use serde_json::{Value, json};
use std::collections::VecDeque;
use std::io::{BufRead, BufReader, Read, Write};
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

fn manifest_bin() -> PathBuf {
    for profile in ["debug", "release"] {
        let candidate = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("target")
            .join(profile)
            .join(format!("md-ts-lsp{}", std::env::consts::EXE_SUFFIX));
        if candidate.is_file() {
            return candidate;
        }
    }
    panic!("server binary not found; run `cargo build` first");
}

fn tsc_bin() -> PathBuf {
    if let Some(path) = std::env::var_os("MDTS_TEST_TSSERVER").map(PathBuf::from) {
        return path;
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("bin").join("tsc")
}

struct Session {
    child: std::process::Child,
    next_id: i64,
    stdin: Arc<Mutex<std::process::ChildStdin>>,
    incoming: Arc<Mutex<VecDeque<Value>>>,
    diags: Arc<Mutex<Vec<(String, Vec<Value>)>>>,
}

impl Session {
    fn spawn(worktree: &std::path::Path) -> Self {
        let mut child = std::process::Command::new(manifest_bin())
            .arg("--stdio")
            .arg("--worktree")
            .arg(worktree)
            .arg("--tsserver")
            .arg(tsc_bin())
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .expect("spawn server");
        let stdin = Arc::new(Mutex::new(child.stdin.take().expect("piped")));
        let stdout = child.stdout.take().expect("piped");
        let incoming: Arc<Mutex<VecDeque<Value>>> = Arc::new(Mutex::new(VecDeque::new()));
        let diags: Arc<Mutex<Vec<(String, Vec<Value>)>>> = Arc::new(Mutex::new(Vec::new()));
        let incoming_clone = Arc::clone(&incoming);
        let diags_clone = Arc::clone(&diags);
        let stdin_for_reader = Arc::clone(&stdin);
        std::thread::spawn(move || {
            let mut input = BufReader::new(stdout);
            let send = |message: &Value| {
                let body = serde_json::to_vec(message).unwrap();
                let mut guard = stdin_for_reader.lock().unwrap();
                let _ = write!(
                    guard,
                    "Content-Length: {}\r\n\r\n",
                    body.len()
                );
                let _ = guard.write_all(&body);
                let _ = guard.flush();
            };
            loop {
                let mut content_length: Option<usize> = None;
                loop {
                    let mut line = String::new();
                    if input.read_line(&mut line).unwrap_or(0) == 0 {
                        return;
                    }
                    let trimmed = line.trim();
                    if trimmed.is_empty() {
                        break;
                    }
                    if let Some(rest) = trimmed.strip_prefix("Content-Length:") {
                        content_length = rest.trim().parse().ok();
                    }
                }
                let len = match content_length {
                    Some(len) => len,
                    None => continue,
                };
                let mut body = vec![0u8; len];
                if input.read_exact(&mut body).is_err() {
                    return;
                }
                let Ok(message) = serde_json::from_slice::<Value>(&body) else {
                    continue;
                };
                if let Some(method) = message.get("method").and_then(Value::as_str) {
                    if method == "textDocument/publishDiagnostics" {
                        let uri = message
                            .get("params")
                            .and_then(|p| p.get("uri"))
                            .and_then(Value::as_str)
                            .unwrap_or("")
                            .to_string();
                        let items = message
                            .get("params")
                            .and_then(|p| p.get("diagnostics"))
                            .and_then(Value::as_array)
                            .cloned()
                            .unwrap_or_default();
                        diags_clone.lock().unwrap().push((uri, items));
                        continue;
                    }
                    if message.get("id").is_some() {
                        // Server-initiated request: answer like a real client.
                        if method == "workspace/configuration" {
                            let count = message
                                .get("params")
                                .and_then(|p| p.get("items"))
                                .and_then(Value::as_array)
                                .map(|items| items.len())
                                .unwrap_or(0);
                            send(&json!({ "jsonrpc": "2.0", "id": message.get("id").cloned().unwrap(),
                                "result": vec![json!({}); count] }));
                        } else {
                            send(&json!({ "jsonrpc": "2.0", "id": message.get("id").cloned().unwrap(), "result": null }));
                        }
                        continue;
                    }
                }
                incoming_clone.lock().unwrap().push_back(message);
            }
        });
        Session { child, stdin, next_id: 0, incoming, diags }
    }

    fn send(&self, message: &Value) {
        let body = serde_json::to_vec(message).unwrap();
        let mut guard = self.stdin.lock().unwrap();
        write!(guard, "Content-Length: {}\r\n\r\n", body.len()).unwrap();
        guard.write_all(&body).unwrap();
        guard.flush().unwrap();
    }

    fn request(&mut self, method: &str, params: Value) -> Value {
        self.next_id += 1;
        let id = self.next_id;
        self.send(&json!({ "jsonrpc": "2.0", "id": id, "method": method, "params": params }));
        let deadline = Instant::now() + Duration::from_secs(90);
        loop {
            if Instant::now() > deadline {
                panic!("timed out waiting for response to {method}");
            }
            let mut queue = self.incoming.lock().unwrap();
            if let Some(pos) = queue.iter().position(|m| m.get("id") == Some(&json!(id))) {
                return queue.remove(pos).unwrap();
            }
            drop(queue);
            std::thread::sleep(Duration::from_millis(50));
        }
    }

    fn wait_for_publish(&mut self, uri: &str, condition: &dyn Fn(&[Value]) -> bool) -> Vec<Value> {
        let deadline = Instant::now() + Duration::from_secs(90);
        loop {
            if Instant::now() > deadline {
                panic!("timed out waiting for publishDiagnostics of {uri}");
            }
            {
                let mut diags = self.diags.lock().unwrap();
                if let Some(pos) = diags.iter().position(|(u, d)| u == uri && condition(d)) {
                    return diags.remove(pos).1;
                }
            }
            std::thread::sleep(Duration::from_millis(100));
        }
    }
}

impl Drop for Session {
    fn drop(&mut self) {
        let _ = self.child.kill();
    }
}

fn open_md(session: &mut Session, uri: &str, text: &str) {
    let init = session.request(
        "initialize",
        json!({ "processId": null, "rootUri": null, "capabilities": {} }),
    );
    assert!(init.get("result").is_some(), "initialize failed: {init}");
    session.send(&json!({ "jsonrpc": "2.0", "method": "initialized", "params": {} }));
    session.send(&json!({
        "jsonrpc": "2.0",
        "method": "textDocument/didOpen",
        "params": {
            "textDocument": { "uri": uri, "languageId": "markdown", "version": 1, "text": text },
        },
    }));
}

fn has_ts2322_at(diags: &[Value], line: u64, character: u64) -> bool {
    diags.iter().any(|d| {
        let code = d.get("code").map(|c| c.to_string()).unwrap_or_default();
        code.contains("2322")
            && d.pointer("/range/start/line").and_then(Value::as_u64) == Some(line)
            && d.pointer("/range/start/character").and_then(Value::as_u64) == Some(character)
    })
}

#[test]
fn proxy_reports_ts2322_at_markdown_position() {
    let worktree = std::env::temp_dir().join(format!("md-ts-lsp-it-{}", std::process::id()));
    let _ = std::fs::create_dir_all(&worktree);
    let uri = "file:///it/basic-usage.md".to_string();
    let mut session = Session::spawn(&worktree);
    open_md(&mut session, &uri, "```ts\nconst b: number = 'adsf'\n```\n");

    let diags = session.wait_for_publish(&uri, &|d| has_ts2322_at(d, 1, 6));
    assert!(
        diags.iter().any(|d| d.pointer("/range/end") == Some(&json!({ "line": 1, "character": 7 }))),
        "bad end position: {diags:?}"
    );
    let _ = std::fs::remove_dir_all(&worktree);
}

#[test]
fn proxy_updates_on_change_and_forwards_hover() {
    let worktree = std::env::temp_dir().join(format!("md-ts-lsp-hover-{}", std::process::id()));
    let _ = std::fs::create_dir_all(&worktree);
    let uri = "file:///it/hover.md".to_string();
    let mut session = Session::spawn(&worktree);
    open_md(&mut session, &uri, "```ts\nconst b: number = 'adsf'\n```\n");
    session.wait_for_publish(&uri, &|d| has_ts2322_at(d, 1, 6));

    let hover = session.request(
        "textDocument/hover",
        json!({
            "textDocument": { "uri": uri },
            "position": { "line": 1, "character": 6 },
        }),
    );
    let contents = hover["result"]["contents"].to_string();
    assert!(contents.contains("number"), "expected hover with type info, got: {contents}");

    session.send(&json!({
        "jsonrpc": "2.0",
        "method": "textDocument/didChange",
        "params": {
            "textDocument": { "uri": uri, "version": 2 },
            "contentChanges": [{ "text": "```ts\nconst b: number = 1\n```\n" }],
        },
    }));
    session.wait_for_publish(&uri, &|d| {
        !d.iter().any(|d| {
            d.get("code").map(|c| c.to_string()).unwrap_or_default().contains("2322")
        })
    });
    let _ = std::fs::remove_dir_all(&worktree);
}

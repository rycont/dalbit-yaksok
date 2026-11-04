mod extract;

use extract::{build_temp_text, extract_fences, source_line_count};
use serde_json::{Value, json};
use std::collections::hash_map::DefaultHasher;
use std::collections::{HashMap, HashSet};
use std::hash::{Hash, Hasher};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::time::{Duration, Instant};

const VERSION: &str = "0.2.0";
/// Backend request ids start here; the backend's own ids stay small.
const BACKEND_ID_BASE: u64 = 1_000_000_000;
/// Client-facing ids for backend-initiated requests.
const CLIENT_ID_BASE: u64 = 2_000_000_000;
const PULL_DEBOUNCE: Duration = Duration::from_millis(300);

struct Config {
    worktree: PathBuf,
    tsserver: PathBuf,
}

struct TempDoc {
    uri: String,
    #[allow(dead_code)]
    path: PathBuf,
}

struct DocState {
    generation: u64,
    temps: Vec<TempDoc>,
    /// Scheduled auto-pull (generation, deadline).
    pull_at: Option<(u64, Instant)>,
}

struct Proxy {
    config: Config,
    docs: HashMap<String, DocState>,
    /// temp uri -> md uri
    temp_owner: HashMap<String, String>,
    /// backend numeric id -> client request id
    up: HashMap<u64, Value>,
    /// client-facing numeric id -> backend request id
    down: HashMap<u64, Value>,
    /// Backend ids whose responses are dropped (fire-and-forget).
    fire_and_forget: HashSet<u64>,
    next_up: u64,
    next_down: u64,
    /// backend pull id -> (md uri, temp uri)
    auto_pulls: HashMap<u64, (String, String)>,
    /// latest pulled diagnostics per temp uri
    temp_diags: HashMap<String, Vec<Value>>,
    /// merged diagnostics per md uri (serves client pull requests)
    merged_diags: HashMap<String, Vec<Value>>,
    result_seq: u64,
    out: std::io::Stdout,
}

fn send_value(out: &mut impl Write, value: &Value) {
    let body = serde_json::to_vec(value).unwrap_or_default();
    let _ = write!(out, "Content-Length: {}\r\n\r\n", body.len());
    let _ = out.write_all(&body);
    let _ = out.flush();
}

fn read_message(input: &mut impl BufRead) -> Option<Value> {
    let mut content_length: Option<usize> = None;
    loop {
        let mut line = String::new();
        if input.read_line(&mut line).ok()? == 0 {
            return None;
        }
        let trimmed = line.trim();
        if trimmed.is_empty() {
            break;
        }
        if let Some(rest) = trimmed.strip_prefix("Content-Length:") {
            content_length = rest.trim().parse().ok();
        }
    }
    let len = content_length?;
    let mut body = vec![0u8; len];
    input.read_exact(&mut body).ok()?;
    serde_json::from_slice(&body).ok()
}

fn is_markdown(uri: &str, language_id: Option<&str>) -> bool {
    if language_id == Some("markdown") {
        return true;
    }
    let lower = uri.to_lowercase();
    lower.ends_with(".md") || lower.ends_with(".mdx") || lower.ends_with(".markdown")
}

fn slug_for_uri(uri: &str) -> String {
    let stem = uri
        .rsplit('/')
        .next()
        .unwrap_or("doc")
        .split('?')
        .next()
        .unwrap_or("doc");
    let clean: String = stem
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '_' })
        .take(48)
        .collect();
    let mut hasher = DefaultHasher::new();
    uri.hash(&mut hasher);
    format!("{}-{:x}", clean, hasher.finish())
}

fn which(name: &str) -> Option<PathBuf> {
    std::env::var_os("PATH").and_then(|paths| {
        std::env::split_paths(&paths).find_map(|dir| {
            let candidate = dir.join(name);
            candidate.is_file().then_some(candidate)
        })
    })
}

fn exe_dir() -> Option<PathBuf> {
    std::env::current_exe().ok()?.parent().map(std::path::Path::to_path_buf)
}

fn resolve_config(args: &[String]) -> Result<Config, String> {
    let mut worktree: Option<PathBuf> = None;
    let mut tsserver: Option<PathBuf> = None;
    let mut stdio = false;
    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--stdio" => stdio = true,
            "--worktree" => {
                i += 1;
                worktree = args.get(i).map(PathBuf::from);
            }
            "--tsserver" => {
                i += 1;
                tsserver = args.get(i).map(PathBuf::from);
            }
            other => return Err(format!("unknown argument: {other}")),
        }
        i += 1;
    }
    if !stdio {
        return Err("usage: md-ts-lsp --stdio [--worktree DIR] [--tsserver BIN]".to_string());
    }
    let worktree = worktree.unwrap_or(std::env::current_dir().map_err(|e| e.to_string())?);
    let tsserver = tsserver
        .or_else(|| std::env::var_os("MDTS_TSSERVER").map(PathBuf::from))
        .or_else(|| which("tsc"))
        .or_else(|| {
            exe_dir().and_then(|dir| {
                dir.parent()
                    .and_then(|p| p.parent())
                    .map(|p| p.join("bin").join("tsc"))
                    .filter(|p| p.is_file())
            })
        })
        .ok_or_else(|| {
            "tsserver binary not found (pass --tsserver, set MDTS_TSSERVER, or put tsc on PATH)"
                .to_string()
        })?;
    Ok(Config { worktree, tsserver })
}

/// Exact-match URI rewriting. Positions need no translation:
/// temp files are coordinate-identical to the markdown source.
fn rewrite_uris(value: &mut Value, table: &HashMap<String, String>) {
    match value {
        Value::String(s) => {
            if let Some(replacement) = table.get(s.as_str()) {
                *s = replacement.clone();
            }
        }
        Value::Array(items) => {
            for item in items {
                rewrite_uris(item, table);
            }
        }
        Value::Object(map) => {
            for (_, v) in map.iter_mut() {
                rewrite_uris(v, table);
            }
        }
        _ => {}
    }
}

struct BackendTx {
    stdin: std::process::ChildStdin,
}

impl BackendTx {
    fn send(&mut self, message: &Value) {
        send_value(&mut self.stdin, message);
    }
}

impl Proxy {
    fn md_to_temp_table(&self) -> HashMap<String, String> {
        let mut table = HashMap::new();
        for (md_uri, doc) in &self.docs {
            for temp in &doc.temps {
                table.insert(md_uri.clone(), temp.uri.clone());
            }
        }
        table
    }

    fn temp_to_md_table(&self) -> HashMap<String, String> {
        self.temp_owner.clone()
    }

    fn anchor_dir(&self, uri: &str) -> PathBuf {
        self.config.worktree.join(".md-ts-lsp").join(slug_for_uri(uri))
    }

    fn temp_uri(&self, uri: &str, index: usize, tsx: bool) -> (String, PathBuf) {
        let name = if tsx { format!("fence{index}.tsx") } else { format!("fence{index}.ts") };
        let path = self.anchor_dir(uri).join(&name);
        (format!("file://{}", path.display()), path)
    }

    fn schedule_pull(&mut self, uri: &str) {
        if let Some(doc) = self.docs.get_mut(uri) {
            doc.generation += 1;
            let generation = doc.generation;
            doc.pull_at = Some((generation, Instant::now() + PULL_DEBOUNCE));
        }
    }

    /// Write temp files and sync them to the backend. Reuses temp slots when
    /// the fence structure is unchanged, rebuilds otherwise.
    fn sync_doc(&mut self, uri: &str, text: String, version: i32, backend: &mut BackendTx) {
        let fences = extract_fences(&text);
        let total_lines = source_line_count(&text);
        let dir = self.anchor_dir(uri);
        let _ = std::fs::create_dir_all(&dir);

        let same_shape = self
            .docs
            .get(uri)
            .map(|doc| {
                doc.temps.len() == fences.len()
                    && doc
                        .temps
                        .iter()
                        .zip(fences.iter())
                        .all(|(t, f)| t.path.extension().map(|e| e == "tsx").unwrap_or(false) == f.use_tsx)
            })
            .unwrap_or(false);

        if !same_shape {
            let old_generation = self.docs.get(uri).map(|d| d.generation).unwrap_or(0);
            if let Some(old) = self.docs.remove(uri) {
                for temp in &old.temps {
                    backend.send(&json!({
                        "jsonrpc": "2.0",
                        "method": "textDocument/didClose",
                        "params": { "textDocument": { "uri": temp.uri } },
                    }));
                    self.temp_owner.remove(&temp.uri);
                    self.temp_diags.remove(&temp.uri);
                    let _ = std::fs::remove_file(&temp.path);
                }
            }
            let mut temps = Vec::with_capacity(fences.len());
            for (i, fence) in fences.iter().enumerate() {
                let (temp_uri, path) = self.temp_uri(uri, i, fence.use_tsx);
                let content = build_temp_text(&fence.code_lines, total_lines);
                let _ = std::fs::write(&path, &content);
                backend.send(&json!({
                    "jsonrpc": "2.0",
                    "method": "textDocument/didOpen",
                    "params": {
                        "textDocument": {
                            "uri": temp_uri,
                            "languageId": if fence.use_tsx { "typescriptreact" } else { "typescript" },
                            "version": version,
                            "text": content,
                        },
                    },
                }));
                self.temp_owner.insert(temp_uri.clone(), uri.to_string());
                temps.push(TempDoc { uri: temp_uri, path });
            }
            self.docs.insert(uri.to_string(), DocState {
                generation: old_generation + 1,
                temps,
                pull_at: None,
            });
        } else if let Some(doc) = self.docs.get_mut(uri) {
            for (i, temp) in doc.temps.iter().enumerate() {
                let content = build_temp_text(&fences[i].code_lines, total_lines);
                let _ = std::fs::write(&temp.path, &content);
                backend.send(&json!({
                    "jsonrpc": "2.0",
                    "method": "textDocument/didChange",
                    "params": {
                        "textDocument": { "uri": temp.uri, "version": version },
                        "contentChanges": [{ "text": content }],
                    },
                }));
            }
        }
        self.schedule_pull(uri);
    }

    fn close_doc(&mut self, uri: &str, backend: &mut BackendTx) {
        if let Some(doc) = self.docs.remove(uri) {
            for temp in &doc.temps {
                backend.send(&json!({
                    "jsonrpc": "2.0",
                    "method": "textDocument/didClose",
                    "params": { "textDocument": { "uri": temp.uri } },
                }));
                self.temp_owner.remove(&temp.uri);
                self.temp_diags.remove(&temp.uri);
            }
            let _ = std::fs::remove_dir_all(self.anchor_dir(uri));
        }
        self.merged_diags.remove(uri);
        self.publish_empty(uri);
    }

    fn publish_empty(&mut self, uri: &str) {
        send_value(
            &mut self.out,
            &json!({
                "jsonrpc": "2.0",
                "method": "textDocument/publishDiagnostics",
                "params": { "uri": uri, "diagnostics": [] },
            }),
        );
    }

    fn fire_due_pulls(&mut self, backend: &mut BackendTx) {
        let now = Instant::now();
        let mut due = Vec::new();
        for (uri, doc) in self.docs.iter_mut() {
            if let Some((generation, deadline)) = doc.pull_at {
                if deadline <= now {
                    doc.pull_at = None;
                    due.push((uri.clone(), generation));
                }
            }
        }
        for (uri, generation) in due {
            let current = self.docs.get(&uri).map(|d| d.generation).unwrap_or(0);
            if current != generation {
                continue;
            }
            let temps: Vec<(String, String)> = self
                .docs
                .get(&uri)
                .map(|d| d.temps.iter().map(|t| (t.uri.clone(), uri.clone())).collect())
                .unwrap_or_default();
            for (temp_uri, _md_uri) in temps {
                let id = self.next_up;
                self.next_up += 1;
                self.auto_pulls.insert(id, (uri.clone(), temp_uri.clone()));
                backend.send(&json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "method": "textDocument/diagnostic",
                    "params": { "textDocument": { "uri": temp_uri } },
                }));
            }
        }
    }

    fn handle_pull_response(&mut self, backend_id: u64, result: &Value) {
        let Some((md_uri, temp_uri)) = self.auto_pulls.remove(&backend_id) else {
            return;
        };
        let items = result
            .get("items")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        self.temp_diags.insert(temp_uri, items);
        let mut merged = Vec::new();
        if let Some(doc) = self.docs.get(&md_uri) {
            for temp in &doc.temps {
                if let Some(items) = self.temp_diags.get(&temp.uri) {
                    merged.extend(items.iter().cloned());
                }
            }
        }
        self.merged_diags.insert(md_uri.clone(), merged.clone());
        if std::env::var_os("MDTS_QUIET").is_none() {
            eprintln!("md-ts-lsp: publish {} diagnostic(s) for {}", merged.len(), md_uri);
        }
        send_value(
            &mut self.out,
            &json!({
                "jsonrpc": "2.0",
                "method": "textDocument/publishDiagnostics",
                "params": { "uri": md_uri, "diagnostics": merged },
            }),
        );
    }
}

fn forward_with_new_id(proxy: &mut Proxy, backend: &mut BackendTx, mut message: Value) {
    if message.get("id").is_some() {
        let new_id = proxy.next_up;
        proxy.next_up += 1;
        if let Some(id) = message.get("id").cloned() {
            proxy.up.insert(new_id, id);
        }
        if let Some(map) = message.as_object_mut() {
            map.insert("id".to_string(), json!(new_id));
        }
    }
    let table = proxy.md_to_temp_table();
    rewrite_uris(&mut message, &table);
    backend.send(&message);
}

fn handle_client_message(proxy: &mut Proxy, backend: &mut BackendTx, message: Value) {
    let method = message.get("method").and_then(Value::as_str).unwrap_or("");
    match method {
        "initialize" => unreachable!("handled before pump starts"),
        "initialized" => backend.send(&message),
        "shutdown" => {
            // Answer immediately: our shutdown is complete once the backend
            // is told. The backend's own response is dropped to avoid hanging
            // Zed's shutdown sequence on a wedged backend.
            let id = message.get("id").cloned().unwrap_or(Value::Null);
            let mut backend_message = message;
            let backend_id = proxy.next_up;
            proxy.next_up += 1;
            proxy.fire_and_forget.insert(backend_id);
            if let Some(map) = backend_message.as_object_mut() {
                map.insert("id".to_string(), json!(backend_id));
            }
            backend.send(&backend_message);
            send_value(
                &mut proxy.out,
                &json!({ "jsonrpc": "2.0", "id": id, "result": null }),
            );
        }
        "exit" => {
            backend.send(&message);
            std::process::exit(0);
        }
        "textDocument/didOpen" => {
            let params = message.get("params");
            let doc = params.and_then(|p| p.get("textDocument"));
            let uri = doc.and_then(|d| d.get("uri")).and_then(Value::as_str).unwrap_or("");
            let text = doc.and_then(|d| d.get("text")).and_then(Value::as_str).unwrap_or("");
            let version = doc.and_then(|d| d.get("version")).and_then(Value::as_i64).unwrap_or(1) as i32;
            let lang = doc.and_then(|d| d.get("languageId")).and_then(Value::as_str);
            if !is_markdown(uri, lang) {
                return;
            }
            proxy.sync_doc(uri, text.to_string(), version, backend);
        }
        "textDocument/didChange" => {
            let params = message.get("params");
            let uri = params
                .and_then(|p| p.get("textDocument"))
                .and_then(|d| d.get("uri"))
                .and_then(Value::as_str)
                .unwrap_or("");
            if !proxy.docs.contains_key(uri) {
                return;
            }
            let version = params
                .and_then(|p| p.get("textDocument"))
                .and_then(|d| d.get("version"))
                .and_then(Value::as_i64)
                .unwrap_or(1) as i32;
            let text = params
                .and_then(|p| p.get("contentChanges"))
                .and_then(Value::as_array)
                .and_then(|changes| changes.last())
                .and_then(|c| c.get("text"))
                .and_then(Value::as_str)
                .unwrap_or("");
            proxy.sync_doc(uri, text.to_string(), version, backend);
        }
        "textDocument/didClose" => {
            let uri = message
                .get("params")
                .and_then(|p| p.get("textDocument"))
                .and_then(|d| d.get("uri"))
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string();
            if proxy.docs.contains_key(&uri) {
                proxy.close_doc(&uri, backend);
            }
        }
        "textDocument/diagnostic" => {
            // Serve from the merged cache (kept fresh by auto-pulls) and
            // trigger a fresh round for the next update.
            let uri = message
                .get("params")
                .and_then(|p| p.get("textDocument"))
                .and_then(|d| d.get("uri"))
                .and_then(Value::as_str)
                .unwrap_or("");
            let id = message.get("id").cloned().unwrap_or(Value::Null);
            let items = proxy.merged_diags.get(uri).cloned().unwrap_or_default();
            proxy.result_seq += 1;
            let result_id = format!("md-ts-lsp/{}", proxy.result_seq);
            send_value(
                &mut proxy.out,
                &json!({ "jsonrpc": "2.0", "id": id,
                    "result": { "kind": "full", "resultId": result_id, "items": items } }),
            );
            proxy.schedule_pull(uri);
        }
        "textDocument/willSaveWaitUntil" => {
            let id = message.get("id").cloned().unwrap_or(Value::Null);
            send_value(&mut proxy.out, &json!({ "jsonrpc": "2.0", "id": id, "result": null }));
        }
        "$/cancelRequest" => {
            let mut message = message;
            if let Some(wanted) = message.get("params").and_then(|p| p.get("id")).cloned() {
                let wanted_num = wanted.as_u64();
                let mut replacement: Option<Value> = None;
                if let Some(n) = wanted_num {
                    // Client cancelling its own request.
                    replacement = proxy.up.iter().find_map(|(backend_id, client_id)| {
                        (client_id.as_u64() == Some(n)).then(|| json!(backend_id))
                    });
                    // ...or a backend-initiated request we forwarded.
                    if replacement.is_none() {
                        replacement = proxy.down.get(&n).cloned();
                    }
                }
                if let Some(backend_id) = replacement {
                    if let Some(params) = message.get_mut("params") {
                        if let Some(map) = params.as_object_mut() {
                            map.insert("id".to_string(), backend_id);
                        }
                    }
                }
            }
            backend.send(&message);
        }
        _ => {
            if message.get("method").is_some() {
                forward_with_new_id(proxy, backend, message);
            } else if let Some(id) = message.get("id").cloned() {
                // Client response to a backend-initiated request.
                let backend_id = match &id {
                    Value::Number(n) => n.as_u64().and_then(|k| proxy.down.remove(&k)),
                    _ => None,
                };
                match backend_id {
                    Some(backend_id) => {
                        let mut message = message;
                        if let Some(map) = message.as_object_mut() {
                            map.insert("id".to_string(), backend_id);
                        }
                        let table = proxy.md_to_temp_table();
                        rewrite_uris(&mut message, &table);
                        backend.send(&message);
                    }
                    None => eprintln!("md-ts-lsp: client response for unknown id {id}, dropping"),
                }
            } else {
                eprintln!("md-ts-lsp: dropping invalid client message without method or id");
            }
        }
    }
}

fn handle_backend_message(proxy: &mut Proxy, backend: &mut BackendTx, message: Value) {
    if let Some(method) = message.get("method").and_then(Value::as_str) {
        match method {
            "workspace/configuration" => {
                let id = message.get("id").cloned().unwrap_or(Value::Null);
                let count = message
                    .get("params")
                    .and_then(|p| p.get("items"))
                    .and_then(Value::as_array)
                    .map(|items| items.len())
                    .unwrap_or(0);
                send_value(
                    &mut proxy.out,
                    &json!({ "jsonrpc": "2.0", "id": id,
                        "result": vec![json!({}); count] }),
                );
                return;
            }
            "workspace/diagnostic/refresh"
            | "window/logMessage"
            | "window/showMessage"
            | "telemetry/event"
            | "$/progress"
            | "client/registerCapability"
            | "client/unregisterCapability"
            | "workspace/workspaceFolders/change" => {
                let mut message = message;
                if let Some(id) = message.get("id").cloned() {
                    let new_id = proxy.next_down;
                    proxy.next_down += 1;
                    proxy.down.insert(new_id, id);
                    if let Some(map) = message.as_object_mut() {
                        map.insert("id".to_string(), json!(new_id));
                    }
                }
                send_value(&mut proxy.out, &message);
                return;
            }
            "textDocument/publishDiagnostics" => {
                // tsc pushes rarely; auto-pulls are authoritative. Still forward
                // anything known so the client never shows stale temp-URI state.
                let mut message = message;
                let table = proxy.temp_to_md_table();
                rewrite_uris(&mut message, &table);
                let known = message
                    .get("params")
                    .and_then(|p| p.get("uri"))
                    .and_then(Value::as_str)
                    .map(|uri| proxy.docs.contains_key(uri))
                    .unwrap_or(false);
                if known {
                    send_value(&mut proxy.out, &message);
                }
                return;
            }
            _ => {
                let mut message = message;
                if let Some(id) = message.get("id").cloned() {
                    let new_id = proxy.next_down;
                    proxy.next_down += 1;
                    proxy.down.insert(new_id, id);
                    if let Some(map) = message.as_object_mut() {
                        map.insert("id".to_string(), json!(new_id));
                    }
                }
                let table = proxy.temp_to_md_table();
                rewrite_uris(&mut message, &table);
                send_value(&mut proxy.out, &message);
                return;
            }
        }
    }
    // Response: auto-pull result, forwarded request, fire-and-forget, or unknown.
    if let Some(id) = message.get("id").cloned() {
        if let Some(n) = id.as_u64() {
            if proxy.fire_and_forget.remove(&n) {
                return;
            }
            if proxy.auto_pulls.contains_key(&n) {
                let result = message.get("result").cloned().unwrap_or(Value::Null);
                proxy.handle_pull_response(n, &result);
                return;
            }
            if let Some(client_id) = proxy.up.remove(&n) {
                let mut message = message;
                if let Some(map) = message.as_object_mut() {
                    map.insert("id".to_string(), client_id);
                }
                let table = proxy.temp_to_md_table();
                rewrite_uris(&mut message, &table);
                send_value(&mut proxy.out, &message);
                return;
            }
        }
        eprintln!("md-ts-lsp: backend response for unknown id {id}, dropping");
        return;
    }
    eprintln!("md-ts-lsp: dropping backend message without method or id");
    let _ = backend;
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let config = match resolve_config(&args) {
        Ok(config) => config,
        Err(message) => {
            eprintln!("md-ts-lsp: {message}");
            std::process::exit(2);
        }
    };

    let init = {
        let stdin = std::io::stdin();
        let mut input = stdin.lock();
        loop {
            match read_message(&mut input) {
                Some(message)
                    if message.get("method").and_then(Value::as_str) == Some("initialize") =>
                {
                    break message;
                }
                Some(_) => continue,
                None => std::process::exit(1),
            }
        }
    };

    let mut child = match Command::new(&config.tsserver)
        .arg("--lsp")
        .arg("--stdio")
        .current_dir(&config.worktree)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
    {
        Ok(child) => child,
        Err(e) => {
            eprintln!("md-ts-lsp: cannot spawn tsserver: {e}");
            std::process::exit(2);
        }
    };
    let backend_stdout = child.stdout.take().expect("piped");
    let mut backend_in = BufReader::new(backend_stdout);
    let mut backend_out = child.stdin.take().expect("piped");

    // Synchronous initialize handshake with the backend.
    let init_id = init.get("id").cloned().unwrap_or(Value::Null);
    // The backend needs project context to answer pulls: fill in the
    // worktree when the client sends none.
    let mut init_forward = init.clone();
    if let Some(map) = init_forward.as_object_mut() {
        map.insert("id".to_string(), json!(BACKEND_ID_BASE));
        if let Some(params) = map.get_mut("params").and_then(Value::as_object_mut) {
            let root_uri = format!("file://{}", config.worktree.display());
            let has_root = params
                .get("rootUri")
                .and_then(Value::as_str)
                .map(|s| !s.is_empty())
                .unwrap_or(false);
            if !has_root {
                params.insert("rootUri".to_string(), json!(root_uri.clone()));
            }
            let has_folders = params
                .get("workspaceFolders")
                .and_then(Value::as_array)
                .map(|folders| !folders.is_empty())
                .unwrap_or(false);
            if !has_folders {
                params.insert(
                    "workspaceFolders".to_string(),
                    json!([{ "uri": root_uri, "name": "workspace" }]),
                );
            }
        }
    }
    send_value(&mut backend_out, &init_forward);
    // Claim the handshake id so a late duplicate response still routes.
    let backend_result = loop {
        match read_message(&mut backend_in) {
            Some(message) => {
                let is_init = message.get("id").and_then(Value::as_u64) == Some(BACKEND_ID_BASE);
                if is_init {
                    break message;
                } else if message.get("method").and_then(Value::as_str) == Some("workspace/configuration") {
                    let id = message.get("id").cloned().unwrap_or(Value::Null);
                    let count = message
                        .get("params")
                        .and_then(|p| p.get("items"))
                        .and_then(Value::as_array)
                        .map(|items| items.len())
                        .unwrap_or(0);
                    send_value(
                        &mut backend_out,
                        &json!({ "jsonrpc": "2.0", "id": id,
                            "result": vec![json!({}); count] }),
                    );
                }
            }
            None => {
                eprintln!("md-ts-lsp: tsserver exited during initialize");
                std::process::exit(2);
            }
        }
    };

    let mut proxy = Proxy {
        config,
        docs: HashMap::new(),
        temp_owner: HashMap::new(),
        up: HashMap::new(),
        down: HashMap::new(),
        next_up: BACKEND_ID_BASE + 1,
        next_down: CLIENT_ID_BASE,
        auto_pulls: HashMap::new(),
        fire_and_forget: HashSet::new(),
        temp_diags: HashMap::new(),
        merged_diags: HashMap::new(),
        result_seq: 0,
        out: std::io::stdout(),
    };
    let mut backend = BackendTx { stdin: backend_out };

    let mut init_response = backend_result;
    if let Some(map) = init_response.as_object_mut() {
        map.insert("id".to_string(), init_id);
        if let Some(result) = map.get_mut("result") {
            if let Some(caps) = result.get_mut("capabilities") {
                if let Some(caps_map) = caps.as_object_mut() {
                    // Push model: the proxy publishes diagnostics itself.
                    caps_map.remove("diagnosticProvider");
                    // Full sync toward our client: Zed always sends whole
                    // documents, which extraction needs. The backend still gets
                    // full text, which incremental servers accept as replace-all.
                    caps_map.insert(
                        "textDocumentSync".to_string(),
                        json!({ "openClose": true, "change": 1 }),
                    );
                }
            }
            if let Some(result_map) = result.as_object_mut() {
                result_map.insert(
                    "serverInfo".to_string(),
                    json!({ "name": "md-ts-lsp", "version": VERSION }),
                );
            }
        }
    }
    send_value(&mut proxy.out, &init_response);

    enum Incoming {
        Client(Option<Value>),
        Backend(Option<Value>),
    }
    let (tx, rx) = mpsc::channel::<Incoming>();
    let tx_client = tx.clone();
    std::thread::spawn(move || {
        let stdin = std::io::stdin();
        let mut input = stdin.lock();
        loop {
            match read_message(&mut input) {
                Some(message) => {
                    if tx_client.send(Incoming::Client(Some(message))).is_err() {
                        break;
                    }
                }
                None => {
                    let _ = tx_client.send(Incoming::Client(None));
                    break;
                }
            }
        }
    });
    std::thread::spawn(move || {
        let mut input = backend_in;
        loop {
            match read_message(&mut input) {
                Some(message) => {
                    if tx.send(Incoming::Backend(Some(message))).is_err() {
                        break;
                    }
                }
                None => {
                    let _ = tx.send(Incoming::Backend(None));
                    break;
                }
            }
        }
    });

    loop {
        match rx.recv_timeout(Duration::from_millis(50)) {
            Ok(Incoming::Client(Some(message))) => handle_client_message(&mut proxy, &mut backend, message),
            Ok(Incoming::Client(None)) => break,
            Ok(Incoming::Backend(Some(message))) => handle_backend_message(&mut proxy, &mut backend, message),
            Ok(Incoming::Backend(None)) => {
                eprintln!("md-ts-lsp: tsserver exited");
                break;
            }
            Err(mpsc::RecvTimeoutError::Timeout) => {
                proxy.fire_due_pulls(&mut backend);
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn table(pairs: &[(&str, &str)]) -> HashMap<String, String> {
        pairs.iter().map(|(a, b)| (a.to_string(), b.to_string())).collect()
    }

    #[test]
    fn rewrites_uris_recursively() {
        let mut message = json!({
            "method": "textDocument/hover",
            "params": {
                "textDocument": { "uri": "file:///doc.md" },
                "position": { "line": 4, "character": 7 },
                "note": "file:///doc.md",
            },
        });
        let t = table(&[("file:///doc.md", "file:///tmp/x/doc/fence0.ts")]);
        rewrite_uris(&mut message, &t);
        assert_eq!(message["params"]["textDocument"]["uri"], json!("file:///tmp/x/doc/fence0.ts"));
        // Positions pass through untouched: temp files are coordinate-identical.
        assert_eq!(message["params"]["position"], json!({ "line": 4, "character": 7 }));
        assert_eq!(message["params"]["note"], json!("file:///tmp/x/doc/fence0.ts"));
    }

    #[test]
    fn leaves_foreign_uris_and_values_alone() {
        let mut message = json!({
            "uri": "file:///node_modules/ts/lib.d.ts",
            "range": { "start": { "line": 1, "character": 2 }, "end": { "line": 3, "character": 4 } },
        });
        let t = table(&[("file:///doc.md", "file:///tmp/x/doc/fence0.ts")]);
        rewrite_uris(&mut message, &t);
        assert_eq!(message["uri"], json!("file:///node_modules/ts/lib.d.ts"));
        assert_eq!(message["range"]["start"], json!({ "line": 1, "character": 2 }));
    }
}

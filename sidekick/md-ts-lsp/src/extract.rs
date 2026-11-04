use oxc_markdown_parser::ast::{Block, CodeBlockKind};
use oxc_markdown_parser::{Allocator, Parser};

/// One code line and its verbatim position in the markdown source.
///
/// The temp file keeps every source line: code lines carry the code slice
/// (container prefixes replaced by spaces), all other lines stay blank.
/// Temp coordinates therefore equal markdown coordinates — no remapping.
#[derive(Debug, Clone)]
pub struct CodeLine {
    /// 0-based markdown (= temp) line number.
    pub md_line: usize,
    /// Temp file content: spaces for the stripped prefix, then the code slice.
    pub text: String,
}

#[derive(Debug)]
pub struct Fence {
    pub use_tsx: bool,
    pub code_lines: Vec<CodeLine>,
}

fn is_ts_lang(lang: &str) -> Option<bool> {
    match lang.split_whitespace().next()?.to_lowercase().as_str() {
        "ts" | "typescript" | "mts" | "cts" => Some(false),
        "tsx" => Some(true),
        _ => None,
    }
}

fn line_starts(source: &str) -> Vec<usize> {
    let mut starts = vec![0];
    for (i, b) in source.bytes().enumerate() {
        if b == b'\n' {
            starts.push(i + 1);
        }
    }
    starts
}

fn offset_to_line(starts: &[usize], offset: usize) -> usize {
    match starts.binary_search(&offset) {
        Ok(line) => line,
        Err(next) => next.saturating_sub(1),
    }
}

fn utf16_units(text: &str) -> usize {
    text.encode_utf16().count()
}

fn md_line_text<'a>(source: &'a str, starts: &[usize], line: usize) -> &'a str {
    let start = starts[line.min(starts.len().saturating_sub(1))];
    let end = starts
        .get(line + 1)
        .map(|next| next.saturating_sub(1))
        .unwrap_or(source.len());
    let end = end.min(source.len());
    source[start..end].strip_suffix('\r').unwrap_or(&source[start..end])
}

/// Temp line text whose UTF-16 columns match the markdown line exactly:
/// every prefix byte becomes a space, then the code slice verbatim.
fn aligned_text(source: &str, starts: &[usize], span_start: usize, span_end: usize) -> (usize, String) {
    let line = offset_to_line(&starts, span_start.min(source.len()));
    let line_text = md_line_text(source, &starts, line);
    let line_start = starts[line.min(starts.len().saturating_sub(1))];
    let prefix_bytes = span_start.saturating_sub(line_start);
    let prefix = line_text.get(..prefix_bytes.min(line_text.len())).unwrap_or("");
    let slice = source.get(span_start..span_end.min(source.len())).unwrap_or("");
    let mut text = String::with_capacity(utf16_units(prefix) + slice.len());
    text.extend(std::iter::repeat_n(' ', utf16_units(prefix)));
    text.push_str(slice);
    (line, text)
}

fn collect_fences<'a>(blocks: &[Block<'a>], source: &str, out: &mut Vec<Fence>) {
    for block in blocks {
        match block {
            Block::CodeBlock(cb) => {
                let (fence_char, lang) = match cb.kind {
                    CodeBlockKind::Fenced { fence, lang, .. } => (fence, lang),
                    CodeBlockKind::Indented => continue,
                };
                if fence_char != b'`' && fence_char != b'~' {
                    continue;
                }
                let Some(lang_span) = lang else { continue };
                let Some(use_tsx) = is_ts_lang(lang_span.slice(source)) else {
                    continue
                };
                if cb.lines.is_empty() {
                    continue;
                }
                if !has_closing_fence(source, cb.span.end as usize, fence_char) {
                    continue;
                }
                let starts = line_starts(source);
                let mut code_lines = Vec::with_capacity(cb.lines.len());
                for seg in cb.lines.iter() {
                    let (md_line, text) = aligned_text(
                        source,
                        &starts,
                        seg.span.start as usize,
                        seg.span.end as usize,
                    );
                    code_lines.push(CodeLine { md_line, text });
                }
                out.push(Fence { use_tsx, code_lines });
            }
            Block::Blockquote(b) => collect_fences(&b.children, source, out),
            Block::List(l) => {
                for item in l.children.iter() {
                    collect_fences(&item.children, source, out);
                }
            }
            Block::ContainerDirective(d) => collect_fences(&d.children, source, out),
            Block::FootnoteDefinition(d) => collect_fences(&d.children, source, out),
            Block::MdxJsx(x) => collect_fences(&x.children, source, out),
            _ => {}
        }
    }
}

/// A fence counts as closed when the block span's last line is a fence run.
/// Filters out half-typed fences while editing.
fn has_closing_fence(source: &str, span_end: usize, fence: u8) -> bool {
    if source.is_empty() || span_end == 0 {
        return false;
    }
    let mut probe = span_end.min(source.len()).saturating_sub(1);
    let bytes = source.as_bytes();
    while probe > 0 && bytes[probe] == b'\n' {
        probe -= 1;
    }
    let starts = line_starts(source);
    let line = offset_to_line(&starts, probe);
    is_closing_fence_line(md_line_text(source, &starts, line), fence)
}

fn is_closing_fence_line(line: &str, fence: u8) -> bool {
    let mut rest = line.trim_end();
    loop {
        rest = rest.trim_start_matches([' ', '\t']);
        if let Some(after) = rest.strip_prefix('>') {
            rest = after;
            continue;
        }
        if let Some(after) = rest.strip_prefix(['-', '+', '*']) {
            rest = after;
            continue;
        }
        let digits = rest.len() - rest.trim_start_matches(|c: char| c.is_ascii_digit()).len();
        let mut ordered = false;
        if digits > 0 {
            if let Some(after) = rest[digits..].strip_prefix(['.', ')']) {
                rest = after;
                ordered = true;
            }
        }
        if ordered {
            continue;
        }
        break;
    }
    let marker = if fence == b'~' { "~~~" } else { "```" };
    rest.strip_prefix(marker).is_some_and(|tail| tail.trim().is_empty())
}

pub fn extract_fences(source: &str) -> Vec<Fence> {
    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, source);
    let ret = parsed.parse();
    let mut out = Vec::new();
    collect_fences(&ret.root.children, source, &mut out);
    out
}

/// Full-height temp text: code lines carry code, everything else stays blank,
/// so temp (line, UTF-16 char) == markdown (line, UTF-16 char) by construction.
pub fn build_temp_text(code_lines: &[CodeLine], total_lines: usize) -> String {
    let mut lines = vec![String::new(); total_lines];
    for code in code_lines {
        if code.md_line < total_lines {
            lines[code.md_line] = code.text.clone();
        }
    }
    let mut out = lines.join("\n");
    out.push('\n');
    out
}

pub fn source_line_count(source: &str) -> usize {
    line_starts(source).len().saturating_sub(if source.ends_with('\n') { 1 } else { 0 })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_ts_fence() {
        let fences = extract_fences("```ts\nconst b: number = 'adsf'\n```\n");
        assert_eq!(fences.len(), 1);
        assert!(!fences[0].use_tsx);
        assert_eq!(fences[0].code_lines.len(), 1);
        assert_eq!(fences[0].code_lines[0].md_line, 1);
        assert_eq!(fences[0].code_lines[0].text, "const b: number = 'adsf'");
    }

    #[test]
    fn lang_variants() {
        for lang in ["ts", "TS", "typescript", "tsx", "mts", "cts", "ts twoslash"] {
            let src = format!("```{lang}\nconst a = 1\n```\n");
            let fences = extract_fences(&src);
            assert_eq!(fences.len(), 1, "lang={lang}");
        }
        assert!(extract_fences("```tsx\nconst a = 1\n```\n")[0].use_tsx);
        assert!(!extract_fences("```ts\nconst a = 1\n```\n")[0].use_tsx);
    }

    #[test]
    fn ignores_non_ts_and_indented() {
        assert!(extract_fences("```python\nx = 1\n```\n").is_empty());
        assert!(extract_fences("```\nplain\n```\n").is_empty());
        assert!(extract_fences("    const a = 1\n").is_empty());
    }

    #[test]
    fn ignores_unclosed_fence_while_typing() {
        assert!(extract_fences("```ts\nconst a = 1\n").is_empty());
        assert!(extract_fences("```ts\nconst a = 1").is_empty());
    }

    #[test]
    fn maps_second_fence_lines() {
        let src = "```ts\nconst ok: number = 1\n```\n\n```ts\nconst bad: number = 'x'\n```\n";
        let fences = extract_fences(src);
        assert_eq!(fences.len(), 2);
        assert_eq!(fences[1].code_lines[0].md_line, 5);
    }

    #[test]
    fn nested_blockquote_fence_keeps_md_position() {
        let src = "> ```ts\n> const a: number = 'x'\n> ```\n";
        let fences = extract_fences(src);
        assert_eq!(fences.len(), 1);
        assert_eq!(fences[0].code_lines[0].md_line, 1);
        assert_eq!(fences[0].code_lines[0].text, "  const a: number = 'x'");
    }

    #[test]
    fn temp_text_is_coordinate_identical() {
        let src = "> ```ts\n> const a = 1\n> ```\ntext\n";
        let fences = extract_fences(src);
        assert_eq!(fences.len(), 1);
        let temp = build_temp_text(&fences[0].code_lines, source_line_count(src));
        let temp_lines: Vec<&str> = temp.split('\n').collect();
        let src_lines: Vec<&str> = src.split('\n').collect();
        assert_eq!(temp_lines.len(), src_lines.len());
        // Code line: same UTF-16 columns as the markdown line.
        let temp_code = temp_lines[1];
        let src_code = src_lines[1];
        assert!(temp_code.ends_with("const a = 1"));
        assert_eq!(temp_code.encode_utf16().count(), src_code.encode_utf16().count());
        // Non-code lines stay blank.
        assert_eq!(temp_lines[0], "");
        assert_eq!(temp_lines[2], "");
        assert_eq!(temp_lines[3], "");
    }
}

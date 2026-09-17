#!/usr/bin/env bash
# 이 저장소의 소스코드 탐색은 ast-grep 으로만 한다.
# Grep 툴과, 파일을 대상으로 도는 grep/rg/find/cat/sed/awk 계열을 거절한다.
# 파이프로 이어받는 구간(`cmd | grep ...`)은 출력 필터이므로 여기서 판단하지 않는다.
# 예외: /tmp 또는 scratchpad 경로 (= 저장해둔 실행 결과 탐색)
set -euo pipefail

IN=$(cat)

TOOL=""
CMD=""
if command -v jq >/dev/null 2>&1; then
  TOOL=$(jq -r '.tool_name // ""' <<<"$IN")
  CMD=$(jq -r '.tool_input.command // ""' <<<"$IN")
fi

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

HINT='소스코드 탐색은 ast-grep 만 사용합니다.

  ast-grep run -p '"'"'<패턴>'"'"' -l ts core/     구조 검색
  ast-grep run -p '"'"'$A.slice($B)'"'"' -l ts      메타변수로 형태 검색

파일명으로 찾을 땐 Glob 툴을 쓰세요.'

if [[ $TOOL == "Grep" || $TOOL == "Find" || $TOOL == "grep" || $TOOL == "find" ]]; then
  deny "Grep 툴은 이 저장소에서 막혀 있습니다. $HINT"
fi

[[ ( $TOOL == "Bash" || $TOOL == "bash" ) && -n $CMD ]] || exit 0

# 따옴표 안의 내용은 명령어로 오인될 수 있어 비운다
BARE=$(printf '%s' "$CMD" | sed "s/'[^']*'//g; s/\"[^\"]*\"//g")

SEARCH_CMDS='grep|egrep|fgrep|rg|ripgrep|ag|ack|ack-grep|ugrep|find'

contains_source_read() {
  command -v python3 >/dev/null 2>&1 || return 1

  python3 - "$1" <<'PY'
import re
import shlex
import sys

command = sys.argv[1]
source_file = re.compile(r"\.(?:ts|tsx|js|jsx)(?::\d+(?::\d+)?)?$", re.IGNORECASE)
read_commands = {"cat", "sed", "awk"}
separators = {"|", ";", "&&", "||", "&"}

try:
    lexer = shlex.shlex(command, posix=True, punctuation_chars="|;&<>")
    lexer.whitespace_split = True
    tokens = list(lexer)
except ValueError:
    tokens = command.split()

at_command_start = True
for index, token in enumerate(tokens):
    if token in separators:
        at_command_start = True
        continue
    if not at_command_start:
        continue
    if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*=.*", token):
        continue

    command_name = token.rsplit("/", 1)[-1]
    if command_name not in read_commands:
        at_command_start = False
        continue

    for argument in tokens[index + 1:]:
        if argument in separators:
            break
        if source_file.search(argument):
            raise SystemExit(0)
    at_command_start = False

raise SystemExit(1)
PY
}

if contains_source_read "$CMD"; then
  deny "cat/sed/awk로 TS/TSX/JS/JSX 파일을 탐색할 수 없습니다. $HINT"
fi

# 저장해둔 실행 결과를 탐색하는 경우는 통과
case "$CMD" in */tmp/*|*scratchpad*) exit 0 ;; esac

# 파이프라인을 구분자별로 쪼개되, 파이프(|)로 이어받은 구간은 표시를 남겨 건너뛴다
PIPED_MARK=$'\x01'
SEGMENTS=$(printf '%s' "$BARE" \
  | sed -e "s/||/\n/g" -e "s/&&/\n/g" -e "s/;/\n/g" -e "s/|/\n${PIPED_MARK}/g")

while IFS= read -r seg; do
  [[ $seg == "${PIPED_MARK}"* ]] && continue

  # 앞쪽 공백, 괄호, VAR=value 형태의 환경변수 접두사 제거
  seg=$(printf '%s' "$seg" | sed -e 's/^[[:space:](]*//' -e 's/^\([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]\+\)*//')
  first=${seg%%[[:space:]]*}
  first=${first##*/}
  [[ -n $first ]] || continue

  if [[ $first =~ ^(${SEARCH_CMDS})$ ]]; then
    deny "\`$first\` 로 파일을 탐색하고 있습니다. $HINT"
  fi
done <<<"$SEGMENTS"

exit 0

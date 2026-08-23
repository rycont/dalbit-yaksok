#!/usr/bin/env bash
# 긴 출력은 알아서 파일로 저장한다.
#
# 실행 전에 출력이 얼마나 될지는 알 수 없다. 그래서 판단을 미리 시키는 대신,
# 명령을 감싸서 파일로 받은 뒤 길이를 보고 결정한다:
#   짧으면  -> 그대로 전부 보여주고 파일 삭제
#   길면    -> 앞부분만 보여주고 파일 경로를 알린다 (원본이 남으므로 재실행 불필요)
#
# PostToolUse 로는 불가능하다. 그 시점엔 이미 전체 출력이 모델 컨텍스트에 들어가 있고,
# PostToolUse 훅에는 툴 출력을 교체하는 필드가 없다.
set -euo pipefail

MAX_LINES=200
MAX_BYTES=100000
LOG_DIR="${TMPDIR:-/tmp}/claude-bash-out"

IN=$(cat)

command -v jq >/dev/null 2>&1 || exit 0

TOOL=$(jq -r '.tool_name // ""' <<<"$IN")
CMD=$(jq -r '.tool_input.command // ""' <<<"$IN")
BG=$(jq -r '.tool_input.run_in_background // false' <<<"$IN")

[[ $TOOL == "Bash" && -n $CMD ]] || exit 0
# 백그라운드 실행은 이미 파일로 출력을 받는다
[[ $BG == "true" ]] && exit 0
# 이미 감싼 명령은 다시 감싸지 않는다
case "$CMD" in *__cc_log*) exit 0 ;; esac

# 원본을 작은따옴표 문자열 안에 그대로 넣기 위한 이스케이프
ESC=${CMD//\'/\'\\\'\'}

WRAPPED="mkdir -p '$LOG_DIR'
__cc_log=\$(mktemp '$LOG_DIR/out.XXXXXXXX')
{ eval '$ESC'; } > \"\$__cc_log\" 2>&1
__cc_rc=\$?
__cc_lines=\$(wc -l < \"\$__cc_log\")
__cc_bytes=\$(wc -c < \"\$__cc_log\")
if [ \"\$__cc_lines\" -gt $MAX_LINES ] || [ \"\$__cc_bytes\" -gt $MAX_BYTES ]; then
  head -n $MAX_LINES \"\$__cc_log\"
  printf '\\n[출력 잘림] 전체 %s줄 / %s바이트. 원본 보존됨:\\n  %s\\n[안내] 나머지는 Read 툴(offset/limit) 이나 이 파일 대상 grep/sed 로 찾으세요. 명령을 다시 돌리지 마세요.\\n' \"\$__cc_lines\" \"\$__cc_bytes\" \"\$__cc_log\"
else
  cat \"\$__cc_log\"
  rm -f \"\$__cc_log\"
fi
( exit \$__cc_rc )"

jq -n --argjson input "$IN" --arg cmd "$WRAPPED" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    updatedInput: ($input.tool_input | .command = $cmd)
  }
}'

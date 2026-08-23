#!/usr/bin/env bash
# 명령 출력을 파이프로 버리지 않는다.
# `| head`, `| tail`, `| grep` 계열을 거절한다. 필터가 빗나가면 원본이 사라져 재실행해야 한다.
# 정말 긴 출력은 파일로 저장한 뒤 탐색한다.
# 예외: /tmp 또는 scratchpad 경로 (= 이미 저장해둔 결과를 탐색 중)
set -euo pipefail

IN=$(cat)

TOOL=""
CMD=""
if command -v jq >/dev/null 2>&1; then
  TOOL=$(jq -r '.tool_name // ""' <<<"$IN")
  CMD=$(jq -r '.tool_input.command // ""' <<<"$IN")
fi

[[ $TOOL == "Bash" && -n $CMD ]] || exit 0

# 저장해둔 결과를 탐색하는 경우는 통과
case "$CMD" in */tmp/*|*scratchpad*) exit 0 ;; esac

# 따옴표 안의 내용은 명령어로 오인될 수 있어 비운다
BARE=$(printf '%s' "$CMD" | sed "s/'[^']*'//g; s/\"[^\"]*\"//g")

FILTER_CMDS='grep|egrep|fgrep|rg|ripgrep|ag|ack|ack-grep|ugrep|head|tail'

# 파이프(|)로 이어받는 구간만 검사한다. `;`, `&&`, `||` 뒤는 별개 명령이라 대상이 아니다.
PIPED_MARK=$'\x01'
SEGMENTS=$(printf '%s' "$BARE" \
  | sed -e "s/||/\n/g" -e "s/&&/\n/g" -e "s/;/\n/g" -e "s/|/\n${PIPED_MARK}/g")

while IFS= read -r seg; do
  [[ $seg == "${PIPED_MARK}"* ]] || continue
  seg=${seg#"${PIPED_MARK}"}

  seg=$(printf '%s' "$seg" | sed -e 's/^[[:space:](]*//' -e 's/^\([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]\+\)*//')
  first=${seg%%[[:space:]]*}
  first=${first##*/}
  [[ -n $first ]] || continue

  if [[ $first =~ ^(${FILTER_CMDS})$ ]]; then
    jq -n --arg cmd "$first" '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: ("`| " + $cmd + "` 로 출력을 버리고 있습니다. 필터가 빗나가면 원본이 사라져서 명령을 다시 돌려야 합니다.\n\n필터를 떼고 그냥 실행하세요. 길이는 신경 쓸 필요 없습니다:\n출력이 200줄을 넘으면 save-long-output 훅이 전체를 파일로 저장하고\n앞 200줄과 그 경로를 보여줍니다. 나머지는 Read 툴이나 그 파일 대상 grep 으로 찾으면 됩니다.\n\n실행 중인 명령에 head/tail 을 붙이면 명령이 끝날 때까지 아무것도 안 보이기까지 합니다.\n출력을 버리지 않는 파이프(wc, jq, sort, uniq)는 그대로 쓰면 됩니다.")
      }
    }'
    exit 0
  fi
done <<<"$SEGMENTS"

exit 0

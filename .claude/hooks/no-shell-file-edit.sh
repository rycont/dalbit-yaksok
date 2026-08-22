#!/usr/bin/env bash
set -euo pipefail

IN=$(cat)

if command -v jq >/dev/null 2>&1; then
  IN=$(jq -r '.tool_input.command // ""' <<<"$IN")
fi

BARE=$(printf '%s' "$IN" | tr '\n' ' ' | sed "s/'[^']*'//g; s/\"[^\"]*\"//g")

REASON=""

WRITE_RE='write_text\(|\.writelines\(|open\([^)]*["'"'"'][wa]'
if [[ $IN =~ $WRITE_RE ]]; then
  REASON="인라인 코드로 파일을 쓰고 있습니다"
fi

if [[ -z $REASON ]]; then
  case "$IN" in */tmp/*|*scratchpad*) exit 0 ;; esac
fi

SED_RE='(^|[;&|(]|[[:space:]])sed[[:space:]]+[^|]*-i([[:space:]]|\.|$)'
if [[ -z $REASON && $BARE =~ $SED_RE ]]; then
  REASON="\`sed -i\` 로 파일을 편집하고 있습니다"
fi

REDIR_RE='(^|[;&|(]|[[:space:]])(printf|echo|cat|tee)[[:space:]][^|]*>[[:space:]]*[^[:space:]]+\.(py|ts|tsx|js|jsx|mjs|cjs|md|json|ya?ml|toml|sh|css|scss|html|sql|txt|env)'
if [[ -z $REASON && $BARE =~ $REDIR_RE ]]; then
  REASON="셸 리다이렉션으로 소스 파일을 덮어쓰고 있습니다"
fi

[[ -n $REASON ]] || exit 0

cat <<JSON
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "$REASON. 수정은 \`Edit\`, 생성은 \`Write\`.\n\n\`.replace()\` 와 \`sed\` 는 매칭이 빗나가도 조용히 성공합니다. scratchpad 도 인라인 쓰기는 막힙니다."
  }
}
JSON

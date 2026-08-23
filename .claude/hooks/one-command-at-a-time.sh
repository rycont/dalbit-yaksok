#!/usr/bin/env bash
# 한 번에 명령 하나만 실행한다.
#
# 사람은 셸에 `;` 나 `&&` 로 명령을 이어붙여 한 번에 던지지 않는다.
# 여러 단계가 필요하면 스크립트 파일로 만들어 실행하고,
# 서로 의존 없는 작업이면 Bash 툴을 여러 번 호출한다.
#
# 파이프라인 하나(`a | b | c`)는 명령 하나로 본다.
# 힙독은 여러 줄이지만 명령 하나이므로 본문을 검사 대상에서 뺀다.
set -euo pipefail

IN=$(cat)

command -v jq >/dev/null 2>&1 || exit 0

TOOL=$(jq -r '.tool_name // ""' <<<"$IN")
CMD=$(jq -r '.tool_input.command // ""' <<<"$IN")

[[ $TOOL == "Bash" && -n $CMD ]] || exit 0
# save-long-output 훅이 감싼 명령은 대상이 아니다
case "$CMD" in *__cc_log*) exit 0 ;; esac

# 힙독 본문을 걷어낸다 (여러 줄이어도 명령 하나이므로)
STRIPPED=$(printf '%s\n' "$CMD" | awk '
  BEGIN { inhd = 0 }
  {
    if (inhd) {
      probe = $0
      sub(/^[ \t]+/, "", probe)
      sub(/[ \t]*;?[ \t]*$/, "", probe)
      if (probe == delim) inhd = 0
      next
    }
    if (match($0, /<<-?[ \t]*["'"'"']?[A-Za-z_][A-Za-z0-9_]*["'"'"']?/)) {
      d = substr($0, RSTART, RLENGTH)
      sub(/^<<-?[ \t]*/, "", d)
      gsub(/["'"'"']/, "", d)
      delim = d
      inhd = 1
    }
    print
  }
')

# 따옴표 안의 내용은 구분자로 오인될 수 있어 비운다
BARE=$(printf '%s\n' "$STRIPPED" | sed "s/'[^']*'//g; s/\"[^\"]*\"//g")

deny() {
  jq -n --arg what "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ($what + " 로 명령을 이어붙였습니다. 한 번에 명령 하나만 실행하세요.\n\n- 서로 의존 없는 작업이면 한 응답에서 Bash 툴을 여러 번 호출하세요 (그러면 병렬로 돕니다).\n- 순서가 필요하면 앞 명령의 결과를 보고 다음 호출을 하세요.\n- 다른 디렉터리에서 실행하려면 `env -C <경로> <명령>` 또는 `cd <경로> && <명령 하나>` 를 쓰세요.\n- 파이프라인 하나(`a | b`)는 명령 하나로 봅니다. 힙독도 허용됩니다.\n\n스크립트 파일로 감싸서 우회하지 마세요. 스크립트는 여러 번 재실행할 검증 하네스일 때만 만듭니다.")
    }
  }'
  exit 0
}

# 명령이 있는 줄이 둘 이상이면 여러 명령이다
LINES=$(printf '%s\n' "$BARE" | grep -c '[^[:space:]]' || true)
[[ ${LINES:-0} -gt 1 ]] && deny "줄바꿈"

# 한 줄 안에서 이어붙인 경우. 끝에 붙은 `;` 하나는 봐준다.
ONELINE=$(printf '%s' "$BARE" | tr -d '\n' | sed 's/[[:space:]]*;[[:space:]]*$//')

# `cd <경로> &&` 접두사는 한 번만 허용한다.
# 작업 디렉터리가 Bash 호출 간 유지되지 않아 생기는 구조적 필요라 예외로 둔다.
# 떼어낸 나머지는 그대로 검사하므로 `cd x && a && b` 는 여전히 막힌다.
ONELINE=$(printf '%s' "$ONELINE" |
  sed -E 's/^[[:space:]]*cd[[:space:]]+[^&|;]+&&[[:space:]]*//')

case "$ONELINE" in
  *"&&"*) deny "\`&&\`" ;;
  *"||"*) deny "\`||\`" ;;
  *";"*)  deny "\`;\`" ;;
esac

exit 0

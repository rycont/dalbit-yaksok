#!/usr/bin/env bash
# 편집이 끝난 뒤 변경된 파일을 oxfmt로 고치고, JavaScript/TypeScript 파일은 oxlint로 검사한다.
# Claude의 Edit/Write, Codex의 apply_patch, Pi의 edit/write를 지원한다.
set -euo pipefail

IN=$(cat)

command -v jq >/dev/null 2>&1 || exit 0

report_failure() {
  jq -n --arg message "$1" '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: $message
    }
  }'
  exit 0
}

is_lintable() {
  case "$1" in
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.mts|*.cts) return 0 ;;
    *) return 1 ;;
  esac
}

CWD=$(jq -r '.cwd // empty' <<<"$IN")
[[ -d $CWD ]] || CWD=$PWD
REPO=$(git -C "$CWD" rev-parse --show-toplevel 2>/dev/null || true)
[[ -n $REPO ]] || exit 0

TOOL=$(jq -r '.tool_name // empty' <<<"$IN")
declare -a RAW_PATHS=()

case "$TOOL" in
  Edit|edit|Write|write)
    FILE_PATH=$(jq -r '.tool_input.file_path // .tool_input.path // .tool_response.filePath // empty' <<<"$IN")
    [[ -n $FILE_PATH ]] && RAW_PATHS+=("$FILE_PATH")
    ;;
  apply_patch)
    PATCH=$(jq -r '.tool_input.command // .tool_input.patch // empty' <<<"$IN")
    while IFS= read -r path; do
      [[ -n $path ]] && RAW_PATHS+=("$path")
    done < <(
      printf '%s' "$PATCH" |
        sed -n -E \
          -e 's/^\*\*\* (Update|Add|Delete) File: (.*)$/\2/p' \
          -e 's/^\*\*\* Move to: (.*)$/\1/p'
    )
    ;;
  *)
    exit 0
    ;;
esac

declare -A SEEN_FILES=()
declare -a FILES=()
declare -a LINT_FILES=()

for raw_path in "${RAW_PATHS[@]}"; do
  if [[ $raw_path == /* ]]; then
    absolute=$(realpath -m -- "$raw_path")
  else
    absolute=$(realpath -m -- "$CWD/$raw_path")
  fi

  case "$absolute" in
    "$REPO"/*) ;;
    *) continue ;;
  esac

  relative=${absolute#"$REPO"/}
  [[ -f $absolute ]] || continue
  [[ -n ${SEEN_FILES[$absolute]:-} ]] && continue
  SEEN_FILES[$absolute]=1
  FILES+=("$absolute")
  is_lintable "$relative" && LINT_FILES+=("$absolute")
done

((${#FILES[@]} > 0)) || exit 0

format_output=""
format_exit_code=0
if format_output=$(cd "$REPO" && deno run -A npm:oxfmt@0.63.0 --write --no-error-on-unmatched-pattern "${FILES[@]}" 2>&1); then
  :
else
  format_exit_code=$?
fi

lint_output=""
lint_exit_code=0
if ((${#LINT_FILES[@]} > 0)); then
  if lint_output=$(cd "$REPO" && deno run -A npm:oxlint@1.78.0 "${LINT_FILES[@]}" 2>&1); then
    :
  else
    lint_exit_code=$?
  fi
fi

report=""
if ((format_exit_code != 0)); then
  report=$(printf 'oxfmt 자동 수정에 실패했습니다 (exit %s).\n\n%s' "$format_exit_code" "${format_output:0:12000}")
fi

if ((lint_exit_code != 0)); then
  lint_report=$(printf 'oxlint가 편집 후 실패했습니다 (exit %s).\n\n%s' "$lint_exit_code" "${lint_output:0:12000}")
  if [[ -n $report ]]; then
    report+=$(printf '\n\n%s' "$lint_report")
  else
    report=$lint_report
  fi
fi

[[ -n $report ]] || exit 0
report_failure "$report"

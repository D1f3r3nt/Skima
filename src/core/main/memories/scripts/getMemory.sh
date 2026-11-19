#!/usr/bin/env bash
project_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
memory_file="$project_dir/MEMORY.md"
[ -f "$memory_file" ] || exit 0

memory_path="$(sed -n 's/^[[:space:]]*path[[:space:]]*:[[:space:]]*//p' "$memory_file" | head -n 1 | tr -d '\r' | sed 's/[[:space:]]*$//')"
[ -n "$memory_path" ] || exit 0

memory_dir="$(printf '%s' "$memory_path" | tr '\\' '/')"
[ -d "$memory_dir" ] || exit 0

index_file="$memory_dir/README.md"
instructions_file="$memory_dir/CLAUDE.md"

json_escape() {
  tr -d '\000-\010\013\014\016-\037' \
    | tr '\t' ' ' \
    | sed -e 's/\r$//' -e 's/\\/\\\\/g' -e 's/"/\\"/g' \
    | awk 'BEGIN { ORS = "" } { if (NR > 1) printf "%s", "\\n"; printf "%s", $0 }'
}

context="$(
  {
    printf 'Este proyecto pertenece a una memoria compartida (brain) en %s. Antes de buscar en archivos en bruto, consulta la memoria: empieza por su indice y abre solo los archivos relevantes (context/, tech_solutions/, decisions/, projects/<proyecto>/).\n' "$memory_path"
    if [ -f "$instructions_file" ]; then
      printf '\n--- CLAUDE.md de la memoria ---\n'
      head -n 120 "$instructions_file"
    fi
    if [ -f "$index_file" ]; then
      printf '\n--- README.md (indice) de la memoria ---\n'
      head -n 150 "$index_file"
    fi
  } | json_escape
)"

printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"%s"}}\n' "$context"

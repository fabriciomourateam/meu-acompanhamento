#!/usr/bin/env bash
# PreToolUse (Edit|Write|MultiEdit): injeta um lembrete pro Claude SUGERIR ao dono,
# no momento da edição de um .ts/.tsx em src/, as práticas do projeto:
#  (1) TEMA: entregar SEMPRE claro + escuro (claro = base; escuro = variantes dark:)
#  (2) tipar os `any` que estiver tocando (usar os types gerados do Supabase)
#  (3) se o arquivo for grande (>800 linhas), extrair o trecho tocado (refactor oportunístico)
# Nunca bloqueia a edição (sempre exit 0). Só fala quando é arquivo de UI/código relevante.
set -euo pipefail

input="$(cat)"
f="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"

# Só .ts/.tsx dentro de src/. Ignora declarações de tipo e testes.
case "$f" in
  */src/*.tsx|*/src/*.ts|src/*.tsx|src/*.ts) ;;
  *) exit 0 ;;
esac
case "$f" in
  *.d.ts|*.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) exit 0 ;;
esac

msg="Lembrete do projeto (sugira ao dono e aplique quando fizer sentido): "
msg+="(1) TEMA — entregue claro + escuro (claro = base; escuro = variantes dark:). "
msg+="(2) Tipe os \`any\` que tocar (use os types gerados do Supabase quando aplicável)."

if [ -f "$f" ]; then
  lines="$(wc -l < "$f" 2>/dev/null | tr -d ' ' || echo 0)"
  if [ "${lines:-0}" -gt 800 ]; then
    msg+=" (3) Arquivo grande (${lines} linhas): considere extrair o trecho que está tocando para subcomponente/hook/lib (refactor oportunístico, validado por build)."
  fi
fi

jq -n --arg m "$msg" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$m}}'
exit 0

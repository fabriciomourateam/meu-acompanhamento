#!/bin/bash
# SessionStart hook: injeta o handoff da sessão anterior no contexto do Claude,
# no início de TODA sessão (web/local). O stdout deste script vira contexto.
# Idempotente, não-interativo, no-op se não houver handoff.
set -euo pipefail

HANDOFF="${CLAUDE_PROJECT_DIR:-.}/docs/SESSION_HANDOFF.md"

if [ -s "$HANDOFF" ]; then
  printf '=== HANDOFF DA SESSÃO ANTERIOR (docs/SESSION_HANDOFF.md) — LEIA ANTES DE QUALQUER AÇÃO DE ESCRITA ===\n\n'
  cat "$HANDOFF"
  printf '\n=== FIM DO HANDOFF ===\n'
fi

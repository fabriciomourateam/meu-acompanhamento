# SESSION HANDOFF — Projeto iOS / App Store (Capacitor + push nativo)

> Leia este arquivo PRIMEIRO ao abrir uma nova janela (regra no `CLAUDE.md` →
> "Continuidade entre janelas de contexto"). Sobrescreva-o a cada handoff.

## Tarefa ATIVA
Publicar o app do aluno (`meu-acompanhamento`) na **Apple App Store** via
**Capacitor**, com **push nativo (APNs/FCM)** funcionando no iPhone — sem quebrar
web/PWA/Android.

➡️ **Spec completa, plano, esforço e decisões: `docs/ios-app-store-capacitor.md` — LEIA-A.**

## Resumo de uma linha
Android = PWA→TWA (PWABuilder, package `com.fmteam.meuacompanhamento`). iOS não tem TWA
e WKWebView não suporta Web Push → caminho é **Capacitor + FCM**. Plano em 4 frentes
(cliente Capacitor, config Apple/Firebase, estender a edge function `send-push` p/ FCM,
build via Codemagic + TestFlight). ~4–5 dias de dev + contas do dono + iPhone p/ testar.

## Estado atual
- **Nada de código iOS começou.** Só análise + a spec.
- **Brainstorm inicial FEITO (2026-06-25) — 5 decisões fechadas** (detalhe em
  `docs/ios-app-store-capacitor.md` → "Decisões FECHADAS"):
  1. **FCM** (não APNs direto); cliente usa `@capacitor-firebase/messaging`.
  2. **Só iOS** no nativo; Android continua TWA + Web Push (intocado).
  3. **Dedup por device** (natural): tabela `native_push_tokens`, `UNIQUE(token)`, sem dedup extra.
  4. **Deep-link**: campo `url` canônico reusado (web SW + tap nativo lê `data.url`).
  5. **Service account JSON** → secret da edge function (não `app_config`).
- Decidido (antes): **Capacitor** (não PWABuilder), porque push no iPhone é requisito.
- Push hoje = Web Push/VAPID (`src/lib/push-service.ts` → `push_subscriptions` →
  edge function `send-push` → `sw.js`). Funciona em web/PWA/Android TWA; NÃO no WKWebView.
- Limitação: Claude escreve tudo, mas **não testa push iOS** (sem Mac/iPhone) → dono valida via TestFlight.

## Próximo passo concreto
Brainstorm fechado → partir pro **Passo 1** da spec: configurar **Capacitor + projeto
iOS + ícones/splash** no repo (additivo, não toca no fluxo atual). Branch de trabalho:
`claude/pensive-newton-3zucgh`.

## Regra de ouro
Tudo additivo, em branch, dono testa antes de mergear. NÃO mexer em
`package_name`/`assetlinks.json`/`start_url`/ícones usados pelo TWA.

---
_(Handoff anterior — tema claro/escuro — concluído e mergeado; substituído por este.)_

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
- **Nada de código iOS começou.** Só análise + a spec, commitada na `main`.
- Decidido: **Capacitor** (não PWABuilder), porque push no iPhone é requisito.
- Push hoje = Web Push/VAPID (`src/lib/push-service.ts` → `push_subscriptions` →
  edge function `send-push` → `sw.js`). Funciona em web/PWA/Android TWA; NÃO no WKWebView.
- Limitação: Claude escreve tudo, mas **não testa push iOS** (sem Mac/iPhone) → dono valida via TestFlight.

## Próximo passo concreto
Passo 1 da spec: configurar **Capacitor + projeto iOS + ícones/splash** no repo
(additivo, não toca no fluxo atual). Antes, vale um **brainstorm curto** pra fechar as
"Decisões em aberto" da spec (FCM vs APNs, unificar Android ou não, dedup, deep-link).

## Regra de ouro
Tudo additivo, em branch, dono testa antes de mergear. NÃO mexer em
`package_name`/`assetlinks.json`/`start_url`/ícones usados pelo TWA.

---
_(Handoff anterior — tema claro/escuro — concluído e mergeado; substituído por este.)_

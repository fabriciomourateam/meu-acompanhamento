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

## Passo 1 — PARCIALMENTE FEITO (branch `claude/pensive-newton-3zucgh`, pushada)
Commits: `3114fa9` (Capacitor + iOS). Feito e seguro/aditivo:
- Capacitor 8 instalado: `core/cli/ios/app/push-notifications` + `@capacitor-firebase/messaging`.
- `capacitor.config.ts`: appId `com.fmteam.meuacompanhamento`, `server.url=https://my-shape.app`
  (carrega site ao vivo, igual ao Android — não toca web/PWA/Android).
- `ios/` (projeto Xcode) versionado via `npx cap add ios`.
- `Info.plist`: `UIBackgroundModes=remote-notification`. Scripts `cap:sync`/`cap:open`.

**Pendente do Passo 1 (precisa Mac/Codemagic ou contas do dono — NÃO dá pra validar aqui):**
- Ícones/splash reais: `@capacitor/assets` falhou no Linux (sharp/libvips via proxy).
  Fonte pronta: `public/app-icon-512.png`. Rodar no Mac/Codemagic. Hoje há placeholder do Capacitor.
- `GoogleService-Info.plist` (Firebase) — dono cria projeto Firebase + app iOS.
- Capability **Push Notifications** + entitlement `aps-environment` (Xcode/Codemagic).
- Init do Firebase no `AppDelegate.swift` + encaminhar APNs token pro FCM (parte do plugin).

## Próximo passo concreto
Escrever a camada de **cliente** que DÁ pra validar aqui (typecheck): serviço que, em
`Capacitor.isNativePlatform()`, registra push nativo, pega o **token FCM** e salva na
tabela nova **`native_push_tokens`** (criar migration); + handler de **tap → deep-link**
(`data.url`). Web Push (`src/lib/push-service.ts`) continua intacto pra web/PWA/Android.

## Regra de ouro
Tudo additivo, em branch, dono testa antes de mergear. NÃO mexer em
`package_name`/`assetlinks.json`/`start_url`/ícones usados pelo TWA.

---
_(Handoff anterior — tema claro/escuro — concluído e mergeado; substituído por este.)_

# Projeto: publicar o app do aluno na Apple App Store (Capacitor + push nativo)

> Spec/handoff completo. Objetivo: levar o `meu-acompanhamento` pra **App Store**
> com **notificações push funcionando no iPhone**, sem quebrar nada do que os
> alunos já usam (web, PWA, Android).

## Contexto — como o Android foi feito
- O app no **Play Store é um PWA empacotado como TWA** (Trusted Web Activity),
  gerado pelo **PWABuilder**. Package: **`com.fmteam.meuacompanhamento`**.
- Artefatos do PWABuilder que o dono já tem: `.aab`, `.apk`, `signing.keystore`,
  `signingkeyinfo.txt`, `assetlinks.json`, readme. (A keystore + senha são SEGREDO —
  não comitar; e **não servem pra Apple**, que usa certificados próprios.)
- No repo só vivem `public/manifest.json` (app "My Shape", `start_url: /portal`),
  `public/sw.js`, `public/.well-known/assetlinks.json`. Não há pasta nativa.

## Por que Capacitor (e não PWABuilder) no iOS
- iOS **não tem TWA**. O equivalente é um app **WKWebView**.
- **WKWebView não suporta Web Push.** O push atual (Web Push/VAPID) **NÃO funciona**
  dentro do app do PWABuilder iOS. Web Push no iOS só roda no Safari/PWA instalado
  (Adicionar à Tela de Início, iOS 16.4+) — não via app de loja.
- Para ter push num app da App Store, só com **APNs nativo** → **Capacitor** com o
  plugin de push (via **FCM**, que cobre iOS por baixo dos panos).
- Conclusão: como push no iPhone é requisito, fazemos **Capacitor desde já** pra
  evitar dupla submissão/review na Apple.

## Como o push funciona HOJE (não quebrar)
1. **Cliente** `src/lib/push-service.ts`: Web Push via `pushManager.subscribe`
   (chave VAPID vinda de `get_push_public_key`); salva endpoint/p256dh/auth na tabela
   **`push_subscriptions`** (RPCs `push_save_subscription` / `_trainer`).
2. **Disparo**: SQL `notify_send_push` → `pg_net` (`net.http_post`) → **edge function
   `send-push`** (deployada, **fonte NÃO está no repo**) → web-push assina c/ VAPID e
   faz POST nos endpoints. Chaves VAPID ficam em `app_config`. Trigger ex.:
   `trg_chat_message_notify` (migration `controle-de-pacientes/supabase/migrations/20260620_chat_push.sql`).
3. **Recebimento**: `public/sw.js` handler `push` → `showNotification`.
4. **Onde já funciona**: web, PWA instalado, **Android TWA** (Chrome suporta Web Push).
5. **Sininho in-app** (lista via `notifications_get`) funciona em qualquer wrapper — é
   só consulta quando o app está aberto. O que muda no iOS é o **push real** (app fechado).
- Supabase project: **"Controle de pacientes"** `qhzifnyjyxdushxorzrk` (sa-east-1).

## Plano — 4 frentes
| Frente | O que fazer | Quem | Esforço |
|---|---|---|---|
| **Cliente (Capacitor)** | Instalar Capacitor (`core/cli/ios`); `npx cap add ios` (pasta `ios/` versionada); plugin de push; ao abrir o app NATIVO, registrar e pegar o **token do device**, salvar em tabela nova **`native_push_tokens`** (patient_id, token, platform); tratar **toque na notificação** → deep-link pra tela certa; usar `Capacitor.isNativePlatform()` pra escolher Web Push (web/PWA) vs nativo (app). | Claude | ~1,5 dia |
| **Config Apple/Firebase** | Conta Apple Developer ($99/ano); **APNs Auth Key (.p8)**; capability Push; projeto **Firebase** + subir a chave APNs + baixar `GoogleService-Info.plist`; service account do Firebase (JSON) pro envio server-side. | Dono | ~0,5 dia |
| **Servidor (envio)** | Estender `send-push` (ou criar `send-push-native`): além do Web Push, mandar pros tokens nativos via **FCM HTTP v1** (assinar JWT com o service account). Guardar credenciais em `app_config`. **Dedup**: quem tem web push + token nativo não recebe duplicado (rotear por plataforma/device). | Claude | ~1,5–2 dias |
| **Build & teste** | **Codemagic** (grátis) compila/assina/sobe; testar via **TestFlight** em iPhone real. | Dono + Claude | ~0,5 dia setup |

**Total dev ~4–5 dias** + parte de contas do dono + um iPhone p/ testar (TestFlight).

## Regra de ouro
Tudo **additivo**. NÃO mexer em: `package_name`/`assetlinks.json` (Android depende),
`start_url`/ícones já usados pelo TWA. Capacitor carrega o **site ao vivo** (igual ao
Android) → experiência do aluno **idêntica**. Trabalhar em **branch**, dono testa antes
de mergear.

## Limitação honesta de teste
Claude **escreve tudo** (Capacitor, registro de token, tabela, estender `send-push`) mas
**não testa push no iOS** (sem Mac/iPhone no ambiente). Validação do push chegando =
dono, via **TestFlight**. Iterar conforme os testes reais.

## Decisões FECHADAS (brainstorm inicial — 2026-06-25)
1. **FCM (Firebase)**, não APNs direto. Servidor fala FCM HTTP v1; Firebase entra como
   dep nova (`GoogleService-Info.plist` + service account JSON). No cliente Capacitor,
   usar **`@capacitor-firebase/messaging`** (dá token FCM no iOS; o `@capacitor/push-notifications`
   puro só daria token APNs cru).
2. **Só iOS no nativo (FCM).** Android **continua TWA + Web Push** (já funciona, não tocar).
   "Unificar Android no FCM" exigiria reembrulhar o Android em Capacitor → escopo grande,
   fora do agora. Blast radius mínimo.
3. **Dedup: por device, natural.** Cada aparelho tem **um único canal** (iPhone-app→token
   nativo; Android-TWA/Safari/desktop→web push; WKWebView não tem Web Push, então o app iOS
   nunca recebe web push). Tabela nova **`native_push_tokens (patient_id, token UNIQUE,
   platform, device_id?)`**; no envio, manda pra todas as web subs **+** todos os tokens
   nativos do paciente. Só `UNIQUE(token)` pra não duplicar registro — **sem dedup extra**.
4. **Deep-link: campo `url` canônico.** Reusar o mesmo `url`/`data.url` que o web push já
   manda hoje pro `notificationclick` do `sw.js`. No nativo, `pushNotificationActionPerformed`
   lê `data.url` → navega o webview pra rota (`/portal/...`). Um payload só serve SW e tap nativo.
5. **Service account JSON → secret da edge function** (Supabase Functions secret/env),
   **não** `app_config`. Chave privada isolada, não consultável via SQL. (VAPID continua em
   `app_config`; só o service account vai pro secret.)

## Credenciais/IDs que o dono precisa providenciar
- Apple Developer account + Team ID; APNs Auth Key (.p8) + Key ID; Bundle ID
  (sugestão: `com.fmteam.meuacompanhamento`, igual ao Android).
- Firebase: projeto, app iOS, `GoogleService-Info.plist`, service account JSON.
- Conta Codemagic (grátis) ligada ao repo.

## Estado da implementação (2026-06-25) — TODO o código feito
Todas as 4 frentes foram codadas e commitadas (branches `claude/pensive-newton-3zucgh`
nos dois repos). Detalhe operacional e sequência de ativação do dono em
`docs/SESSION_HANDOFF.md`. Resumo:

| Frente | Status |
|---|---|
| Cliente (Capacitor + token FCM + deep-link) | ✅ código (typecheck ok) |
| Servidor (`send-push-native` FCM v1 + roteamento gated) | ✅ código; migrations **aplicadas**; função **não deployada** |
| iOS nativo (Firebase init, entitlement, Codemagic) | ✅ wiring; valida no Mac/Codemagic |
| Config Apple/Firebase (contas) | ⏳ **dono** |

**Decisão de não-quebrar:** em vez de tocar a `send-push`, criei a `send-push-native`
paralela; o `notify_send_push` chama as duas, mas a nativa só dispara com
`app_config.native_push_enabled='true'` (off por default). Web push e Android TWA
ficam 100% inalterados até o dono ligar a flag.

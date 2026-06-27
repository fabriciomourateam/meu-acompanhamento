# SESSION HANDOFF — Projeto iOS / App Store (Capacitor + push nativo)

> Leia este arquivo PRIMEIRO ao abrir uma nova janela (regra no `CLAUDE.md` →
> "Continuidade entre janelas de contexto"). Sobrescreva-o a cada handoff.

## Tarefa ATIVA
Publicar o app do aluno (`meu-acompanhamento`) na **Apple App Store** via
**Capacitor**, com **push nativo (FCM/APNs)** funcionando no iPhone — sem quebrar
web/PWA/Android.

➡️ **Spec completa, plano e decisões: `docs/ios-app-store-capacitor.md`.**

## Resumo de uma linha
Android = PWA→TWA (intocado). iOS = **Capacitor + FCM**. **TODO o código das 4 frentes
foi escrito e commitado** (2026-06-25). Falta só o dono **abrir contas** (Apple Developer,
Firebase, Codemagic), plugar credenciais e **buildar/testar via TestFlight**.

## Branches (pushar e o dono mergeia depois de validar — NÃO mergeei)
- `meu-acompanhamento` → `claude/pensive-newton-3zucgh` (cliente + projeto iOS + Codemagic).
- `controle-de-pacientes` → `claude/pensive-newton-3zucgh` (edge function + migrations).

## O QUE JÁ ESTÁ FEITO (código, validado por typecheck onde dá)

### Frente 1 — Cliente (meu-acompanhamento) ✅
- Capacitor 8 (`core/cli/ios/app/push-notifications` + `@capacitor-firebase/messaging`).
- `capacitor.config.ts`: appId `com.fmteam.meuacompanhamento`, `server.url=https://my-shape.app`
  (carrega site ao vivo, igual Android). `ios/` (Xcode) versionado.
- `src/lib/native-push-service.ts`: registra/refresca/remove token FCM; salva via RPC.
- `src/components/NativePushBridge.tsx`: tap na notificação → deep-link (`data.url`), montado no `App.tsx`.
- `EnableNotificationsBanner`: no app nativo oferece "Ativar" (FCM) em vez de "Instalar PWA".
- `PatientPortal`: refresh silencioso do token + listener de rotação quando já permitido.
- Web Push (`push-service.ts`) **intocado** → web/PWA/Android seguem 100%.

### Frente 3 — Servidor (controle-de-pacientes) ✅ [migrations APLICADAS em prod]
- `native_push_tokens` (tabela) + RPCs `native_push_save/delete_token` (SECURITY DEFINER). **Aplicada.**
- `supabase/functions/send-push-native/index.ts`: FCM HTTP v1 (JWT RS256 do service account no
  secret `FCM_SERVICE_ACCOUNT`). Não grava sino (a `send-push` já grava). **NÃO deployada ainda.**
- `notify_send_push` estendida com POST `/send-push-native` **GATED** por
  `app_config.native_push_enabled` (off por default → web push inalterado). **Aplicada.**

### Frente 4 — Build ✅
- `codemagic.yaml`: build web → `cap sync` → IPA → TestFlight (assina via App Store Connect API key).

### Frente 2 — iOS nativo (wiring escrito às cegas, valida no Mac/Codemagic) ✅ código / ⏳ contas
- `AppDelegate.swift`: `FirebaseApp.configure()`.
- `App.entitlements` (aps-environment) + `CODE_SIGN_ENTITLEMENTS` no pbxproj (Debug+Release).
- `Info.plist`: `UIBackgroundModes=remote-notification`.
- `GoogleService-Info.plist.example` (placeholder; o real é gitignored).

## ⏳ PENDÊNCIAS DO DONO (abrir contas + plugar) — sequência de ativação
1. **Apple Developer** ($99/ano): Team ID; criar Bundle ID `com.fmteam.meuacompanhamento`
   com capability **Push Notifications**; **APNs Auth Key (.p8)** + Key ID.
2. **Firebase**: projeto + app iOS (mesmo bundle); subir a **APNs .p8** no Firebase;
   baixar **`GoogleService-Info.plist`** → salvar em `ios/App/App/` (gitignored);
   gerar **service account JSON**.
3. **Supabase**: secret `FCM_SERVICE_ACCOUNT` = conteúdo do service account JSON;
   **deploy** da função `send-push-native` **com `verify_jwt=false`** (é chamada
   internamente por secret, igual à `send-push`); depois `insert app_config(key,value)
   values('native_push_enabled','true') on conflict (key) do update set value='true'`
   pra ligar o roteamento nativo.
4. **Ícones**: rodar `@capacitor/assets` no Mac a partir de `public/app-icon-512.png`
   (placeholder do Capacitor por ora). Idealmente fonte 1024×1024.
5. **Codemagic**: integração App Store Connect API key; setar
   `CHANGE_ME_APP_STORE_CONNECT_INTEGRATION` no `codemagic.yaml`; `GOOGLE_SERVICE_INFO_PLIST`
   (base64) como env seguro. Rodar workflow → TestFlight → testar push no iPhone real.

## Armadilhas / notas
- **Capacitor 8 gerou projeto SPM** (`CapApp-SPM/Package.swift`, sem Podfile). O
  `@capacitor-firebase/messaging` precisa resolver via SPM no `cap sync` — verificar no
  primeiro build do Codemagic (risco bleeding-edge; se falhar, avaliar Podfile).
- Claude **não testa push iOS** (sem Mac/iPhone) → validação é do dono via TestFlight.
- 163 erros de `tsc` no repo são **pré-existentes** (não dos arquivos novos); `vite build` não roda tsc.

## Regra de ouro
Tudo additivo, em branch, dono testa antes de mergear. `send-push` (web) e Android TWA
não foram tocados. Push nativo fica OFF até a flag `native_push_enabled='true'`.

## ATUALIZAÇÃO 2026-06-26 — App NO TESTFLIGHT ✅
Todo o pipeline iOS FUNCIONOU. Estado real:
- Build (Capacitor 8 + Firebase SPM nativo) compila; **firebase** JS SDK adicionado (peer do
  @capacitor-firebase/messaging) pra destravar o vite build.
- **Assinatura resolvida via signing MANUAL** (a API do Codemagic gerava profile SEM Push —
  bug conhecido). Caminho que funcionou: certificado `Apple Distribution` criado por CSR
  (gerado no sandbox, sem Mac) + **provisioning profile criado À MÃO no portal** (aí herda
  aps-environment=production com Push). `.p12` (senha `myshape-ios-2026`) + profile em base64
  estão nas envs do Codemagic grupo `ios_signing` (CM_CERTIFICATE / CM_CERTIFICATE_PASSWORD /
  CM_PROVISIONING_PROFILE). `codemagic.yaml` usa esses (não mais fetch-signing-files).
- `aps-environment=production` no App.entitlements; `ITSAppUsesNonExemptEncryption=false` no Info.plist.
- App Store Connect: app "My Shape" criado (bundle com.fmteam.meuacompanhamento). **Compilação 8
  está "Pronta para testar"** (grupo interno "My Shape Team"). Export compliance respondido (None).
- Apple Team ID MAR4FQS322. Issuer ID ASC: 4133f59a-01c7-43bb-b8a3-37389dde4f42. Firebase project: my-shape-1ecfc.

### BLOQUEIO ATUAL: sem iPhone físico
Push só pode ser validado num iPhone real (token nasce no device). Dono não tem iPhone →
precisa de um emprestado (aluno/amigo) OU testadores externos (alunos por e-mail).

### PENDENTE no servidor (fazer quando houver device com token):
1. **Deploy `send-push-native`** (controle-de-pacientes/supabase/functions/send-push-native) com
   verify_jwt=false — ficou pendente de aprovação no Supabase. FCM secret `FCM_SERVICE_ACCOUNT` JÁ salvo.
2. **Ligar flag**: `insert into app_config(key,value) values('native_push_enabled','true') on conflict (key) do update set value='true';`
3. Disparar push de teste e validar (app aberto/fechado + deep-link no tap).

### Ainda aberto: PRs #75 (meu-acompanhamento) e #372 (controle-de-pacientes) NÃO mergeados (mergear após validar push).

# Chat interno (substituir o WhatsApp) — SPEC

> **Documento vivo.** Antes de mexer em qualquer parte do chat, leia este arquivo
> e o `docs/chat/PROGRESS.md`. Os mesmos dois arquivos existem (em sincronia) nos
> dois repos: `controle-de-pacientes` e `meu-acompanhamento`.

## Por que existe

Fabricio atende 700+ alunos. O suporte e a cadência de mensagens (onboarding +
check-ins, ~100/dia) saíam por um WhatsApp automatizado (Evolution API + n8n),
operado por ele + equipe. Isso vinha causando **banimentos recorrentes do
WhatsApp** — risco existencial de perder o canal de suporte. A solução é um
**"WhatsApp interno" dentro da própria plataforma**, 100% próprio, eliminando o
risco de ban.

**Risco de negócio (não técnico):** adoção — o app exige instalar/abrir, ao
contrário do WhatsApp. Por isso a transição é **paralela e gradual** (o chat roda
junto com o WhatsApp; migra por coorte, começando pelos alunos que já usam o app).

## Arquitetura (reuso do que já existe)

- **`controle-de-pacientes`** = back-office do profissional (Supabase Auth). Acessa
  as tabelas do chat direto, protegido por **RLS** com suporte a equipe. **Realtime**
  já é usado no repo (`src/hooks/use-realtime-changes.ts`).
- **`meu-acompanhamento`** = app do aluno. O aluno **não** é usuário do Supabase
  Auth (login por telefone/token), então acessa o chat **só via RPCs SECURITY
  DEFINER**, no mesmo padrão de `community-service.ts` (passa `p_patient_id`).
- Mesmo projeto Supabase: **`qhzifnyjyxdushxorzrk`** ("Controle de pacientes").
- **Multitenant por padrão:** tudo é escopado por `owner_id` (= `patients.user_id`)
  via RLS + `team_members`. Custo zero — é o padrão já usado no resto do produto.

## Modelo de dados (migração `20260616_chat_core.sql`, aditiva)

### `chat_conversations` (uma por paciente)
- `id`, `patient_id` (FK → `patients`, unique), `owner_id` (profissional dono).
- `status`: `aguardando` | `atendendo` | `resolvido`.
- `assigned_to` (uuid do membro responsável; null fora de "atendendo").
- `last_message_at`, `last_message_preview`, `last_sender_type`.
- `unread_for_team`, `unread_for_patient` (bool).
- `cleared_at_patient`, `cleared_at_team` (timestamptz, null por padrão) — marcas
  d'água de **"limpar conversa" manual, por lado** (migração `20260617_chat_archive.sql`).
  Cada lado só exibe mensagens com `created_at >` sua marca d'água; null = mostra tudo.
  As mensagens **nunca** são apagadas — só muda o que cada lado vê. Equipe pode
  "Restaurar" (volta a marca pra null) ou ver o histórico completo na hora.
- `created_at`, `updated_at` (trigger `chat_touch_updated_at`).

### `chat_messages`
- `id`, `conversation_id` (FK), `sender_type` (`patient` | `team`),
  `sender_user_id` (qual membro enviou — **uso interno; o aluno NUNCA vê**),
  `body`, `created_at`, `read_at`.
- `media_url`, `media_type` (`image|audio|video`), `media_mime` (migração
  `20260619_chat_media.sql`) — anexo de mídia da **Fatia 2**. O arquivo fica no
  bucket público `patient-photos` (pasta `chat/`); a coluna guarda só a URL pública.
  `body` pode ser vazio quando há mídia (mensagem só-anexo).
- `deleted_at`, `deleted_by` (`patient|team`), `edited_at`, `original_body` (migração
  `20260621_chat_edit_delete.sql`) — **editar/apagar (soft-delete)**. Apagar NÃO remove
  `body`/mídia do banco (só marca `deleted_at`); editar guarda o texto original em
  `original_body`. Exibição: o **app do aluno** vê só um aviso "🚫 mensagem apagada"
  (o `chat_patient_get_messages` zera `body`/mídia das apagadas e devolve `deleted`/`edited`);
  o **back-office** vê o aviso **+** o conteúdo original esmaecido. Permissões: aluno mexe só
  nas próprias mensagens; equipe modera qualquer uma.

### `chat_internal_notes` (demandas internas — SÓ a equipe, migração `20260618`)
- Notas/pendências sobre um aluno (ex.: "mudar o treino de pernas"), **invisíveis ao
  aluno**. `id`, `conversation_id` (FK on delete cascade), `owner_id`, `category`
  (`geral|treino|dieta|suplementacao|financeiro|outro`), `body`, `status` (`open|done`),
  `created_by`, `created_at`, `resolved_by`, `resolved_at`.
- **RLS só `authenticated`** (select/insert/update/delete com `chat_is_team_of(owner_id)`);
  **nenhuma policy pra `anon`** → o app do aluno não acessa. No board, o card mostra um selo
  (bandeirinha + contagem) quando há demanda `open`.

### Segurança
- **RLS (lado equipe):** SELECT/UPDATE em `chat_conversations` e SELECT em
  `chat_messages` permitidos quando `chat_is_team_of(owner_id)` — ou seja, o
  `auth.uid()` é o dono **ou** membro ativo (`team_members.is_active`) daquele dono.
- **RPCs SECURITY DEFINER:**
  - Paciente (anon): `chat_patient_get_or_create_conversation`,
    `chat_patient_get_messages` (marca lido; devolve `deleted`/`edited` e zera o conteúdo
    das apagadas), `chat_patient_send_message` (reabre se resolvida),
    `chat_patient_unread_count`, `chat_patient_edit_message(p_patient_id, p_message_id, p_body)`
    e `chat_patient_delete_message(p_patient_id, p_message_id)` — só nas próprias mensagens.
  - Equipe (authenticated): `chat_team_get_or_create_conversation`,
    `chat_team_send_message` (insere como `team`, assume a conversa, marca
    `unread_for_patient`), `chat_team_set_cleared(p_conversation_id, p_side, p_clear)`
    — limpar/restaurar por lado (`patient` | `team` | `both`), manual;
    `chat_team_edit_message(p_message_id, p_body)` e `chat_team_delete_message(p_message_id)`
    — moderação de qualquer mensagem (soft-delete);
    `chat_team_add_note(p_conversation_id, p_body, p_category)` e
    `chat_team_set_note_status(p_note_id, p_status)` — demandas internas (só equipe).
- **Nota de segurança conhecida:** as RPCs do paciente recebem `p_patient_id` e são
  chamáveis por `anon` — **mesma superfície de risco já existente nas funções
  `community_*`**. O advisor do Supabase marca `*_security_definer_function_executable`
  como WARN; é **intencional** e idêntico ao padrão da comunidade. Se um dia se
  endurecer a comunidade, endurecer o chat junto.

### Realtime
- `chat_conversations`, `chat_messages` e `chat_internal_notes` entram na publication
  `supabase_realtime` com `replica identity full`. O **back-office** ouve em tempo real
  (RLS filtra por time). O **app do aluno** usa **polling** (a conexão anon não pode ouvir
  as tabelas sob RLS) — janela curta (6s) enquanto a aba está aberta.

## Fatiamento

1. **Chat 1:1 + inbox kanban da equipe (texto)** — ✅ implementado (ver PROGRESS).
2. **Mídia (áudio/foto/vídeo via Storage `patient-photos`)** — ✅ implementado (ver PROGRESS).
3. **Push de mensagem nova (reusa Web Push do app do aluno)** — ✅ implementado (ver PROGRESS).
4. Tags (treino, dieta, hormônio, financeiro, Fabricio) para roteamento.
5. Respostas rápidas / pré-salvas (reusa `whatsapp_templates`).
6. Migração da cadência programada para o app (reusa `whatsapp_scheduled_messages`
   / `whatsapp_sequences` / `pg_cron`).

## Fatia 1 — o que foi construído

### Back-office (`controle-de-pacientes`)
- `src/lib/chat-service.ts` — service do lado equipe (lanes, listar, mensagens,
  enviar via RPC, mover/atribuir/marcar lido, buscar paciente, Realtime).
- `src/pages/Atendimento.tsx` + `src/components/atendimento/AtendimentoBoard.tsx`
  — inbox **kanban**: coluna **Aguardando** · uma **raia por membro** da equipe ·
  **Resolvido**. Card = aluno (foto, prévia, "há X min" em BRT). Menu de 1 clique
  no card: mover p/ raia, Resolver, marcar (não-)lida. Painel lateral (Sheet) com
  thread estilo WhatsApp + composer. Botão **"Nova conversa"** (busca paciente).
  Tudo em **tempo real**.
- Rota `/atendimento` (App.tsx) + item "Atendimento" na sidebar (AppSidebar.tsx +
  `sidebar-modules.ts`). Visível para a equipe (operadores confiáveis).

### App do aluno (`meu-acompanhamento`)
- `src/lib/chat-service.ts` — `chatService` (RPCs do paciente).
- `src/components/patient-portal/chat/SupportChat.tsx` — aba de chat; cabeçalho
  **"Fale com o Fabricio"**; o aluno nunca vê qual atendente respondeu; polling 6s;
  envio otimista; horários em BRT.
- Aba **"Suporte"** (ícone Headset) no `MobileBottomNav.tsx` + `PatientDietPortal.tsx`,
  com selo de não-lidas.

### Feature flag (rollout gradual por coorte) — app do aluno
`portal-settings-service.ts` → `PortalConfig.support`:
- `show_tab: boolean` — libera a aba para **todos** os alunos do treinador (default `false`).
- `test_patient_ids: string[]` — libera só para **pacientes de teste**.
- `enabled_plans: string[]` — libera para alunos cujo `plano` está na lista (coorte por plano).
- `rollout_percentage: number` (0–100) — libera para uma fatia da base via **hash determinístico
  do `patientId`** (mesma coorte em todo refresh).
A decisão é centralizada em `shouldShowSupport(patientId, patient, config)`: a aba aparece se
QUALQUER condição bater (show_tab || id ∈ test_patient_ids || plano ∈ enabled_plans ||
hash(id)%100 < rollout_percentage). Substitui o gating inline antigo no `PatientDietPortal`.

### Rollout & Adoção (back-office) — página `/rollout`
- **Quem é "ativo/engajável":** fonte única `chat_rollout_config(owner_id, active_planos[],
  require_vigente)` — allow-list de planos curada pelo dono. Vazia ⇒ fallback `is_patient_active(id)`.
- **RPCs SECURITY DEFINER** (guard `chat_is_team_of(owner)`), migração
  `20260702_chat_rollout_config.sql`: `chat_rollout_get/set_config`, `chat_rollout_plan_counts`,
  `chat_rollout_get/set_support` (lê/escreve `portal_config.support`; `portal_settings.user_id` é
  TEXT), `chat_adoption_dashboard` (KPIs por plano: engajáveis/push/app-14d/chat) e
  `chat_adoption_patients` (lista com selos). Flags por paciente via EXISTS (sem fan-out).
- **UI** (`components/rollout/RolloutPanel.tsx`, service `rollout-service.ts`): 3 abas internas —
  Liberação (coorte: show_tab/planos/%/teste + "quantos atinge"), Adoção (KPIs + por plano +
  lista de alunos), Quem é ativo (allow-list com contagem ao vivo). **Vive DENTRO da página
  Atendimento** — toggle "Conversas | Rollout & Adoção" no cabeçalho do board (sem item extra na
  sidebar nem rota própria, pra não poluir o menu).
- Base medida hoje: ~785 engajáveis, 14 com push, 0 com last_seen (popula após Fase C em prod),
  1 usou chat.

### Links clicáveis no chat
As bolhas renderizam o `body` como texto puro; um helper `lib/linkify.tsx` (`renderWithLinks`,
zero-dependência, idêntico nos dois repos) detecta URLs (http/https e `www.`) e as envolve em
`<a target="_blank" rel="noopener noreferrer">`. Aplicado no `SupportChat` (app) e nas bolhas do
`AtendimentoBoard` (back-office). Anexos de mídia continuam abrindo pelo botão "Abrir anexo".

## Fatia 2 — o que foi construído (mídia)

- **Banco** (`20260619_chat_media.sql`, aditiva): colunas `media_url`/`media_type`/
  `media_mime` em `chat_messages`. As RPCs `chat_patient_send_message` e
  `chat_team_send_message` ganharam params opcionais `p_media_url`, `p_media_type`,
  `p_media_mime` e passam a aceitar `body` vazio quando há mídia; o
  `last_message_preview` vira um rótulo (📷 Foto / 🎤 Áudio / 🎬 Vídeo) na mensagem
  só-mídia. `chat_patient_get_messages` passou a retornar `media_url`/`media_type`
  (mantendo o filtro `cleared_at_patient` e o marcar-como-lido). Toda a lógica antiga
  (reabrir resolvida, marcas de "limpar") foi preservada.
- **Storage:** upload direto pelo client (anon no app do aluno) pro bucket público
  `patient-photos`, pasta `chat/` — mesmo padrão de avatar/evolução/comunidade. URL
  pública via `getPublicUrl`. Limite de 25 MB por arquivo (vídeo é o caso pesado).
- **App do aluno** (`SupportChat.tsx` + `chat-service.uploadMedia` +
  `hooks/use-audio-recorder.ts`): botão de anexar (foto/vídeo/áudio) e de gravar nota
  de voz (MediaRecorder); bolhas renderizam imagem (lightbox), vídeo e áudio.
- **Back-office** (`AtendimentoBoard.tsx` + `chat-service.uploadChatMedia` +
  `hooks/use-audio-recorder.ts`): mesmos botões no composer da conversa e renderização
  de mídia nas bolhas (imagem em `Dialog`).
- **Realtime/polling** inalterados (a Fatia 2 não muda o transporte).

## Fatia 3 — o que foi construído (push de mensagem nova)

- **Reuso total da infra de Web Push já existente** (não criou tabela/edge/VAPID): a edge
  function `send-push`, o wrapper SQL `notify_send_push`, a tabela `push_subscriptions`, as
  chaves VAPID em `app_config` e o `sw.js` do app do aluno.
- **Banco** (`20260620_chat_push.sql`, aditiva): trigger `chat_message_notify` AFTER INSERT em
  `chat_messages` (função `trg_chat_message_notify`) que dispara push via `notify_send_push`:
  - `sender_type='team'` → push pro **aluno** (título "Fabricio", corpo = prévia/rótulo de
    mídia, `type='chat'`, `data.conversation_id`).
  - `sender_type='patient'` → push pra **equipe**, roteando como o kanban: se a conversa está
    atribuída, só o atendente; se está livre (aguardando), o dono + `team_members` ativos.
  - O `perform` fica em bloco `exception when others then null` → push é best-effort e nunca
    quebra o envio da mensagem.
  - `notify_send_push` ganhou o param opcional `p_save_notification` (default true,
    retrocompatível); o chat passa `false` pra **não** poluir o sino (os dois lados já têm
    indicador de não-lida próprio).
- **Empurrão de instalação/ativação (app do aluno):** `InstallPWAButton` virou reutilizável
  (props `triggerless`/`open`/`onOpenChange`); `EnableNotificationsBanner` mostra "Como
  instalar" no iPhone (em vez de beco sem saída) e cita as respostas do Fabricio; e o
  `SupportChat` ganhou um convite contextual ("Ative as notificações…") que chama
  `pushService.subscribe` (Android/desktop) ou abre as instruções de instalação (iPhone).
- **Entrega real:** depende do aluno ter o PWA instalado (obrigatório no iPhone) e push
  ativado. No Android funciona até no navegador; no iPhone só com o app instalado.

## Decisões travadas
- Transição paralela/gradual (não corte seco).
- Mídia no bucket **público** `patient-photos` (pasta `chat/`) — consistente com as
  fotos de evolução/avatar; sem edge function nem URL assinada.
- Push reusa 100% a infra existente (`send-push` + `notify_send_push`); chat não grava no
  sino in-app (`save_notification=false`) pra não duplicar com o badge de não-lida.
- Uma conversa por aluno (thread 1:1). Pro aluno é sempre "Fabricio/MyShape".
- Kanban com raias = membros da equipe + Aguardando/Resolvido.
- Multitenant por padrão (reuso de `owner_id` + RLS).
- Migrações **aditivas** aplicadas direto na produção, validadas antes; UI do aluno
  atrás de feature flag.

## Fuso horário
Tudo em **America/Sao_Paulo (BRT, UTC-3)** — datas/horários renderizados com
`timeZone: 'America/Sao_Paulo'`.

## Pendências / follow-ups
- (Opcional) Regenerar `src/integrations/supabase/types.ts` para tipar as novas
  tabelas/RPCs (hoje os acessos usam casts; compila e roda normalmente).
- UI no back-office para o profissional editar o flag `support` (test_patient_ids /
  show_tab) — hoje setado via dado em `portal_settings`.
- Verificação ponta a ponta na UI real (rodar os dois apps) — ver PROGRESS.

---

## Adendo — Tags, Realtime Broadcast e padrão de segurança do guard (Fatia 4)

### Tabela `chat_conversation_tags` (migração `20260623`)
- `id`, `conversation_id` (FK→`chat_conversations` on delete cascade), `owner_id`, `tag`
  (`treino|dieta|hormonio|financeiro|fabricio`), `added_by`, `created_at`. Único `(conversation_id, tag)`.
- **Só a equipe** (RLS `authenticated` via `chat_is_team_of`; nenhuma policy `anon`; nenhuma RPC
  `chat_patient_*` toca a tabela → o aluno nunca vê tag). Na publication `supabase_realtime`.
- RPCs: `chat_team_add_tag(conv, tag)` / `chat_team_remove_tag(conv, tag)`.

### Realtime Broadcast (migração `20260622`)
- Trigger `chat_broadcast` AFTER INSERT OR UPDATE em `chat_messages` → `realtime.send` emite um
  **ping sem conteúdo** no tópico `chat:conv:<conversation_id>` (canal público, `private=false`).
  É o canal que o app do aluno (anon) assina, já que não pode ouvir `postgres_changes` da tabela
  protegida por RLS. O conteúdo continua vindo da RPC escopada `chat_patient_get_messages`.
- App do aluno: broadcast como caminho principal; **polling de 25s como fallback**, pausado em
  background. Back-office segue usando `postgres_changes` (conexão autenticada).

### Padrão de segurança do guard (IMPORTANTE para futuras RPCs `chat_team_*`)
`chat_is_team_of(p_owner)` retorna **NULL** quando `auth.uid()` é null (anon). Por isso o guard
correto é **`if chat_is_team_of(v_owner) is not true then raise exception 'Sem permissao'`** — e
**nunca** `if not chat_is_team_of(...)` (que deixa o anon passar, pois `not null` = null = falso no
IF). Corrigido em todas as 9 funções `chat_team_*` na migração `20260624`.

### Respostas rápidas — `chat_quick_replies` (Fatia 5, migração 20260625)
Tabela team-scoped (RLS `chat_is_team_of`, sem anon). CRUD direto por RLS; `chat_qr_increment_use`
é o único RPC (guard seguro). Acionada no composer do back-office por botão ⚡ ou atalho "/". Variáveis
`{{nome}}/{{apelido}}/{{primeiro_nome}}/{{plano}}/{{dias_para_vencer}}/{{dia_acompanhamento}}` via
`applyVars` em `chat-service.ts`. Tabela dedicada (não reusa `whatsapp_templates`) por precisar do
campo `shortcut` e de criação por toda a equipe.

### Cadência no chat — target_channel + chat_system_send_to_patient (Fatia 6, migração 20260628)
`whatsapp_scheduled_messages.target_channel` e `whatsapp_sequences.target_channel`
(`whatsapp`|`chat`|`both`, default `whatsapp`). O cron/edge `whatsapp-process-scheduled-v2` ramifica:
`chat` entrega via RPC `chat_system_send_to_patient` (service_role only; sem auth.uid; insere msg `team`
e dispara push pelo trigger), pulando Evolution/janela/anti-ban; `both` manda nos dois. Sequências
materializam o canal via `materialize_sequence_messages`. UI: seletor de destino no SequenceEditor.

### Régua de ausência — sinais + régua editável (Fase C, migrações 20260629/20260630)
**Sinal "abriu o app":** `patients.last_seen_at`, carimbado pela RPC `patient_touch_last_seen` (anon),
chamada no `PatientAuthContext` do app do aluno (throttle 15min). Antes não havia rastreamento de
abertura de app.

**Atividade:** `patient_last_activity(patient)` = `max()` de chat (msg do aluno), check-in (`checkin`
por telefone), treino (`workout_session_logs`/`workout_set_logs`), dieta (`diet_daily_consumption`),
peso (`patient_weight_logs`), diário (`patient_journal_entries`) e `last_seen_at`.

**Régua:** `chat_inactivity_rulers` (1 padrão `plano=null` + N por plano, por owner) → `chat_inactivity_steps`
(`days_inactive`, `channel` push|chat|whatsapp, `message_kind` text|quick_reply|sequence, `title`/`body`/
`quick_reply_id`/`sequence_id`, `position`). RLS só-equipe (CRUD direto). `chat_inactivity_state`
(dedupe por paciente). Avaliador `chat_inactivity_run()` (cron `chat-inactivity-run` 09:00 BRT,
service_role only) escalona por dias de ausência e despacha no canal do passo (reusa `notify_send_push`/
`chat_system_send_to_patient`/`whatsapp_scheduled_messages`/sequence-enroll). Elegibilidade = aluno ativo
(`data_cancelamento`/`data_congelamento` vazios). **Substitui** `run_inactive_check` (cron antigo
`inactive-check` desagendado; função mantida p/ rollback). Painel "Alunos em risco":
`chat_inactivity_dashboard(owner,min_days)`; UI em `/regua` (`ReguaAusencia.tsx`).

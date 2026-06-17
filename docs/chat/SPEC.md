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
    `chat_patient_get_messages` (marca lido), `chat_patient_send_message`
    (reabre se resolvida), `chat_patient_unread_count`.
  - Equipe (authenticated): `chat_team_get_or_create_conversation`,
    `chat_team_send_message` (insere como `team`, assume a conversa, marca
    `unread_for_patient`), `chat_team_set_cleared(p_conversation_id, p_side, p_clear)`
    — limpar/restaurar por lado (`patient` | `team` | `both`), manual;
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
2. Mídia (áudio/foto/vídeo via Storage `patient-photos`).
3. Push de mensagem nova (reusa Web Push do app do aluno).
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

### Feature flag (rollout gradual) — app do aluno
`portal-settings-service.ts` → `PortalConfig.support`:
- `show_tab: boolean` — libera a aba para **todos** os alunos do treinador (default `false`).
- `test_patient_ids: string[]` — libera só para **pacientes de teste** (rollout).
A aba aparece se `show_tab === true` **ou** o `patientId` está em `test_patient_ids`.
Assim dá pra testar com contas específicas agora e abrir pra todos depois — sem
expor os 700 alunos prematuramente.

## Decisões travadas
- Transição paralela/gradual (não corte seco).
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

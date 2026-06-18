# Chat interno — PROGRESS (diário de bordo)

> Atualize a cada etapa concluída. Mesmo arquivo nos dois repos.

## Fatia 1 — Chat 1:1 + inbox kanban (texto) — EM REVISÃO/VALIDAÇÃO

### Feito
- **Banco (prod, projeto `qhzifnyjyxdushxorzrk`)**, migração aditiva
  `controle-de-pacientes/supabase/migrations/20260616_chat_core.sql`:
  - Tabelas `chat_conversations` + `chat_messages` (+ índices, trigger `updated_at`).
  - Helper RLS `chat_is_team_of(owner)`; RLS no lado equipe.
  - RPCs paciente (anon): get_or_create / get_messages / send_message / unread_count.
  - RPCs equipe (auth): get_or_create / send_message.
  - Realtime: ambas as tabelas na publication, `replica identity full`.
- **Back-office:** `chat-service.ts`, página `/atendimento` (kanban + painel +
  "Nova conversa"), rota + sidebar.
- **App do aluno:** `chat-service.ts`, `SupportChat.tsx`, aba "Suporte" no nav,
  feature flag `PortalConfig.support` (show_tab + test_patient_ids, default OFF).

### Testado / validado
- ✅ Smoke test das RPCs do **paciente** (SQL): cria conversa → envia → lista (marca
  lido) → `unread_for_patient`=0 e `unread_for_team`=1. Cleanup ok.
- ✅ Smoke test das RPCs da **equipe** (SQL com JWT simulado): `chat_is_team_of`
  (self=true, estranho=false), criar conversa, enviar → `sender_user_id`=owner,
  status=atendendo, assigned_to=owner, `unread_for_patient`=true. Cleanup ok.
- ✅ RLS validada por construção: as policies usam `chat_is_team_of`, cujo
  comportamento (dono vê / estranho não vê) foi testado.
- ✅ Advisors de segurança: só os WARN esperados de SECURITY DEFINER (mesmo padrão
  `community_*`) + 1 search_path mutável já corrigido. Nada crítico.
- ✅ `tsc --noEmit` limpo nos arquivos novos/editados (os 2 repos). (Restam só
  avisos ambientais pré-existentes: `vite/client`, `baseUrl`.)

### Falta validar (manual, na UI real — precisa do Fabricio)
- [ ] Rodar os dois apps (Vite). Logar como membro de equipe e como aluno de teste.
- [ ] Liberar a aba para um aluno de teste: setar
      `portal_settings.setting_value.support.test_patient_ids = ["<patient_id>"]`
      (setting_key `portal_config`) para o `user_id` do treinador.
- [ ] Mandar mensagem dos dois lados → conferir entrega (Realtime no back-office,
      polling no app do aluno) e os selos de não-lida.
- [ ] Mover entre raias (1 clique), Resolver, reabertura ao chegar nova msg,
      marcar não-lida, "Nova conversa" via busca.
- [ ] Confirmar que sem o flag a aba fica invisível para alunos reais.

### Próximo passo
- Após o OK da validação manual, iniciar **Fatia 2 (mídia)** OU **Fatia 3 (push)**,
  conforme prioridade do Fabricio. Atualizar o SPEC antes de implementar.

---

## Rodada de UI — Repaginação do Atendimento (back-office) + copy do app

### Feito
- **Tema do back-office em claro/white** por padrão (`ThemeContext` → `'light'`); a
  sidebar continua dark de propósito (`.theme-light` no `index.css`).
- **`AtendimentoBoard.tsx` repaginado** (visual branco premium, acento esmeralda):
  - **Arrastar e soltar** cards entre colunas (@dnd-kit: `DndContext` + `useDraggable`
    nos cards + `useDroppable` nas colunas + `DragOverlay`). Update otimista +
    `updateConversation` + refetch. Menu de 3 pontinhos mantido como atalho.
  - **Esconder/mostrar colunas** via Popover de checkboxes; preferência salva em
    `localStorage` (`atendimento:hidden-columns`).
  - **Cor por atendente**: paleta determinística (`LANE_PALETTE`) usada no cabeçalho
    da raia e num **badge por atendente no rodapé do card** — clicar atribui a conversa
    àquele atendente (`status:'atendendo', assigned_to`). O atribuído fica destacado.
  - **Atalhos do hub do aluno** no painel da conversa (Dieta/Treino/Check-in/Anamnese/
    Evolução) via o evento global `open-quick-drawer` (listener já montado pelo
    `DashboardLayout` → `GlobalQuickDrawers`). Painel (Sheet) mais largo.
- **App do aluno:** ajuste de copy do estado-vazio do `SupportChat`
  ("Mande sua primeira mensagem para dúvidas ou orientações."). Cabeçalho mantido
  em "Fale com o Fabricio" (decisão travada).

### Testado / validado
- ✅ `tsc --noEmit` limpo no back-office após a reescrita.
- [ ] Validação manual na UI (Fabricio): drag-and-drop entre colunas, esconder/mostrar
      colunas (persistência ao recarregar), badge de atendente, atalhos do hub abrindo
      os quick-drawers, e o tema claro geral.

---

## Rodada — "Limpar conversa" manual, por lado (sem apagar histórico)

### Decisão do dono
Nada de limpeza automática. Por padrão aluno e equipe veem **todo o histórico**, sempre,
e tudo fica salvo no Supabase. Só quando o dono clicar em **Limpar** é que a visão de um
lado é zerada — e ele escolhe **qual lado**: a do aluno, a do back-office, ou os dois.
"Restaurar" traz o histórico de volta. As mensagens **nunca** são apagadas.

### Feito
- **Migração aditiva `20260617_chat_archive.sql`** (aplicada em produção via MCP):
  - `chat_conversations` ganhou `cleared_at_patient` e `cleared_at_team` (timestamptz,
    null = mostra tudo). Marca d'água por lado.
  - `chat_patient_get_messages` agora filtra `created_at > coalesce(cleared_at_patient,
    -infinity)` → a thread do aluno respeita a limpeza dele. (Resto idêntico.)
  - Nova RPC `chat_team_set_cleared(p_conversation_id, p_side, p_clear)` (SECURITY DEFINER,
    `search_path` fixo, checa `chat_is_team_of`): `p_side ∈ {patient,team,both}`;
    `p_clear=true` marca now(), `false` restaura (null).
  - Advisors: só os WARN esperados de SECURITY DEFINER (igual aos demais `chat_*`); a nova
    função **não** entra no `search_path_mutable`. Nenhum ERROR novo.
- **Back-office `chat-service.ts`:** novo `clearConversation(id, side, clear)` → RPC acima.
  `ChatConversation` ganhou `cleared_at_patient`/`cleared_at_team`.
- **`AtendimentoBoard.tsx`:** no painel da conversa, menu **"Limpar"** com: limpar minha
  conversa (back-office) / limpar a do aluno / limpar dos dois lados / restaurar. A thread
  da equipe respeita `cleared_at_team` (com aviso "N mensagens anteriores limpas — Ver
  histórico" pra reexibir na hora). Badge "Limpa p/ o aluno" quando a visão do aluno está limpa.
- **App do aluno:** sem mudança de código — o RPC já filtra; a thread some sozinha só
  quando a equipe limpar o lado do aluno.

### Testado / validado
- ✅ Migração aplicada; colunas e funções conferidas via SQL (MCP).
- ✅ `tsc --noEmit` limpo no back-office.
- ℹ️ Conversa de teste existente: aluno Fabricio Hermes
  (`patient_id e318eb2c-…`, conversa `ec04dd36-…`, 2 mensagens) — ambas marcas null.
- [ ] Validação manual (Fabricio): limpar cada lado, conferir que o aluno deixa de ver
      no app e a equipe deixa de ver no back-office, que o histórico continua em
      `chat_messages`, e que "Restaurar" traz tudo de volta.

---

## Rodada — Hotfix de regressões + polish + reordenar colunas + demandas internas

### Fase A (hotfix — já mergeada, PR #283)
- **Tema:** `ThemeContext` voltou a `dark`; o claro é aplicado **só** na rota `/atendimento`
  (`theme-light` no `<html>` no mount/unmount, padrão do LeadsCRM; sidebar segue dark).
- **Layout do board:** altura ancorada ao viewport (`100dvh`) com colunas `flex-1` — termina
  onde a sidebar termina (sem vazão branco); scroll horizontal contido (`min-w-0`), não
  empurra mais a página/sidebar no mobile.
- **Badge respeita coluna oculta:** esconder a coluna de um membro também esconde o badge
  dele no card (badges usam só as lanes visíveis; menu "Mover para" segue completo).

### Fase B (melhorias)
- **Reordenar colunas (raias):** drag pelo handle (grip) no cabeçalho via `@dnd-kit/sortable`
  (estratégia horizontal). Aguardando/Resolvido fixas nas pontas. Ordem salva em
  `localStorage` (`atendimento:lane-order`). IDs `lane:<userId>` distinguem reordenação de
  card no `onDragEnd`. Cor de cada atendente é estável (indexada pela ordem original).
- **Demandas internas (só equipe):** migração `20260618_chat_internal_notes.sql` (aplicada via
  MCP) — tabela `chat_internal_notes` (categoria/texto/status/autor), RLS só `authenticated`
  (paciente **sem** policy), RPCs `chat_team_add_note`/`chat_team_set_note_status`. No
  `chat-service`: `listNotes`/`addNote`/`setNoteStatus` + `open_notes_count` no
  `listConversations`. UI: **selo** (bandeirinha + contagem) no card e seção **"Demandas
  internas"** no painel da conversa (criar/listar/resolver, chips de categoria). Realtime
  inclui a tabela.
- **Polish:** cards com elevação no hover, não-lida vira ponto vermelho no avatar + nome em
  negrito, selo de demanda; colunas/handle mais limpos.

### Testado / validado
- ✅ `tsc --noEmit` limpo (Fases A e B).
- ✅ Migração das notas aplicada; RLS habilitada e só policies `authenticated` (paciente
  bloqueado, conferido por SQL). Advisors: só os WARN de SECURITY DEFINER já conhecidos.
- [ ] Validação manual (Fabricio): reordenar colunas (persistir ao recarregar), criar/resolver
      demanda e ver o selo no card, e o visual geral.

---

## Fatia 2 — Mídia (foto / áudio / vídeo) — IMPLEMENTADA, falta validação manual

### Feito
- **Banco (prod, `qhzifnyjyxdushxorzrk`)**, migração aditiva
  `controle-de-pacientes/supabase/migrations/20260619_chat_media.sql`:
  - `chat_messages` ganhou `media_url`, `media_type` (check `image|audio|video`), `media_mime`.
  - `chat_patient_send_message` / `chat_team_send_message` ganharam params opcionais
    `p_media_url/type/mime`; aceitam `body` vazio quando há mídia; `last_message_preview`
    vira rótulo (📷/🎤/🎬) na mensagem só-mídia. Lógica antiga preservada (reabre resolvida,
    assume conversa, marcas de "limpar").
  - `chat_patient_get_messages` retorna `media_url`/`media_type` (mantém filtro
    `cleared_at_patient` + marcar-como-lido). Recriada com DROP (mudou o RETURNS TABLE);
    grants `anon, authenticated` reaplicados.
- **App do aluno (`meu-acompanhamento`):** `chat-service.uploadMedia` + `sendMessage(…, media)`,
  novo `hooks/use-audio-recorder.ts` (MediaRecorder), `SupportChat.tsx` com botão de anexar,
  gravar nota de voz, preview do anexo, bolhas de imagem (lightbox)/vídeo/áudio.
- **Back-office (`controle-de-pacientes`):** `chat-service.uploadChatMedia` +
  `sendTeamMessage(…, media)`, `hooks/use-audio-recorder.ts`, `AtendimentoBoard.tsx` com os
  mesmos botões no composer e renderização de mídia (imagem em `Dialog`).
- **Storage:** bucket público `patient-photos`, pasta `chat/`, upload direto pelo client
  (mesmo padrão de avatar/evolução/comunidade). Limite de 25 MB/arquivo.

### Testado / validado
- ✅ Migração aplicada via MCP; colunas conferidas (`information_schema`).
- ✅ Smoke test por SQL: `chat_patient_send_message` com mídia (sem texto) → mensagem
  gravada com `media_url/type`; `chat_patient_get_messages` retorna os campos de mídia;
  `last_message_preview` = "📷 Foto" e a conversa reabriu (`aguardando` + `unread_for_team`).
  Mensagem de teste removida e a conversa de teste restaurada ao estado original.
- ✅ `tsc --noEmit` limpo nos dois repos (restam só os avisos ambientais pré-existentes
  `vite/client` e `baseUrl`).
- [ ] Validação manual (Fabricio): enviar foto/vídeo/nota de voz dos dois lados; conferir
      render (imagem abre, áudio/vídeo tocam) e entrega (Realtime no back-office, polling 6s
      no app do aluno); mídia sem texto mostra o rótulo no card; negar microfone mostra aviso.

---

## Fatia 3 — Push de mensagem nova — IMPLEMENTADA, falta validação manual

### Feito
- **Achado-chave:** a infra de Web Push **já existia 100% em produção** (a edge function
  `send-push`, o wrapper `notify_send_push`, a tabela `push_subscriptions`, as chaves VAPID em
  `app_config`, o `sw.js`). Os agentes de exploração não acharam no repo porque a `send-push`
  mora fora dele — confirmado via MCP (`list_edge_functions` + `pg_get_functiondef`).
- **Banco (prod)**, migração aditiva `controle-de-pacientes/supabase/migrations/20260620_chat_push.sql`:
  - Trigger `chat_message_notify` AFTER INSERT em `chat_messages` (fn `trg_chat_message_notify`):
    - `team` → push pro **aluno** (título "Fabricio", corpo = prévia/rótulo de mídia).
    - `patient` → push pra **equipe** (atendente atribuído; ou dono + `team_members` ativos se
      a conversa estiver livre).
    - `perform` dentro de `exception when others then null` (push best-effort; nunca quebra o
      insert). Prévia replica o rótulo de mídia da Fatia 2.
  - `notify_send_push` recriado (DROP + CREATE) com param extra `p_save_notification`
    (default true → 6 callers existentes inalterados). Chat passa `false` (não polui o sino).
- **App do aluno — empurrão de instalação/ativação:**
  - `InstallPWAButton.tsx`: diálogo de instruções virou reutilizável (`triggerless` +
    `open`/`onOpenChange`); botão/menu seguem iguais quando as props não são passadas.
  - `EnableNotificationsBanner.tsx`: no iPhone, botão "Como instalar" abre as instruções (em
    vez de beco sem saída); copy passou a citar as respostas do Fabricio.
  - `SupportChat.tsx`: convite contextual no topo da thread ("Ative as notificações…") →
    `pushService.subscribe` no Android/desktop ou instruções de instalação no iPhone;
    dispensável (`localStorage` `chat-notif-nudge-dismissed`); some quando já inscrito.

### Testado / validado
- ✅ `tsc --noEmit` limpo no app do aluno (só os avisos ambientais pré-existentes).
- [ ] (Pendente nesta sessão por instabilidade do gateway MCP) `apply_migration` da
      `20260620_chat_push.sql` + smoke por SQL: inserir msg `team` e `patient` na conversa de
      teste e conferir que `notify_send_push` enfileirou no `net` e que **não** criou linha em
      `notifications`; limpar e restaurar. ⚠️ Confirmar que a migração foi aplicada antes de
      considerar a fatia pronta.
- [ ] Validação manual (Fabricio, device com push ativo): equipe responde → push no celular
      do aluno; aluno escreve → push pra equipe inscrita; nudge de instalação/ativação aparece
      e some ao ativar.

---

## Sessão 17/06 — feedback do teste no preview + deploy pra produção

Fabricio testou a Fatia 2/3 no **preview da branch** e trouxe 3 pontos:

1. **Nota de voz agora envia na hora ao parar a gravação** (UX estilo WhatsApp). Antes,
   `stopRecording` só fazia `setPendingFile` e exigia um 2º toque no enviar. Agora
   `stopRecording` chama `handleSend(file)` direto. `handleSend` ganhou um param
   `fileOverride?: File | null`; o anexo manual (clipe → foto/vídeo) com preview e o cancelar
   gravação seguem iguais. Os botões enviar passaram a `onClick={() => handleSend()}` pra não
   injetar o `MouseEvent` como arquivo. Vale pros dois apps (`SupportChat.tsx` e
   `AtendimentoBoard.tsx`).
2. **"O áudio não chegou no back-office" → era gap de deploy, não bug.** Os dados estavam
   100% corretos (arquivo `.webm` no Storage, `media_url`/`media_type` preenchidos; o
   back-office renderiza via `MessageMedia`). A Fatia 2 (mídia) e a Fatia 3 (push) estavam
   **só na branch**, não em produção (`main`). Por isso o Chrome desktop não mostrava o player.
   → resolvido levando a branch pra `main` nesta sessão.
3. **Check-in NÃO mudou.** O envio de feedback de check-in continua indo pro webhook
   (n8n)/Evolution via `whatsapp-universal-service.sendPatientMessage`
   (`CheckinFeedbackCard.tsx`, `webhookType:'checkin'`) — nada do chat foi tocado. A mensagem
   "📌 FEEDBACK DO CHECK-IN" que apareceu na conversa do Júlio César Maia foi **enviada
   manualmente pelo membro Guido** (`guido@fmteam.com`) via "Nova conversa" + composer do
   painel de Atendimento (`chat_team_send_message`). Nenhuma função/trigger do banco espelha
   check-in no chat; só as 3 RPCs `chat_*` tocam `chat_messages`. Sem ação de código.

### Deploy
- Migrações da Fatia 2/3 já aplicadas no banco de produção (Supabase compartilhado) → o merge
  foi **só de front-end**. Branch `claude/sharp-dirac-8dgmht` mergeada em `main` nos dois repos
  (sem sobrescrever nada de `origin/main`; no CP havia 4 commits de WebDiet à frente, em
  arquivos disjuntos — preservados).

---

## Editar / apagar mensagens (soft-delete) — feito

**Migração `20260621_chat_edit_delete.sql`** (aplicada em produção via MCP + commitada). Aditiva.
- Colunas novas em `chat_messages`: `deleted_at`, `deleted_by` (`patient|team`), `edited_at`,
  `original_body`. Apagar **não** remove `body`/mídia — só marca `deleted_at` (conteúdo fica
  salvo no banco). Editar guarda o texto original em `original_body` e marca `edited_at`.
- RPCs novas: `chat_patient_edit_message` / `chat_patient_delete_message` (aluno só nas próprias,
  `sender_type='patient'`), `chat_team_edit_message` / `chat_team_delete_message` (equipe modera
  qualquer mensagem, via `chat_is_team_of`). Todas atualizam `last_message_preview` se mexerem na
  última mensagem da conversa.
- `chat_patient_get_messages` recriado (DROP+CREATE): novos campos `deleted`/`edited` no retorno;
  para mensagens apagadas devolve `body=''` e mídia nula (o aluno **não** vê o conteúdo).

**Front-end:**
- App do aluno (`SupportChat.tsx` + `chat-service.ts`): menu "⋯" nas próprias mensagens
  (Editar/Apagar); apagada vira aviso "🚫 Esta mensagem foi apagada"; editada mostra "(editado)";
  edição reusa o composer (banner "Editando mensagem" + cancelar).
- Back-office (`AtendimentoBoard.tsx` + `chat-service.ts`): menu de ações em **qualquer** mensagem;
  apagada mostra o selo "Mensagem apagada (pela equipe/pelo aluno)" **+ o conteúdo original
  esmaecido** (a equipe vê o que foi removido); "(editado)" no horário; edição reusa o composer.

**Validação:** smoke por SQL (MCP) na conversa de teste — editar preserva `original_body`, apagar
preserva o conteúdo no banco com `deleted_by='patient'`, e `chat_patient_get_messages` devolve a
apagada com `deleted=true` e `body=''` (sem vazar). `tsc` limpo no CP; no MA o `SupportChat.tsx`
fica limpo (as únicas notas de tipo são o padrão já existente de `types.ts` desatualizado p/ as
RPCs `chat_*`). Falta a validação manual do dono nos dois apps.

**Auto-envio de áudio (pedido do dono):** já estava em `origin/main` desde a sessão anterior
(`SupportChat.stopRecording → handleSend(file)`). Sem código novo — só re-verificar no app
deployado.

---

## Fatia 4 (Tags) + Emojis + Realtime Broadcast + Correção de segurança — feito

### Realtime Broadcast no app do aluno (substitui o polling de 6s)
**Migração `20260622_chat_realtime_broadcast.sql`** (aplicada em produção + commitada). Aditiva.
- Confirmado via MCP que `realtime.send(payload jsonb, event text, topic text, private boolean)`
  existe no projeto. Função `trg_chat_broadcast()` + trigger `chat_broadcast` AFTER INSERT OR UPDATE
  em `chat_messages` (cobre msg nova **e** editar/apagar). Emite um **ping sem conteúdo** no tópico
  `chat:conv:<conversation_id>` (`private=false`, canal público — o aluno é anon). O conteúdo
  continua vindo da RPC `chat_patient_get_messages` (escopada por `p_patient_id`). Trigger
  **separado** do de push (`chat_message_notify`).
- App do aluno (`chat-service.ts` + `SupportChat.tsx`): novo `subscribeToConversation(convId, cb)`
  (`supabase.channel('chat:conv:'+id,{private:false}).on('broadcast',{event:'chat_changed'},cb)`).
  No `SupportChat`, ao montar resolve a conversa e assina o broadcast → no evento `load(false)`.
  **Polling vira fallback**: `POLL_MS` de 6s → **25s**, e **pausa quando a aba está em background**
  (`visibilitychange`). Entrega quase instantânea com o socket vivo; o polling lento cobre quedas.
- Validado no banco: insert em `chat_messages` com o trigger ativo não quebra (insert+delete OK).
  A entrega ao cliente valida-se no app (teste manual do dono).

### Fatia 4 — Tags de assunto (back-office, invisível ao aluno)
**Migração `20260623_chat_tags.sql`** (aplicada + commitada). Molde = `chat_internal_notes`.
- Tabela `chat_conversation_tags` (`conversation_id`, `owner_id`, `tag`, `added_by`, `created_at`),
  índice único `(conversation_id, tag)`. Vocabulário: `treino|dieta|hormonio|financeiro|fabricio`.
  **RLS só `authenticated`** (4 policies via `chat_is_team_of`); nenhuma p/ `anon`. `replica
  identity full` + na publication `supabase_realtime`. RPCs `chat_team_add_tag` / `chat_team_remove_tag`.
- `chat-service.ts`: tipos `ChatTag`/`CHAT_TAGS`/`ConversationTag`; `listConversations` agrega as tags
  por conversa (2ª query, igual ao `open_notes_count`); `addTag`/`removeTag`; subscribe inclui a
  tabela de tags.
- `AtendimentoBoard.tsx`: `TAG_META` (cor por tag), chips no card, `TagEditor` no cabeçalho do
  painel (toggle add/remove), `TagFilterMenu` no topo (filtra as colunas; preferência em
  `localStorage` `atendimento:tag-filter`). App do aluno **não** mostra tag nenhuma.
- Roteamento desta fatia = filtrar + ver os chips (atribuição por raia em 1 clique já existia).
  Regras automáticas (ex.: "financeiro → raia X") ficam fora desta fatia.

### Seletor de emojis (Parte A) — os dois composers, sem dependência
- `EmojiPicker` (CP via `Popover`; MA via `<div>` toggle no mesmo estilo do menu "⋯"). Lista curada
  (~50 emojis em 4 grupos). Botão `Smile` ao lado do `Paperclip`; insere **na posição do cursor**
  do textarea (`selectionStart/End` + re-foco). Vale também no modo edição.

### Regenerar types do Supabase (Parte D) — só o CP
- **CP**: `src/integrations/supabase/types.ts` regenerado via MCP (cobre as tabelas/RPCs novas de
  tags). `tsc --noEmit` **limpo** no CP.
- **MA: NÃO regenerado.** O `types.ts` do MA é um arquivo **enxuto/mantido à mão** (1388 linhas).
  Regenerar o schema completo **corrigiria** as ~7 notas das RPCs `chat_patient_*` mas
  **introduziria ~40 erros novos** em código não-relacionado ao chat (referências a colunas
  inexistentes no schema real: `diet_foods.name`, `checkins.bioimpedancia`, mismatches de
  `WeightEntry`/`LaboratoryExam` etc.) — bugs latentes que o types desatualizado mascarava.
  Decisão: manter o `types.ts` do MA como está (delta **0 erros novos** das minhas edições). As 7
  notas de RPC do MA seguem pré-existentes. **Sinalizado ao dono:** há código no MA referenciando
  colunas que não existem mais no banco — vale uma rodada futura de limpeza (fora do escopo).

### Correção de segurança — guard das RPCs `chat_team_*` (NÃO previsto, achado na verificação)
**Migração `20260624_chat_team_guard_hardening.sql`** (aplicada + commitada).
- **Bug:** `chat_is_team_of(p_owner)` retorna **NULL** quando `auth.uid()` é null (anon). O padrão
  `if not chat_is_team_of(v_owner) then raise` **não dispara** com NULL → a checagem era contornada
  pelo anon (chave pública do app). **Provado:** como anon (role `anon` + claims sem `sub`, igual ao
  request real do PostgREST) consegui inserir mensagem como EQUIPE (`before=7 → after=8`). Impacto:
  anon podia se passar pela equipe, apagar/editar qualquer mensagem, limpar conversas, mexer em notas.
- **Fix (seguro):** as 9 funções `chat_team_*` passaram a usar `if chat_is_team_of(v_owner) is not
  true then raise`. Equipe logada (true) inalterada; anon (null) e não-equipe (false) bloqueados.
- **Verificado:** probe anon agora bloqueia (`after==before`, "Sem permissao"); equipe logada segue
  funcionando (`before=7 → after=8`). Dado de teste limpo; conversa de teste restaurada.

> STATUS: implementado e validado no banco; `tsc` limpo no CP e 0 erros novos no MA. Falta a
> validação manual do dono nos dois apps (emoji, tempo real, tags). Pushed na branch; merge pra
> `main` só após o ok do dono.

---

## AÇÃO 11 / Fase A — Respostas rápidas (Fatia 5) — feito (back-office)

**Migração `20260625_chat_quick_replies.sql`** (aplicada em produção + commitada). Aditiva.
- Tabela `chat_quick_replies` (`owner_id, title, shortcut, content, category, media_url, usage_count,
  is_active, created_by, created_at, updated_at`), índice único `(owner_id, lower(shortcut))`.
- **RLS só equipe** (4 policies via `chat_is_team_of`; nenhuma p/ anon). CRUD é **direto via RLS**
  (sem RPC SECURITY DEFINER) → sem superfície pro bug de guard. Único RPC: `chat_qr_increment_use`
  (contador atômico) já com guard seguro `is not true`. Tabela na publication realtime.

**`chat-service.ts`:** tipos `QuickReply`/`QuickReplyInput`; `listQuickReplies`, `upsertQuickReply`
(deriva owner via `getTeamOwnerId`), `deleteQuickReply`, `incrementQuickReplyUse`; e **`applyVars`**
(substitui `{{nome}}`, `{{apelido}}`, `{{primeiro_nome}}`, `{{plano}}`, `{{dias_para_vencer}}`,
`{{dia_acompanhamento}}`; placeholder desconhecido fica literal). O embed do paciente em
`listConversations` ganhou `apelido, plano, dias_para_vencer, inicio_acompanhamento` (p/ as variáveis).

**UI (`AtendimentoBoard.tsx`):**
- `QuickReplyPicker` (botão ⚡ no composer) com busca por atalho/título/conteúdo.
- **Atalho "/"**: digitar `/algo` no composer abre dropdown filtrando respostas; Enter aplica a 1ª.
- Ao escolher, o texto entra no composer **com as variáveis já preenchidas** pelo aluno da conversa,
  pra revisar/completar e enviar; incrementa `usage_count` (ordena por mais usadas).
- `QuickRepliesManager` (diálogo) pra cadastrar/editar/apagar (título, atalho, texto), aberto pelo
  "Gerenciar" do picker. Qualquer membro da equipe cria/usa.

**Validação:** smoke por SQL/MCP — equipe insere (RLS ok), anon bloqueado (RLS), `increment` bloqueado
p/ anon ("Sem permissao"). `tsc --noEmit` limpo no CP. Falta validação manual do dono no app.

> Próximo: Fase B (cadência programada no chat, repintando o motor de automação) e Fase C (régua de
> ausência multi-canal).

---

## AÇÃO 11 / Fase B — Cadência programada no chat (Fatia 6) — feito (back-office)

Repinta o motor de automação do WhatsApp pra entregar também no chat interno. Como o trigger
`chat_message_notify` já dispara push, "canal chat" = in-app **+** push, sem risco de ban.

**Migração `20260628_chat_cadence.sql`** (aplicada em produção + commitada). Aditiva, default preserva
o fluxo WhatsApp atual:
- Coluna `target_channel` (`whatsapp`|`chat`|`both`, default `whatsapp`) em `whatsapp_scheduled_messages`
  e `whatsapp_sequences`.
- RPC `chat_system_send_to_patient(patient, body, media_url, media_type, media_mime)` SECURITY DEFINER,
  search_path fixo, **sem auth.uid()** (chamada pelo cron/edge). Acha/cria a conversa (`on conflict
  (patient_id)`), insere msg `team`/`sender_user_id=NULL`. **SEGURANÇA: REVOKE de public/anon/
  authenticated + GRANT só a `service_role`** (verificado: anon=false, authenticated=false,
  service_role=true). Conversa nova nasce `resolvido` (sem ação pendente da equipe).
- `materialize_sequence_messages` propaga `seq.target_channel` pra cada agendamento gerado.

**Edge `whatsapp-process-scheduled-v2` (deployada, v12, verify_jwt=true):**
- Ramo por `target_channel`: `chat` → entrega no chat sem Evolution/instância/janela/limite/anti-ban,
  marca enviado; `whatsapp` (default) → fluxo **inalterado**; `both` → WhatsApp + espelha no chat
  (best-effort, entrega no chat mesmo se o WhatsApp falhar/banir).
- Refactor: bloco de status/recorrência extraído pra `applyPostSendStatus` (compartilhado), `sendToChat`
  novo. Caminho WhatsApp permanece idêntico.

**Front-end:** `sequence-service.ts` (campo `target_channel` no tipo/create/duplicate);
`SequenceEditor.tsx` (seletor **Destino**: WhatsApp / Chat interno / Ambos); `ScheduledMessages.tsx`
(badge 💬/📱+💬 nas agendadas).

**Validação:** RPC testada via rollback (conversa/preview/unread/sender corretos); grants verificados;
advisors sem achado novo; `tsc` limpo. **Smoke E2E em produção:** mensagem agendada `target_channel='chat'`
→ cron→edge → inseriu em `chat_messages` (sender `team`), marcou `sent`, HTTP 200
`{processed:1,errors:0}`, a mensagem WhatsApp real concorrente foi `skipped` (nenhum WhatsApp indevido).
Dados de teste removidos.

> Falta validação manual do dono (criar sequência destino=Chat, enrollar, ver chegar no app).
> Pendente desta fase (não-bloqueante): auto-pausa ao aluno responder; pré-visualização "como chega".
> Próximo: Fase C (régua de ausência multi-canal) — usa este motor + os sinais de atividade.

---

## AÇÃO 11 / Fase C — Régua de ausência multi-canal — feito (branch; validação manual pendente)

Detector de inatividade configurável que reengaja alunos que somem. **Substitui** o detector antigo
`run_inactive_check` (45d, só push) por uma régua editável, multi-passo, multi-canal e por plano.

**Sinais de atividade** — `patient_last_activity(patient)` = `max()` de: chat (msg do aluno),
check-in (`checkin` por telefone normalizado), treino (`workout_session_logs`/`workout_set_logs`),
dieta (`diet_daily_consumption`), peso (`patient_weight_logs`), diário (`patient_journal_entries`)
e **abrir o app** (`patients.last_seen_at`, sinal NOVO).

**Migrações (aplicadas em produção + commitadas):**
- `20260629_patient_last_seen.sql`: `patients.last_seen_at` + RPC `patient_touch_last_seen` (anon).
- `20260630_chat_inactivity_ruler.sql`: `patient_last_activity`, `chat_apply_vars`, tabelas
  `chat_inactivity_rulers`/`_steps`/`_state` (RLS só-equipe, CRUD direto), avaliador
  `chat_inactivity_run()` (service_role-only; cron `chat-inactivity-run` 09:00 BRT = 12:00 UTC),
  painel `chat_inactivity_dashboard(owner,min_days)`. Seed migra o aviso de 45d como passo da régua
  padrão de cada treinador. **Desagenda o cron antigo `inactive-check`** (função preservada p/ rollback).

**Decisões:** régua nova é fonte única (sem push duplicado); "aluno ativo" = `data_cancelamento`/
`data_congelamento` vazios (reusa convenção do `run_inactive_check`; cobre INATIVO/RESCISÃO/CONGELADO);
acompanhamento da equipe = painel "Alunos em risco" (sem push pro treinador).

**Anti-onda:** 1004 estados de dedup semeados das notificações `inactive` existentes → quem o sistema
antigo já avisou NÃO leva re-aviso; a régua rearma só quando o aluno volta e some de novo.

**Avaliador (`chat_inactivity_run`):** por paciente ativo → resolve a régua (plano, senão padrão) →
`dias_inativo` (BRT) → maior passo `days_inactive <= dias` ainda não disparado neste ciclo (dedup via
`chat_inactivity_state`) → despacha: `push`→`notify_send_push` (save_notification=false), `chat`→
`chat_system_send_to_patient`, `whatsapp`→`whatsapp_scheduled_messages` (edge existente), `sequence`→
enroll + materialize. Variáveis via `chat_apply_vars`. Best-effort (try/catch por paciente).

**Front-end:**
- App do aluno: ping `patient_touch_last_seen` no `PatientAuthContext` (throttle 15min/dispositivo).
- Back-office: `chat-service.ts` (rulers/steps/dashboard CRUD); página `/regua` (`Regua.tsx` +
  `components/regua/ReguaAusencia.tsx`): aba "Alunos em risco" (lista por dias sem atividade + taxa de
  resposta) e aba "Réguas de ausência" (editor por plano: passos com dias/canal/tipo-de-mensagem,
  add/remover/reordenar; texto próprio OU resposta rápida OU sequência). Item na sidebar.

**Segurança (advisors):** só os WARN intencionais de SECURITY DEFINER. `chat_inactivity_run` NÃO
executável por anon/authenticated; `patient_last_activity`/`chat_apply_vars`/`chat_inactivity_dashboard`
revogados de anon. `tsc` limpo no CP; 0 erros novos no MA.

> Validação manual pendente do dono: criar régua por plano, ver "Alunos em risco", e o disparo
> escalonado (push→chat→WhatsApp). Cron roda 09:00 BRT. **Não mergeado pra main** — aguardando ok.

---

## Correção (Parte 0 do rollout) — elegibilidade da régua usa o filtro CANÔNICO de ativo

**Bug encontrado:** o filtro de elegibilidade da régua (`data_cancelamento`/`data_congelamento`
vazios) NÃO cobria INATIVO/RESCISÃO/CONGELADO/Negativado/Pendência — esses estados ficam no TEXTO
de `patients.plano`, não nas datas. Resultado: a régua avaliava **1589** alunos, incluindo inativos.
(A frase anterior neste doc dizendo que o filtro "cobre INATIVO/RESCISÃO/CONGELADO" estava errada.)

**Decisão (dono): reusar o filtro que já existe.** O sistema já tem a regra de negócio única de
aluno ativo:
- TS: `src/lib/patient-status.ts` → `isPlanoAtivo()` (tokens inativos: inativo/congelado/rescisao/
  pendencia financeira/negativado; plano vazio = onboarding = ativo).
- SQL: `public.is_patient_active(uuid)` (espelha o TS; é o mesmo gate do trigger
  `cancel_scheduled_messages_when_plan_inactive` que corta envio automático quando o plano vira
  inativo).

**Migração `20260701_chat_inactivity_engageable.sql`** (aplicada na produção): `chat_inactivity_run()`
e `chat_inactivity_dashboard()` passam a usar `public.is_patient_active(id)` no lugar do filtro
frouxo. Mudança cirúrgica — resto do corpo idêntico.

**Resultado medido:** base elegível **1589 → 955**; `inativos_que_passam = 0`. (As estimativas
manuais anteriores — 905/1010/1105 — estavam over-contando por um bug de normalização de acento
maiúsculo na réplica ad-hoc; a função canônica é a fonte da verdade.) `is_patient_active` é
plano-only (não checa `vencimento`); se o dono quiser excluir vencidos também, é um passo opcional
futuro.
---

## Rollout por coorte (Parte A) + Página de Rollout & Adoção (Parte B)

**Parte A — gating por coorte (app do aluno `meu-acompanhamento`):**
- `portal-settings-service.ts`: `PortalConfig.support` ganhou `enabled_plans: string[]` e
  `rollout_percentage: number` (além de `show_tab`/`test_patient_ids`). Nova função pura
  `shouldShowSupport(patientId, patient, config)` centraliza o gating (hash djb2 determinístico
  pro %). `PatientDietPortal.tsx` passou a usar `shouldShowSupport` no lugar do gating inline.
- `tsc`: 0 erros novos (os 8 erros pré-existentes em portal-settings-service são tipos do Supabase
  desatualizados no sandbox, presentes com ou sem a mudança).

**Parte B — back-office (`controle-de-pacientes`):**
- Migração `20260702_chat_rollout_config.sql` (aplicada em produção via MCP): tabela
  `chat_rollout_config` (allow-list `active_planos` curada pelo dono + `require_vigente`) e 7 RPCs
  SECURITY DEFINER guardadas por `chat_is_team_of(owner)`: get/set config, plan_counts, get/set
  support (lê/escreve `portal_config.support`), adoption_dashboard, adoption_patients. Seed da
  allow-list pro Fabricio com os 14 planos ativos atuais (idempotente).
- UI: `pages/Rollout.tsx` (tema claro escopado) + `components/rollout/RolloutPanel.tsx` (3 abas:
  Liberação por coorte, Adoção, Quem é ativo) + `lib/rollout-service.ts`. Rota `/rollout` no
  `App.tsx` e item "Rollout & Adoção" (ícone Rocket) na `AppSidebar.tsx`.
- Validação: lógica das RPCs conferida por SQL — engajáveis **785**, push **14** (bate com o
  histórico), app-14d **0** (last_seen popula agora pós-Fase C), chat **1**. Advisors: meus objetos
  só geram INFO `rls_enabled_no_policy` (acesso só via RPC, intencional) e os WARN esperados de
  SECURITY DEFINER. `tsc --noEmit` limpo no back-office (0 erros no projeto inteiro).

> **Não mergeado pra main** — aguardando ok do dono (validação manual da página `/rollout`).
> A migração já está em produção (aditiva, retrocompatível). Parte A (app do aluno) e Parte B
> (back-office) estão na branch `claude/sharp-dirac-8dgmht`. Parte A é retrocompatível: campos
> novos default vazio/0 = sem efeito até o dono configurar.
---

## Ajustes: Rollout dentro do Atendimento + links clicáveis no chat

- **Rollout & Adoção movido pra dentro da página Atendimento** (a pedido do dono, pra não
  poluir a sidebar): `AtendimentoBoard` ganhou um toggle "Conversas | Rollout & Adoção" no
  cabeçalho; em "Rollout" renderiza o `RolloutPanel` no lugar do kanban (mesma altura/escopo de
  tema do board). Removidos: item da sidebar, rota `/rollout` e `pages/Rollout.tsx`.
- **Links clicáveis:** novo `lib/linkify.tsx` (`renderWithLinks`) detecta URLs no corpo da
  mensagem e as torna clicáveis (http/https e `www.`). Aplicado no `SupportChat` (app do aluno)
  e nas bolhas do `AtendimentoBoard` (back-office). Idêntico nos dois repos, zero-dependência.
- `tsc --noEmit` limpo nos dois repos.
---

## Fatia 7 — Polish WhatsApp (read receipts + separadores + deep-link + badge) — IMPLEMENTADA

### Feito
- **Banco (prod):** migração `20260618_chat_read_receipts` — `chat_patient_get_messages` recriada (marca
  read_at das msgs da equipe + retorna read_at); novo `chat_team_mark_read` (marca read_at das msgs do paciente
  + zera unread_for_team). Validado: assinatura nova traz `read_at`; função do time presente.
- **App do aluno:** `SupportMessage.read_at`; ✓/✓✓ nas mensagens do aluno; separadores de data (Hoje/Ontem);
  listener de `open-support-tab` do SW; `sw.js` manda postMessage no clique da notificação de chat; badge
  monocromático (`notification-badge.png`); bump do cache do SW (v27).
- **Back-office:** `markTeamRead` via RPC `chat_team_mark_read`; ✓/✓✓ nas mensagens da equipe; separadores de data.
- **Build:** `npm run build` limpo nos dois repos.

### Falta validar (manual, na UI real)
- [ ] Aluno manda msg → Fabricio abre a conversa → aluno vê ✓✓ nas mensagens dele.
- [ ] Fabricio responde → aluno abre → Fabricio vê ✓✓ nas mensagens dele.
- [ ] Separador "Hoje/Ontem" aparece certo virando o dia (BRT).
- [ ] Tocar na notificação de chat com o app aberto cai direto na aba Suporte.
- [ ] Badge da notificação sai como silhueta (não mais quadrado) no Android.

### Próximo (não feito nesta fatia)
- "Digitando…" em tempo real (realtime broadcast de presença).
- Responder/citar mensagem (coluna reply_to + UI).
- Reações com emoji (tabela nova + RLS + RPCs + UI nos dois lados).
---

## Fatia 8 — Polish WhatsApp lote 2: digitando + responder/citar + reações — IMPLEMENTADA

### Digitando…
- Canal de Realtime Broadcast efêmero `chat:typing:<conv>` (sem banco). App: `chatService.subscribeTyping`;
  back-office: `subscribeChatTyping`. Cada lado emite ao digitar (throttle ~1.8s) e mostra "digitando…" no
  cabeçalho quando o outro digita.

### Responder/citar (migração `20260618_chat_reply_to`)
- Coluna `chat_messages.reply_to_message_id` (auto-FK on delete set null).
- RPCs de envio (`chat_patient_send_message`/`chat_team_send_message`) ganham `p_reply_to` (default no fim →
  backward-compatible com chamadas antigas). `chat_patient_get_messages` retorna `reply_to_message_id`.
- UI dos dois lados: ação "Responder" no menu de qualquer mensagem, tarja de citação no composer e bloco
  citado dentro da bolha (resolvido na lista local pelo id).

### Reações com emoji (migração `20260618_chat_reactions`)
- Tabela `chat_message_reactions` (uma por lado/mensagem, `unique(message_id, reactor)`), RLS (equipe lê via
  `chat_is_team_of`; escrita só por RPC). Trigger de broadcast no mesmo tópico das mensagens + tabela na
  publication `supabase_realtime` (postgres_changes pro back-office).
- RPCs toggle `chat_patient_react` / `chat_team_react`. `chat_patient_get_messages` passa a retornar `reactions`
  (jsonb). Back-office lê via `getReactions(conversationId)`.
- UI dos dois lados: barra de emojis rápida (👍❤️😂😮😢🙏) no menu da bolha + chips de reação na mensagem
  (clicar no chip faz toggle da sua reação).

### Build
`npm run build` limpo nos dois repos.

### Falta validar (manual, na UI real)
- [ ] "digitando…" aparece dos dois lados quase na hora.
- [ ] Responder mostra a citação no composer e o bloco citado na bolha enviada.
- [ ] Reagir mostra o emoji na bolha dos dois lados; re-reagir com a mesma emoji remove.

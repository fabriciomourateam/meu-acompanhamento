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

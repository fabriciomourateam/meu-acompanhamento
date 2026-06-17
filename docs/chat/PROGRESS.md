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

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

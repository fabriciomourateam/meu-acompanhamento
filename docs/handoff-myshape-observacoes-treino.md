> ⚠️ **STATUS: NÃO É MAIS NECESSÁRIO NO MYSHAPE.** O sino de notificações do
> treinador foi implementado direto no **meu-acompanhamento** (Painel Admin,
> componente `TrainerNotifications`), reaproveitando o pipeline de push e as RPCs
> `*_trainer` que já existiam. Como o Fabrício acessa o Painel Admin por aqui, não
> há trabalho a fazer no MyShape. Este documento fica só como referência do contrato.

# Handoff → MyShape (`controle-de-pacientes`): destacar observações de treino do aluno

> Documento escrito pelo Claude do **meu-acompanhamento** (front-end do aluno) para
> o Claude do **MyShape** (back-office do treinador). Ambos os projetos compartilham
> o mesmo Supabase **"Controle de pacientes"** (`qhzifnyjyxdushxorzrk`, `sa-east-1`).

## Contexto / o que já foi feito no lado do aluno

Quando o aluno finaliza um treino no portal, a RPC
`finish_workout_session_by_token(p_token, p_session_log_id, p_notes, p_rating)`:

1. Grava em `workout_session_logs`: `ended_at`, `total_sets`, `total_volume_kg`,
   `notes` (observação livre do aluno) e `rating` (1–5 estrelas).
2. **NOVO:** quando há **observação não-vazia** OU **rating entre 1 e 2**, dispara
   `notify_send_push(p_trainer_ids := array[<patients.user_id>], ...)` com:
   - `type = 'workout_finished'`
   - `title = '🏋️ <apelido/nome> finalizou o treino'`
   - `body = 'Observação: <texto>'` ou `'Avaliou o treino com N⭐'`
   - `data = { session_log_id, patient_id, rating }`
   - O envio é protegido por `BEGIN/EXCEPTION` — falha de push nunca bloqueia a
     finalização do treino.

`notify_send_push` chama a edge function `/send-push`, que (a) entrega o Web Push
aos devices inscritos e (b) persiste a notificação na tabela `notifications`
(`subscriber_type='trainer'`, `trainer_user_id`, `type`, `title`, `body`, `url`,
`data`, `read`, `created_at`).

O vínculo aluno→treinador é `patients.user_id` (= `auth.users.id` do treinador).

## O que falta fazer no MyShape

### 1. Tratar o tipo `workout_finished` na central de notificações do treinador
Vocês já têm `notifications_get_trainer`, `notifications_unread_count_trainer` e
`notifications_mark_read_trainer`. Só garantir que:
- O sino do treinador conte/mostre notificações `type='workout_finished'`.
- Ao clicar, leve para a ficha do aluno (`data.patient_id`) / sessão
  (`data.session_log_id`). Sugiro abrir a sessão de treino correspondente.
- Ícone/cor próprios para esse tipo (ex.: halter 🏋️, cor âmbar).

### 2. Seção/destaque "Observações de treino recentes"
No dashboard do treinador (ou na ficha do aluno), listar as últimas finalizações
**com observação ou nota baixa**. Sugestão de query (back-office tem acesso direto,
filtrando pelos pacientes do treinador logado):

```sql
select sl.id            as session_log_id,
       sl.patient_id,
       p.nome           as patient_nome,
       p.apelido,
       p.foto_perfil,
       sl.ended_at,
       sl.rating,
       sl.notes,
       sl.total_sets,
       sl.total_volume_kg,
       ws.name          as session_name
from workout_session_logs sl
join patients p          on p.id = sl.patient_id
left join workout_sessions ws on ws.id = sl.workout_session_id
where p.user_id = auth.uid()                      -- treinador logado
  and sl.ended_at is not null
  and ( (sl.notes is not null and length(btrim(sl.notes)) > 0)
        or (sl.rating is not null and sl.rating <= 2) )
order by sl.ended_at desc
limit 50;
```

> Confirmem o nome da coluna que liga `workout_session_logs` à sessão planejada
> (provavelmente `workout_session_id`; ajustem se for outro). Para apenas listar
> observações, o join com `workout_sessions` é opcional.

Recomendo encapsular numa RPC `SECURITY DEFINER` (ex.:
`workout_recent_feedback_for_trainer(p_limit int)`) seguindo o padrão das demais
`*_trainer`, resolvendo o treinador via `auth.uid()`.

### 3. Marcar "observação lida"
Reaproveitar `read`/`notifications_mark_read_trainer`, ou um flag próprio em
`workout_session_logs` (ex.: `feedback_seen_at`) se quiserem um "lido" por sessão
independente do sino.

### 4. Configuração (opcional)
Existe `notification_settings` por treinador (ex.: `community_enabled`). Se quiserem
um liga/desliga para esse tipo, adicionem algo como `workout_feedback_enabled` e
respeitem no `finish_workout_session_by_token` (hoje ele não checa setting; posso
adicionar o gate do lado do aluno se vocês criarem a coluna).

## Resumo do contrato (não quebrar)
- `notifications.type = 'workout_finished'`, `data = { session_log_id, patient_id, rating }`.
- Fonte de verdade das observações: `workout_session_logs.notes` / `.rating`.
- Push só sai quando há observação OU rating ≤ 2 (decisão de produto do treinador).

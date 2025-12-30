# Instruções para Configurar RLS no Supabase

## Problema

O portal do paciente está recebendo erro 406 (Not Acceptable) ao tentar ler dados de algumas tabelas porque as políticas RLS (Row Level Security) estão bloqueando o acesso.

## Solução

Execute o script SQL `rls_patient_portal.sql` no Supabase para criar as políticas necessárias.

## 🔒 Segurança

As políticas criadas são **RESTRITIVAS** e permitem acesso apenas:

1. ✅ **Ao próprio paciente** - Duas formas:
   - Quando o paciente está autenticado via Supabase Auth (tem `user_id` vinculado na tabela `patients`)
   - Quando o paciente acessa via **token anônimo** do portal (validado no código JavaScript por telefone)
2. ✅ **Ao dono da conta** - O usuário autenticado que criou os dados (via `user_id`)
3. ✅ **Aos membros da equipe** - Usuários autenticados que estão na tabela `team_members` como membros ativos

### 🔑 Acesso via Token (Portal do Paciente)

O portal do paciente usa um **sistema de token baseado em telefone** (não Supabase Auth). Para isso funcionar com segurança:

- O código JavaScript valida o token antes de fazer qualquer query
- O token é vinculado ao telefone do paciente
- As queries sempre incluem filtros por `patient_id` específico
- As políticas RLS permitem acesso anônimo apenas para dados vinculados a pacientes válidos

⚠️ **IMPORTANTE**: 
- Para pacientes autenticados via Supabase Auth, eles precisam ter `user_id` preenchido na tabela `patients` vinculado ao `auth.uid()`.
- Para acesso via token do portal, a validação é feita no código JavaScript que garante que apenas o paciente correto acessa seus dados.

## Como Executar

### Método 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral)
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `sql/rls_patient_portal.sql`
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Verifique se não há erros na execução

### Método 2: Via Supabase CLI (Avançado)

```bash
# Se você tem o Supabase CLI instalado
supabase db reset
# ou
psql -h [seu-host] -U postgres -d postgres -f sql/rls_patient_portal.sql
```

## O que o Script Faz

O script cria políticas RLS que permitem:

1. **patient_points** - Leitura de pontos do paciente
2. **patient_achievements** - Leitura de conquistas do paciente
3. **patient_daily_challenges** - Leitura de desafios diários
4. **patient_points_history** - Leitura do histórico de pontos
5. **diet_daily_consumption** - Leitura do consumo diário
6. **diet_plans** - Leitura de planos liberados (is_released = true)
7. **diet_meals** - Leitura de refeições de planos liberados
8. **diet_foods** - Leitura de alimentos de planos liberados
9. **diet_guidelines** - Leitura de orientações de planos liberados
10. **daily_challenges** - Leitura de desafios ativos
11. **achievement_templates** - Leitura de templates de conquistas

## Verificação

Após executar o script, você pode verificar se as políticas foram criadas:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'patient_points',
  'patient_achievements',
  'diet_plans',
  'diet_meals',
  'diet_foods'
)
ORDER BY tablename, policyname;
```

## Notas Importantes

- 🔒 **Segurança Restritiva**: As políticas criadas são **RESTRITIVAS** e permitem acesso apenas ao próprio paciente, dono da conta e membros da equipe.

- 👤 **Autenticação Necessária**: Os pacientes precisam estar autenticados via Supabase Auth e ter `user_id` preenchido na tabela `patients` vinculado ao `auth.uid()`.

- 🔑 **Vinculação Paciente-Usuário**: Se o paciente ainda não tem `user_id` preenchido, ele precisa fazer login no portal via telefone + OTP para vincular automaticamente.

- 🔒 **Escrita**: As políticas criadas são apenas para **SELECT** (leitura). Se precisar permitir escrita (INSERT/UPDATE/DELETE), será necessário criar políticas adicionais.

- 🧪 **Teste**: Após aplicar as políticas, teste o portal do paciente para garantir que todos os dados aparecem corretamente.

## Como Funciona

1. **Paciente autenticado**: Quando um paciente faz login via Supabase Auth (telefone + OTP), seu `user_id` na tabela `patients` é vinculado ao `auth.uid()`.

2. **Verificação de acesso**: As políticas verificam se:
   - O `patients.user_id` = `auth.uid()` (próprio paciente), OU
   - O `user_id` do registro = `auth.uid()` (dono), OU
   - O usuário é membro ativo da equipe do dono

3. **Isolamento de dados**: Cada paciente só vê seus próprios dados, e cada dono/membro da equipe só vê dados de seus pacientes.

## Troubleshooting

### Erro: "policy already exists"
Se você receber este erro, significa que a política já existe. Você pode:
- Ignorar o erro e continuar
- Ou remover a política antiga antes de executar:
  ```sql
  DROP POLICY IF EXISTS "nome_da_politica" ON public.nome_da_tabela;
  ```

### Erro: "permission denied"
Verifique se você tem permissões de administrador no banco de dados.

### Dados ainda não aparecem
1. Verifique se RLS está habilitado nas tabelas:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'patient_points';
   ```
2. Verifique se as políticas foram criadas corretamente (use a query de verificação acima)
3. Verifique se os dados realmente existem no banco


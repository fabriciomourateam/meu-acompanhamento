# CLAUDE.md — meu-acompanhamento

## Arquitetura do produto

Este projeto (`meu-acompanhamento`) é um **braço do MyShape**. A divisão de papéis é:

- **MyShape (`controle-de-pacientes`)** → é o **back-office / painel do profissional**.
  É onde o Fabrício monta tudo nos bastidores (dietas, refeições, alimentos,
  orientações, suplementação etc.) e grava no **Supabase**.
  - Projeto Supabase: **"Controle de pacientes"** (`qhzifnyjyxdushxorzrk`, região `sa-east-1`).
- **meu-acompanhamento** → é o **front-end final do aluno/paciente**.
  Consome os mesmos dados do Supabase e os exibe para o paciente (dieta,
  orientações, suplementos, substituições, evolução etc.).

Ou seja: **o MyShape escreve, o meu-acompanhamento lê e apresenta.** Não há
integração com nenhum sistema externo de terceiros — "MyShape" é a marca do
próprio ecossistema (ver `public/fm-myshape-logo.png`).

### Modelo de dados da dieta (Supabase)
- `patients` (coluna do nome é `nome`, não `name`)
  - `foto_perfil` (text): URL pública da foto de perfil/avatar do paciente (bucket
    público `patient-photos`). O paciente faz upload pelo próprio portal (avatar ao
    lado do nome) e a foto aparece no ranking. Não confundir com as fotos de
    evolução (`foto_inicial_*` / `foto_atual_*`).
- `diet_plans` → `diet_meals` → `diet_foods`
- `diet_guidelines` (orientações gerais **e** suplementação — diferenciadas por `guideline_type`)

### Refeições "OPÇÃO" (alternativas)
Refeições alternativas são modeladas como **refeições-filhas** via a coluna
`diet_meals.parent_meal_id`:
- Refeição principal: `parent_meal_id = NULL`
- Refeição-opção (ex.: "🔁 OPÇÃO DA REFEIÇÃO 02"): `parent_meal_id` aponta para
  o `id` da refeição principal correspondente.

A semântica é **"coma OU a principal OU a opção"**, nunca as duas.

## Pendências / requisitos conhecidos

1. **Macros e calorias do card superior de Dieta NÃO devem contabilizar as
   refeições-opção.** Como elas são substitutas (`parent_meal_id != NULL`), somar
   principal + opção infla os totais (dupla contagem). O somatório exibido no card
   de topo deve considerar apenas as refeições principais (`parent_meal_id IS NULL`).
   - Obs.: hoje as refeições-opção vêm com `exclude_from_macros = false` no banco.

2. **Sinalizar visualmente que a refeição é uma opção.** Hoje usa o emoji 🔁 no
   nome. Avaliar um indicador visual mais claro/consistente (ex.: trocar o
   marcador/"gartinho" por um ícone circular, badge "Opção", ou agrupar
   visualmente sob a refeição principal) que sugira que é uma alternativa, e não
   uma refeição adicional.

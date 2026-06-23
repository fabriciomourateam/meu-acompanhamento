# CLAUDE.md — meu-acompanhamento

## Chat interno (substituir WhatsApp) — LEIA antes de mexer

Se for trabalhar no **chat/Suporte** (a feature que substitui o WhatsApp),
**leia primeiro `docs/chat/SPEC.md` e `docs/chat/PROGRESS.md`** — eles têm o design
completo, o que já foi feito/validado e o próximo passo. Mantenha esses dois
arquivos em sincronia com os equivalentes do repo `controle-de-pacientes`.

## Grafia do nome do dono — SEMPRE "Fabricio" (sem acento)

O dono se chama **Fabricio**, sem acento agudo no "i". Nunca escreva "Fabrício". Vale pra TUDO: respostas em chat, mensagens de commit, descrições de PR, comentários no código, nomes em seed/test data, copy de UI, etc. Se você encontrar "Fabrício" (com acento) já existente no código/banco, NÃO altere automaticamente — sinaliza pro dono e pergunta se quer normalizar. Mas em qualquer texto NOVO que você produzir, é sempre "Fabricio".

## Tema claro/escuro — SEMPRE tematizar os dois (regra obrigatória)

O portal do aluno tem **tema claro (padrão) e escuro**, alternável no menu (⋮).
Arquitetura: **claro = base** (classes Tailwind normais, ex.: `bg-white`,
`text-slate-900`); **escuro = variantes `dark:`** por cima. A classe `.dark` vai no
`<html>` (light = sem classe). A paleta escura é **centralizada** em `src/index.css`
(bloco no fim: vars `--d-bg/surface/elevated/border/...` + overrides `html.dark`,
recharts, react-day-picker, `.chat-doodle`, `.portal-name-card`).

**Ao adicionar/editar QUALQUER UI, já entregue os DOIS temas — o dono não precisa
pedir "nos dois formatos".** Checklist:

- Toda cor de fundo/texto/borda clara precisa de par `dark:` (ex.: `bg-white
  dark:bg-slate-900`, `text-slate-900 dark:text-slate-100`).
- **Armadilhas que escapam de varredura automática** (sempre conferir à mão):
  - **Estilo inline** (`style={{ backgroundColor }}`) vence `dark:` → ler o tema via
    `useTheme()`/`resolvedTheme` e escolher a cor.
  - **Cores hex fixas** (`text-[#222222]`, `bg-[#fff]`) — sem `dark:` somem no escuro.
  - **Opacidade** (`bg-white/80`, `bg-emerald-50/60`, `border-cor-100/80`) — o `/NN`
    bloqueia conversões por regex; precisa de `dark:` manual.
  - **Gradientes** terminando em branco (`to-white`, `via-white`) desbotam no escuro.
  - **Branco SOBRE card colorido** (overlays `bg-white/15`, números/brilhos) deve
    ficar claro nos DOIS temas — NÃO darkenizar.
  - **Conteúdo rich text do back-office** (cores embutidas) é tratado por
    `adaptHtmlColorsForDark()` em `src/lib/utils.ts` no render.
- Componentes **só do back-office** (modais/forms em `src/components/diets/*Modal`,
  `DietPlanForm`, `DietPlansList`, `TemplateLibraryModal`, telas de **export/PDF**)
  **não** entram no tema do portal — deixar claros.

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

## Refeições-opção na UI — comportamento já implementado

Os dois requisitos abaixo **já estão resolvidos** em
`src/components/patient-portal/diet/DietTab.tsx` (documentado aqui pra contexto, não
é mais pendência):

1. **Macros/calorias do card de topo NÃO contam as refeições-opção.** O somatório
   roda só sobre as refeições "em uso" do grupo via `isCountedMeal()` / `isOptionMeal()`
   — opção (`parent_meal_id != NULL`) e principal rebaixada após troca ficam de fora,
   sem dupla contagem.

2. **Sinalização visual da opção.** O emoji 🔁 foi removido do nome e substituído por
   um badge "Opção" (`<OptionBadge />`); as opções vêm agrupadas/recolhidas sob a
   principal (indentadas, borda esquerda emerald, fundo mais claro), com botões
   "Usar hoje" / "Desfazer" e badge "Em uso hoje" para a troca do dia.

## Fuso horário — SEMPRE São Paulo (America/Sao_Paulo, UTC-3)

Tudo que envolva tempo neste projeto opera no fuso de **São Paulo (`America/Sao_Paulo`, UTC-3 sem horário de verão)**. Vale pra:

- **Comparações de "hoje", "ontem", "esta semana"** no app do aluno (check-ins, consumo de refeições, treino do dia, streak, metas diárias): o "dia" começa e termina à meia-noite de São Paulo, não UTC.
- **Renderização de datas/horários** em listas, históricos, avatares de check-in: usar BRT. `new Date()` sem cuidado mostra o fuso do navegador do aluno (geralmente OK, mas alunos no exterior viam datas erradas — preferir conversão explícita pra `America/Sao_Paulo`).
- **Persistência**: colunas `timestamptz` armazenam em UTC correto; o problema acontece em `extract(hour from ...)` sem `AT TIME ZONE 'America/Sao_Paulo'`, ou em comparações de string `YYYY-MM-DD` derivadas de UTC.
- **Logs de set/série/cardio**: o `sent_at`/`logged_at` é UTC no banco, mas o "que dia foi" pro aluno é o dia em BRT.
- **Janelas de notificação**: alarmes/reminders agendados respeitam o relógio do aluno (BRT).

Se um código existente está em UTC puro sem ajuste, considere isso como **bug em potencial** — sinalize ou corrija. Quando o user disser "ontem", "essa semana", sempre interprete em BRT.

## Continuidade entre janelas de contexto — handoff obrigatório

O objetivo é nunca perder o fio da meada quando uma janela de contexto acaba e outra começa. Há **duas obrigações** (regra espelhada do repo `controle-de-pacientes`):

### 1. Salvar o estado quando o contexto está acabando (ou em marcos)

**Quando o contexto restante chegar a ~3%, ~2% ou ~1% — ou sempre que você perceber que a janela está perto do limite / prestes a ser resumida** — PARE o que não for crítico e **escreva/atualize `docs/SESSION_HANDOFF.md`** com TUDO que a próxima janela precisa pra continuar sem reperguntar:

- **O que está sendo feito** (tarefa atual, em uma frase) e **por quê**.
- **Estado atual**: o que já foi concluído e validado, o que está pela metade.
- **Branch(es) em andamento** e se há trabalho não commitado/não pushado.
- **Decisões já tomadas** (pra não re-litigar) e pendências/dúvidas abertas com o dono.
- **Próximo passo concreto** (a primeira ação que a nova janela deve executar).
- **Armadilhas/contexto não óbvio** (configs, IDs, credenciais já validadas, gotchas).

**Não espere o contexto acabar:** atualize o handoff também **após cada marco importante** — uma feature validada, um commit relevante, uma decisão tomada com o dono. O gatilho de "contexto baixo" é o último recurso, não o único.

Escreva de forma que alguém — você numa nova janela — consiga retomar lendo **só** esse arquivo. Atualize-o (sobrescreva) a cada handoff; ele é **rolante**, sempre reflete o estado mais recente. Faça commit dele se houver branch ativa.

### 2. Ler o handoff no início de toda nova janela

**No começo de TODA nova sessão/janela de contexto, ANTES de qualquer ação de escrita, leia `docs/SESSION_HANDOFF.md` primeiro** (se existir e tiver conteúdo de uma sessão anterior). Ele tem prioridade sobre suposições: retome exatamente de onde a janela anterior parou. Só ignore se o dono explicitamente abrir um assunto novo e não relacionado.

> Há um **SessionStart hook** configurado (`.claude/settings.json` → `.claude/hooks/session-start.sh`) que injeta `docs/SESSION_HANDOFF.md` no contexto automaticamente no início de cada sessão. Mesmo assim, esta regra vale como reforço caso o hook não rode.
>
> Obs.: existe um `docs/SESSION-HANDOFF.md` (com hífen) legado de sessões antigas; o handoff rolante novo é o `SESSION_HANDOFF.md` (com underscore). Consolidar/remover o legado fica a critério do dono.

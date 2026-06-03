# Handoff — meu-acompanhamento (resumo da sessão)

> Documento de continuidade pra retomar o trabalho em um novo chat sem perder contexto.
> Tudo abaixo já está implementado e na branch `main` (salvo onde indicado como pendente).

## Como trabalhar neste repo

- **Branch de desenvolvimento:** `claude/pensive-goodall-RaaBv`. Os pushes vão pra ela **e** pra `main` (`git push origin claude/pensive-goodall-RaaBv:main`).
- **Deploy:** Vercel (auto-deploy do `main`). ⚠️ Já houve **atraso/parada de deploy** — se o site não atualizar, cheque em Vercel → Deployments; um **commit vazio** (`git commit --allow-empty`) re-dispara o webhook. Possível limite de ~100 deploys/dia no plano grátis.
- **Validações antes de commitar:**
  - `npx vite build` (precisa terminar com `✓ built`).
  - `npm run check:refs` — **guard de CI** (script `scripts/check-refs.mjs` + workflow `.github/workflows/typecheck.yml`) que falha só em `TS2304/TS2552` (identificador não definido → ReferenceError). Criado depois de um bug (`isConquista`) que derrubava o app inteiro.
- **Supabase (compartilhado com o MyShape/controle-de-pacientes):** projeto `qhzifnyjyxdushxorzrk`, região sa-east-1.
- **Arquitetura:** MyShape (controle-de-pacientes) **escreve**; meu-acompanhamento **lê e apresenta**. Não dá pra "buscar componentes" do MyShape — só os **dados** são compartilhados.

## Constantes / IDs importantes

- **Super-admin (Fabrício) uid:** `a9798432-60bd-4ac8-a035-d139a47ad59b` (gating do painel de erros e da aba Membros).
- **Play Store package id:** `com.fmteam.meuacompanhamento`.
- **assetlinks fingerprints (já no ar em `/.well-known/assetlinks.json` e `/assetlinks.json`):**
  - upload (PWABuilder): `DC:02:3A:9F:9B:B3:12:E7:F6:5C:98:20:7C:B4:1F:EF:67:D1:BB:D9:C4:B8:51:81:D1:D3:EB:C6:24:B3:E3:95`
  - Play App Signing: `AF:2E:52:DD:88:D7:B3:FD:0B:06:7C:04:BC:E9:D5:FF:98:06:C6:51:96:77:B3:EB:B1:D2:FA:3B:0C:48:75:95`

---

## O que foi feito (por área)

### Comunidade / estabilidade
- **Bug "tela preta" corrigido:** `PostCard` usava `isConquista` sem declarar → ReferenceError derrubava todo o app (sem error boundary). Declarado `isConquista = post.category === 'conquista'`.
- **ErrorBoundary global** (`src/components/ErrorBoundary.tsx`): fallback amigável + limpa `portal_active_tab_*` do localStorage (pra não reabrir na tela quebrada) + registra o erro.
- **Log de erros:** tabela `client_error_logs` + RPC `log_client_error` (write-only anon). Painel **"Erros"** no AdminPortal, **exclusivo do super-admin** (RPCs `admin_list_client_errors` / `admin_resolve_client_error`).
- **Foto na comunidade marca a meta** `registro_visual` (em `PostComposer`).

### Dieta
- **Consumo por alimento** (item a item): estado `consumedFoods` em `useDietData`; refeição vira "consumida" quando todos os itens marcados; macros somam proporcional. Persistido por dia.
- **Trocar opção↔principal no dia:** `primaryChoices` (por dia); a opção escolhida **sobe** pro lugar da principal (reorder real do grupo via `displayMeals`) e conta nos macros (1 por grupo). Zera ao virar o dia.
- **Botão (+) de completar refeição** reduzido.
- **Cabeçalho do plano** (`PlanHeader` em `WorkoutTab`? não — em DietTab/`WorkoutTab`): na verdade o cabeçalho premium do **treino**; ver Treino.
- **Meta "Siga a Dieta" (`seguiu_dieta`)** marca sozinha ao completar todas as refeições.
- **Substituição "alimentos diferentes":** era dado — `food_database.category`. Recategorizados amiláceos de "Verduras e hortaliças" → "Carboidratos" (batata baroa, mandioca, inhame, cará, farinha de mandioca, polvilho, fécula, nhoque, batata sauté, etc.).

### Treino (WorkoutSessionRunner / ExerciseCard / SetRow)
- **Cronômetro de descanso travado** corrigido (deadline absoluto via `Date.now`, imune a re-render). Barra **enche** até o fim; com **faixa min–máx** (ex.: 60–90s) conta até o máx, marca o mín, muda pra "Já pode voltar" e vibra.
- **Reps/RPE editáveis:** o campo usava o default injetado; agora é placeholder (dá pra apagar).
- **Substituição leva o vídeo** do exercício substituto (antes mantinha o original).
- **Medalha de recorde (PR)** por série: baseada no **recorde all-time** (`workout_personal_records`: melhor peso **ou** melhor 1RM estimado). Phase-agnóstico.
- **Observações do aluno por exercício** (persistem entre treinos): tabela `workout_exercise_patient_notes` + RPCs `get/set_exercise_note_by_token`. **Colapsadas por padrão** (bolinha verde quando há nota).
- **Reordenar exercícios** (modo reordenar, setas) — vale só pra sessão do dia (rascunho local).
- **Auto-avançar:** ao completar todas as séries, recolhe e abre o próximo.
- **Descartar/reiniciar treino:** botão + RPC `cancel_workout_session_by_token`. (Resolveu também o cronômetro mostrando horas de sessão antiga recuperada.)
- **Cabeçalho do plano** (`PlanHeader` em `WorkoutTab`): card branco, borda emerald, **título em negrito** + frequência (split no `:`), uma linha. Ex.: "✅ MUSCULAÇÃO: 3 a 4x na semana".
- **Aquecimento (warmup):** não aparecia. Agora renderiza bloco "🔥 Aquecimento" antes das séries de trabalho, **clicável** (loga com `is_warmup=true`). 
  - ⚠️ **Índice negativo** (`set_index = -(i+1)`) pra **não colidir** com a série de trabalho no índice único `(session_log, planned_exercise, set_index)` (a RPC faz `ON CONFLICT DO UPDATE`).
  - **Segue o 1º exercício da lista** (warmup = início do treino): runner calcula `warmupConfig` e passa só pro primeiro da ordem atual.
  - **Sugere última carga de aquecimento** (RPC `get_last_warmup_loads_by_token`).
- **Fase / periodização:** avanço é automático por semanas desde `coalesce(periodization_anchor_at, released_at, created_at)`.
  - **Mudança manual de fase** com aviso (banner): RPC `set_plan_phase_by_token` (aplica `apply_phase_change` + re-ancora). Mesma RPC serve pro ajuste "começar numa semana adiantada".
- **Adesão semanal** estava quebrada (`frequency_per_week` nulo dava 0% e contava treinos não-finalizados). Corrigida `get_weekly_adherence`: alvo cai pro nº de sessões do plano quando nulo, conta só finalizados (`ended_at`), limita 100%.
- **Frequência variável do cardio** (`vezes_semana_max`): card mostra "3x a 4x por semana"; progresso mostra a faixa "0/3-4 treinos · 0/60-80 min".

### Cardio (CardioSubtab)
- Progresso semanal modo "Nx/semana" (treinos + min).
- Cardio **segue o plano selecionado** (`getPrescribedCardio(token, planId)`).
- **Observações e opções renderizadas como HTML** sanitizado (vinha tag crua). 
- **Opções múltiplas** (`workout_plan_cardio.opcoes` jsonb, formato `{label, descricao}`): renderizadas como blocos "Opções de cardio".
- Empty-state quando o plano não tem cardio.

### Metas diárias (auto)
- `atividade_fisica` (treino/cardio — já existia), `seguiu_dieta` (dieta completa), `registro_visual` (foto na comunidade). Água/sono/celular continuam manuais.

### Login
- **Normalização de telefone** (`PortalLogin`): aceita com/sem o **9** do celular e com/sem o **55** (gera variantes e tenta cada uma). A 2ª etapa (data de nascimento) valida identidade.

### Evolução (aba Evolução / PatientEvolutionTab)
- **Boneco de bioimpedância** (`BodyCompositionFigure`): silhueta cinza (frente+costas) com regiões em **elipses coloridas** + valor, escala em faixas (Mínima/Baixa/Moderada/Alta/Muito Alta), legenda, subtítulo (data • BF% • classificação). Dados reais de `body_composition.distribuicao_regional` (mesmo Supabase do MyShape). **Lado a lado** com o gráfico de % gordura no PC (`items-stretch`).
- **Evolução das medidas** (`MeasurementsChart`): cintura + quadril, extraídas (parser tolerante) de `checkin.respostas_json`/`medida`. Fica **acima** das pontuações.
- **"Análise de Evolução" sem mensagens negativas** (só positiva/neutra).
- **Badge de Massa Magra** só aparece quando há **ganho** (escondido quando negativa).

### PWA / App
- **Botão "Instalar app" no mobile** (estava só no desktop). No mobile: 2 botões-ícone (👑 Área de Membros + ⬇️ instalar); após instalado, Membros mostra texto.
- **Nome do app na tela inicial: "My Shape"** (manifest + apple title).
- **Ícone do app por rota:** `/`, `/portal`, `/portal-fmteam` → `app-icon-512/192.png` (gerado do logo do login "Nutrição e Treinamento", fundo preto). Slugs `/portal-<x>` → `fmteam-icon.png`.
- Manifest **estático** (`public/manifest.json`, discoverable p/ PWABuilder) **+ dinâmico por rota** no `index.html` (link `#app-manifest` atualizado em runtime).

### Play Store (TWA via PWABuilder)
- `assetlinks.json` em `public/.well-known/` **e** `public/assetlinks.json` (cópia sem ponto) + rewrite no `vercel.json` (`/.well-known/assetlinks.json` → `/assetlinks.json`), porque o Vercel não servia a pasta com ponto (dava HTML → `MALFORMED_CONTENT`). Header `no-cache`.
- **Página de Política de Privacidade:** `/privacidade` (`src/pages/PrivacyPolicy.tsx`). URL p/ o Play Console: `https://meu-acompanhamento.vercel.app/privacidade`.
- **Regra do Google (conta pessoal nova):** teste fechado com **≥12 testadores** por **14 dias** antes de produção. Usar os próprios alunos como testadores. Link de convite sai na página da faixa de teste ("Copiar link").

---

## Pendências / próximos passos

1. **Play Store:** rodar o teste fechado (12 testadores × 14 dias) → solicitar produção. Mandar o link de convite pros alunos.
2. Conferir no ar (após deploy): boneco, aquecimento, medidas, ícone "My Shape", `/.well-known/assetlinks.json` com os 2 fingerprints.
3. Itens "opcionais" mencionados e não feitos: refinar ainda mais o traço do boneco se quiser; mais medidas além de cintura/quadril (depende de padronizar o check-in).

## Migrations/RPCs criadas nesta sessão (Supabase)
- `client_error_logs` + `log_client_error`, `admin_list_client_errors`, `admin_resolve_client_error`
- `workout_exercise_patient_notes` + `get/set_exercise_note_by_token`
- `get_personal_records_by_token`, `set_plan_phase_by_token`
- `cancel_workout_session_by_token`, `get_weekly_adherence` (corrigida)
- `get_last_warmup_loads_by_token`
- `get_workout_plan_cardio_by_token` (aceita `p_plan_id`)
- recategorização de amiláceos em `food_database`

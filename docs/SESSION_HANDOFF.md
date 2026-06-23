# SESSION HANDOFF — Tema claro/escuro (dark mode)

> Leia este arquivo PRIMEIRO ao abrir uma nova janela (regra no `CLAUDE.md` →
> "Continuidade entre janelas de contexto"). Sobrescreva-o a cada handoff.

## Tarefa
Implementar **tema claro + escuro oficial** no portal do aluno (`meu-acompanhamento`),
com **claro como padrão** e botão no app. Objetivo do dono: dark de qualidade
**premium/coeso** que também blinde contra inversão forçada do SO/acessibilidade.

## Branch
`claude/tema-escuro-toggle` (branch SEPARADA pedida pelo dono p/ esse teste).
Tudo commitado e pushado.

## Estado atual (pronto)
- **Infra**: `src/lib/theme.tsx` — ThemeProvider/useTheme, 3 modos (light/dark/system),
  padrão light, persiste em localStorage `ma-theme`. Aplica classe `.dark` no <html>
  (light = sem classe = idêntico à produção). `color-scheme` por modo (anti auto-dark).
  Script inline no `index.html` evita flash.
- **Botão**: `ThemeToggleMenuItem.tsx` no menu (⋮) — radio Claro/Escuro/Automático.
- **CSS vars**: index.css tem `:root` (escuro) e `.theme-light` (claro), SEM bloco `.dark`.
  No escuro as vars vêm do `:root`. Componentes usam cores explícitas (não vars) → conversão
  via variantes `dark:` do Tailwind (darkMode: ["class"]).
- **Conversão**: varredura completa do portal (neutros + tints + gradientes) via
  `/tmp/darkify.py` (idempotente). Casos especiais: `!bg-white`,
  `data-[state=active]:bg-white`, estilos **inline** (DietTab cards de refeição/alimento
  liam tema via useTheme `isDark`), gradient stops `to-white/via-white`, bg neutros com
  opacidade (`bg-white/80`), track do círculo de macros (era preto 6% = invisível).

## Decisões tomadas
- Light = **byte-idêntico** à produção (só adiciona variantes dark:). Não aplicar `.theme-light`.
- Abordagem mudou de "aba por aba" → **varredura completa** (dark parcial = cards brancos).
- 3 modos (incl. Automático) confirmados pelo dono.

## Próximo passo
Refino fino de paleta com o dono via preview (ele manda print por print, eu corrijo
e dou push na MESMA branch — ele pediu pra não abrir preview novo toda hora).
Já cobertos: Dieta, Treino (SetRow/inputs/headers/GuidelinesBanner), Suporte (chat),
Progresso (widgets), Evolução + diets/exames externos, gráficos (recharts via CSS).
Pendências possíveis: fine-tune de cores de séries de gráficos, badges de nível
(Prata sem graça), e validar Evolução no preview (charts).

## Paleta central (index.css, bloco no fim)
Vars `.dark` (--d-bg #080f13, --d-surface #151f27, --d-elevated #1f2b33,
--d-border #2d3c46, textos). Re-mapeia utilitários slate dark: → essas vars.
Tem realce emerald (botões) e overrides recharts. MUDAR O TOM DO DARK = editar
esses hexes. Tudo `html.dark` p/ especificidade.

## Decisões
- Light = idêntico à produção (só adiciona dark:). Estilo teal-escuro + emerald
  (aprovado). Card do topo: glow emerald-teal radial (NÃO verde sólido — dono
  perguntou e a recomendação foi não).
- Componentes de export/PDF NÃO convertidos (ficam claros pro PDF).

## Armadilhas
- NÃO dá pra ver o app autenticado aqui (precisa token+Supabase). Validação visual depende
  do preview do dono.
- Estilos **inline** (`style={{ backgroundColor }}`) vencem `dark:` — caçar com grep.
- `tsc --noEmit` tem MUITOS erros pré-existentes no sandbox (deps faltando) — filtrar pelos
  arquivos tocados.
- Nome do dono: "Fabricio" (sem acento) em texto novo.

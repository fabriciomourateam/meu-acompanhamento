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
Dono revisa no preview e manda ajustes finos de paleta ("premium/moderno"). Último round
corrigiu Orientações (gradiente/texto branco/hover), círculo de macros, gradientes
desbotando pra branco, barra dos chips de grupo. **Aguardar próximo print** e refinar
contraste/coesão tab a tab (Treino, Progresso, Evolução, Comunidade, Suporte ainda não
revisados visualmente por ele).

## Armadilhas
- NÃO dá pra ver o app autenticado aqui (precisa token+Supabase). Validação visual depende
  do preview do dono.
- Estilos **inline** (`style={{ backgroundColor }}`) vencem `dark:` — caçar com grep.
- `tsc --noEmit` tem MUITOS erros pré-existentes no sandbox (deps faltando) — filtrar pelos
  arquivos tocados.
- Nome do dono: "Fabricio" (sem acento) em texto novo.

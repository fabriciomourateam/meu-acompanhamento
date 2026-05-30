// ---------------------------------------------------------------------------
// Temas semanais da comunidade: presets + cálculo do tema da semana atual.
// A rotação avança 1 tema por semana a partir de `startDate` (segunda-feira),
// e volta ao início ao chegar no fim da lista (loop infinito).
// ---------------------------------------------------------------------------

export interface WeeklyTheme {
  emoji: string;
  text: string;
}

/** Preset de 4 semanas. */
export const THEME_PRESET_4: WeeklyTheme[] = [
  { emoji: '📸', text: 'Tema da semana: poste a foto do seu treino de hoje!' },
  { emoji: '🥗', text: 'Tema da semana: mostre a refeição mais caprichada da sua dieta.' },
  { emoji: '🏆', text: 'Tema da semana: compartilhe uma conquista (peso, medida, hábito).' },
  { emoji: '💧', text: 'Tema da semana: como está sua meta de água e sono? Conta pra gente!' },
];

/** Preset de 8 semanas. */
export const THEME_PRESET_8: WeeklyTheme[] = [
  { emoji: '📸', text: 'Tema da semana: poste a foto do seu treino de hoje!' },
  { emoji: '🥗', text: 'Tema da semana: mostre a refeição mais caprichada da sua dieta.' },
  { emoji: '🏆', text: 'Tema da semana: compartilhe uma conquista da semana.' },
  { emoji: '💧', text: 'Tema da semana: meta de água e sono — como foi?' },
  { emoji: '🔥', text: 'Tema da semana: qual treino te deixou mais orgulhoso?' },
  { emoji: '🍳', text: 'Tema da semana: receita fit favorita — divide com a galera!' },
  { emoji: '📈', text: 'Tema da semana: poste sua evolução (antes/depois ou número).' },
  { emoji: '🙌', text: 'Tema da semana: mande uma mensagem de motivação pra alguém.' },
];

/** Segunda-feira (00:00 local) da semana de uma data. */
function startOfWeekMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0=domingo … 1=segunda
  const diff = (day === 0 ? -6 : 1) - day; // recua até segunda
  date.setDate(date.getDate() + diff);
  return date;
}

/**
 * Retorna o tema vigente nesta semana dado o cronograma e a data de início.
 * `null` se não houver cronograma. Faz loop ao chegar no fim da lista.
 */
export function getCurrentWeeklyTheme(
  schedule: WeeklyTheme[] | undefined,
  startDateIso: string | undefined,
  now: Date = new Date(),
): WeeklyTheme | null {
  if (!schedule || schedule.length === 0) return null;

  // Sem data de início definida: usa o primeiro tema.
  const start = startDateIso ? new Date(startDateIso + 'T00:00:00') : now;
  if (isNaN(start.getTime())) return schedule[0];

  const startMonday = startOfWeekMonday(start);
  const nowMonday = startOfWeekMonday(now);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.floor((nowMonday.getTime() - startMonday.getTime()) / msPerWeek);

  // Antes da data de início: ainda mostra o primeiro tema.
  const index = ((weeksElapsed % schedule.length) + schedule.length) % schedule.length;
  return schedule[Math.max(0, index)];
}

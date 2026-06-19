// Agenda de check-in do aluno — puro e testável, sempre em horário de São Paulo (BRT).
//
// Papel: dado o início do acompanhamento, o plano e a data de hoje, decide em que
// ponto do ciclo de check-in o aluno está (locked/open/overdue) e, cruzando com os
// check-ins já enviados, se o ciclo atual já foi cumprido (done).
//
// Coortes:
//  - Quinzenal (planos PREMIUM antigos): check-in nos dias 1 e 15 do calendário.
//  - Mensal (demais): a cada 30 dias a partir de `inicio_acompanhamento` (1ª data = inicio+30).
//
// Janela: abre WINDOW_OPEN_DAYS dias antes da data. No dia do vencimento e por mais
// OVERDUE_GRACE_DAYS dia(s) ainda conta como "aberto"; passando disso vira "atrasado".
// O atraso persiste até o aluno preencher OU até a janela do próximo ciclo abrir (rola).

import { getBrtISODate } from '@/lib/utils';

export const WINDOW_OPEN_DAYS = 3;
export const OVERDUE_GRACE_DAYS = 1;

export type CheckinState = 'locked' | 'open' | 'overdue' | 'done';

export interface CheckinCycle {
  state: CheckinState;
  /** Data do check-in do ciclo ativo (YYYY-MM-DD, BRT). */
  dueDate: string;
  /** Quando a janela do ciclo ativo abre/abriu (YYYY-MM-DD, BRT). */
  opensAt: string;
  /** Próxima data de check-in depois da atual (para os textos "Próximo: ..."). */
  nextDate: string | null;
  /** Dias de hoje até `dueDate` (positivo = falta; usado em locked/open). */
  daysUntil: number;
  /** Dias de atraso (hoje − dueDate; usado em overdue). */
  daysOverdue: number;
  isQuinzenal: boolean;
}

// Planos da coorte quinzenal (dia 1 e 15). Comparação normalizada para tolerar
// variações de caixa/espaço no cadastro.
const QUINZENAL_PLANS = [
  'PREMIUM (Parceria)',
  'PREMIUM (Semestral)',
  'PREMIUM (Trimestral)',
  'PREMIUM (Antigo | Anual)',
];

function normalizePlan(plano?: string | null): string {
  return (plano || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

const QUINZENAL_SET = new Set(QUINZENAL_PLANS.map(normalizePlan));

export function isQuinzenal(plano?: string | null): boolean {
  return QUINZENAL_SET.has(normalizePlan(plano));
}

// === Aritmética de datas em YYYY-MM-DD (ancorada em UTC, sem fuso do navegador) ===

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/** true só para strings exatamente no formato YYYY-MM-DD com componentes coerentes. */
function isValidYmd(s: string): boolean {
  if (!YMD_RE.test(s)) return false;
  return Number.isFinite(ymdToUTC(s));
}

function ymdToUTC(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Diferença em dias inteiros (a − b). */
function diffDays(a: string, b: string): number {
  return Math.round((ymdToUTC(a) - ymdToUTC(b)) / 86_400_000);
}

/** Soma `n` dias (pode ser negativo) a uma data YYYY-MM-DD. */
function addDays(s: string, n: number): string {
  return new Date(ymdToUTC(s) + n * 86_400_000).toISOString().slice(0, 10);
}

// Gera as datas de check-in (YYYY-MM-DD) dentro de [from, to], já filtradas por `>= inicio`.
// Defensivo: validação do `inicio` acontece no chamador (getCheckinCycle); ainda assim os
// loops têm teto de iterações como circuit-breaker — um NaN jamais pode travar a thread.
function buildDueDates(inicio: string, from: string, to: string, quinzenal: boolean): string[] {
  const dates: string[] = [];
  const MAX_ITER = 600; // ~muito além de qualquer janela real (today ± ~105 dias)

  if (quinzenal) {
    // Dias 1 e 15 de cada mês do calendário no intervalo.
    const [fy, fm] = from.split('-').map(Number);
    let y = fy;
    let m = fm; // 1-12
    // Recua um mês para não perder o dia 15 do mês de `from`.
    m -= 1;
    if (m < 1) { m = 12; y -= 1; }
    const toUTC = ymdToUTC(to);
    let iter = 0;
    while (ymdToUTC(`${y}-${String(m).padStart(2, '0')}-15`) <= toUTC + 31 * 86_400_000) {
      if (++iter > MAX_ITER) break;
      for (const day of [1, 15]) {
        const d = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (ymdToUTC(d) >= ymdToUTC(from) && ymdToUTC(d) <= toUTC) dates.push(d);
      }
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
  } else {
    // A cada 30 dias a partir de inicio; a 1ª data é inicio + 30.
    const fromUTC = ymdToUTC(from);
    const toUTC = ymdToUTC(to);
    const inicioUTC = ymdToUTC(inicio);
    for (let k = 1; k <= MAX_ITER; k++) {
      const dUTC = inicioUTC + k * 30 * 86_400_000;
      if (dUTC > toUTC) break;
      if (dUTC >= fromUTC) dates.push(new Date(dUTC).toISOString().slice(0, 10));
    }
  }

  return dates.filter((d) => ymdToUTC(d) >= ymdToUTC(inicio)).sort();
}

export interface CheckinCycleInput {
  inicio: string; // YYYY-MM-DD (patients.inicio_acompanhamento)
  plano?: string | null;
  hoje?: string; // YYYY-MM-DD, BRT (default: hoje em São Paulo)
}

/**
 * Resolve o ciclo ativo (sem considerar check-ins já enviados — ver getCheckinStatus).
 * Estado pode ser locked | open | overdue.
 */
export function getCheckinCycle({ inicio, plano, hoje }: CheckinCycleInput): CheckinCycle | null {
  // Normaliza/valida o início: a coluna é `date`, mas pode vir como timestamp
  // ('YYYY-MM-DDT…') ou sujo. Pegamos só os 10 primeiros chars e exigimos
  // YYYY-MM-DD válido — qualquer coisa fora disso vira NaN no cálculo e poderia
  // travar a thread, então abortamos cedo (badge some).
  const inicioYmd = (inicio || '').slice(0, 10);
  if (!isValidYmd(inicioYmd)) return null;
  inicio = inicioYmd;

  const today = isValidYmd((hoje || '').slice(0, 10)) ? hoje!.slice(0, 10) : getBrtISODate();
  const quinzenal = isQuinzenal(plano);

  // Janela ampla o suficiente pra achar o ciclo atual e o próximo.
  const from = addDays(today, -45);
  const to = addDays(today, 60);
  const dueDates = buildDueDates(inicio, from, to, quinzenal);
  if (dueDates.length === 0) return null;

  const opensAt = (d: string) => addDays(d, -WINDOW_OPEN_DAYS);

  // Janelas já abertas até hoje. A "em jogo" é a mais recente — é isso que faz o
  // ciclo rolar sozinho: quando a janela do próximo abre, ele vira o ciclo ativo.
  const opened = dueDates.filter((d) => diffDays(today, opensAt(d)) >= 0);

  let due: string;
  let state: CheckinState;
  if (opened.length === 0) {
    // Antes da primeira janela abrir: contagem regressiva (locked).
    due = dueDates[0];
    state = 'locked';
  } else {
    due = opened[opened.length - 1];
    // No dia do vencimento e por +OVERDUE_GRACE_DAYS ainda é "aberto".
    state = diffDays(today, due) <= OVERDUE_GRACE_DAYS ? 'open' : 'overdue';
  }

  const nextDate = dueDates.find((d) => diffDays(d, due) > 0) ?? null;

  return {
    state,
    dueDate: due,
    opensAt: opensAt(due),
    nextDate,
    daysUntil: diffDays(due, today),
    daysOverdue: diffDays(today, due),
    isQuinzenal: quinzenal,
  };
}

/** Item mínimo de check-in necessário para detectar ciclo cumprido. */
export interface CheckinLike {
  data_checkin?: string | null;
  data_preenchimento?: string | null;
}

/** Data (YYYY-MM-DD, BRT) em que o check-in foi efetivamente enviado. */
function checkinBrtDate(c: CheckinLike): string | null {
  if (c.data_preenchimento) return getBrtISODate(c.data_preenchimento);
  if (c.data_checkin) return c.data_checkin.slice(0, 10);
  return null;
}

export interface CheckinStatusInput extends CheckinCycleInput {
  checkins?: CheckinLike[];
}

/**
 * Estado final do card, cruzando o ciclo com os check-ins já enviados. Se o ciclo
 * ativo (open/overdue) já tem um check-in dentro da janela, vira `done` e aponta o
 * próximo. Locked (ainda fora da janela) permanece como contagem regressiva.
 */
export function getCheckinStatus({ inicio, plano, hoje, checkins }: CheckinStatusInput): CheckinCycle | null {
  const cycle = getCheckinCycle({ inicio, plano, hoje });
  if (!cycle) return null;
  if (cycle.state === 'locked') return cycle;

  // Cumprido = algum check-in enviado a partir da abertura da janela do ciclo atual.
  const fulfilled = (checkins || []).some((c) => {
    const d = checkinBrtDate(c);
    return d != null && diffDays(d, cycle.opensAt) >= 0;
  });

  if (!fulfilled) return cycle;

  // done: próximo check-in = a data seguinte à atual. `hoje` é saneado igual ao
  // getCheckinCycle (pode chegar como timestamp) pra não gerar NaN no daysUntil.
  const today = isValidYmd((hoje || '').slice(0, 10)) ? hoje!.slice(0, 10) : getBrtISODate();
  const nextDate = cycle.nextDate;
  return {
    ...cycle,
    state: 'done',
    daysUntil: nextDate ? diffDays(nextDate, today) : cycle.daysUntil,
  };
}

/** dd/MM a partir de YYYY-MM-DD (sem reintroduzir fuso do navegador). */
export function formatDdMm(ymd: string): string {
  const [, m, d] = ymd.split('-');
  return `${d}/${m}`;
}

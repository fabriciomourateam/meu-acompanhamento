// Helpers de técnicas avançadas (drop set, cluster, etc.) — Pilar 2.
import type { ExerciseTechnique } from './types';

// Resolve applies_to → lista de números de série (1-indexed).
export function resolveAppliesTo(appliesTo: string, totalSets: number): number[] {
  if (appliesTo === 'all') return Array.from({ length: totalSets }, (_, i) => i + 1);
  if (appliesTo === 'last') return totalSets > 0 ? [totalSets] : [];
  return appliesTo
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= totalSets);
}

// Texto humanizado do applies_to pro badge.
export function humanizeAppliesTo(appliesTo: string, totalSets: number): string {
  if (appliesTo === 'all') return 'todas as séries';
  if (appliesTo === 'last') return 'última série';
  const nums = resolveAppliesTo(appliesTo, totalSets);
  if (nums.length === 0) return appliesTo;
  if (nums.length === 1) return `série ${nums[0]}`;
  return `séries ${nums.join(', ')}`;
}

// Técnicas que aplicam a uma série específica (1-indexed).
export function techniquesForSet(
  techniques: ExerciseTechnique[] | undefined,
  setIndex1: number,
  totalSets: number,
): ExerciseTechnique[] {
  if (!techniques?.length) return [];
  return techniques.filter((t) => resolveAppliesTo(t.applies_to, totalSets).includes(setIndex1));
}

// Mapeia a cor do back-end pra classes Tailwind (badge + banner).
interface TechColors {
  badge: string;
  banner: string;
}
const COLOR_MAP: Record<string, TechColors> = {
  rose: { badge: 'bg-rose-100 text-rose-700 border-rose-200', banner: 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-200' },
  amber: { badge: 'bg-amber-100 text-amber-700 border-amber-200', banner: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', banner: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200' },
  sky: { badge: 'bg-sky-100 text-sky-700 border-sky-200', banner: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-200' },
  violet: { badge: 'bg-violet-100 text-violet-700 border-violet-200', banner: 'border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-800/60 dark:bg-violet-950/30 dark:text-violet-200' },
  indigo: { badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', banner: 'border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-800/60 dark:bg-indigo-950/30 dark:text-indigo-200' },
  slate: { badge: 'bg-slate-100 text-slate-700 border-slate-200', banner: 'border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300' },
};

export function techniqueColors(color: string | null): TechColors {
  return COLOR_MAP[color ?? 'slate'] ?? COLOR_MAP.slate;
}

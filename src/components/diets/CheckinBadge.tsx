import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CalendarClock, CalendarCheck, AlarmClock, CheckCircle2, ArrowRight, Camera } from 'lucide-react';
import {
  getCheckinStatus,
  formatDdMm,
  type CheckinLike,
  type CheckinState,
} from '@/lib/checkin-schedule';

interface CheckinBadgeProps {
  inicio?: string | null;
  plano?: string | null;
  checkins?: CheckinLike[];
  /** Abre o formulário de check-in embutido. */
  onFill: () => void;
  /** 'full' = card grande (aba Evolução); 'mini' = linha única (atalho na Home). */
  variant?: 'full' | 'mini';
}

interface StateStyle {
  gradient: string;
  glow: string;
  icon: React.ReactNode;
}

const STATE_STYLE: Record<CheckinState, StateStyle> = {
  locked: {
    gradient: 'from-slate-600 to-slate-800',
    glow: 'bg-slate-300/20',
    icon: <CalendarClock className="w-6 h-6 text-white" />,
  },
  open: {
    gradient: 'from-[#00C98A] to-[#00A875]',
    glow: 'bg-emerald-200/30',
    icon: <CalendarCheck className="w-6 h-6 text-white" />,
  },
  overdue: {
    gradient: 'from-amber-500 to-orange-600',
    glow: 'bg-amber-200/40',
    icon: <AlarmClock className="w-6 h-6 text-white" />,
  },
  done: {
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'bg-emerald-200/30',
    icon: <CheckCircle2 className="w-6 h-6 text-white" />,
  },
};

export function CheckinBadge({ inicio, plano, checkins, onFill, variant = 'full' }: CheckinBadgeProps) {
  const cycle = useMemo(
    () => getCheckinStatus({ inicio: inicio || '', plano, checkins }),
    [inicio, plano, checkins],
  );

  // Confete único quando o ciclo aparece já cumprido.
  const firedConfetti = useRef(false);
  useEffect(() => {
    if (variant !== 'full') return;
    if (cycle?.state === 'done' && !firedConfetti.current) {
      firedConfetti.current = true;
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.3 },
          colors: ['#10b981', '#34d399', '#a7f3d0', '#ffffff'],
          disableForReducedMotion: true,
        });
      } catch {
        // ambiente sem canvas (SSR/teste) — ignora
      }
    }
  }, [cycle?.state, variant]);

  if (!cycle) return null;

  const { state, dueDate, nextDate, daysUntil, daysOverdue } = cycle;
  const style = STATE_STYLE[state];
  const isNewStudent = state === 'locked' && (checkins?.length ?? 0) === 0;

  // Rótulo do número + valor exibido por estado.
  let numberLabel: string;
  let bigValue: string;
  let unit = 'dias';
  if (state === 'overdue') {
    numberLabel = 'ATRASO';
    bigValue = String(daysOverdue);
    unit = daysOverdue === 1 ? 'dia' : 'dias';
  } else if (state === 'done') {
    numberLabel = 'PRÓXIMO';
    bigValue = nextDate ? String(Math.max(0, daysUntil)) : '✓';
    unit = nextDate ? (daysUntil === 1 ? 'dia' : 'dias') : '';
  } else if (state === 'open' && daysUntil <= 0) {
    numberLabel = 'CHECK-IN';
    bigValue = 'HOJE';
    unit = '';
  } else {
    numberLabel = 'FALTAM';
    bigValue = String(Math.max(0, daysUntil));
    unit = Math.max(0, daysUntil) === 1 ? 'dia' : 'dias';
  }

  // Status (esquerda) + subtítulo + caption (centralizada).
  const status =
    state === 'locked' ? 'A caminho'
      : state === 'open' ? 'Aberto'
        : state === 'overdue' ? 'Pendente'
          : 'Em dia';

  const subtitle =
    state === 'locked' ? (isNewStudent ? null : `Próximo: ${formatDdMm(dueDate)}`)
      : state === 'open' ? `Check-in em ${formatDdMm(dueDate)}`
        : state === 'overdue' ? `Venceu em ${formatDdMm(dueDate)}`
          : nextDate ? `Próximo: ${formatDdMm(nextDate)}` : 'Tudo certo por aqui';

  const caption =
    state === 'locked'
      ? (isNewStudent
        ? `Seu primeiro check-in será em ${formatDdMm(dueDate)}`
        : 'Tire fotos e medidas com antecedência')
      : state === 'open'
        ? (daysUntil <= 0 ? 'É hoje! Bora preencher 📸' : 'Dá pra enviar antecipado · leva ~5 min')
        : state === 'overdue'
          ? 'Bora preencher, leva ~5 min'
          : nextDate
            ? `Próximo check-in em ${formatDdMm(nextDate)} — Bora pra cima! 💪🏼`
            : 'Check-in em dia — Bora pra cima! 💪🏼';

  const showButton = state === 'open' || state === 'overdue';

  // === Variante mini (atalho na Home / Dieta) ===
  if (variant === 'mini') {
    if (!showButton) return null;
    return (
      <motion.button
        type="button"
        onClick={onFill}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className={`w-full flex items-center gap-3 rounded-2xl bg-gradient-to-r ${style.gradient} px-4 py-3 shadow-lg text-left`}
      >
        <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
          {style.icon}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-white leading-tight">
            {state === 'overdue' ? 'Check-in pendente' : `Check-in em ${formatDdMm(dueDate)}`}
          </span>
          <span className="block text-xs text-white/80 leading-tight">
            {state === 'overdue'
              ? `Venceu em ${formatDdMm(dueDate)} · ${daysOverdue} ${unit}`
              : daysUntil <= 0 ? 'É hoje!' : `faltam ${daysUntil} ${daysUntil === 1 ? 'dia' : 'dias'}`}
          </span>
        </span>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
          Preencher <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </motion.button>
    );
  }

  // === Variante full (card grande) ===
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className={`relative overflow-hidden rounded-3xl border-t border-white/15 bg-gradient-to-br ${style.gradient} p-5 sm:p-6 shadow-xl shadow-black/10 ring-1 ring-black/5`}
    >
      {/* Shimmer no estado aberto — varre o card convidando pra ação */}
      {state === 'open' && (
        <motion.div
          aria-hidden
          initial={{ x: '-120%' }}
          animate={{ x: '120%' }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.6, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-y-0 -inset-x-1/4 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />
      )}

      {/* Glow radial atrás do número */}
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute -top-10 right-2 w-40 h-40 rounded-full blur-3xl ${style.glow}`}
        animate={state === 'overdue' ? { opacity: [0.5, 1, 0.5], scale: [1, 1.12, 1] } : undefined}
        transition={state === 'overdue' ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Esquerda: chip de ícone + status */}
        <div className="flex items-start gap-3">
          <span className="shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
            {style.icon}
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Seu check-in</p>
            <p className="text-2xl sm:text-3xl font-black text-white leading-tight">{status}</p>
            {subtitle && <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Direita: número grandão */}
        <div className="text-right shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{numberLabel}</p>
          <p className="text-5xl font-black leading-none tabular-nums bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent drop-shadow">
            {bigValue}
          </p>
          {unit && <p className="text-xs text-white/70 mt-0.5">{unit}</p>}
        </div>
      </div>

      {/* Caption única centralizada */}
      <p className="relative mt-4 text-center text-sm font-medium text-white/90">{caption}</p>

      {/* Botão (apenas open/overdue) */}
      {showButton && (
        <motion.button
          type="button"
          onClick={onFill}
          whileTap={{ scale: 0.97 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-white/95 hover:bg-white text-slate-900 font-bold py-3 shadow-lg transition-colors"
        >
          <Camera className="w-4 h-4" />
          Preencher meu check-in
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Target } from 'lucide-react';
import {
  weeklyChallengeService, type ActiveChallengeStatus,
} from '@/lib/weekly-challenge-service';

interface Props {
  token: string;
}

/**
 * Card do Desafio da Semana. Aparece se o trainer tiver definido um pra esta
 * semana. Roda a RPC que auto-conclui se o aluno bateu a meta.
 */
export function WeeklyChallengeCard({ token }: Props) {
  const [data, setData] = useState<ActiveChallengeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    weeklyChallengeService.getCurrentByToken(token)
      .then((d) => { if (!cancelled) setData(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading || !data) return null;

  const pct = data.threshold > 0
    ? Math.min(100, (data.progress / data.threshold) * 100)
    : 0;
  const remaining = Math.max(0, data.threshold - data.progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 sm:p-5 text-white shadow-lg bg-gradient-to-br ${data.color} relative overflow-hidden`}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-3.5 w-3.5 text-white/80" />
          <span className="text-xs uppercase tracking-wider font-semibold text-white/80">
            Desafio da Semana
          </span>
          {data.completed && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
              <Check className="h-3 w-3" /> Concluído
            </span>
          )}
        </div>

        <div className="flex items-start gap-3">
          <span className="text-4xl select-none drop-shadow-lg">{data.emoji || '🎯'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-lg sm:text-xl font-bold leading-tight">{data.title}</p>
            {data.description && (
              <p className="text-xs text-white/85 mt-0.5">{data.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-white/70">Bônus</p>
            <p className="text-xl font-black leading-none">+{data.points}</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-white/80 mb-1">
            <span>
              {data.completed ? 'Meta batida! 🎉' : `${data.progress} / ${data.threshold}`}
            </span>
            <span className="font-bold">{Math.round(pct)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]"
            />
          </div>
          {!data.completed && remaining > 0 && (
            <p className="text-[10px] text-white/70 mt-1">
              Falta{remaining === 1 ? '' : 'm'} {remaining} pra concluir.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

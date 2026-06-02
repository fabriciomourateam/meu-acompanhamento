import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Timer, X, Check } from 'lucide-react';

interface RestTimerProps {
  /** Descanso mínimo (prescrito). Quando há faixa, é o ponto "já pode voltar". */
  minSeconds: number;
  /** Descanso máximo da faixa (opcional). Quando > min, o timer conta até ele. */
  maxSeconds?: number | null;
  onDone: () => void;
}

export function RestTimer({ minSeconds, maxSeconds, onDone }: RestTimerProps) {
  const hasRange = maxSeconds != null && maxSeconds > minSeconds;
  // Conta até o máximo quando há faixa (60–90s → conta 90); senão, até o mínimo.
  const totalSec = hasRange ? (maxSeconds as number) : minSeconds;

  // Deadline absoluto fixado no mount: imune a re-renders do pai (o cronômetro da
  // sessão re-renderiza a cada 1s, o que antes reiniciava o setTimeout e travava).
  const [endAt] = useState(() => Date.now() + totalSec * 1000);
  const [now, setNow] = useState(() => Date.now());
  const onDoneRef = useRef(onDone);
  const firedRef = useRef(false);
  const readyBuzzedRef = useRef(false);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const totalMs = Math.max(1, totalSec * 1000);
  const leftMs = Math.max(0, endAt - now);
  const left = Math.ceil(leftMs / 1000);
  const elapsedSec = totalSec - left;
  const ready = hasRange && elapsedSec >= minSeconds; // mínimo já atingido

  // Vibra ao atingir o mínimo (pode voltar) e ao terminar (tempo máximo).
  useEffect(() => {
    if (hasRange && ready && !readyBuzzedRef.current) {
      readyBuzzedRef.current = true;
      try { navigator.vibrate?.(80); } catch { /* ignore */ }
    }
  }, [hasRange, ready]);

  useEffect(() => {
    if (leftMs <= 0 && !firedRef.current) {
      firedRef.current = true;
      try { navigator.vibrate?.([120, 60, 120]); } catch { /* ignore */ }
      onDoneRef.current();
    }
  }, [leftMs]);

  const mm = Math.floor(left / 60).toString().padStart(2, '0');
  const ss = (left % 60).toString().padStart(2, '0');
  // Barra que se auto-completa: enche de 0 → 100% conforme o descanso passa.
  const elapsedPct = Math.max(0, Math.min(100, ((totalMs - leftMs) / totalMs) * 100));
  // Posição do marcador do mínimo na barra (ex.: 60s numa faixa de 90s = 66%).
  const minMarkPct = hasRange ? Math.min(100, (minSeconds / totalSec) * 100) : 0;

  const bg = ready ? 'bg-teal-600' : 'bg-emerald-600';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[10000] w-[min(92vw,340px)]"
      >
        <div className={`rounded-2xl text-white shadow-2xl px-4 py-3 transition-colors ${bg}`}>
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
              {ready ? 'Já pode voltar' : 'Descanso'}
            </span>
            {hasRange && (
              <span className="text-[10px] text-white/70">({minSeconds}–{maxSeconds}s)</span>
            )}
            <span className="ml-auto text-2xl font-bold tabular-nums leading-none">{mm}:{ss}</span>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/15 h-9 w-9 p-0 shrink-0"
              onClick={() => onDoneRef.current()}
              aria-label="Pular descanso"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Barra grossa que enche até o fim do descanso; marcador no mínimo */}
          <div className="relative mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-200 ease-linear"
              style={{ width: `${elapsedPct}%` }}
            />
            {hasRange && (
              <div
                className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 bg-white/90"
                style={{ left: `${minMarkPct}%` }}
                title={`Mínimo: ${minSeconds}s`}
              />
            )}
          </div>
          {ready && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-white/90">
              <Check className="h-3 w-3" /> Mínimo atingido — pode ir. Restam até {left}s da margem.
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Timer, X } from 'lucide-react';

interface RestTimerProps {
  seconds: number;
  onDone: () => void;
}

export function RestTimer({ seconds, onDone }: RestTimerProps) {
  // Deadline absoluto fixado no mount: imune a re-renders do pai (o cronômetro da
  // sessão re-renderiza a cada 1s, o que antes reiniciava o setTimeout e travava
  // a contagem). Tica por conta própria comparando com Date.now().
  const [endAt] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());
  const onDoneRef = useRef(onDone);
  const firedRef = useRef(false);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const totalMs = Math.max(1, seconds * 1000);
  const leftMs = Math.max(0, endAt - now);
  const left = Math.ceil(leftMs / 1000);

  useEffect(() => {
    if (leftMs <= 0 && !firedRef.current) {
      firedRef.current = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate?.([120, 60, 120]); } catch { /* ignore */ }
      }
      onDoneRef.current();
    }
  }, [leftMs]);

  const mm = Math.floor(left / 60).toString().padStart(2, '0');
  const ss = (left % 60).toString().padStart(2, '0');
  // Barra que se auto-completa: enche de 0 → 100% conforme o descanso passa.
  const elapsedPct = Math.max(0, Math.min(100, ((totalMs - leftMs) / totalMs) * 100));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[10000] w-[min(92vw,340px)]"
      >
        <div className="rounded-2xl bg-emerald-600 text-white shadow-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white/80">Descanso</span>
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
          {/* Barra grossa que enche até o fim do descanso */}
          <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-200 ease-linear"
              style={{ width: `${elapsedPct}%` }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

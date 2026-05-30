import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Timer, X } from 'lucide-react';

interface RestTimerProps {
  seconds: number;
  onDone: () => void;
}

export function RestTimer({ seconds, onDone }: RestTimerProps) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (left <= 0) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate?.([120, 60, 120]); } catch { /* ignore */ }
      }
      onDone();
      return;
    }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onDone]);

  const mm = Math.floor(left / 60).toString().padStart(2, '0');
  const ss = (left % 60).toString().padStart(2, '0');
  const pct = Math.max(0, Math.min(100, (left / seconds) * 100));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[10000]"
      >
        <div className="bg-emerald-600 text-white rounded-full shadow-2xl pl-4 pr-2 py-2 flex items-center gap-3 min-w-[200px]">
          <Timer className="w-5 h-5" />
          <div className="flex-1">
            <div className="text-lg font-bold tabular-nums leading-none">{mm}:{ss}</div>
            <div className="mt-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <div className="h-full bg-white transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/15 h-9 w-9 p-0"
            onClick={onDone}
            aria-label="Pular descanso"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

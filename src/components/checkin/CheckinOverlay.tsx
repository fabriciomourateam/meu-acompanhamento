import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface CheckinOverlayProps {
  open: boolean;
  /** Telefone do paciente — pré-seleciona o aluno no formulário embutido. */
  phone?: string | null;
  onClose: () => void;
  /** Disparado quando o formulário avisa que o check-in foi enviado. */
  onDone: () => void;
}

// Domínio do back-office (onde vive a rota /checkin) e slug do dono. Configuráveis
// por env; defaults apontam pra produção do MyShape.
const CHECKIN_BASE_URL =
  (import.meta.env.VITE_CHECKIN_BASE_URL as string | undefined) || 'https://dashboard-fmteam.vercel.app';
const CHECKIN_SLUG = (import.meta.env.VITE_CHECKIN_SLUG as string | undefined) || 'fmteam';

export function CheckinOverlay({ open, phone, onClose, onDone }: CheckinOverlayProps) {
  const [loading, setLoading] = useState(true);

  // Ouve o aviso de conclusão vindo do iframe (window.parent.postMessage no PublicCheckin).
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const handler = (e: MessageEvent) => {
      const data = e.data;
      const isDone = data === 'checkin-done' || (data && typeof data === 'object' && data.type === 'checkin-done');
      if (isDone) onDone();
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [open, onDone]);

  const src = `${CHECKIN_BASE_URL}/checkin/${CHECKIN_SLUG}?phone=${encodeURIComponent(phone || '')}&embed=1`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-slate-950 flex flex-col"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Cabeçalho com fechar */}
          <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-slate-900 text-white border-b border-white/10">
            <span className="text-sm font-semibold">Meu check-in</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar check-in"
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Loader enquanto o iframe carrega */}
          {loading && (
            <div className="absolute inset-0 top-14 flex items-center justify-center bg-slate-950 pointer-events-none">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          )}

          <iframe
            title="Check-in"
            src={src}
            onLoad={() => setLoading(false)}
            allow="camera; fullscreen"
            className="flex-1 w-full border-0 bg-white"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

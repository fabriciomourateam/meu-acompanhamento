import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ExternalLink } from 'lucide-react';

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
  (import.meta.env.VITE_CHECKIN_BASE_URL as string | undefined) || 'https://my-shape.app';
const CHECKIN_SLUG = (import.meta.env.VITE_CHECKIN_SLUG as string | undefined) || 'fmteam';

// Origem esperada das mensagens do iframe (pra não aceitar 'checkin-done' de qualquer site).
let CHECKIN_ORIGIN = '';
try { CHECKIN_ORIGIN = new URL(CHECKIN_BASE_URL).origin; } catch { /* base inválida */ }

export function CheckinOverlay({ open, phone, onClose, onDone }: CheckinOverlayProps) {
  const [loading, setLoading] = useState(true);
  const [stuck, setStuck] = useState(false);

  // Ouve o aviso de conclusão vindo do iframe (window.parent.postMessage no PublicCheckin).
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setStuck(false);
    const handler = (e: MessageEvent) => {
      // Só aceita mensagem da origem do check-in (evita spoof de 'checkin-done').
      if (CHECKIN_ORIGIN && e.origin !== CHECKIN_ORIGIN) return;
      const data = e.data;
      const isDone = data === 'checkin-done' || (data && typeof data === 'object' && data.type === 'checkin-done');
      if (isDone) onDone();
    };
    window.addEventListener('message', handler);
    // Se o iframe não carregar em 12s (offline, bloqueio de embed, etc.), oferece fallback.
    const t = window.setTimeout(() => setStuck(true), 12_000);
    return () => {
      window.removeEventListener('message', handler);
      window.clearTimeout(t);
    };
  }, [open, onDone]);

  const src = `${CHECKIN_BASE_URL}/checkin/${CHECKIN_SLUG}?phone=${encodeURIComponent(phone || '')}&embed=1`;

  // Renderizado via portal no <body>: escapa os stacking contexts criados pelos
  // motion.div/transform ancestrais, garantindo que o overlay (z-[10000]) fique
  // ACIMA da barra de navegação inferior em vez de atrás dela.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col"
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

          {/* Loader / fallback enquanto o iframe carrega */}
          {loading && (
            <div className="absolute inset-x-0 top-14 bottom-0 flex flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
              {!stuck ? (
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              ) : (
                <>
                  <p className="text-sm text-slate-300">Demorou pra carregar aqui dentro.</p>
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-4 py-2.5 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir o check-in em nova aba
                  </a>
                </>
              )}
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
    </AnimatePresence>,
    document.body,
  );
}

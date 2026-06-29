import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

// Vídeo de tutorial (Vimeo, formato vertical/celular).
const VIMEO_ID = '1203619002';

type TutorialModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando true, mostra a saudação de boas-vindas (primeiro acesso). */
  welcome?: boolean;
};

/**
 * Modal com o tutorial de uso do app (vídeo vertical do Vimeo).
 * - Abre automaticamente no primeiro acesso (boas-vindas).
 * - Reabrível a qualquer momento pelo item "Tutorial" no menu (⋮).
 * Tematizado nos DOIS temas (claro = base; escuro = variantes dark:).
 */
export function TutorialModal({ open, onOpenChange, welcome = false }: TutorialModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 p-0 overflow-hidden max-w-[340px] w-[calc(100vw-2rem)] max-h-[88vh] overflow-y-auto rounded-2xl gap-0 [&>button]:text-slate-600 [&>button]:dark:text-slate-300 [&>button]:hover:text-slate-900 [&>button]:dark:hover:text-white">
        <div className="px-4 pt-5 pb-2 pr-12">
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {welcome ? '👋 Boas-vindas! Como usar o app' : '🎬 Tutorial — como usar o app'}
          </DialogTitle>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {welcome
              ? 'Dá um play nesse tutorial rápido. Você pode rever quando quiser no menu (⋮) → Tutorial.'
              : 'Vídeo rápido com o passo a passo do aplicativo.'}
          </p>
        </div>

        {/* Player vertical (formato celular) — limitado a 52vh pra não tomar a tela toda */}
        <div className="relative w-full bg-black" style={{ aspectRatio: '9 / 16', maxHeight: '52vh' }}>
          <iframe
            src={`https://player.vimeo.com/video/${VIMEO_ID}?title=0&byline=0&portrait=0&dnt=1`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
            allowFullScreen
            title="Tutorial do aplicativo"
          />
        </div>

        <div className="p-3 pt-2.5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold py-3 text-sm transition-colors shadow-sm"
          >
            {welcome ? 'Entendi, vamos começar! 💪' : 'Fechar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

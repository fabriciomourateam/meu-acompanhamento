import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Trophy, Users, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FinishSessionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doneSets: number;
  totalVolumeKg: number;
  prs?: Array<{ name: string; weight: number; prev: number }>;
  sessionName?: string;
  canShare?: boolean;
  onConfirm: (rating: number | null, notes: string, share: boolean, shareText: string) => Promise<void>;
}

function buildShareText(sessionName: string | undefined, doneSets: number, totalVolumeKg: number, prs: Array<{ name: string; weight: number; prev: number }>): string {
  const lines: string[] = [];
  lines.push(sessionName ? `Finalizei o treino de ${sessionName}! 💪` : 'Finalizei mais um treino! 💪');
  lines.push(`${doneSets} série${doneSets === 1 ? '' : 's'} · ${totalVolumeKg.toFixed(0)} kg de volume total`);
  if (prs.length > 0) {
    lines.push('');
    lines.push('🏆 Bati novos recordes:');
    prs.forEach((p) => lines.push(`• ${p.name}: ${p.prev}kg → ${p.weight}kg`));
  }
  return lines.join('\n');
}

export function FinishSessionDialog({ open, onOpenChange, doneSets, totalVolumeKg, prs = [], sessionName, canShare = false, onConfirm }: FinishSessionDialogProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState(false);
  const [shareText, setShareText] = useState('');
  const [shareTouched, setShareTouched] = useState(false);

  // Texto-padrão do post (recalculado enquanto o usuário não editar manualmente).
  const defaultShareText = buildShareText(sessionName, doneSets, totalVolumeKg, prs);
  const effectiveShareText = shareTouched ? shareText : defaultShareText;

  // Compartilhamento nativo (WhatsApp, Instagram, etc.) ou cópia como fallback.
  // Disparado direto no clique pra preservar o "user gesture" exigido pelo navegador.
  const handleShareSocial = async () => {
    const text = effectiveShareText.trim();
    const nav = navigator as Navigator & { share?: (d: { title?: string; text?: string }) => Promise<void> };
    try {
      if (nav.share) {
        await nav.share({ title: 'Meu treino', text });
        return;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // usuário cancelou o share sheet
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Texto copiado 📋', description: 'Cole onde quiser compartilhar.' });
    } catch {
      toast({ title: 'Não foi possível compartilhar', variant: 'destructive' });
    }
  };

  const handle = async () => {
    setBusy(true);
    try {
      await onConfirm(rating, notes, share, effectiveShareText.trim());
      onOpenChange(false);
      setRating(null);
      setNotes('');
      setShare(false);
      setShareText('');
      setShareTouched(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle>Finalizar treino?</DialogTitle>
          <DialogDescription>
            {doneSets} série{doneSets === 1 ? '' : 's'} · {totalVolumeKg.toFixed(0)} kg de volume total
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {prs.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 dark:from-amber-950/40 to-yellow-50 dark:to-yellow-950/40 p-3">
              <p className="flex items-center gap-1.5 text-sm font-bold text-amber-800 dark:text-amber-300">
                <Trophy className="h-4 w-4 text-amber-500" /> Você superou a última vez! 🎉
              </p>
              <ul className="mt-1.5 space-y-1">
                {prs.map((p) => (
                  <li key={p.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-slate-700 dark:text-slate-200">{p.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                      {p.prev}kg → {p.weight}kg
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Como foi o treino?</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1.5 rounded-md hover:bg-slate-100"
                  aria-label={`Nota ${n}`}
                >
                  <Star className={`w-7 h-7 ${rating != null && n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Observações</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Como você se sentiu? Algo a registrar?"
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {canShare && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={share}
                  onChange={(e) => setShare(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500"
                />
                <Users className="h-4 w-4 text-violet-500" />
                Compartilhar na comunidade
              </label>
              {share && (
                <textarea
                  value={effectiveShareText}
                  onChange={(e) => { setShareTouched(true); setShareText(e.target.value); }}
                  rows={4}
                  className="mt-2 w-full rounded-md border border-slate-200 dark:border-slate-700 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleShareSocial}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 transition hover:bg-slate-50"
          >
            <Share2 className="h-3.5 w-3.5 text-violet-500" /> Compartilhar nas redes sociais
          </button>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900">Cancelar</Button>
          <Button onClick={handle} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {busy ? 'Salvando…' : 'Finalizar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

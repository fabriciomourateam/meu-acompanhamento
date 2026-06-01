import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Trophy } from 'lucide-react';

interface FinishSessionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doneSets: number;
  totalVolumeKg: number;
  prs?: Array<{ name: string; weight: number; prev: number }>;
  onConfirm: (rating: number | null, notes: string) => Promise<void>;
}

export function FinishSessionDialog({ open, onOpenChange, doneSets, totalVolumeKg, prs = [], onConfirm }: FinishSessionDialogProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    try {
      await onConfirm(rating, notes);
      onOpenChange(false);
      setRating(null);
      setNotes('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle>Finalizar treino?</DialogTitle>
          <DialogDescription>
            {doneSets} série{doneSets === 1 ? '' : 's'} · {totalVolumeKg.toFixed(0)} kg de volume total
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {prs.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-3">
              <p className="flex items-center gap-1.5 text-sm font-bold text-amber-800">
                <Trophy className="h-4 w-4 text-amber-500" /> Você superou a última vez! 🎉
              </p>
              <ul className="mt-1.5 space-y-1">
                {prs.map((p) => (
                  <li key={p.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-slate-700">{p.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-amber-700">
                      {p.prev}kg → {p.weight}kg
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Como foi o treino?</p>
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
            <p className="text-sm font-medium text-slate-700 mb-2">Observações</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Como você se sentiu? Algo a registrar?"
              className="w-full rounded-md border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy} className="text-slate-600 hover:bg-slate-100 hover:text-slate-900">Cancelar</Button>
          <Button onClick={handle} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {busy ? 'Salvando…' : 'Finalizar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

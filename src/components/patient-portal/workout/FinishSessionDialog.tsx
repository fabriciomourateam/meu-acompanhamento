import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface FinishSessionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doneSets: number;
  totalVolumeKg: number;
  onConfirm: (rating: number | null, notes: string) => Promise<void>;
}

export function FinishSessionDialog({ open, onOpenChange, doneSets, totalVolumeKg, onConfirm }: FinishSessionDialogProps) {
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
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={handle} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {busy ? 'Salvando…' : 'Finalizar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ITEM 10 — Substituir exercício no dia (só nessa execução, não altera o plano).
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Dumbbell, Loader2, Shuffle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { workoutExtrasService, type ExerciseVariation } from '@/lib/workout/workout-extras-service';

interface Props {
  token: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  originalExerciseId: string;
  originalExerciseName: string;
  onSubstituted: (variation: { id: string; name: string }) => void;
}

export function SubstituteExerciseDialog({
  token, open, onOpenChange, originalExerciseId, originalExerciseName, onSubstituted,
}: Props) {
  const { toast } = useToast();
  const [variations, setVariations] = useState<ExerciseVariation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void workoutExtrasService.suggestVariations(token, originalExerciseId, 10)
      .then(setVariations)
      .catch((err) => console.error('Erro ao buscar variações:', err))
      .finally(() => setLoading(false));
  }, [open, originalExerciseId, token]);

  const handleSelect = (v: ExerciseVariation) => {
    onSubstituted({ id: v.id, name: v.name });
    onOpenChange(false);
    toast({
      title: '✓ Substituído por hoje',
      description: 'Sempre que possível priorize o exercício principal pra ter maior controle da progressão de cargas. Original volta no próximo treino.',
      duration: 6000,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-amber-600" />
            Substituir por hoje
          </DialogTitle>
          <DialogDescription>
            Trocar <strong>{originalExerciseName}</strong> por uma variação do mesmo grupo muscular.
            <span className="mt-1 block text-xs italic">Próximo treino você vê o original de novo.</span>
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-6 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Buscando variações...
          </div>
        )}

        {!loading && variations.length === 0 && (
          <p className="py-4 text-center text-sm italic text-slate-500">
            Sem variações disponíveis pra esse exercício.
          </p>
        )}

        <div className="grid max-h-[400px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {variations.map((v) => (
            <button
              key={v.id}
              onClick={() => handleSelect(v)}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2 text-left transition hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-sm"
            >
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt="" className="h-12 w-12 rounded object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100 text-slate-400">
                  <Dumbbell className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-800">{v.name}</div>
                <div className="truncate text-[10px] uppercase tracking-wider text-amber-700">{v.muscle_group}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ITEM 7 — Banner da fase atual + transição de fase (com modal de confirmação).
import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { workoutExtrasService, type Periodization } from '@/lib/workout/workout-extras-service';
import { cn } from '@/lib/utils';

const PHASE_COLORS: Record<string, string> = {
  base: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  forca: 'border-rose-300 bg-rose-50 text-rose-900',
  força: 'border-rose-300 bg-rose-50 text-rose-900',
  regenerativo: 'border-sky-300 bg-sky-50 text-sky-900',
  deload: 'border-amber-300 bg-amber-50 text-amber-900',
  custom: 'border-slate-300 bg-slate-50 text-slate-900',
};

interface Props {
  token: string;
  planId: string;
  planCreatedAt: string;
  onPhaseChanged: () => void;
}

export function PhaseAdvanceBanner({ token, planId, planCreatedAt, onPhaseChanged }: Props) {
  const [periodization, setPeriodization] = useState<Periodization | null>(null);
  const [sessionsInPhase, setSessionsInPhase] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [adherence, setAdherence] = useState(0);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const p = await workoutExtrasService.getPlanPeriodization(token, planId);
      if (!p) { setPeriodization(null); return; }
      setPeriodization(p);

      const since = p.phase_started_at ?? planCreatedAt;
      const [count, adh] = await Promise.all([
        workoutExtrasService.countSessionsInPhase(token, planId, since),
        workoutExtrasService.getWeeklyAdherence(token, planId, 2),
      ]);
      setSessionsInPhase(count);
      if (adh.length > 0) {
        const avg = adh.reduce((s, w) => s + Number(w.adherence_pct), 0) / adh.length;
        setAdherence(Math.round(avg));
      }
    } catch (err) {
      console.error('Erro ao carregar periodização:', err);
      setPeriodization(null);
    }
  }, [token, planId, planCreatedAt]);

  useEffect(() => { void reload(); }, [reload]);

  if (!periodization || periodization.phases.length === 0) return null;

  const currentPhase = periodization.phases[periodization.current_phase_index];
  const nextPhase = periodization.phases[periodization.current_phase_index + 1];
  if (!currentPhase) return null;

  const sessionsLeft = (currentPhase.duration_sessions ?? 0) - sessionsInPhase;
  const readyToAdvance = sessionsLeft <= 0 && !!nextPhase;
  const color = PHASE_COLORS[(currentPhase.preset ?? 'custom').toLowerCase()] ?? PHASE_COLORS.custom;

  const handleAdvanceClick = async () => {
    if (!nextPhase) return;
    const nextIdx = periodization.current_phase_index + 1;
    setBusy(true);
    try {
      const hasDiff = await workoutExtrasService.phaseChangeHasVisibleDiff(token, planId, nextIdx);
      if (!hasDiff) {
        await workoutExtrasService.applyPhaseChange(token, planId, nextIdx);
        await reload();
        onPhaseChanged();
        return;
      }
      setShowModal(true);
    } catch (err) {
      console.error('Erro ao avançar fase:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmAdvance = async () => {
    const nextIdx = periodization.current_phase_index + 1;
    setBusy(true);
    try {
      await workoutExtrasService.applyPhaseChange(token, planId, nextIdx);
      setShowModal(false);
      await reload();
      onPhaseChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={cn('rounded-lg border-2 p-3 text-sm', color)}>
        <div className="font-bold">💪 Fase atual: {currentPhase.label}</div>
        <div className="mt-0.5 text-xs">
          {currentPhase.sets_override ? `${currentPhase.sets_override} séries` : ''}
          {currentPhase.reps_override ? ` × ${currentPhase.reps_override} reps` : ''}
          {currentPhase.load_pct_change ? ` · cargas ${currentPhase.load_pct_change > 0 ? '+' : ''}${currentPhase.load_pct_change}%` : ''}
          {currentPhase.rpe_per_set_override ? ` · RPE alvo ${currentPhase.rpe_per_set_override}` : ''}
        </div>
        {nextPhase && !readyToAdvance && (
          <div className="mt-1 text-[11px] italic opacity-80">
            Faltam {sessionsLeft} treino{sessionsLeft !== 1 ? 's' : ''} pra próxima fase ({nextPhase.label})
          </div>
        )}
        {readyToAdvance && (
          <button
            onClick={() => void handleAdvanceClick()}
            disabled={busy}
            className="mt-2 rounded bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700 disabled:opacity-60"
          >
            🚀 Avançar pra {nextPhase.label}
          </button>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pronto pra avançar pra {nextPhase?.label}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">Você completou {sessionsInPhase} treinos da fase {currentPhase.label}.</p>
            <p className="text-sm">Adesão das últimas 2 semanas: <strong>{adherence}%</strong></p>

            {adherence < 50 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                ⚠️ Você completou menos de 50% dos treinos previstos. Recomendamos repetir a fase atual antes de avançar.
              </div>
            )}

            {nextPhase && (
              <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                <div className="mb-2 font-semibold">O que vai mudar:</div>
                <ul className="space-y-1 text-xs">
                  {nextPhase.sets_override && <li>• Séries: {currentPhase.sets_override ?? 'atual'} → <strong>{nextPhase.sets_override}</strong></li>}
                  {nextPhase.reps_override && <li>• Reps: {currentPhase.reps_override ?? 'atual'} → <strong>{nextPhase.reps_override}</strong></li>}
                  {nextPhase.load_pct_change && <li>• Cargas: <strong>{nextPhase.load_pct_change > 0 ? '+' : ''}{nextPhase.load_pct_change}%</strong></li>}
                  {nextPhase.rpe_per_set_override && <li>• RPE: <strong>{nextPhase.rpe_per_set_override}</strong></li>}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            {adherence < 50 && <Button variant="outline" onClick={() => setShowModal(false)}>Repetir fase atual</Button>}
            <Button onClick={() => void handleConfirmAdvance()} disabled={busy}>🚀 Confirmar avanço</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

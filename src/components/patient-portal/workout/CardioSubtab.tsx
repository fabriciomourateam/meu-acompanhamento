// ITEM 4 — Sub-aba Cardios: prescritos pelo trainer + registro livre + histórico.
import { useCallback, useEffect, useState } from 'react';
import { workoutExtrasService, type CardioLog, type CardioTotals } from '@/lib/workout/workout-extras-service';
import type { HubSession } from '@/lib/workout/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { HeartPulse, Plus, Trash2 } from 'lucide-react';

interface CardioSubtabProps {
  token: string;
  prescribedSessions: HubSession[];
}

export function CardioSubtab({ token, prescribedSessions }: CardioSubtabProps) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<CardioLog[]>([]);
  const [totals, setTotals] = useState<CardioTotals | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    try {
      const [l, t] = await Promise.all([
        workoutExtrasService.listCardio(token, monthStart, monthEnd),
        workoutExtrasService.getCardioTotals(token),
      ]);
      setLogs(l);
      setTotals(t);
    } catch (err) {
      console.error('Erro ao carregar cardios:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void reload(); }, [reload]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cardio?')) return;
    try {
      await workoutExtrasService.deleteCardio(token, id);
      await reload();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível excluir', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {totals && (
        <div className="grid grid-cols-4 gap-2">
          <TotalCard label="Hoje" min={totals.today_min} />
          <TotalCard label="Semana" min={totals.week_min} />
          <TotalCard label="Mês" min={totals.month_min} />
          <TotalCard label="Total" min={totals.total_min} />
        </div>
      )}

      {prescribedSessions.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Prescritos pelo trainer</h3>
          <div className="space-y-2">
            {prescribedSessions.map((s) => (
              <div key={s.id} className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-3">
                <div className="font-medium text-cyan-900">{s.name}</div>
                {s.notes && (
                  <div className="mt-1 text-xs text-cyan-800" dangerouslySetInnerHTML={{ __html: s.notes }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button onClick={() => setShowForm(true)} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" size="lg">
        <Plus className="mr-1 h-4 w-4" /> Registrar cardio feito
      </Button>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Histórico (este mês)</h3>
        {loading ? (
          <p className="py-4 text-center text-sm text-slate-400">Carregando…</p>
        ) : logs.length === 0 ? (
          <p className="py-4 text-center text-sm italic text-slate-500">
            Nenhum cardio registrado ainda este mês.
          </p>
        ) : (
          <div className="space-y-1.5">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5">
                <div className="text-sm">
                  <div className="font-medium text-slate-800">
                    <strong>{l.duration_min}min</strong>
                    {l.modality && <span className="ml-1 text-slate-600">· {l.modality}</span>}
                    {l.intensity && <span className="ml-1 text-xs uppercase tracking-wider text-slate-500">({l.intensity})</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(l.performed_at + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <button onClick={() => void handleDelete(l.id)} className="text-slate-400 hover:text-rose-600" aria-label="Excluir cardio">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CardioLogDialog
          token={token}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); void reload(); }}
        />
      )}
    </div>
  );
}

function TotalCard({ label, min }: { label: string; min: number }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-blue-600">{label}</div>
      <div className="text-lg font-bold text-blue-800">
        {min}<span className="text-xs font-normal opacity-70">min</span>
      </div>
    </div>
  );
}

function CardioLogDialog({ token, onClose, onSaved }: { token: string; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [duration, setDuration] = useState('30');
  const [modality, setModality] = useState('');
  const [intensity, setIntensity] = useState<'leve' | 'moderado' | 'forte' | 'hiit'>('moderado');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await workoutExtrasService.logCardio(token, {
        duration_min: Number(duration),
        modality: modality || undefined,
        intensity,
        notes: notes || undefined,
        performed_at: date,
      });
      onSaved();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-cyan-600" /> Registrar cardio
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Duração (min) *</Label>
            <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Modalidade</Label>
            <Input value={modality} onChange={(e) => setModality(e.target.value)} placeholder="Esteira, bike, corrida..." className="mt-1" />
          </div>
          <div>
            <Label>Intensidade</Label>
            <Select value={intensity} onValueChange={(v) => setIntensity(v as typeof intensity)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="leve">😌 Leve</SelectItem>
                <SelectItem value="moderado">🚶 Moderado</SelectItem>
                <SelectItem value="forte">💨 Forte</SelectItem>
                <SelectItem value="hiit">🔥 HIIT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => void handleSave()} disabled={saving || !duration}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

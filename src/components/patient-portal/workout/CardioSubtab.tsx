// ITEM 4 — Sub-aba Cardios: prescritos pelo trainer + registro livre + histórico.
import { useCallback, useEffect, useState } from 'react';
import { workoutExtrasService, type CardioLog, type CardioTotals, type PrescribedCardio } from '@/lib/workout/workout-extras-service';
import type { HubSession } from '@/lib/workout/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { dailyChallengesService } from '@/lib/daily-challenges-service';
import { sanitizeRichHtml } from '@/lib/utils';
import { HeartPulse, Plus, Trash2, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Timer } from 'lucide-react';

interface CardioSubtabProps {
  token: string;
  prescribedSessions: HubSession[];
  /** Necessário pra marcar a meta "Atividade física" do dia ao registrar cardio. */
  patientId?: string;
  /** Plano selecionado no topo — o cardio prescrito segue esse plano. */
  planId?: string | null;
}

// Segunda-feira da semana atual (date_trunc('week') no Postgres = ISO, começa na segunda).
function currentWeekStart(): string {
  const now = new Date();
  const diffToMon = (now.getDay() + 6) % 7; // dias desde a segunda
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMon);
  return mon.toISOString().slice(0, 10);
}

export function CardioSubtab({ token, prescribedSessions, patientId, planId }: CardioSubtabProps) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<CardioLog[]>([]);
  const [totals, setTotals] = useState<CardioTotals | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prescribed, setPrescribed] = useState<PrescribedCardio | null>(null);
  // Sessões e minutos de cardio feitos na semana atual (pro progresso do modo "Nx/semana").
  const [weekStats, setWeekStats] = useState<{ count: number; min: number }>({ count: 0, min: 0 });
  // Mês exibido no histórico (1º dia do mês). Começa no mês atual.
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });

  // Pilar 1 — cardio prescrito na ficha (1:1 com o plano selecionado).
  useEffect(() => {
    void workoutExtrasService.getPrescribedCardio(token, planId)
      .then(setPrescribed)
      .catch((err) => console.error('Erro ao carregar cardio prescrito:', err));
  }, [token, planId]);

  const reload = useCallback(async () => {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().slice(0, 10);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().slice(0, 10);
    const weekStart = currentWeekStart();
    const today = new Date().toISOString().slice(0, 10);
    setLoading(true);
    try {
      const [l, t, wk] = await Promise.all([
        workoutExtrasService.listCardio(token, monthStart, monthEnd),
        workoutExtrasService.getCardioTotals(token),
        workoutExtrasService.listCardio(token, weekStart, today),
      ]);
      setLogs(l);
      setTotals(t);
      setWeekStats({ count: wk.length, min: wk.reduce((s, c) => s + (c.duration_min ?? 0), 0) });
    } catch (err) {
      console.error('Erro ao carregar cardios:', err);
    } finally {
      setLoading(false);
    }
  }, [token, month]);

  useEffect(() => { void reload(); }, [reload]);

  const isCurrentMonth = (() => {
    const n = new Date();
    return month.getFullYear() === n.getFullYear() && month.getMonth() === n.getMonth();
  })();
  const monthLabel = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const shiftMonth = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  // Tempo de cardio prescrito pra hoje (se houver), pra decidir quando a meta
  // do dia é atingida. null = sem prescrição pra hoje → qualquer cardio conta.
  const prescribedTodayMin = (() => {
    if (!prescribed) return null;
    const dow = new Date().getDay();
    if (!prescribed.dias_semana?.includes(dow)) return null;
    const t = prescribed.modo === 'mesmo'
      ? prescribed.tempo_padrao
      : prescribed.tempo_por_dia?.[String(dow)] ?? null;
    // Só compara quando a unidade é minutos (a meta é por tempo).
    return prescribed.unidade === 'min' && typeof t === 'number' ? t : null;
  })();

  // Espelha o runner de treino: ao registrar um cardio DE HOJE que atinja o
  // tempo prescrito (ou qualquer cardio, se não houver prescrição em minutos),
  // marca a meta "Atividade física" do dia. completeChallenge é idempotente
  // (não duplica se já estiver marcada). Best-effort: nunca quebra o fluxo.
  const maybeCompleteGoal = (durationMin: number, performedAt: string) => {
    if (!patientId) return;
    const today = new Date().toISOString().slice(0, 10);
    if (performedAt !== today) return;
    if (prescribedTodayMin != null && durationMin < prescribedTodayMin) return;
    dailyChallengesService.completeChallenge(patientId, 'atividade_fisica')
      .then(() => {
        toast({ title: 'Meta concluída ✅', description: `Atividade física do dia marcada (${durationMin}min de cardio).` });
      })
      .catch((e) => console.error('Falha ao marcar meta de atividade física (cardio):', e));
  };

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
      {/* Pilar 1 — cardio prescrito no topo */}
      {prescribed ? (
        <PrescribedCardioCard cardio={prescribed} weekStats={weekStats} />
      ) : !loading && (
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
          <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>Este plano não tem cardio prescrito. Você pode registrar suas atividades livremente abaixo.</span>
        </div>
      )}

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
                  <div className="prose prose-sm mt-1 max-w-none text-xs text-cyan-800 prose-p:my-1" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(s.notes) }} />
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
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Histórico</h3>
          <div className="flex items-center gap-1">
            <button onClick={() => shiftMonth(-1)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[7.5rem] text-center text-xs font-medium capitalize text-slate-600">{monthLabel}</span>
            <button
              onClick={() => shiftMonth(1)}
              disabled={isCurrentMonth}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {loading ? (
          <p className="py-4 text-center text-sm text-slate-400">Carregando…</p>
        ) : logs.length === 0 ? (
          <p className="py-4 text-center text-sm italic text-slate-500">
            Nenhum cardio registrado neste mês.
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
          onSaved={(durationMin, performedAt) => {
            setShowForm(false);
            void reload();
            maybeCompleteGoal(durationMin, performedAt);
          }}
        />
      )}
    </div>
  );
}

const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Normaliza uma opção de cardio (chaves variam conforme o back-office) em
// { label, html }. Aceita objeto com label/título/etc. ou string solta.
function normalizeCardioOption(opt: any, i: number): { label: string; html: string } {
  const fallback = `Opção ${String(i + 1).padStart(2, '0')}`;
  if (typeof opt === 'string') return { label: fallback, html: opt };
  const label = opt?.label || opt?.titulo || opt?.nome || fallback;
  const html = opt?.descricao || opt?.description || opt?.conteudo || opt?.texto || opt?.html || '';
  return { label, html: typeof html === 'string' ? html : '' };
}

// Pilar 1 — bloco "Cardio prescrito": modalidade/intensidade, pills dos dias
// (destaca hoje), tempo do dia atual e observações.
function PrescribedCardioCard({ cardio, weekStats }: { cardio: PrescribedCardio; weekStats: { count: number; min: number } }) {
  const todayDow = new Date().getDay();
  // Modo "Nx por semana": frequência livre, sem dias fixos (tempo sempre o padrão).
  const byFrequency = (cardio.vezes_semana ?? 0) > 0;
  const isToday = !byFrequency && cardio.dias_semana?.includes(todayDow);
  const tempoHoje = cardio.modo === 'mesmo'
    ? cardio.tempo_padrao
    : cardio.tempo_por_dia?.[String(todayDow)] ?? null;
  const modalidade = cardio.modalidade?.trim() || null;
  const intensidade = cardio.intensidade?.trim() || null;

  return (
    <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-cyan-900">
          🫀 Cardio prescrito
        </h3>
        {isToday && tempoHoje != null && (
          <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-xs font-bold text-white">
            Hoje: {tempoHoje}{cardio.unidade}
          </span>
        )}
      </div>
      {(modalidade || intensidade) && (
        <div className="mt-0.5 space-y-0.5 text-xs text-cyan-700">
          {modalidade && <p>{modalidade}</p>}
          {intensidade && <p className="text-cyan-600">{intensidade}</p>}
        </div>
      )}

      {byFrequency ? (
        <FrequencyProgress cardio={cardio} weekStats={weekStats} />
      ) : (
        <div className="mt-2 flex flex-wrap gap-1">
          {DOW_LABELS.map((lbl, dow) => {
            const active = cardio.dias_semana?.includes(dow);
            const today = dow === todayDow;
            if (!active) return null;
            const tempo = cardio.modo === 'mesmo' ? cardio.tempo_padrao : cardio.tempo_por_dia?.[String(dow)] ?? null;
            return (
              <span
                key={dow}
                className={
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ' +
                  (today ? 'border-cyan-500 bg-cyan-600 text-white' : 'border-cyan-200 bg-white text-cyan-800')
                }
              >
                {lbl}{tempo != null ? ` ${tempo}${cardio.unidade}` : ''}
              </span>
            );
          })}
        </div>
      )}

      {Array.isArray(cardio.opcoes) && cardio.opcoes.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
            Opções de cardio ({cardio.opcoes.length})
          </p>
          <p className="text-[11px] text-cyan-600">Faça <strong>uma</strong> destas opções.</p>
          {cardio.opcoes.map((opt, i) => {
            const { label, html } = normalizeCardioOption(opt, i);
            return (
              <div key={i} className="rounded-lg border border-cyan-200 bg-white/70 p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900">
                  <RotateCcw className="h-3 w-3" /> {label}
                </div>
                {html && (
                  <div
                    className="prose prose-sm mt-1 max-w-none text-xs text-cyan-800 prose-p:my-1 prose-strong:text-cyan-900"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {cardio.observacoes && (
        <div
          className="prose prose-sm mt-2 max-w-none text-xs text-cyan-800 prose-p:my-1 prose-b:text-cyan-900 prose-strong:text-cyan-900"
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(cardio.observacoes) }}
        />
      )}
    </div>
  );
}

// Progresso semanal do modo "Nx por semana": foco em treinos (frequência),
// com os minutos como contexto. Ex.: "1/4 treinos · 45 min esta semana".
function FrequencyProgress({ cardio, weekStats }: { cardio: PrescribedCardio; weekStats: { count: number; min: number } }) {
  const target = cardio.vezes_semana ?? 0;
  const maxV = cardio.vezes_semana_max ?? null;
  // Rótulo da frequência: faixa "3x a 4x por semana" quando há teto, senão "3x por semana".
  const freqLabel = maxV && maxV > target ? `${target}x a ${maxV}x por semana` : `${target}x por semana`;
  const done = weekStats.count;
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const complete = target > 0 && done >= target;
  const targetMin = cardio.tempo_padrao != null ? cardio.tempo_padrao * target : null;
  // Metas com a margem (faixa): "3-4" treinos e "60-80" min quando há teto.
  const hasRange = !!maxV && maxV > target;
  const goalLabel = hasRange ? `${target}-${maxV}` : `${target}`;
  const targetMinMax = cardio.tempo_padrao != null && maxV ? cardio.tempo_padrao * maxV : null;
  const minGoalLabel = targetMin != null
    ? (hasRange && targetMinMax ? `${targetMin}-${targetMinMax}` : `${targetMin}`)
    : null;

  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-cyan-800">
          <HeartPulse className="h-4 w-4 text-cyan-600" />
          {freqLabel}
          {cardio.tempo_padrao != null && (
            <span className="font-normal text-cyan-600">· {cardio.tempo_padrao}{cardio.unidade} cada</span>
          )}
        </span>
        {complete && <span className="text-xs font-bold text-emerald-600">✓ Completo</span>}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-cyan-100">
        <div
          className={'h-full rounded-full transition-all ' + (complete ? 'bg-emerald-500' : 'bg-cyan-600')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-cyan-700">
        <strong className="text-cyan-900">{done}/{goalLabel}</strong> treinos esta semana
        <span className="text-cyan-600"> · {weekStats.min}{minGoalLabel ? `/${minGoalLabel}` : ''} min</span>
      </p>
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

function CardioLogDialog({ token, onClose, onSaved }: { token: string; onClose: () => void; onSaved: (durationMin: number, performedAt: string) => void }) {
  const { toast } = useToast();
  const [duration, setDuration] = useState('30');
  const [modality, setModality] = useState('');
  const [intensity, setIntensity] = useState<'leve' | 'moderado' | 'forte' | 'hiit'>('moderado');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Cronômetro do cardio: o aluno pode medir o tempo direto no app.
  const [swSec, setSwSec] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  useEffect(() => {
    if (!swRunning) return;
    const t = setInterval(() => setSwSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [swRunning]);
  const swLabel = `${String(Math.floor(swSec / 60)).padStart(2, '0')}:${String(swSec % 60).padStart(2, '0')}`;
  const swMinutes = Math.max(1, Math.round(swSec / 60));
  // Enquanto o cronômetro roda, a duração acompanha o tempo medido (evita salvar
  // o valor padrão de 30min sem querer). Depois de parar, o último valor fica.
  useEffect(() => {
    if (swRunning) setDuration(String(swMinutes));
  }, [swSec, swRunning, swMinutes]);

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
      onSaved(Number(duration), date);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-cyan-600" /> Registrar cardio
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* Cronômetro — mede o tempo do cardio e preenche a duração */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Timer className="h-4 w-4 text-cyan-600" />
                <span className="text-2xl font-bold tabular-nums">{swLabel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button type="button" size="sm" variant="outline" onClick={() => setSwRunning((r) => !r)} className="border-slate-300 bg-white">
                  {swRunning ? <><Pause className="mr-1 h-4 w-4" /> Pausar</> : <><Play className="mr-1 h-4 w-4" /> Iniciar</>}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setSwRunning(false); setSwSec(0); }} aria-label="Zerar cronômetro">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {swSec > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Duração registrada: <strong className="text-slate-700">{swMinutes} min</strong> (ajustável abaixo)
              </p>
            )}
          </div>

          <div>
            <Label>Duração (min) *</Label>
            <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 bg-white border-slate-300" />
          </div>
          <div>
            <Label>Modalidade</Label>
            <Input value={modality} onChange={(e) => setModality(e.target.value)} placeholder="Esteira, bike, corrida..." className="mt-1 bg-white border-slate-300" />
          </div>
          <div>
            <Label>Intensidade</Label>
            <Select value={intensity} onValueChange={(v) => setIntensity(v as typeof intensity)}>
              <SelectTrigger className="mt-1 bg-white border-slate-300"><SelectValue /></SelectTrigger>
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
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 bg-white border-slate-300" />
          </div>
          <div>
            <Label>Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="mt-1 bg-white border-slate-300" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">Cancelar</Button>
          <Button onClick={() => void handleSave()} disabled={saving || !duration} className="bg-cyan-600 text-white hover:bg-cyan-700">
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

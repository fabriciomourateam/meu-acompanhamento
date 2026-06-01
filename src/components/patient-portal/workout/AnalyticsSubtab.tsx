// ITEM 5 — Sub-aba Análise: calendário (treinos + cardios) + gráficos volume/RPE/adesão.
import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { workoutExtrasService, type TrainerProfile, type VolumeByGroup } from '@/lib/workout/workout-extras-service';
import { ShareableProgressCard } from '../ShareableProgressCard';

interface AnalyticsSubtabProps {
  token: string;
  planId: string;
  patientName?: string;
}

export function AnalyticsSubtab({ token, planId, patientName }: AnalyticsSubtabProps) {
  const [tab, setTab] = useState<'calendar' | 'volume' | 'groups' | 'rpe' | 'adherence'>('calendar');

  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 rounded-lg h-auto">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 py-2 rounded-md transition-all">📅 <span className="hidden sm:inline ml-1">Calendário</span></TabsTrigger>
          <TabsTrigger value="volume" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 py-2 rounded-md transition-all">📊 <span className="hidden sm:inline ml-1">Volume</span></TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 py-2 rounded-md transition-all">🦾 <span className="hidden sm:inline ml-1">Grupos</span></TabsTrigger>
          <TabsTrigger value="rpe" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 py-2 rounded-md transition-all">💪 <span className="hidden sm:inline ml-1">RPE</span></TabsTrigger>
          <TabsTrigger value="adherence" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 py-2 rounded-md transition-all">✓ <span className="hidden sm:inline ml-1">Adesão</span></TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-3"><CalendarView token={token} /></TabsContent>
        <TabsContent value="volume" className="mt-3"><VolumeChart token={token} /></TabsContent>
        <TabsContent value="groups" className="mt-3"><VolumeByGroupChart token={token} /></TabsContent>
        <TabsContent value="rpe" className="mt-3"><RpeChart token={token} /></TabsContent>
        <TabsContent value="adherence" className="mt-3"><AdherenceChart token={token} planId={planId} /></TabsContent>
      </Tabs>

      <ShareProgressSection token={token} planId={planId} patientName={patientName} />
    </div>
  );
}

// ITEM 11 — botão "Compartilhar progresso". Por decisão de privacidade, NÃO
// publica peso nem % de gordura: só semanas treinando + adesão média.
function ShareProgressSection({ token, planId, patientName }: { token: string; planId: string; patientName?: string }) {
  const [open, setOpen] = useState(false);
  const [trainer, setTrainer] = useState<TrainerProfile | null>(null);
  const [stats, setStats] = useState<{ weeks: number; avgAdherence?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    if (stats) return;
    setLoading(true);
    try {
      const [profile, adh] = await Promise.all([
        workoutExtrasService.getTrainerProfile(token),
        workoutExtrasService.getWeeklyAdherence(token, planId, 12),
      ]);
      setTrainer(profile ?? { name: null, avatar_url: null, share_logo_url: null, share_brand_name: null, share_brand_color: null });
      const weeks = adh.length;
      const avgAdherence = adh.length > 0
        ? Math.round(adh.reduce((s, w) => s + Number(w.adherence_pct), 0) / adh.length)
        : undefined;
      setStats({ weeks: Math.max(1, weeks), avgAdherence });
    } catch (err) {
      console.error('Erro ao preparar compartilhamento:', err);
      setStats({ weeks: 1 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => void handleOpen()} variant="outline" className="w-full">
        <Share2 className="mr-1.5 h-4 w-4" /> Compartilhar progresso
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Compartilhar progresso</DialogTitle>
          </DialogHeader>
          {loading || !stats || !trainer ? (
            <p className="py-8 text-center text-sm text-slate-400">Preparando…</p>
          ) : (
            <ShareableProgressCard
              trainerProfile={trainer}
              patientName={patientName ?? 'Aluno(a)'}
              stats={stats}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CalendarView({ token }: { token: string }) {
  const [month, setMonth] = useState(new Date());
  const [workoutDays, setWorkoutDays] = useState<Date[]>([]);
  const [cardioDays, setCardioDays] = useState<Date[]>([]);
  const [selected, setSelected] = useState<Date | undefined>();

  useEffect(() => {
    const fromDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const toDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const from = fromDate.toISOString().slice(0, 10);
    const to = toDate.toISOString().slice(0, 10);
    void Promise.all([
      workoutExtrasService.listSessionLogs(token, fromDate.toISOString(), new Date(toDate.getTime() + 86400000).toISOString()),
      workoutExtrasService.listCardio(token, from, to),
    ]).then(([w, c]) => {
      setWorkoutDays(w.map((l) => new Date(l.started_at)));
      setCardioDays(c.map((l) => new Date(l.performed_at + 'T00:00:00')));
    }).catch((err) => console.error('Erro no calendário:', err));
  }, [month, token]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={setSelected}
        month={month}
        onMonthChange={setMonth}
        modifiers={{ treinou: workoutDays, cardio: cardioDays }}
        modifiersClassNames={{
          treinou: 'bg-emerald-100 text-emerald-700 font-bold rounded-md',
          cardio: 'ring-2 ring-blue-400 ring-inset rounded-md',
        }}
        styles={{
          caption_label: { color: '#0f172a', fontWeight: 600 },
          head_cell: { color: '#64748b' },
          day: { color: '#334155' },
          nav_button: { color: '#475569' },
        }}
      />
      <div className="mt-2 flex gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-100" /> Treinou</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded ring-2 ring-blue-400" /> Cardio</span>
      </div>
    </div>
  );
}

function startOfWeekMonday(d: Date): Date {
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return monday;
}

function VolumeChart({ token }: { token: string }) {
  const [data, setData] = useState<Array<{ week: string; sets: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 56);
      try {
        const rows = await workoutExtrasService.listSetLogs(token, since.toISOString(), new Date().toISOString());
        const byWeek = new Map<string, number>();
        for (const r of rows) {
          const wk = startOfWeekMonday(new Date(r.logged_at)).toISOString().slice(0, 10);
          byWeek.set(wk, (byWeek.get(wk) ?? 0) + 1);
        }
        setData(Array.from(byWeek.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([week, sets]) => ({ week: week.slice(5), sets })));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <ChartShell title="Volume semanal (séries · últimas 8 semanas)" loading={loading} empty={data.length === 0}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="sets" fill="#3b82f6" name="Séries" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartShell>
  );
}

// Pilar 3 — Volume por grupamento muscular (barras horizontais).
const CATEGORY_COLORS: Record<string, string> = {
  superior: '#3b82f6', // blue
  inferior: '#10b981', // emerald
  core: '#f59e0b',     // amber
};
function categoryColor(cat: string | null): string {
  return CATEGORY_COLORS[cat ?? ''] ?? '#64748b'; // slate fallback
}

function VolumeByGroupChart({ token }: { token: string }) {
  const [data, setData] = useState<Array<{ group: string; volume: number; category: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void workoutExtrasService.getVolumeByGroup(token)
      .then((vol) => {
        const rows = Object.entries(vol)
          .map(([group, v]) => ({ group, volume: Number(v.volume) || 0, category: v.category }))
          .filter((r) => r.volume > 0)
          .sort((a, b) => b.volume - a.volume);
        setData(rows);
      })
      .catch((err) => console.error('Erro no volume por grupo:', err))
      .finally(() => setLoading(false));
  }, [token]);

  // altura proporcional ao nº de grupos (cada barra ~34px)
  const height = Math.max(160, data.length * 34 + 20);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h4 className="mb-1 text-sm font-semibold text-slate-700">Volume por grupamento (plano atual)</h4>
      <p className="mb-2 text-[11px] text-slate-400">séries × reps médias × ativação</p>
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-400">Carregando…</p>
      ) : data.length === 0 ? (
        <p className="py-6 text-center text-sm italic text-slate-500">Sem dados de volume ainda</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="group" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v: number) => [`${v}`, 'Volume']} />
              <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                {data.map((d) => (
                  <Cell key={d.group} fill={categoryColor(d.category)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: CATEGORY_COLORS.superior }} /> Superior</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: CATEGORY_COLORS.inferior }} /> Inferior</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: CATEGORY_COLORS.core }} /> Core</span>
          </div>
        </>
      )}
    </div>
  );
}

function RpeChart({ token }: { token: string }) {
  const [data, setData] = useState<Array<{ date: string; rpe: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 28);
      try {
        const rows = await workoutExtrasService.listSetLogs(token, since.toISOString(), new Date().toISOString());
        const byDate = new Map<string, { sum: number; n: number }>();
        for (const r of rows) {
          if (r.rpe == null) continue;
          const d = r.logged_at.slice(0, 10);
          const cur = byDate.get(d) ?? { sum: 0, n: 0 };
          cur.sum += Number(r.rpe);
          cur.n++;
          byDate.set(d, cur);
        }
        setData(Array.from(byDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, v]) => ({ date: date.slice(5), rpe: Number((v.sum / v.n).toFixed(1)) })));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <ChartShell title="RPE médio por dia (últimas 4 semanas)" loading={loading} empty={data.length === 0} emptyText="Sem RPE registrado ainda">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[6, 10]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="rpe" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ChartShell>
  );
}

function AdherenceChart({ token, planId }: { token: string; planId: string }) {
  const [data, setData] = useState<Array<{ week: string; pct: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void workoutExtrasService.getWeeklyAdherence(token, planId, 6)
      .then((rows) => setData(rows.map((r) => ({ week: r.week_start.slice(5), pct: Number(r.adherence_pct) }))))
      .catch((err) => console.error('Erro na adesão:', err))
      .finally(() => setLoading(false));
  }, [token, planId]);

  return (
    <ChartShell title="Adesão semanal (% treinos feitos)" loading={loading} empty={data.length === 0}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => `${v}%`} />
        <Bar dataKey="pct" fill="#10b981" name="Adesão" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartShell>
  );
}

function ChartShell({ title, loading, empty, emptyText = 'Sem dados ainda', children }: {
  title: string; loading: boolean; empty: boolean; emptyText?: string; children: React.ReactElement;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h4 className="mb-2 text-sm font-semibold text-slate-700">{title}</h4>
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-400">Carregando…</p>
      ) : empty ? (
        <p className="py-6 text-center text-sm italic text-slate-500">{emptyText}</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>{children}</ResponsiveContainer>
      )}
    </div>
  );
}

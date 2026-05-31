// ITEM 5 — Sub-aba Análise: calendário (treinos + cardios) + gráficos volume/RPE/adesão.
import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { workoutExtrasService } from '@/lib/workout/workout-extras-service';

interface AnalyticsSubtabProps {
  token: string;
  planId: string;
}

export function AnalyticsSubtab({ token, planId }: AnalyticsSubtabProps) {
  const [tab, setTab] = useState<'calendar' | 'volume' | 'rpe' | 'adherence'>('calendar');

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="calendar">📅 <span className="hidden sm:inline ml-1">Calendário</span></TabsTrigger>
        <TabsTrigger value="volume">📊 <span className="hidden sm:inline ml-1">Volume</span></TabsTrigger>
        <TabsTrigger value="rpe">💪 <span className="hidden sm:inline ml-1">RPE</span></TabsTrigger>
        <TabsTrigger value="adherence">✓ <span className="hidden sm:inline ml-1">Adesão</span></TabsTrigger>
      </TabsList>
      <TabsContent value="calendar" className="mt-3"><CalendarView token={token} /></TabsContent>
      <TabsContent value="volume" className="mt-3"><VolumeChart token={token} /></TabsContent>
      <TabsContent value="rpe" className="mt-3"><RpeChart token={token} /></TabsContent>
      <TabsContent value="adherence" className="mt-3"><AdherenceChart token={token} planId={planId} /></TabsContent>
    </Tabs>
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

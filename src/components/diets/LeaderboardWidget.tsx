import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  rankingService, previousPeriodKey,
  type LeaderboardEntry, type HistoryEntry, type PeriodSummary,
} from '@/lib/ranking-service';
import type { RankingPeriod } from '@/lib/portal-settings-service';
import { ChevronDown, ChevronUp, Crown } from 'lucide-react';

interface LeaderboardWidgetProps {
  patientId: string;
  trainerUserId: string;
  periods: RankingPeriod[];
}

const PERIOD_LABELS: Record<RankingPeriod, string> = {
  weekly: 'Semana',
  monthly: 'Mês',
  yearly: 'Ano',
  all_time: 'Geral',
};

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

function RankAvatar({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={`w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center text-[10px] font-bold shrink-0 ${
        entry.is_current_patient
          ? 'border-emerald-400 bg-emerald-200 text-emerald-800 dark:text-emerald-300'
          : 'border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
      }`}
    >
      {entry.photo_url ? (
        <img src={entry.photo_url} alt={entry.patient_name} className="w-full h-full object-cover" />
      ) : (
        initials(entry.patient_name)
      )}
    </div>
  );
}

function PodiumBlock({
  entry,
  rank,
}: {
  entry: LeaderboardEntry | undefined;
  rank: 1 | 2 | 3;
}) {
  const configs = {
    1: {
      height: 'h-24',
      medal: '🥇',
      bg: 'bg-amber-400/40 border-amber-500/60',
      text: 'text-amber-800 dark:text-amber-300',
      avatarBg: 'bg-amber-200 border-amber-500',
      avatarSize: 'w-14 h-14',
      order: 'order-2',
    },
    2: {
      height: 'h-16',
      medal: '🥈',
      bg: 'bg-slate-300/70 border-slate-400/70',
      text: 'text-slate-700 dark:text-slate-200',
      avatarBg: 'bg-slate-200 dark:bg-slate-800 border-slate-400',
      avatarSize: 'w-12 h-12',
      order: 'order-1',
    },
    3: {
      height: 'h-12',
      medal: '🥉',
      bg: 'bg-orange-300/40 border-orange-400/60',
      text: 'text-orange-800 dark:text-orange-300',
      avatarBg: 'bg-orange-100 dark:bg-orange-950/50 border-orange-400',
      avatarSize: 'w-12 h-12',
      order: 'order-3',
    },
  };

  const c = configs[rank];
  const isCurrent = entry?.is_current_patient;

  return (
    <div className={`flex flex-col items-center gap-1.5 flex-1 ${c.order}`}>
      {entry ? (
        <div
          className={`${c.avatarSize} rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden transition-all ${
            isCurrent
              ? 'bg-emerald-200 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-400'
              : `${c.avatarBg} ${c.text}`
          }`}
        >
          {entry.photo_url ? (
            <img src={entry.photo_url} alt={entry.patient_name} className="w-full h-full object-cover" />
          ) : (
            initials(entry.patient_name)
          )}
        </div>
      ) : (
        <div className={`${c.avatarSize} rounded-full border-2 border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400`}>
          —
        </div>
      )}

      <div className="text-center w-full px-1">
        {entry ? (
          <>
            <p className={`text-xs font-semibold truncate leading-tight ${isCurrent ? 'text-emerald-700 dark:text-emerald-300' : c.text}`}>
              {entry.patient_name.split(' ')[0]}
              {isCurrent && <span className="ml-1 text-emerald-600 dark:text-emerald-400">★</span>}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {entry.points.toLocaleString('pt-BR')} pts
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500">—</p>
        )}
      </div>

      <div
        className={`w-full ${c.height} rounded-t-lg border-2 flex items-center justify-center text-xl shadow-inner ${
          isCurrent ? 'bg-emerald-200/70 border-emerald-400' : c.bg
        }`}
      >
        <span>{c.medal}</span>
      </div>
    </div>
  );
}

function LeaderboardList({
  patientId,
  trainerUserId,
  period,
}: {
  patientId: string;
  trainerUserId: string;
  period: RankingPeriod;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    rankingService
      .getLeaderboard(trainerUserId, patientId, period)
      .then(data => {
        if (!cancelled) {
          setEntries(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [patientId, trainerUserId, period]);

  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-12 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 dark:text-slate-400">
        <p className="text-3xl mb-2">🏆</p>
        <p className="text-sm">Nenhum ponto registrado neste período ainda.</p>
      </div>
    );
  }

  // Limita a lista visível ao Top 20 (pódio + 17). O aluno atual sempre aparece:
  // se estiver fora do top, é mostrado destacado abaixo do separador "...".
  const TOP_LIMIT = 20;
  const rest = entries.slice(3, TOP_LIMIT);
  const currentEntry = entries.find(e => e.is_current_patient);
  const currentInRest = rest.some(e => e.is_current_patient);
  const currentInTop3 = entries.slice(0, 3).some(e => e?.is_current_patient);
  const showSeparated = currentEntry && !currentInRest && !currentInTop3;

  return (
    <div className="mt-4 space-y-4">
      {/* Pódio */}
      <div className="flex items-end gap-2 px-2 pt-2">
        <PodiumBlock entry={entries[1]} rank={2} />
        <PodiumBlock entry={entries[0]} rank={1} />
        <PodiumBlock entry={entries[2]} rank={3} />
      </div>

      {/* Lista a partir do 4° lugar */}
      {rest.length > 0 && (
        <div className="space-y-1">
          {rest.map(entry => (
            <div
              key={entry.patient_id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 ${
                entry.is_current_patient
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-200 hover:border-slate-400 cursor-default'
              }`}
            >
              <span className="text-sm font-bold w-7 text-center shrink-0 text-slate-500 dark:text-slate-400">
                {entry.position}°
              </span>
              <RankAvatar entry={entry} />
              <span
                className={`flex-1 text-sm font-semibold truncate ${
                  entry.is_current_patient ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {entry.patient_name}
                {entry.is_current_patient && (
                  <span className="ml-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-normal">(você)</span>
                )}
              </span>
              <span
                className={`text-sm font-bold shrink-0 ${
                  entry.is_current_patient ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {entry.points.toLocaleString('pt-BR')} pts
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Paciente fora do top visível */}
      {showSeparated && currentEntry && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-dashed border-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">...</span>
            <div className="flex-1 border-t border-dashed border-slate-400" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 shadow-sm">
            <span className="text-sm font-bold w-7 text-center shrink-0 text-emerald-700 dark:text-emerald-300">
              {currentEntry.position}°
            </span>
            <RankAvatar entry={currentEntry} />
            <span className="flex-1 text-sm font-semibold truncate text-emerald-800 dark:text-emerald-300">
              {currentEntry.patient_name}
              <span className="ml-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-normal">(você)</span>
            </span>
            <span className="text-sm font-bold shrink-0 text-emerald-700 dark:text-emerald-300">
              {currentEntry.points.toLocaleString('pt-BR')} pts
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/** Formata um period_key humano: '2026-W23' → "Semana 23/2026"; '2026-06' → "Junho 2026". */
function formatPeriodKey(period: 'weekly' | 'monthly' | 'yearly', key: string): string {
  if (period === 'weekly') {
    const [y, w] = key.split('-W');
    return `Semana ${w}/${y}`;
  }
  if (period === 'monthly') {
    const [y, m] = key.split('-');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  }
  return key;
}

/** Período anterior do ranking (semana/mês passado). */
function PreviousPeriodCard({
  trainerUserId,
  currentPatientId,
  period,
}: {
  trainerUserId: string;
  currentPatientId: string;
  period: 'weekly' | 'monthly' | 'yearly';
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const key = previousPeriodKey(period, 1);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    rankingService.getHistory(trainerUserId, period, key, 10)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [open, trainerUserId, period, key]);

  return (
    <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700"
      >
        <span className="flex items-center gap-1.5">
          📜 {period === 'weekly' ? 'Semana passada' : period === 'monthly' ? 'Mês passado' : 'Ano passado'} — {formatPeriodKey(period, key)}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {loading ? (
            <Skeleton className="h-16 w-full bg-slate-100 dark:bg-slate-800" />
          ) : entries.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 text-center">
              Sem ranking nesse período.
            </p>
          ) : (
            entries.slice(0, 5).map((e) => {
              const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `${e.rank}°`;
              const isMe = e.patient_id === currentPatientId;
              return (
                <div
                  key={`${e.patient_id}-${e.rank}`}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                    isMe ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50' : 'bg-slate-50 dark:bg-slate-900'
                  }`}
                >
                  <span className="w-6 text-center">{medal}</span>
                  <span className={`flex-1 truncate ${isMe ? 'font-semibold text-emerald-800 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>
                    {e.patient_name}{isMe && ' (você)'}
                  </span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{e.points.toLocaleString('pt-BR')}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/** Hall da Fama: lista de campeões mensais antigos (top 1 de cada mês passado). */
function HallOfFameSection({ trainerUserId, currentPatientId }: { trainerUserId: string; currentPatientId: string }) {
  const [periods, setPeriods] = useState<PeriodSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    rankingService.listHistoryPeriods(trainerUserId)
      .then((p) => setPeriods(p.filter((x) => x.period === 'monthly')))
      .finally(() => setLoading(false));
  }, [open, trainerUserId]);

  return (
    <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-800"
      >
        <span className="flex items-center gap-1.5">
          <Crown className="h-3.5 w-3.5" /> Hall da Fama
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {loading ? (
            <Skeleton className="h-12 w-full bg-slate-100 dark:bg-slate-800" />
          ) : periods.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 text-center">
              Ainda não há campeões registrados. Cada mês fechado vira história aqui.
            </p>
          ) : (
            periods.map((p) => {
              const isMe = false; // o nome não é diretamente comparável; mantemos neutro
              return (
                <div
                  key={`${p.period}-${p.period_key}`}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs bg-gradient-to-r from-amber-50 dark:from-amber-950/40 to-yellow-50 dark:to-yellow-950/40 border border-amber-200 dark:border-amber-900/50`}
                >
                  <span className="text-base">👑</span>
                  <span className={`flex-1 truncate ${isMe ? 'font-bold text-amber-900 dark:text-amber-200' : 'text-slate-700 dark:text-slate-200'}`}>
                    <span className="font-semibold text-amber-800 dark:text-amber-300">{formatPeriodKey(p.period, p.period_key)}</span>
                    {' — '}{p.top1_name || '—'}
                  </span>
                  {p.top1_points != null && (
                    <span className="font-bold text-amber-700 dark:text-amber-300">{p.top1_points.toLocaleString('pt-BR')} pts</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function LeaderboardWidget({ patientId, trainerUserId, periods }: LeaderboardWidgetProps) {
  const activePeriods = periods.filter(Boolean);
  const defaultPeriod = activePeriods[0] || 'monthly';

  if (activePeriods.length === 0) return null;

  return (
    <Card className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-800 dark:text-slate-200 flex items-center gap-2 text-lg font-bold">
          <span className="text-2xl">🏆</span>
          Ranking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activePeriods.length === 1 ? (
          <>
            <LeaderboardList
              patientId={patientId}
              trainerUserId={trainerUserId}
              period={activePeriods[0]}
            />
            {activePeriods[0] !== 'all_time' && (
              <PreviousPeriodCard
                trainerUserId={trainerUserId}
                currentPatientId={patientId}
                period={activePeriods[0] as 'weekly' | 'monthly' | 'yearly'}
              />
            )}
          </>
        ) : (
          <Tabs defaultValue={defaultPeriod}>
            <TabsList className="w-full bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
              {activePeriods.map(period => (
                <TabsTrigger
                  key={period}
                  value={period}
                  className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-500/15 dark:data-[state=active]:text-emerald-300 data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 text-sm rounded-md transition-all"
                >
                  {PERIOD_LABELS[period]}
                </TabsTrigger>
              ))}
            </TabsList>
            {activePeriods.map(period => (
              <TabsContent key={period} value={period}>
                <LeaderboardList
                  patientId={patientId}
                  trainerUserId={trainerUserId}
                  period={period}
                />
                {period !== 'all_time' && (
                  <PreviousPeriodCard
                    trainerUserId={trainerUserId}
                    currentPatientId={patientId}
                    period={period as 'weekly' | 'monthly' | 'yearly'}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        <HallOfFameSection trainerUserId={trainerUserId} currentPatientId={patientId} />
      </CardContent>
    </Card>
  );
}

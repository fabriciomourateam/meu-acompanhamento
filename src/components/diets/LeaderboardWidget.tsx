import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { rankingService, LeaderboardEntry } from '@/lib/ranking-service';
import type { RankingPeriod } from '@/lib/portal-settings-service';

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
    .map((w) => w[0].toUpperCase())
    .join('');
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
      bg: 'bg-amber-500/20 border-amber-400/40',
      text: 'text-amber-300',
      avatarBg: 'bg-amber-500/30 border-amber-400/50',
      label: '1°',
      order: 'order-2',
    },
    2: {
      height: 'h-16',
      medal: '🥈',
      bg: 'bg-slate-500/20 border-slate-400/40',
      text: 'text-slate-300',
      avatarBg: 'bg-slate-500/30 border-slate-400/50',
      label: '2°',
      order: 'order-1',
    },
    3: {
      height: 'h-12',
      medal: '🥉',
      bg: 'bg-orange-700/20 border-orange-600/40',
      text: 'text-orange-300',
      avatarBg: 'bg-orange-700/30 border-orange-600/50',
      label: '3°',
      order: 'order-3',
    },
  };

  const c = configs[rank];
  const isCurrent = entry?.is_current_patient;

  return (
    <div className={`flex flex-col items-center gap-1.5 flex-1 ${c.order}`}>
      {/* Avatar */}
      {entry ? (
        <div
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
            isCurrent
              ? 'bg-emerald-500/30 border-emerald-400/60 text-emerald-300 ring-2 ring-emerald-400/40'
              : `${c.avatarBg} ${c.text}`
          }`}
        >
          {initials(entry.patient_name)}
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full border-2 border-slate-700 bg-slate-800/40 flex items-center justify-center text-slate-600">
          —
        </div>
      )}

      {/* Name + points */}
      <div className="text-center w-full px-1">
        {entry ? (
          <>
            <p
              className={`text-xs font-semibold truncate leading-tight ${
                isCurrent ? 'text-emerald-300' : c.text
              }`}
            >
              {entry.patient_name.split(' ')[0]}
              {isCurrent && <span className="ml-1 text-emerald-400">★</span>}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {entry.points.toLocaleString('pt-BR')} pts
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-600">—</p>
        )}
      </div>

      {/* Podium block */}
      <div
        className={`w-full ${c.height} rounded-t-lg border flex items-center justify-center text-xl ${
          isCurrent ? 'bg-emerald-500/20 border-emerald-400/40' : c.bg
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
      .then((data) => {
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
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl bg-slate-700/40" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <p className="text-3xl mb-2">🏆</p>
        <p className="text-sm">Nenhum ponto registrado neste período ainda.</p>
      </div>
    );
  }

  const top3 = [entries[0], entries[1], entries[2]];
  const rest = entries.slice(3);
  const currentEntry = entries.find((e) => e.is_current_patient);
  const currentInRest = rest.some((e) => e.is_current_patient);
  const currentInTop3 = top3.some((e) => e?.is_current_patient);
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
        <div className="space-y-1.5">
          {rest.map((entry) => (
            <div
              key={entry.patient_id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                entry.is_current_patient
                  ? 'bg-emerald-500/15 border border-emerald-500/30 ring-1 ring-emerald-400/20'
                  : 'bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/30'
              }`}
            >
              <span className="text-sm font-bold w-7 text-center shrink-0 text-slate-400">
                {entry.position}°
              </span>
              <span
                className={`flex-1 text-sm font-medium truncate ${
                  entry.is_current_patient ? 'text-emerald-300' : 'text-slate-200'
                }`}
              >
                {entry.patient_name}
                {entry.is_current_patient && (
                  <span className="ml-1.5 text-xs text-emerald-400 font-normal">(você)</span>
                )}
              </span>
              <span
                className={`text-sm font-bold shrink-0 ${
                  entry.is_current_patient ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {entry.points.toLocaleString('pt-BR')} pts
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Paciente atual fora do top visível */}
      {showSeparated && currentEntry && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-dashed border-slate-600" />
            <span className="text-xs text-slate-500 shrink-0">...</span>
            <div className="flex-1 border-t border-dashed border-slate-600" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 ring-1 ring-emerald-400/20">
            <span className="text-sm font-bold w-7 text-center shrink-0 text-emerald-400">
              {currentEntry.position}°
            </span>
            <span className="flex-1 text-sm font-medium truncate text-emerald-300">
              {currentEntry.patient_name}
              <span className="ml-1.5 text-xs text-emerald-400 font-normal">(você)</span>
            </span>
            <span className="text-sm font-bold shrink-0 text-emerald-400">
              {currentEntry.points.toLocaleString('pt-BR')} pts
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function LeaderboardWidget({ patientId, trainerUserId, periods }: LeaderboardWidgetProps) {
  const activePeriods = periods.filter((p) => p);
  const defaultPeriod = activePeriods[0] || 'monthly';

  if (activePeriods.length === 0) return null;

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-lg">
          <span className="text-2xl">🏆</span>
          Ranking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activePeriods.length === 1 ? (
          <LeaderboardList
            patientId={patientId}
            trainerUserId={trainerUserId}
            period={activePeriods[0]}
          />
        ) : (
          <Tabs defaultValue={defaultPeriod}>
            <TabsList className="w-full bg-slate-700/40 rounded-lg p-1">
              {activePeriods.map((period) => (
                <TabsTrigger
                  key={period}
                  value={period}
                  className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-slate-400 text-sm rounded-md transition-all"
                >
                  {PERIOD_LABELS[period]}
                </TabsTrigger>
              ))}
            </TabsList>
            {activePeriods.map((period) => (
              <TabsContent key={period} value={period}>
                <LeaderboardList
                  patientId={patientId}
                  trainerUserId={trainerUserId}
                  period={period}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

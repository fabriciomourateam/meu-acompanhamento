import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { rankingService, type LeaderboardEntry } from '@/lib/ranking-service';
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
    .map(w => w[0].toUpperCase())
    .join('');
}

function RankAvatar({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={`w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center text-[10px] font-bold shrink-0 ${
        entry.is_current_patient
          ? 'border-emerald-400 bg-emerald-200 text-emerald-800'
          : 'border-slate-300 bg-slate-200 text-slate-500'
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
      text: 'text-amber-800',
      avatarBg: 'bg-amber-200 border-amber-500',
      order: 'order-2',
    },
    2: {
      height: 'h-16',
      medal: '🥈',
      bg: 'bg-slate-300/70 border-slate-400/70',
      text: 'text-slate-700',
      avatarBg: 'bg-slate-200 border-slate-400',
      order: 'order-1',
    },
    3: {
      height: 'h-12',
      medal: '🥉',
      bg: 'bg-orange-300/40 border-orange-400/60',
      text: 'text-orange-800',
      avatarBg: 'bg-orange-100 border-orange-400',
      order: 'order-3',
    },
  };

  const c = configs[rank];
  const isCurrent = entry?.is_current_patient;

  return (
    <div className={`flex flex-col items-center gap-1.5 flex-1 ${c.order}`}>
      {entry ? (
        <div
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden transition-all ${
            isCurrent
              ? 'bg-emerald-200 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400'
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
        <div className="w-12 h-12 rounded-full border-2 border-slate-300 bg-slate-200 flex items-center justify-center text-slate-500">
          —
        </div>
      )}

      <div className="text-center w-full px-1">
        {entry ? (
          <>
            <p className={`text-xs font-semibold truncate leading-tight ${isCurrent ? 'text-emerald-700' : c.text}`}>
              {entry.patient_name.split(' ')[0]}
              {isCurrent && <span className="ml-1 text-emerald-600">★</span>}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {entry.points.toLocaleString('pt-BR')} pts
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-400">—</p>
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
          <Skeleton key={i} className="h-12 w-full rounded-xl bg-slate-200" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p className="text-3xl mb-2">🏆</p>
        <p className="text-sm">Nenhum ponto registrado neste período ainda.</p>
      </div>
    );
  }

  const rest = entries.slice(3);
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
                  ? 'bg-emerald-100 border-emerald-300 shadow-sm'
                  : 'bg-slate-100 border-slate-300 hover:bg-slate-200 hover:border-slate-400 cursor-default'
              }`}
            >
              <span className="text-sm font-bold w-7 text-center shrink-0 text-slate-500">
                {entry.position}°
              </span>
              <RankAvatar entry={entry} />
              <span
                className={`flex-1 text-sm font-semibold truncate ${
                  entry.is_current_patient ? 'text-emerald-800' : 'text-slate-700'
                }`}
              >
                {entry.patient_name}
                {entry.is_current_patient && (
                  <span className="ml-1.5 text-xs text-emerald-600 font-normal">(você)</span>
                )}
              </span>
              <span
                className={`text-sm font-bold shrink-0 ${
                  entry.is_current_patient ? 'text-emerald-700' : 'text-slate-600'
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
            <span className="text-xs text-slate-500 shrink-0">...</span>
            <div className="flex-1 border-t border-dashed border-slate-400" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-100 border border-emerald-300 shadow-sm">
            <span className="text-sm font-bold w-7 text-center shrink-0 text-emerald-700">
              {currentEntry.position}°
            </span>
            <RankAvatar entry={currentEntry} />
            <span className="flex-1 text-sm font-semibold truncate text-emerald-800">
              {currentEntry.patient_name}
              <span className="ml-1.5 text-xs text-emerald-600 font-normal">(você)</span>
            </span>
            <span className="text-sm font-bold shrink-0 text-emerald-700">
              {currentEntry.points.toLocaleString('pt-BR')} pts
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function LeaderboardWidget({ patientId, trainerUserId, periods }: LeaderboardWidgetProps) {
  const activePeriods = periods.filter(Boolean);
  const defaultPeriod = activePeriods[0] || 'monthly';

  if (activePeriods.length === 0) return null;

  return (
    <Card className="bg-white border-2 border-slate-200 rounded-2xl shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-800 flex items-center gap-2 text-lg font-bold">
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
            <TabsList className="w-full bg-slate-200 rounded-lg p-1">
              {activePeriods.map(period => (
                <TabsTrigger
                  key={period}
                  value={period}
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 text-sm rounded-md transition-all"
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
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

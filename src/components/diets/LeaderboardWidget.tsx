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

function getMedal(position: number): string {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return `${position}°`;
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
    return () => {
      cancelled = true;
    };
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

  const currentEntry = entries.find((e) => e.is_current_patient);
  const visibleEntries = entries.slice(0, 10);
  const currentInVisible = visibleEntries.some((e) => e.is_current_patient);
  const showSeparated = currentEntry && !currentInVisible;

  return (
    <div className="mt-4 space-y-1.5">
      {visibleEntries.map((entry) => (
        <div
          key={entry.patient_id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            entry.is_current_patient
              ? 'bg-emerald-500/15 border border-emerald-500/30 ring-1 ring-emerald-400/20'
              : 'bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/30'
          }`}
        >
          <span className="text-lg font-bold w-8 text-center shrink-0 text-slate-300">
            {getMedal(entry.position)}
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

      {showSeparated && currentEntry && (
        <>
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 border-t border-dashed border-slate-600" />
            <span className="text-xs text-slate-500 shrink-0">...</span>
            <div className="flex-1 border-t border-dashed border-slate-600" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 ring-1 ring-emerald-400/20">
            <span className="text-lg font-bold w-8 text-center shrink-0 text-slate-300">
              {getMedal(currentEntry.position)}
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

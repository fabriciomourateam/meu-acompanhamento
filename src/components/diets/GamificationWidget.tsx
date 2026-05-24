import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dietConsumptionService, PatientPoints, Achievement } from '@/lib/diet-consumption-service';
import { supabase } from '@/integrations/supabase/client';
import {
  Trophy,
  Star,
  Flame,
  Award,
  CheckCircle2,
  Medal,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GamificationWidgetProps {
  patientId: string;
}

interface AchievementTemplate {
  achievement_type: string;
  achievement_name: string;
  achievement_description?: string;
  points_earned: number;
  icon_name?: string;
}

const iconByType: { [key: string]: any } = {
  streak_3: Flame,
  streak_7: Flame,
  streak_30: Flame,
  first_meal: Star,
  day_complete: CheckCircle2,
  week_complete: Trophy,
  perfect_day: Award,
  month_complete: Medal,
};

function getStreakLabel(streak: number): string {
  if (streak === 0) return 'Comece hoje!';
  if (streak >= 30) return 'Imparável!';
  if (streak >= 7) return 'Semana de ferro!';
  if (streak >= 3) return 'Em chamas!';
  return `${streak} dia${streak > 1 ? 's' : ''} seguido${streak > 1 ? 's' : ''}`;
}

export function GamificationWidget({ patientId }: GamificationWidgetProps) {
  const [points, setPoints] = useState<PatientPoints | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [templates, setTemplates] = useState<AchievementTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, [patientId]);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      const [pointsData, achievementsData, templatesResult] = await Promise.all([
        dietConsumptionService.getPatientPoints(patientId),
        dietConsumptionService.getPatientAchievements(patientId),
        supabase.from('achievement_templates').select('*'),
      ]);
      setPoints(pointsData);
      setAchievements(achievementsData);
      setTemplates(templatesResult.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados de gamificação:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700/50 rounded-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-slate-700" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full bg-slate-700" />
        </CardContent>
      </Card>
    );
  }

  const currentLevel = points?.current_level || 1;
  const totalPoints = points?.total_points || 0;
  const currentStreak = points?.current_streak || 0;

  // Calcular pontos para próximo nível
  const levelThresholds = [0, 100, 300, 600, 1000, 1500];
  const getLevelStart = (lvl: number): number => {
    if (lvl <= 5) return levelThresholds[lvl - 1] || 0;
    return (lvl - 6) * 500 + 1500;
  };
  const getLevelEnd = (lvl: number): number => {
    if (lvl <= 4) return levelThresholds[lvl];
    if (lvl === 5) return 1500;
    return (lvl - 5) * 500 + 1500;
  };

  const levelStart = getLevelStart(currentLevel);
  const levelEnd = getLevelEnd(currentLevel);
  const pointsInLevel = totalPoints - levelStart;
  const pointsNeeded = levelEnd - levelStart;
  const progressToNextLevel = pointsNeeded > 0
    ? Math.min(100, (pointsInLevel / pointsNeeded) * 100)
    : 100;

  // Build a set of unlocked types
  const unlockedTypes = new Set(achievements.map(a => a.achievement_type));

  const streakActive = currentStreak > 0;

  return (
    <div className="space-y-4">
      {/* Streak Card */}
      <Card className={`rounded-2xl border ${
        streakActive
          ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30'
          : 'bg-slate-800/50 border-slate-700/50'
      }`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <motion.div
              key={currentStreak}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`text-5xl sm:text-6xl font-black ${
                streakActive ? 'text-orange-400' : 'text-slate-500'
              }`}
            >
              {streakActive ? '🔥' : '💤'}
            </motion.div>
            <div>
              <motion.p
                key={`streak-${currentStreak}`}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className={`text-3xl sm:text-4xl font-bold ${
                  streakActive ? 'text-orange-300' : 'text-slate-400'
                }`}
              >
                {currentStreak > 0 ? `${currentStreak} dias seguidos` : 'Comece hoje!'}
              </motion.p>
              <p className={`text-sm mt-1 ${streakActive ? 'text-orange-400/80' : 'text-slate-500'}`}>
                {getStreakLabel(currentStreak)}
              </p>
              {points?.longest_streak && points.longest_streak > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Recorde: {points.longest_streak} dias
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level + Points Card */}
      <Card className="bg-slate-800/50 border border-slate-700/50 rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Nível Atual</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-white">{currentLevel}</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                  Nível {currentLevel}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Pontos Totais</p>
              <p className="text-3xl sm:text-4xl font-bold text-white">{totalPoints}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Progresso para Nível {currentLevel + 1}</span>
              <span>{Math.round(progressToNextLevel)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {Math.max(0, pointsNeeded - pointsInLevel)} pontos para o próximo nível
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <Card className="bg-slate-800/50 border border-slate-700/50 rounded-2xl">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            Conquistas ({achievements.length}/{templates.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          {templates.length === 0 ? (
            <div className="text-center py-6">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="text-sm text-slate-400">Nenhuma conquista disponível ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {templates.map((template) => {
                const isUnlocked = unlockedTypes.has(template.achievement_type);
                const Icon = iconByType[template.achievement_type] || Trophy;
                const unlockedAchievement = achievements.find(
                  a => a.achievement_type === template.achievement_type
                );

                return (
                  <motion.div
                    key={template.achievement_type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl p-3 border transition-all ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
                        : 'bg-slate-700/30 border-slate-700/50 opacity-50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-400'
                          : 'bg-slate-600'
                      }`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`font-semibold text-xs leading-tight ${
                          isUnlocked ? 'text-white' : 'text-slate-400'
                        }`}>
                          {template.achievement_name}
                        </p>
                        {template.achievement_description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {template.achievement_description}
                          </p>
                        )}
                        <Badge className={`mt-1.5 text-xs ${
                          isUnlocked
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-600/50 text-slate-500 border-slate-600/50'
                        }`}>
                          +{template.points_earned} pts
                        </Badge>
                      </div>
                      {isUnlocked && unlockedAchievement?.unlocked_at && (
                        <p className="text-xs text-emerald-500/70">
                          {new Date(unlockedAchievement.unlocked_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

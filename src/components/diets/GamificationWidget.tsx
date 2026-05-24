import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dietConsumptionService, PatientPoints, Achievement } from '@/lib/diet-consumption-service';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Star, Flame, Award, CheckCircle2, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

interface GamificationWidgetProps {
  patientId: string;
}

interface AchievementTemplate {
  achievement_type: string;
  achievement_name: string;
  achievement_description?: string;
  points_earned: number;
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

function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Comece hoje!';
  if (streak >= 30) return 'Imparável! 🏆';
  if (streak >= 7) return 'Semana de ferro! 💪';
  if (streak >= 3) return 'Em chamas!';
  return `${streak} dia${streak > 1 ? 's' : ''} seguido${streak > 1 ? 's' : ''}`;
}

export function GamificationWidget({ patientId }: GamificationWidgetProps) {
  const [points, setPoints] = useState<PatientPoints | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [templates, setTemplates] = useState<AchievementTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
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
      console.error('Erro ao carregar gamificação:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border border-slate-200 rounded-2xl">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  const currentLevel = points?.current_level || 1;
  const totalPoints = points?.total_points || 0;
  const currentStreak = points?.current_streak || 0;

  const levelThresholds = [0, 100, 300, 600, 1000, 1500];
  const getLevelStart = (lvl: number): number =>
    lvl <= 5 ? (levelThresholds[lvl - 1] || 0) : (lvl - 6) * 500 + 1500;
  const getLevelEnd = (lvl: number): number =>
    lvl <= 4 ? levelThresholds[lvl] : lvl === 5 ? 1500 : (lvl - 5) * 500 + 1500;

  const levelStart = getLevelStart(currentLevel);
  const levelEnd = getLevelEnd(currentLevel);
  const pointsInLevel = totalPoints - levelStart;
  const pointsNeeded = levelEnd - levelStart;
  const progress = pointsNeeded > 0 ? Math.min(100, (pointsInLevel / pointsNeeded) * 100) : 100;

  const unlockedTypes = new Set(achievements.map(a => a.achievement_type));
  const streakActive = currentStreak > 0;

  return (
    <div className="space-y-4">
      {/* Streak */}
      <Card className={`rounded-2xl border-2 ${
        streakActive
          ? 'bg-orange-50 border-orange-200'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <motion.span
              key={currentStreak}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-5xl select-none"
            >
              {streakActive ? '🔥' : '💤'}
            </motion.span>
            <div>
              <motion.p
                key={`s-${currentStreak}`}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`text-2xl sm:text-3xl font-bold ${streakActive ? 'text-orange-700' : 'text-slate-500'}`}
              >
                {currentStreak > 0 ? `${currentStreak} dias seguidos` : 'Comece hoje!'}
              </motion.p>
              <p className={`text-sm mt-0.5 font-medium ${streakActive ? 'text-orange-500' : 'text-slate-400'}`}>
                {getStreakMessage(currentStreak)}
              </p>
              {(points?.longest_streak ?? 0) > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Recorde: {points!.longest_streak} dias
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nível + Pontos */}
      <Card className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Nível Atual</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-800">{currentLevel}</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs font-semibold">
                  Nível {currentLevel}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium mb-1">Pontos Totais</p>
              <p className="text-3xl sm:text-4xl font-black text-slate-800">{totalPoints.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Progresso para Nível {currentLevel + 1}</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {Math.max(0, pointsNeeded - pointsInLevel)} pontos para o próximo nível
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Conquistas */}
      <Card className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <CardTitle className="text-base sm:text-lg text-slate-800 flex items-center gap-2 font-bold">
            <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
            Conquistas
            <Badge className="bg-slate-100 text-slate-600 border-slate-300 text-xs ml-1">
              {achievements.length}/{templates.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {templates.length === 0 ? (
            <div className="text-center py-6">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400">Nenhuma conquista disponível ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {templates.map((template) => {
                const isUnlocked = unlockedTypes.has(template.achievement_type);
                const Icon = iconByType[template.achievement_type] || Trophy;
                const unlockedAt = achievements.find(
                  a => a.achievement_type === template.achievement_type
                )?.unlocked_at;

                return (
                  <motion.div
                    key={template.achievement_type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl p-3 border-2 transition-all ${
                      isUnlocked
                        ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                        : 'bg-slate-50 border-slate-200 opacity-50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-400 shadow-sm'
                          : 'bg-slate-200'
                      }`}>
                        <Icon className={`w-5 h-5 ${isUnlocked ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className={`font-semibold text-xs leading-tight ${
                          isUnlocked ? 'text-slate-800' : 'text-slate-500'
                        }`}>
                          {template.achievement_name}
                        </p>
                        {template.achievement_description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {template.achievement_description}
                          </p>
                        )}
                        <Badge className={`mt-1.5 text-xs font-semibold ${
                          isUnlocked
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          +{template.points_earned} pts
                        </Badge>
                        {isUnlocked && unlockedAt && (
                          <p className="text-xs text-emerald-600 mt-1 font-medium">
                            ✓ {new Date(unlockedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </p>
                        )}
                      </div>
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

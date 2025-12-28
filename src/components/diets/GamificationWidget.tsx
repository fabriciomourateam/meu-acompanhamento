import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dietConsumptionService, PatientPoints, Achievement } from '@/lib/diet-consumption-service';
import { Trophy, Star, Flame, Award, TrendingUp, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface GamificationWidgetProps {
  patientId: string;
}

const achievementIcons: { [key: string]: any } = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  award: Award,
};

export function GamificationWidget({ patientId }: GamificationWidgetProps) {
  const [points, setPoints] = useState<PatientPoints | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, [patientId]);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      const [pointsData, achievementsData] = await Promise.all([
        dietConsumptionService.getPatientPoints(patientId),
        dietConsumptionService.getPatientAchievements(patientId),
      ]);
      setPoints(pointsData);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Erro ao carregar dados de gamificação:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentLevel = points?.current_level || 1;
  const totalPoints = points?.total_points || 0;
  const currentStreak = points?.current_streak || 0;

  // Calcular pontos para próximo nível
  const pointsForNextLevel = currentLevel === 1 ? 100 : 
    currentLevel === 2 ? 300 : 
    currentLevel === 3 ? 600 :
    currentLevel === 4 ? 1000 :
    currentLevel === 5 ? 1500 :
    (currentLevel - 5) * 500 + 1500;
  
  const pointsInCurrentLevel = currentLevel === 1 ? totalPoints :
    currentLevel === 2 ? totalPoints - 100 :
    currentLevel === 3 ? totalPoints - 300 :
    currentLevel === 4 ? totalPoints - 600 :
    currentLevel === 5 ? totalPoints - 1000 :
    totalPoints - ((currentLevel - 6) * 500 + 1500);
  
  const pointsNeeded = pointsForNextLevel - (currentLevel === 1 ? 0 : 
    currentLevel === 2 ? 100 :
    currentLevel === 3 ? 300 :
    currentLevel === 4 ? 600 :
    currentLevel === 5 ? 1000 :
    (currentLevel - 6) * 500 + 1500);
  
  const progressToNextLevel = pointsNeeded > 0 ? (pointsInCurrentLevel / pointsNeeded) * 100 : 100;

  return (
    <div className="space-y-4">
      {/* Card de Nível e Pontos */}
      <Card className="bg-gradient-to-br from-[#00C98A] to-[#00A875] rounded-2xl shadow-lg border-0 text-white">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <p className="text-xs sm:text-sm opacity-90 mb-1">Nível Atual</p>
              <p className="text-3xl sm:text-4xl font-bold">{currentLevel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm opacity-90 mb-1">Pontos Totais</p>
              <p className="text-3xl sm:text-4xl font-bold">{totalPoints}</p>
            </div>
          </div>
          
          {/* Barra de Progresso para Próximo Nível */}
          <div className="mb-4">
            <div className="flex justify-between text-xs opacity-90 mb-2">
              <span>Progresso para Nível {currentLevel + 1}</span>
              <span>{Math.round(progressToNextLevel)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <p className="text-xs opacity-75 mt-1">
              {pointsNeeded - pointsInCurrentLevel} pontos para o próximo nível
            </p>
          </div>

          {/* Sequência */}
          {currentStreak > 0 && (
            <div className="flex items-center gap-2 bg-white/20 rounded-lg p-2 sm:p-3">
              <Flame className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{currentStreak} dias seguidos!</p>
                <p className="text-xs opacity-90">Continue assim! 🔥</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conquistas */}
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg text-[#222222] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#00C98A] flex-shrink-0" />
            Conquistas ({achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {achievements.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm sm:text-base text-[#777777]">Nenhuma conquista desbloqueada ainda</p>
              <p className="text-xs sm:text-sm text-[#777777] mt-1">Continue seguindo sua dieta para desbloquear!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((achievement) => {
                const Icon = achievementIcons[achievement.achievement_type] || Trophy;
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-[#00C98A]/10 to-[#00A875]/10 rounded-xl p-3 sm:p-4 border border-[#00C98A]/20"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C98A] to-[#00A875] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#222222] text-xs sm:text-sm">{achievement.achievement_name}</p>
                        {achievement.achievement_description && (
                          <p className="text-xs text-[#777777] mt-1 line-clamp-2">{achievement.achievement_description}</p>
                        )}
                        <Badge className="mt-2 bg-[#00C98A]/20 text-[#00A875] border-[#00C98A]/30 text-xs">
                          +{achievement.points_earned} pts
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {points && (
        <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg text-[#222222] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00C98A] flex-shrink-0" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-[#777777] mb-1">Pontos por Dieta</p>
                <p className="text-xl sm:text-2xl font-bold text-[#222222]">{points.points_diet}</p>
              </div>
              <div>
                <p className="text-xs text-[#777777] mb-1">Pontos por Consistência</p>
                <p className="text-xl sm:text-2xl font-bold text-[#222222]">{points.points_consistency}</p>
              </div>
              <div>
                <p className="text-xs text-[#777777] mb-1">Dias Rastreados</p>
                <p className="text-xl sm:text-2xl font-bold text-[#222222]">{points.total_days_tracked}</p>
              </div>
              <div>
                <p className="text-xs text-[#777777] mb-1">Maior Sequência</p>
                <p className="text-xl sm:text-2xl font-bold text-[#00C98A]">{points.longest_streak}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}












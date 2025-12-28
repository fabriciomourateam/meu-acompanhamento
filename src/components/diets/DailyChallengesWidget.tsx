import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dailyChallengesService, DailyChallenge } from '@/lib/daily-challenges-service';
import { 
  Droplets, 
  Moon, 
  ShieldX, 
  Smartphone, 
  Dumbbell, 
  UtensilsCrossed, 
  Camera, 
  CalendarCheck,
  Check,
  Plus,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface DailyChallengesWidgetProps {
  patientId: string;
}

const iconMap: { [key: string]: any } = {
  Droplets,
  Moon,
  ShieldX,
  Smartphone,
  Dumbbell,
  UtensilsCrossed,
  Camera,
  CalendarCheck,
};

export function DailyChallengesWidget({ patientId }: DailyChallengesWidgetProps) {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, [patientId]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const [allChallenges, completed] = await Promise.all([
        dailyChallengesService.getAllChallenges(),
        dailyChallengesService.getCompletedChallenges(patientId),
      ]);
      setChallenges(allChallenges);
      setCompletedChallenges(new Set(completed));
    } catch (error) {
      console.error('Erro ao carregar desafios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChallenge = async (challengeKey: string) => {
    const isCompleted = completedChallenges.has(challengeKey);
    
    try {
      if (isCompleted) {
        await dailyChallengesService.uncompleteChallenge(patientId, challengeKey);
        setCompletedChallenges(prev => {
          const newSet = new Set(prev);
          newSet.delete(challengeKey);
          return newSet;
        });
        toast({
          title: 'Desafio desmarcado',
          description: 'Você pode tentar novamente amanhã!',
        });
      } else {
        await dailyChallengesService.completeChallenge(patientId, challengeKey);
        setCompletedChallenges(prev => new Set(prev).add(challengeKey));
        const challenge = challenges.find(c => c.challenge_key === challengeKey);
        toast({
          title: 'Desafio completo! 🎉',
          description: `Você ganhou ${challenge?.points_earned || 0} pontos!`,
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar desafio:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o desafio',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = completedChallenges.size;
  const totalPoints = challenges
    .filter(c => completedChallenges.has(c.challenge_key))
    .reduce((sum, c) => sum + c.points_earned, 0);

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <Card className="bg-gradient-to-br from-[#00C98A] to-[#00A875] rounded-2xl shadow-lg border-0 text-white">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm opacity-90 mb-1">Desafios de Hoje</p>
              <p className="text-2xl sm:text-3xl font-bold">
                {completedCount} / {challenges.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm opacity-90 mb-1">Pontos Ganhos</p>
              <p className="text-2xl sm:text-3xl font-bold">+{totalPoints}</p>
            </div>
          </div>
          
          {/* Barra de Progresso */}
          <div className="mt-4">
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / challenges.length) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Desafios */}
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg text-[#222222] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#00C98A] flex-shrink-0" />
            Metas Diárias
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3">
            {challenges.map((challenge) => {
              const isCompleted = completedChallenges.has(challenge.challenge_key);
              const Icon = challenge.icon_name ? iconMap[challenge.icon_name] : UtensilsCrossed;
              
              return (
                <motion.div
                  key={challenge.challenge_key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-xl p-3 sm:p-4 border transition-all duration-200 ${
                    isCompleted
                      ? 'border-[#00C98A] bg-[#00C98A]/5'
                      : 'border-gray-100 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-gradient-to-br from-[#00C98A] to-[#00A875]'
                        : 'bg-gray-100'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      ) : Icon ? (
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isCompleted ? 'text-white' : 'text-gray-500'}`} />
                      ) : (
                        <span className="text-xl sm:text-2xl">{challenge.emoji || '🎯'}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-sm sm:text-base transition-colors ${
                            isCompleted ? 'text-[#00A875] line-through' : 'text-[#222222]'
                          }`}>
                            {challenge.emoji && <span className="mr-2">{challenge.emoji}</span>}
                            {challenge.challenge_name}
                          </h4>
                          <p className="text-xs sm:text-sm text-[#777777] mt-1">
                            {challenge.challenge_description}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={`text-xs ${
                            isCompleted
                              ? 'bg-[#00C98A]/20 text-[#00A875] border-[#00C98A]/30'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            +{challenge.points_earned} pts
                          </Badge>
                          
                          <Button
                            size="sm"
                            onClick={() => handleToggleChallenge(challenge.challenge_key)}
                            className={`w-10 h-10 sm:w-10 sm:h-10 p-0 rounded-full transition-all duration-200 min-h-[44px] min-w-[44px] ${
                              isCompleted
                                ? 'bg-gradient-to-br from-[#00C98A] to-[#00A875] hover:from-[#00A875] hover:to-[#00C98A] text-white shadow-md'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


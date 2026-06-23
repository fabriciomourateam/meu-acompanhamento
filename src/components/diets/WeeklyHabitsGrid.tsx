import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dailyChallengesService } from '@/lib/daily-challenges-service';
import { getSaoPauloISODate, shiftISODate } from '@/lib/utils';
import { Droplets, Dumbbell, Moon, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeeklyHabitsGridProps {
  patientId: string;
}

const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const fullDaysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function WeeklyHabitsGrid({ patientId }: WeeklyHabitsGridProps) {
  const [weeklyData, setWeeklyData] = useState<{
    agua: Set<string>;
    atividade: Set<string>;
    sono: Set<string>;
  }>({
    agua: new Set(),
    atividade: new Set(),
    sono: new Set()
  });
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    loadWeeklyHabits();
  }, [patientId]);

  const loadWeeklyHabits = async () => {
    try {
      setLoading(true);

      // Início e fim da semana atual (domingo a sábado), no fuso de São Paulo —
      // o "dia"/semana vira à meia-noite de Brasília (não no fuso do navegador).
      const todayStr = getSaoPauloISODate();
      const dayOfWeek = new Date(`${todayStr}T12:00:00Z`).getUTCDay(); // 0 = domingo
      const startDate = shiftISODate(todayStr, -dayOfWeek);
      const endDate = shiftISODate(startDate, 6);

      // Buscar desafios completados na semana
      const challenges = await dailyChallengesService.getChallengesHistory(
        patientId,
        startDate,
        endDate
      );

      // Agrupar por tipo de desafio e data
      const aguaDays = new Set(
        challenges
          .filter(c => c.challenge_key === 'hidratacao')
          .map(c => c.completion_date)
      );

      const atividadeDays = new Set(
        challenges
          .filter(c => c.challenge_key === 'atividade_fisica')
          .map(c => c.completion_date)
      );

      const sonoDays = new Set(
        challenges
          .filter(c => c.challenge_key === 'sono_qualidade')
          .map(c => c.completion_date)
      );

      setWeeklyData({
        agua: aguaDays,
        atividade: atividadeDays,
        sono: sonoDays
      });

      // Definir dia atual como selecionado
      setSelectedDay(dayOfWeek);
    } catch (error) {
      console.error('Erro ao carregar hábitos semanais:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateForDay = (dayIndex: number): string => {
    const todayStr = getSaoPauloISODate();
    const dayOfWeek = new Date(`${todayStr}T12:00:00Z`).getUTCDay();
    const sundayStr = shiftISODate(todayStr, -dayOfWeek);
    return shiftISODate(sundayStr, dayIndex);
  };

  const isCompleted = (challengeKey: 'agua' | 'atividade' | 'sono', dayIndex: number): boolean => {
    const date = getDateForDay(dayIndex);
    return weeklyData[challengeKey].has(date);
  };

  const isToday = (dayIndex: number): boolean => {
    return selectedDay === dayIndex;
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const habits = [
    {
      key: 'agua' as const,
      label: 'Hidratação',
      icon: Droplets,
      color: 'blue'
    },
    {
      key: 'atividade' as const,
      label: 'Atividade física',
      icon: Dumbbell,
      color: 'purple'
    },
    {
      key: 'sono' as const,
      label: 'Sono',
      icon: Moon,
      color: 'indigo'
    }
  ];

  return (
    <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-[#222222] dark:text-slate-100 flex items-center gap-2">
          <span className="text-lg">Sua semana</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Layout mobile - empilhado verticalmente */}
        <div className="block md:hidden space-y-4">
          {habits.map((habit, habitIndex) => {
            const Icon = habit.icon;
            const iconColorClass =
              habit.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                habit.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                  'text-indigo-600 dark:text-indigo-400';

            return (
              <motion.div
                key={habit.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: habitIndex * 0.1 }}
                className="border border-gray-100 dark:border-slate-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${iconColorClass}`} />
                  <span className="text-sm font-semibold text-[#222222] dark:text-slate-100">{habit.label}</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {daysOfWeek.map((day, dayIndex) => {
                    const completed = isCompleted(habit.key, dayIndex);
                    const today = isToday(dayIndex);

                    return (
                      <div key={dayIndex} className="flex flex-col items-center gap-1">
                        <div className={`text-xs font-medium ${today ? 'text-[#00C98A] font-bold' : 'text-[#777777] dark:text-slate-400'}`}>
                          {day}
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${completed
                            ? today
                              ? 'bg-[#00C98A] text-white'
                              : 'bg-gray-300 text-white'
                            : 'bg-gray-100 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700'
                            }`}
                        >
                          {completed && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Layout desktop - grid horizontal */}
        <div className="hidden md:block space-y-4">
          {/* Header com dias da semana */}
          <div className="grid grid-cols-8 gap-2 items-center">
            <div className="text-sm font-semibold text-[#222222] dark:text-slate-100">Meta</div>
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className={`text-center text-sm font-medium cursor-pointer transition-colors ${isToday(index)
                  ? 'text-[#00C98A] font-bold'
                  : 'text-[#777777] dark:text-slate-400'
                  }`}
                onClick={() => setSelectedDay(index)}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid de hábitos */}
          {habits.map((habit, habitIndex) => {
            const Icon = habit.icon;
            const iconColorClass =
              habit.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                habit.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                  'text-indigo-600 dark:text-indigo-400';

            return (
              <motion.div
                key={habit.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: habitIndex * 0.1 }}
                className="grid grid-cols-8 gap-2 items-center"
              >
                <div className="flex items-center gap-2 text-sm text-[#222222] dark:text-slate-100 font-medium">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${iconColorClass}`} />
                  <span>{habit.label}</span>
                </div>
                {daysOfWeek.map((_, dayIndex) => {
                  const completed = isCompleted(habit.key, dayIndex);
                  const today = isToday(dayIndex);

                  return (
                    <div
                      key={dayIndex}
                      className="flex items-center justify-center"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${completed
                          ? today
                            ? 'bg-[#00C98A] text-white'
                            : 'bg-gray-300 text-white'
                          : 'bg-gray-100 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700'
                          }`}
                      >
                        {completed && (
                          <Check className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

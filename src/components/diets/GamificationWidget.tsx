import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dietConsumptionService, PatientPoints, Achievement } from '@/lib/diet-consumption-service';
import { achievementsService, CATEGORIES, type AchievementTemplate } from '@/lib/achievements-service';
import { levelsService, type CurrentLevel } from '@/lib/levels-service';
import { WeeklyChallengeCard } from '@/components/patient-portal/WeeklyChallengeCard';
import { Trophy, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface GamificationWidgetProps {
  patientId: string;
  /** Token do portal — quando presente, roda a engine pra desbloquear novas conquistas. */
  token?: string;
  /** Callback pra mudar pra aba de Metas Diarias (do streak vazio: 'Comecar agora'). */
  onGoToMetas?: () => void;
}

function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Comece hoje!';
  if (streak >= 30) return 'Imparável! 🏆';
  if (streak >= 7) return 'Semana de ferro! 💪';
  if (streak >= 3) return 'Em chamas!';
  return `${streak} dia${streak > 1 ? 's' : ''} seguido${streak > 1 ? 's' : ''}`;
}

export function GamificationWidget({ patientId, token, onGoToMetas }: GamificationWidgetProps) {
  const [points, setPoints] = useState<PatientPoints | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [templates, setTemplates] = useState<AchievementTemplate[]>([]);
  const [levelData, setLevelData] = useState<CurrentLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [patientId, token]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Se tem token, roda a engine pra desbloquear conquistas novas baseadas em
      // métricas (treinos, cardios, streak, etc). Idempotente.
      if (token) {
        try {
          await achievementsService.evaluateByToken(token);
        } catch (e) {
          console.warn('Engine de conquistas falhou (ignorando):', e);
        }
      }
      const [pointsData, achievementsData, catalog, level] = await Promise.all([
        dietConsumptionService.getPatientPoints(patientId),
        dietConsumptionService.getPatientAchievements(patientId),
        achievementsService.getCatalog(),
        token ? levelsService.getByToken(token) : Promise.resolve(null),
      ]);
      setPoints(pointsData);
      setAchievements(achievementsData);
      setTemplates(catalog);
      setLevelData(level);
    } catch (error) {
      console.error('Erro ao carregar gamificação:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  const totalPoints = levelData?.total_points ?? points?.total_points ?? 0;
  const currentStreak = points?.current_streak || 0;
  // Nível: prefere o dado real do banco; fallback ao current_level legado.
  const levelName = levelData?.current_name || `Nível ${points?.current_level || 1}`;
  const levelEmoji = levelData?.current_emoji || '⭐';
  const levelColor = levelData?.current_color || 'from-[#00C98A] to-[#00A875]';
  const nextLevelName = levelData?.next_name || null;
  const nextMin = levelData?.next_min_points || null;
  const progress = levelData?.progress_pct ?? 0;
  const pointsToNext = nextMin != null ? Math.max(0, nextMin - totalPoints) : 0;

  const unlockedTypes = new Set(achievements.map(a => a.achievement_type));
  const streakActive = currentStreak > 0;
  // Templates visíveis: ocultam secretas não desbloqueadas.
  const visibleTemplates = templates.filter(
    (t) => !t.is_secret || unlockedTypes.has(t.achievement_type),
  );
  const availableCategories = Array.from(
    new Set(visibleTemplates.map((t) => t.category).filter(Boolean) as string[]),
  ).sort();
  const filteredTemplates =
    selectedCategory === 'all'
      ? visibleTemplates
      : visibleTemplates.filter((t) => t.category === selectedCategory);

  // Card de Streak (extraido pra controlar a ordem: streak ativo vai antes do
  // card de Nivel; streak vazio com CTA vai DEPOIS — ao acessar a aba, o aluno
  // ve primeiro o card de Nivel que e a info principal, depois o convite pra
  // comecar a sequencia).
  const streakCard = (
    <Card className={`rounded-2xl border-0 overflow-hidden shadow-lg ${
      streakActive ? '' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm'
    }`}>
      {streakActive ? (
        <div className="bg-gradient-to-br from-orange-500 via-orange-400 to-red-500 p-4 sm:p-6 relative overflow-hidden">
          {/* Glow decorativo */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-yellow-300/30 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-red-600/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <motion.div
              key={currentStreak}
              initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="text-6xl sm:text-7xl select-none drop-shadow-lg"
            >
              🔥
            </motion.div>
            <div className="flex-1">
              <motion.p
                key={`s-${currentStreak}`}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-3xl sm:text-4xl font-black text-white drop-shadow"
              >
                {currentStreak} dias
              </motion.p>
              <p className="text-base sm:text-lg font-semibold text-orange-100 mt-0.5">
                {getStreakMessage(currentStreak)}
              </p>
              {(points?.longest_streak ?? 0) > 0 && (
                <p className="text-xs text-orange-200/80 mt-1.5 flex items-center gap-1">
                  <span>🏅</span> Recorde: {points!.longest_streak} dias
                </p>
              )}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-4xl font-black text-white/20 select-none leading-none">🔥</p>
            </div>
          </div>
        </div>
      ) : (
        <CardContent className="p-4 sm:p-5 flex items-center gap-4">
          <motion.span
            initial={{ scale: 0.7, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-4xl select-none"
          >
            ✨
          </motion.span>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-700 dark:text-slate-200">Sua sequência começa hoje 🔥</p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Marque a primeira meta e veja o fogo acender.
            </p>
          </div>
          {onGoToMetas && (
            <button
              type="button"
              onClick={onGoToMetas}
              className="shrink-0 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-semibold px-3 py-1.5 shadow-sm shadow-orange-500/30 hover:shadow-md hover:shadow-orange-500/40 transition-all"
            >
              Ir pra Metas →
            </button>
          )}
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Streak ativo aparece NO TOPO (destaque do progresso do aluno) */}
      {streakActive && streakCard}

      {/* Nível + Pontos — cor real do nível do banco */}
      <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
        <div className={`bg-gradient-to-br ${levelColor} p-4 sm:p-6 relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 dark:bg-slate-950/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-white/70 font-medium uppercase tracking-wider mb-1">Nível Atual</p>
                <div className="flex items-center gap-2.5">
                  <span className="text-5xl sm:text-6xl leading-none select-none drop-shadow-lg">{levelEmoji}</span>
                  <div className="flex flex-col">
                    <span className="text-2xl sm:text-3xl font-black text-white leading-tight">{levelName}</span>
                    {nextLevelName && (
                      <span className="text-xs text-white/70 mt-0.5">Próximo: {nextLevelName}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/70 font-medium uppercase tracking-wider mb-1">Pontos</p>
                <p className="text-4xl sm:text-5xl font-black text-white leading-none">{totalPoints.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/70 mb-1.5">
                <span>{nextLevelName ? `Para ${nextLevelName}` : 'Nível máximo'}</span>
                <span className="font-bold text-white">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/20 dark:bg-slate-950/20 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-white dark:bg-slate-900 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                />
              </div>
              <p className="text-xs text-white/60 mt-1.5">
                {nextLevelName
                  ? `${pointsToNext.toLocaleString('pt-BR')} pontos para o próximo nível`
                  : 'Você chegou ao topo 🏆'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Streak vazio (CTA) aparece DEPOIS do card de Nivel — o aluno ja viu
          o nivel/pontos primeiro, e o card 'Sua sequencia comeca hoje' fica
          como convite logo abaixo, perto do botao 'Ir pra Metas'. */}
      {!streakActive && streakCard}

      {/* Desafio da Semana — aparece se o trainer definiu um pra esta semana */}
      {token && <WeeklyChallengeCard token={token} />}

      {/* Conquistas */}
      <Card className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <CardTitle className="text-base sm:text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2 font-bold">
              <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
              Conquistas
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 text-xs ml-1">
                {achievements.length}/{visibleTemplates.length}
              </Badge>
            </CardTitle>
          </div>
          {/* Filtro por categoria */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`text-xs rounded-full px-2.5 py-1 font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            {availableCategories.map((c) => {
              const meta = CATEGORIES.find((x) => x.value === c);
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`text-xs rounded-full px-2.5 py-1 font-medium transition-colors ${
                    selectedCategory === c
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {meta?.emoji} {meta?.label || c}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-6">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma conquista nessa categoria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredTemplates.map((template) => {
                const isUnlocked = unlockedTypes.has(template.achievement_type);
                const unlockedAt = achievements.find(
                  (a) => a.achievement_type === template.achievement_type,
                )?.unlocked_at;
                const isSecret = template.is_secret && !isUnlocked;
                const gradient = template.color || 'from-amber-500 to-yellow-500';

                return (
                  <motion.div
                    key={template.achievement_type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl p-3 border-2 transition-all ${
                      isUnlocked
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                          isUnlocked
                            ? `bg-gradient-to-br ${gradient}`
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        {isSecret ? (
                          <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        ) : (
                          <span className="text-2xl leading-none">
                            {template.emoji || '🏆'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-semibold text-xs leading-tight ${
                            isUnlocked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {isSecret ? '???' : template.achievement_name}
                        </p>
                        {!isSecret && template.achievement_description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {template.achievement_description}
                          </p>
                        )}
                        <Badge
                          className={`mt-1.5 text-xs font-semibold ${
                            isUnlocked
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          +{template.points_earned} pts
                        </Badge>
                        {isUnlocked && unlockedAt && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                            ✓ {new Date(unlockedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: '2-digit',
                            })}
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

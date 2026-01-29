import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { dietService } from '@/lib/diet-service';
import { calcularTotaisPlano } from '@/utils/diet-calculations';
import { DailyChallengesWidget } from '@/components/diets/DailyChallengesWidget';
import { WeeklyProgressChart } from '@/components/diets/WeeklyProgressChart';
import { WeeklyHabitsGrid } from '@/components/diets/WeeklyHabitsGrid';
import { GamificationWidget } from '@/components/diets/GamificationWidget';
import { PatientEvolutionTab } from '@/components/diets/PatientEvolutionTab';
import { AdherenceCharts } from '@/components/diets/AdherenceCharts';
import { ExamsHistory } from '@/components/exams/ExamsHistory';
import {
  Utensils,
  Calendar,
  Check,
  Plus,
  X,
  ChevronRight,
  CheckCircle,
  Package,
  AlertTriangle,
  BookOpen,
  Info,
  RefreshCw
} from 'lucide-react';
import { dietConsumptionService } from '@/lib/diet-consumption-service';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface PatientDietPortalProps {
  patientId: string;
  patientName: string;
  checkins?: any[];
  patient?: any;
  bodyCompositions?: any[];
  achievements?: any[];
  refreshTrigger?: number; // Trigger para forçar atualização dos gráficos
}

export function PatientDietPortal({
  patientId,
  patientName,
  checkins,
  patient,
  bodyCompositions,
  achievements,
  refreshTrigger
}: PatientDietPortalProps) {
  const { toast } = useToast();
  const [activePlan, setActivePlan] = useState<any>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [consumedMeals, setConsumedMeals] = useState<Set<string>>(new Set());
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  const [substitutionsModalOpen, setSubstitutionsModalOpen] = useState(false);
  const [selectedFoodSubstitutions, setSelectedFoodSubstitutions] = useState<{
    foodName: string;
    substitutions: any[];
  } | null>(null);
  const [releasedPlans, setReleasedPlans] = useState<any[]>([]);

  useEffect(() => {
    loadDietData();
  }, [patientId]);

  useEffect(() => {
    // Carregar refeições consumidas do localStorage
    const today = new Date().toISOString().split('T')[0];
    const key = `consumedMeals_${patientId}_${today}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setConsumedMeals(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Erro ao carregar refeições consumidas:', e);
      }
    }
  }, [patientId]);

  const loadDietData = async () => {
    try {
      setLoading(true);

      // Buscar planos do paciente
      const plans = await dietService.getByPatientId(patientId);

      // Filtrar apenas planos liberados (is_released = true)
      const released = plans.filter((p: any) => p.is_released === true);
      setReleasedPlans(released);

      // Encontrar plano ativo entre os liberados
      const active = released.find((p: any) => p.status === 'active' || p.active);

      // Se não houver plano ativo, pegar o primeiro liberado
      const selectedPlan = active || released[0];

      if (selectedPlan) {
        setActivePlan(selectedPlan);

        // Se os dados já vêm completos do getByPatientId, usar diretamente
        if (selectedPlan.diet_meals && Array.isArray(selectedPlan.diet_meals) && selectedPlan.diet_meals.length > 0) {
          // Garantir que cada refeição tenha diet_foods como array
          selectedPlan.diet_meals = selectedPlan.diet_meals.map((meal: any) => {
            if (!Array.isArray(meal.diet_foods)) {
              meal.diet_foods = [];
            }
            return meal;
          });

          setPlanDetails(selectedPlan);
        } else {
          // Caso contrário, buscar detalhes completos do plano usando getById
          // O getById agora tem fallback para buscar dados separadamente se necessário
          try {
            const details = await dietService.getById(selectedPlan.id);

            // Garantir que diet_meals seja sempre um array
            if (details && !Array.isArray(details.diet_meals)) {
              details.diet_meals = [];
            }

            // Garantir que cada refeição tenha diet_foods como array
            if (details && Array.isArray(details.diet_meals)) {
              details.diet_meals = details.diet_meals.map((meal: any) => {
                if (!Array.isArray(meal.diet_foods)) {
                  meal.diet_foods = [];
                }
                return meal;
              });
            }

            setPlanDetails(details);
          } catch (error) {
            console.error('Erro ao buscar detalhes do plano:', error);
            toast({
              title: 'Erro',
              description: 'Não foi possível carregar os detalhes do plano alimentar',
              variant: 'destructive'
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados da dieta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da dieta',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (planId: string) => {
    try {
      setLoading(true);
      const plan = releasedPlans.find((p: any) => p.id === planId);
      if (plan) {
        setActivePlan(plan);
        const details = await dietService.getById(plan.id);

        // Garantir que diet_meals seja sempre um array
        if (details && !Array.isArray(details.diet_meals)) {
          details.diet_meals = [];
        }

        // Garantir que cada refeição tenha diet_foods como array
        if (details && Array.isArray(details.diet_meals)) {
          details.diet_meals = details.diet_meals.map((meal: any) => {
            if (!Array.isArray(meal.diet_foods)) {
              meal.diet_foods = [];
            }
            return meal;
          });
        }

        setPlanDetails(details);

        // Limpar refeições consumidas ao trocar de plano
        setConsumedMeals(new Set());

        toast({
          title: 'Plano alterado',
          description: `Agora visualizando: ${plan.name}`,
        });
      }
    } catch (error) {
      console.error('Erro ao trocar de plano:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o plano selecionado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMealConsumed = async (mealId: string) => {
    const newConsumedMeals = new Set(consumedMeals);

    if (newConsumedMeals.has(mealId)) {
      newConsumedMeals.delete(mealId);
    } else {
      newConsumedMeals.add(mealId);
    }

    setConsumedMeals(newConsumedMeals);

    // Verificar se completou todas as refeições do plano
    if (!newConsumedMeals.has(mealId) === false && planDetails?.diet_meals) {
      const allMealsConsumed = planDetails.diet_meals.every((meal: any) =>
        meal.id === mealId || newConsumedMeals.has(meal.id)
      );

      if (allMealsConsumed) {
        // Disparar confete!
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
          return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#00C98A', '#00A875', '#ffffff']
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#00C98A', '#00A875', '#ffffff']
          });
        }, 250);

        toast({
          title: "Parabéns! 🎉",
          description: "Você completou todas as refeições de hoje! Continue assim!",
          className: "bg-green-500 text-white border-green-600"
        });
      }
    }

    // Salvar no localStorage
    const today = new Date().toISOString().split('T')[0];
    const key = `consumedMeals_${patientId}_${today}`;
    localStorage.setItem(key, JSON.stringify(Array.from(newConsumedMeals)));

    // Sincronizar com banco de dados
    if (planDetails) {
      try {
        await dietConsumptionService.saveDailyConsumption(
          patientId,
          planDetails.id,
          Array.from(newConsumedMeals),
          planDetails
        );

        // Verificar conquistas
        await dietConsumptionService.checkAndUnlockAchievements(patientId);
      } catch (error) {
        console.error('Erro ao salvar consumo:', error);
      }
    }
  };

  const calcularTotais = (plan: any) => {
    if (!plan || !plan.diet_meals) {
      return { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
    }
    return calcularTotaisPlano(plan);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Remover o return early - mostrar abas mesmo sem plano ativo
  const hasActivePlan = activePlan && planDetails;

  const totais = hasActivePlan ? calcularTotais(planDetails) : { calorias: 0, carboidratos: 0, proteinas: 0, gorduras: 0 };
  const metaCalorias = totais.calorias;
  const metaCarboidratos = totais.carboidratos;
  const metaProteinas = totais.proteinas;
  const metaGorduras = totais.gorduras;

  let caloriasConsumidas = 0;
  let carboidratosConsumidos = 0;
  let proteinasConsumidas = 0;
  let gordurasConsumidas = 0;

  if (hasActivePlan && planDetails?.diet_meals && consumedMeals.size > 0) {
    planDetails.diet_meals.forEach((meal: any) => {
      if (consumedMeals.has(meal.id)) {
        const mealTotals = calcularTotaisPlano({ diet_meals: [meal] });
        caloriasConsumidas += mealTotals.calorias;
        carboidratosConsumidos += mealTotals.carboidratos;
        proteinasConsumidas += mealTotals.proteinas;
        gordurasConsumidas += mealTotals.gorduras;
      }
    });
  }

  const caloriasRestantes = Math.max(0, metaCalorias - caloriasConsumidas);
  const percentualConsumido = metaCalorias > 0 ? Math.min(100, (caloriasConsumidas / metaCalorias) * 100) : 0;

  return (
    <div className="space-y-6 bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-700/50">
      {/* Seletor de Planos (quando houver múltiplos planos liberados) */}
      {releasedPlans.length > 1 && (
        <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20 shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-100 mb-1">Plano Alimentar Ativo</p>
                <p className="text-xs text-slate-400">Você tem {releasedPlans.length} planos disponíveis</p>
              </div>
              <Select value={activePlan?.id} onValueChange={handleChangePlan}>
                <SelectTrigger className="w-full sm:w-[280px] bg-slate-800/80 border-slate-700 text-white min-h-[44px]">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {releasedPlans.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id} className="py-3 hover:bg-slate-700 focus:bg-slate-700 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{plan.name}</span>
                        {(plan.status === 'active' || plan.active) && (
                          <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex-shrink-0">
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Abas: Plano Alimentar, Metas, Resultados e Ranking */}
      <Tabs defaultValue="diet" className="w-full">
        {/* Desktop: abas em linha */}
        <TabsList className="sticky top-0 z-50 hidden sm:grid w-full grid-cols-4 bg-slate-800/80 backdrop-blur-md p-1 border-b border-slate-700/50 shadow-lg rounded-t-lg">
          <TabsTrigger value="diet" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm text-slate-400 text-sm py-2.5 rounded-md transition-all">
            Plano Alimentar
          </TabsTrigger>
          <TabsTrigger value="challenges" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm text-slate-400 text-sm py-2.5 rounded-md transition-all">
            Metas
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm text-slate-400 text-sm py-2.5 rounded-md transition-all">
            Meus Resultados
          </TabsTrigger>
          <TabsTrigger value="ranking" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm text-slate-400 text-sm py-2.5 rounded-md transition-all">
            Ranking & Conquistas
          </TabsTrigger>
        </TabsList>

        {/* Mobile: grid 4 colunas com ícones */}
        <div className="sticky top-0 z-50 sm:hidden bg-slate-800/90 backdrop-blur-md p-2 border-b border-slate-700/50 shadow-lg rounded-t-lg">
          <TabsList className="grid grid-cols-4 gap-2 bg-transparent h-auto">
            <TabsTrigger value="diet" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm bg-slate-800/40 text-slate-400 text-xs py-3 px-1 rounded-lg flex flex-col items-center gap-1 h-auto border border-transparent data-[state=active]:border-emerald-500/30">
              <span className="text-lg">🍽️</span>
              <span>Plano</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm bg-slate-800/40 text-slate-400 text-xs py-3 px-1 rounded-lg flex flex-col items-center gap-1 h-auto border border-transparent data-[state=active]:border-emerald-500/30">
              <span className="text-lg">🎯</span>
              <span>Metas</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm bg-slate-800/40 text-slate-400 text-xs py-3 px-1 rounded-lg flex flex-col items-center gap-1 h-auto border border-transparent data-[state=active]:border-emerald-500/30">
              <span className="text-lg">📊</span>
              <span>Resultados</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm bg-slate-800/40 text-slate-400 text-xs py-3 px-1 rounded-lg flex flex-col items-center gap-1 h-auto border border-transparent data-[state=active]:border-emerald-500/30">
              <span className="text-lg">🏆</span>
              <span>Ranking</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Aba: Plano Alimentar + Orientações + Exames */}
        <TabsContent value="diet" className="mt-6 space-y-6">
          {!hasActivePlan ? (
            <Card className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50">
              <CardContent className="p-6 sm:p-8 text-center">
                <Utensils className="w-12 h-12 sm:w-16 sm:h-16 text-slate-500 mx-auto mb-3 sm:mb-4 opacity-50" />
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Nenhum Plano Alimentar Ativo</h3>
                <p className="text-sm sm:text-base text-slate-400">
                  Seu nutricionista ainda não liberou um plano alimentar para você.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Resumo de Calorias e Macros */}
              <Card className="bg-emerald-500/5 rounded-2xl shadow-lg border border-emerald-500/10 hover:shadow-emerald-500/5 transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
                    {/* Círculo de Progresso de Calorias */}
                    <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-3 sm:mb-4">
                      <svg className="transform -rotate-90 w-40 h-40 sm:w-48 sm:h-48">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="10"
                          fill="none"
                          className="sm:hidden"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="url(#emerald-gradient)"
                          strokeWidth="10"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 70}`}
                          strokeDashoffset={`${2 * Math.PI * 70 * (1 - percentualConsumido / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-500 sm:hidden"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="84"
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="12"
                          fill="none"
                          className="hidden sm:block"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="84"
                          stroke="url(#emerald-gradient)"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 84}`}
                          strokeDashoffset={`${2 * Math.PI * 84 * (1 - percentualConsumido / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-500 hidden sm:block"
                        />
                        <defs>
                          <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-3xl sm:text-4xl font-bold text-white drop-shadow-glow-sm">{Math.round(caloriasRestantes)}</p>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Kcal restantes</p>
                      </div>
                    </div>

                    {/* Informações de Consumo */}
                    <div className="flex gap-4 sm:gap-6 text-center">
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-white">{Math.round(caloriasConsumidas)}</p>
                        <p className="text-xs text-slate-400 mt-1 font-medium text-emerald-400/80">Consumidas</p>
                      </div>
                      <div className="w-px bg-slate-700/50"></div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-slate-400">{Math.round(metaCalorias)}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Meta do dia</p>
                      </div>
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-700/50">
                    <div className="text-center px-1">
                      <p className="text-sm sm:text-lg font-semibold text-white whitespace-nowrap">
                        {carboidratosConsumidos.toFixed(0)} <span className="text-xs text-slate-500 font-normal">/ {metaCarboidratos.toFixed(0)}g</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Carboidratos</p>
                      <div className="mt-2 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                          style={{ width: `${Math.min((carboidratosConsumidos / metaCarboidratos) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-center px-1">
                      <p className="text-sm sm:text-lg font-semibold text-white whitespace-nowrap">
                        {proteinasConsumidas.toFixed(0)} <span className="text-xs text-slate-500 font-normal">/ {metaProteinas.toFixed(0)}g</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Proteínas</p>
                      <div className="mt-2 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                          style={{ width: `${Math.min((proteinasConsumidas / metaProteinas) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-center px-1">
                      <p className="text-sm sm:text-lg font-semibold text-white whitespace-nowrap">
                        {gordurasConsumidas.toFixed(0)} <span className="text-xs text-slate-500 font-normal">/ {metaGorduras.toFixed(0)}g</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Gorduras</p>
                      <div className="mt-2 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                          style={{ width: `${Math.min((gordurasConsumidas / metaGorduras) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Refeições e Substituições - Conteúdo original */}
              {hasActivePlan && planDetails?.diet_meals && planDetails.diet_meals.length > 0 && (
                <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-[#222222] flex items-center gap-2">
                          <Utensils className="w-5 h-5 text-[#00C98A]" />
                          Hoje
                        </CardTitle>
                        <p className="text-sm text-[#777777] mt-1">
                          {consumedMeals.size} de {planDetails.diet_meals.length} refeições consumidas
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#777777]">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    </div>

                    {/* Barra de Progresso Geral */}
                    <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#00C98A] to-[#00A875] h-full rounded-full transition-all duration-500"
                        style={{ width: `${(consumedMeals.size / planDetails.diet_meals.length) * 100}%` }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {planDetails.diet_meals
                        .sort((a: any, b: any) => (a.meal_order || 0) - (b.meal_order || 0))
                        .map((meal: any, index: number) => {
                          const mealTotals = calcularTotaisPlano({ diet_meals: [meal] });
                          const isConsumed = consumedMeals.has(meal.id);
                          const isExpanded = expandedMeals.has(meal.id);

                          return (
                            <Collapsible
                              key={meal.id || index}
                              open={isExpanded}
                              onOpenChange={(open) => {
                                setExpandedMeals(prev => {
                                  const newSet = new Set(prev);
                                  if (open) {
                                    newSet.add(meal.id);
                                  } else {
                                    newSet.delete(meal.id);
                                  }
                                  return newSet;
                                });
                              }}
                            >
                              <div
                                className={`rounded-xl border transition-all duration-300 transform hover:scale-[1.01] ${isConsumed
                                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                  : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:shadow-xl'
                                  }`}
                              >
                                <CollapsibleTrigger asChild>
                                  <div className="flex items-center justify-between p-3 sm:p-4 cursor-pointer rounded-t-xl transition-all duration-200">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                      <div
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${isConsumed
                                          ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                          : 'bg-slate-700/50 text-slate-400'
                                          }`}
                                      >
                                        {isConsumed ? (
                                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        ) : (
                                          <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                          <h4 className={`text-sm sm:text-base font-semibold transition-colors truncate ${isConsumed ? 'text-emerald-400' : 'text-white'
                                            }`}>
                                            {meal.meal_name}
                                          </h4>
                                          {meal.suggested_time && (
                                            <Badge className="bg-purple-50 text-purple-600 border-purple-200 border text-xs w-fit">
                                              {meal.suggested_time}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right flex items-center gap-1 sm:gap-3 flex-shrink-0">
                                      <Badge className={`text-xs sm:text-sm font-semibold border hidden sm:inline-flex ${isConsumed
                                        ? 'bg-[#00C98A]/20 text-[#00C98A] border-[#00C98A]/30'
                                        : 'bg-blue-100 text-blue-700 border-blue-300'
                                        }`}>
                                        {isConsumed ? mealTotals.calorias : 0} / {mealTotals.calorias} kcal
                                      </Badge>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleMealConsumed(meal.id);
                                        }}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full transition-all duration-200 min-h-[44px] min-w-[44px] ${isConsumed
                                          ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 hover:brightness-110 text-white shadow-lg'
                                          : 'bg-slate-700/50 hover:bg-slate-600 text-slate-400 border border-slate-600'
                                          }`}
                                      >
                                        {isConsumed ? (
                                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                        ) : (
                                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                        )}
                                      </Button>
                                      <ChevronRight
                                        className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''
                                          }`}
                                      />
                                    </div>
                                  </div>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                  <div className={`px-4 pb-4 space-y-3 transition-all duration-300 ${isConsumed ? 'opacity-75' : ''}`}>
                                    {meal.diet_foods && meal.diet_foods.length > 0 ? (
                                      <div className="space-y-2">
                                        {meal.diet_foods.map((food: any, foodIndex: number) => {
                                          let substitutions: any[] = [];
                                          try {
                                            if (food.notes) {
                                              const parsed = JSON.parse(food.notes);
                                              if (parsed.substitutions && Array.isArray(parsed.substitutions)) {
                                                substitutions = parsed.substitutions;
                                              }
                                            }
                                          } catch (e) {
                                            // Se não for JSON válido, não há substituições
                                          }

                                          return (
                                            <div
                                              key={food.id || foodIndex}
                                              className={`p-2 sm:p-3 rounded-lg border transition-all duration-300 bg-slate-800/40 gap-2 ${isConsumed
                                                ? 'border-emerald-500/30 opacity-75'
                                                : 'border-slate-700/50 hover:border-emerald-500/40 hover:shadow-lg'
                                                }`}
                                            >
                                              <div className="flex items-start sm:items-center justify-between gap-2">
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                  {isConsumed && (
                                                    <CheckCircle className="w-4 h-4 text-[#00C98A] flex-shrink-0 mt-0.5" />
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <span className={`font-medium text-xs sm:text-sm block ${isConsumed ? 'text-[#00C98A] line-through' : 'text-[#222222]'
                                                      }`}>
                                                      {food.food_name}
                                                    </span>
                                                    <Badge className={`text-xs font-medium mt-1 inline-flex ${isConsumed
                                                      ? 'bg-[#00C98A]/20 text-[#00C98A] border-[#00C98A]/30'
                                                      : 'bg-gray-100 text-gray-600 border-gray-200'
                                                      } border`}>
                                                      {food.quantity} {food.unit === 'unidade' && food.quantity > 1 ? 'unidades' : food.unit}
                                                    </Badge>
                                                  </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                                                  {substitutions.length > 0 && !isConsumed && (
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFoodSubstitutions({
                                                          foodName: food.food_name,
                                                          substitutions: substitutions
                                                        });
                                                        setSubstitutionsModalOpen(true);
                                                      }}
                                                      className="h-7 sm:h-8 px-2 text-xs bg-[#00C98A]/10 hover:bg-[#00C98A]/20 text-[#00C98A] border border-[#00C98A]/30 min-h-[44px]"
                                                    >
                                                      <RefreshCw className="w-3 h-3 mr-1" />
                                                      <span className="hidden sm:inline">Substituições</span>
                                                      <span className="sm:hidden">Trocar</span>
                                                    </Button>
                                                  )}
                                                  {food.calories && (
                                                    <Badge className={`text-xs font-medium text-right min-w-[60px] sm:min-w-[70px] ${isConsumed
                                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                      : 'bg-blue-500/10 text-cyan-400 border-cyan-500/20'
                                                      } border`}>
                                                      {food.calories} kcal
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-[#777777] text-center py-4">Nenhum alimento adicionado</p>
                                    )}
                                    {meal.instructions && (
                                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-xs text-amber-700 font-medium mb-1 flex items-center gap-2">
                                          <AlertTriangle className="w-3 h-3" />
                                          Instruções:
                                        </p>
                                        <p className="text-sm text-amber-800 leading-relaxed">{meal.instructions}</p>
                                      </div>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mensagem quando não há refeições */}
              {hasActivePlan && planDetails && (!planDetails.diet_meals || planDetails.diet_meals.length === 0) && (
                <Card className="bg-white rounded-2xl shadow-sm border border-amber-200">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-amber-500 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-bold text-[#222222] mb-2">Refeições não disponíveis</h3>
                    <p className="text-sm sm:text-base text-[#777777] mb-4">
                      Não foi possível carregar as refeições deste plano alimentar.
                    </p>
                    <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                      <strong>Possível causa:</strong> As políticas de segurança (RLS) do Supabase podem estar bloqueando o acesso.
                      Verifique se as políticas RLS para as tabelas <code>diet_meals</code> e <code>diet_foods</code> permitem leitura para usuários anônimos ou autenticados.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Orientações - Movido para o final da aba Plano */}
              {hasActivePlan && planDetails?.diet_guidelines && planDetails.diet_guidelines.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#222222] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#00C98A]" />
                    Orientações Nutricionais
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {planDetails.diet_guidelines.map((guideline: any, index: number) => (
                      <Card key={guideline.id || index} className="bg-white hover:bg-gray-50 transition-colors border-l-4 border-l-[#00C98A]">
                        <CardContent className="p-4">
                          <p className="font-semibold text-sm sm:text-base text-[#222222] mb-2">{guideline.title}</p>
                          <p className="text-xs sm:text-sm text-[#777777] leading-relaxed mb-3">{guideline.content}</p>
                          <Badge className="bg-[#00C98A]/20 text-[#00C98A] border-[#00C98A]/30 text-xs">
                            {guideline.guideline_type}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico de Exames - Movido para o final da aba Plano */}
              {patient?.telefone && (
                <div className="space-y-4">
                  <ExamsHistory
                    patientId={patient?.id}
                    telefone={patient.telefone}
                    onUpdate={() => {
                      // Recarregar se necessário
                    }}
                    refreshTrigger={refreshTrigger}
                    allowDelete={true} // Portal do paciente permite deletar
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Aba: Metas (com histórico semanal) */}
        <TabsContent value="challenges" className="mt-6 space-y-6">
          <DailyChallengesWidget patientId={patientId} />
          <WeeklyHabitsGrid patientId={patientId} />
        </TabsContent>

        {/* Aba: Resultados (Fusão de Progresso e Evolução) */}
        <TabsContent value="results" className="mt-6 space-y-8">
          {/* Seção 1: Evolução Corporal (o mais importante para o aluno) */}
          <section>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-2xl drop-shadow-glow-sm">⚖️</span> Evolução Corporal
            </h3>
            <PatientEvolutionTab
              patientId={patientId}
              checkins={checkins}
              patient={patient}
              bodyCompositions={bodyCompositions}
              achievements={achievements}
              refreshTrigger={refreshTrigger}
            />
          </section>

          {/* Seção 2: Adesão à Dieta */}
          <section className="mt-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-2xl drop-shadow-glow-sm">📊</span> Adesão ao Plano
            </h3>
            <div className="space-y-6">
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-1 border border-slate-700/50">
                <WeeklyProgressChart patientId={patientId} />
              </div>
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-1 border border-slate-700/50">
                <AdherenceCharts patientId={patientId} lowAdherenceThreshold={70} />
              </div>
            </div>
          </section>
        </TabsContent>

        {/* Aba: Ranking & Conquistas */}
        <TabsContent value="ranking" className="mt-6">
          <GamificationWidget patientId={patientId} />
        </TabsContent>
      </Tabs>

      {/* Modal de Substituições */}
      <Dialog open={substitutionsModalOpen} onOpenChange={setSubstitutionsModalOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="relative pb-4 border-b border-slate-800">
            <button
              onClick={() => setSubstitutionsModalOpen(false)}
              className="absolute right-0 top-0 rounded-full p-2 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
            <DialogTitle className="text-white text-lg sm:text-xl font-bold flex items-center gap-2 pr-12">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin-slow" />
              <span className="truncate">Opções de Substituição</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-400 pr-8">
              Você pode substituir <strong className="text-emerald-400">{selectedFoodSubstitutions?.foodName}</strong> por qualquer uma das opções abaixo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-2 mt-4 custom-scrollbar">
            {selectedFoodSubstitutions?.substitutions.map((sub: any, index: number) => (
              <div
                key={index}
                className="p-3 sm:p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm sm:text-base truncate">
                      {sub.food_name}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Quantidade: <span className="font-medium text-emerald-400">{sub.quantity} {sub.unit}</span>
                      {sub.custom_unit_name && (
                        <span className="ml-2 text-xs block sm:inline mt-1 sm:mt-0 opacity-70">
                          ({sub.custom_unit_name}: {sub.custom_unit_grams}g)
                        </span>
                      )}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <p className="text-xs text-cyan-400 flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>
                Essas são opções equivalentes que você pode usar no lugar do alimento original.
              </span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


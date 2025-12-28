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
import { GamificationWidget } from '@/components/diets/GamificationWidget';
import { PatientEvolutionTab } from '@/components/diets/PatientEvolutionTab';
import { AdherenceCharts } from '@/components/diets/AdherenceCharts';
import { ExamsHistory } from '@/components/exams/ExamsHistory';
import { 
  Utensils, 
  Calendar, 
  Check, 
  Plus, 
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
        
        // Buscar detalhes completos do plano
        const details = await dietService.getById(selectedPlan.id);
        setPlanDetails(details);
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
    <div className="space-y-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      {/* Seletor de Planos (quando houver múltiplos planos liberados) */}
      {releasedPlans.length > 1 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#222222] mb-1">Plano Alimentar Ativo</p>
                <p className="text-xs text-[#777777]">Você tem {releasedPlans.length} planos disponíveis</p>
              </div>
              <Select value={activePlan?.id} onValueChange={handleChangePlan}>
                <SelectTrigger className="w-full sm:w-[280px] bg-white border-green-300 text-[#222222] min-h-[44px]">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {releasedPlans.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id} className="py-3">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-[#00C98A] flex-shrink-0" />
                        <span className="truncate">{plan.name}</span>
                        {(plan.status === 'active' || plan.active) && (
                          <Badge className="ml-2 bg-[#00C98A]/20 text-[#00C98A] border-[#00C98A]/30 flex-shrink-0">
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
      
      {/* Abas: Plano Alimentar, Metas, Progresso, Conquistas e Minha Evolução */}
      <Tabs defaultValue="diet" className="w-full">
        {/* Desktop: abas em linha */}
        <TabsList className="sticky top-0 z-50 hidden sm:grid w-full grid-cols-6 bg-gray-100 p-1 border-b border-gray-200 shadow-sm rounded-t-lg">
          <TabsTrigger value="diet" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm text-[#777777] text-sm py-2.5 rounded-md">
            Plano Alimentar
          </TabsTrigger>
          <TabsTrigger value="orientations" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm text-[#777777] text-sm py-2.5 rounded-md">
            Orientações
          </TabsTrigger>
          <TabsTrigger value="challenges" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm text-[#777777] text-sm py-2.5 rounded-md">
            Metas
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm text-[#777777] text-sm py-2.5 rounded-md">
            Progresso
          </TabsTrigger>
          <TabsTrigger value="gamification" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm text-[#777777] text-sm py-2.5 rounded-md">
            Conquistas
          </TabsTrigger>
          <TabsTrigger value="evolution" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm text-[#777777] text-sm py-2.5 rounded-md">
            Minha Evolução
          </TabsTrigger>
        </TabsList>

        {/* Mobile: grid 3x2 com ícones */}
        <div className="sticky top-0 z-50 sm:hidden bg-gray-100 p-2 border-b border-gray-200 shadow-sm rounded-t-lg">
          <TabsList className="grid grid-cols-3 gap-2 bg-transparent h-auto">
            <TabsTrigger value="diet" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm bg-white/50 text-[#777777] text-xs py-3 px-2 rounded-lg flex flex-col items-center gap-1 h-auto">
              <span className="text-lg">🍽️</span>
              <span>Plano</span>
            </TabsTrigger>
            <TabsTrigger value="orientations" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm bg-white/50 text-[#777777] text-xs py-3 px-2 rounded-lg flex flex-col items-center gap-1 h-auto">
              <span className="text-lg">📋</span>
              <span>Orientações</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm bg-white/50 text-[#777777] text-xs py-3 px-2 rounded-lg flex flex-col items-center gap-1 h-auto">
              <span className="text-lg">🎯</span>
              <span>Metas</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm bg-white/50 text-[#777777] text-xs py-3 px-2 rounded-lg flex flex-col items-center gap-1 h-auto">
              <span className="text-lg">📈</span>
              <span>Progresso</span>
            </TabsTrigger>
            <TabsTrigger value="gamification" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm bg-white/50 text-[#777777] text-xs py-3 px-2 rounded-lg flex flex-col items-center gap-1 h-auto">
              <span className="text-lg">🏆</span>
              <span>Conquistas</span>
            </TabsTrigger>
            <TabsTrigger value="evolution" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm bg-white/50 text-[#777777] text-xs py-3 px-2 rounded-lg flex flex-col items-center gap-1 h-auto">
              <span className="text-lg">📊</span>
              <span>Evolução</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Aba: Plano Alimentar */}
        <TabsContent value="diet" className="mt-6 space-y-6">
          {!hasActivePlan ? (
            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <CardContent className="p-6 sm:p-8 text-center">
                <Utensils className="w-12 h-12 sm:w-16 sm:h-16 text-[#777777] mx-auto mb-3 sm:mb-4 opacity-50" />
                <h3 className="text-lg sm:text-xl font-bold text-[#222222] mb-2">Nenhum Plano Alimentar Ativo</h3>
                <p className="text-sm sm:text-base text-[#777777]">
                  Seu nutricionista ainda não liberou um plano alimentar para você.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
          {/* Resumo de Calorias e Macros */}
          <Card className="bg-green-50/30 rounded-2xl shadow-sm border border-green-100/50 hover:shadow-md transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
                {/* Círculo de Progresso de Calorias */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-3 sm:mb-4">
                  <svg className="transform -rotate-90 w-40 h-40 sm:w-48 sm:h-48">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#E5E7EB"
                      strokeWidth="10"
                      fill="none"
                      className="sm:hidden"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#00C98A"
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
                      stroke="#E5E7EB"
                      strokeWidth="12"
                      fill="none"
                      className="hidden sm:block"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="84"
                      stroke="#00C98A"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 84}`}
                      strokeDashoffset={`${2 * Math.PI * 84 * (1 - percentualConsumido / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-500 hidden sm:block"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl sm:text-4xl font-bold text-[#222222]">{Math.round(caloriasRestantes)}</p>
                    <p className="text-xs sm:text-sm text-[#777777] mt-1">Kcal restantes</p>
                  </div>
                </div>
                
                {/* Informações de Consumo */}
                <div className="flex gap-4 sm:gap-6 text-center">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-[#222222]">{Math.round(caloriasConsumidas)}</p>
                    <p className="text-xs text-[#777777] mt-1">Consumidas</p>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-[#222222]">{Math.round(metaCalorias)}</p>
                    <p className="text-xs text-[#777777] mt-1">Meta do dia</p>
                  </div>
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-semibold text-[#222222]">
                    {carboidratosConsumidos.toFixed(0)} / {metaCarboidratos.toFixed(0)}g
                  </p>
                  <p className="text-xs text-[#777777] mt-1">Carboidratos</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min((carboidratosConsumidos / metaCarboidratos) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-[#222222]">
                    {proteinasConsumidas.toFixed(0)} / {metaProteinas.toFixed(0)}g
                  </p>
                  <p className="text-xs text-[#777777] mt-1">Proteínas</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min((proteinasConsumidas / metaProteinas) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-[#222222]">
                    {gordurasConsumidas.toFixed(0)} / {metaGorduras.toFixed(0)}g
                  </p>
                  <p className="text-xs text-[#777777] mt-1">Gorduras</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min((gordurasConsumidas / metaGorduras) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Refeições */}
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
                            className={`rounded-xl border transition-all duration-300 transform hover:scale-[1.01] ${
                              isConsumed 
                                ? 'bg-green-50/30 border-[#00C98A]/50 shadow-sm' 
                                : 'bg-green-50/20 border-green-100/50 hover:border-green-200 hover:shadow-md'
                            }`}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-3 sm:p-4 cursor-pointer rounded-t-xl transition-all duration-200">
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                  <div 
                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                                      isConsumed
                                        ? 'bg-gradient-to-br from-[#00C98A] to-[#00A875]'
                                        : 'bg-gray-200'
                                    }`}
                                  >
                                    {isConsumed ? (
                                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    ) : (
                                      <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-[#777777]" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                      <h4 className={`text-sm sm:text-base font-semibold transition-colors truncate ${
                                        isConsumed ? 'text-[#00C98A]' : 'text-[#222222]'
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
                                  <Badge className={`text-xs sm:text-sm font-semibold border hidden sm:inline-flex ${
                                    isConsumed 
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
                                    className={`w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full transition-all duration-200 min-h-[44px] min-w-[44px] ${
                                      isConsumed
                                        ? 'bg-gradient-to-br from-[#00C98A] to-[#00A875] hover:from-[#00A875] hover:to-[#00C98A] text-white shadow-md'
                                        : 'bg-gray-200 hover:bg-gray-300 text-[#777777] border border-gray-300'
                                    }`}
                                  >
                                    {isConsumed ? (
                                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                  </Button>
                                  <ChevronRight 
                                    className={`w-4 h-4 sm:w-5 sm:h-5 text-[#777777] transition-transform duration-200 ${
                                      isExpanded ? 'rotate-90' : ''
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
                                          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 rounded-lg border transition-all duration-300 bg-white gap-2 ${
                                            isConsumed
                                              ? 'border-[#00C98A]/30 opacity-75'
                                              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {isConsumed && (
                                              <CheckCircle className="w-4 h-4 text-[#00C98A] flex-shrink-0" />
                                            )}
                                            <span className={`font-medium text-xs sm:text-sm truncate ${
                                              isConsumed ? 'text-[#00C98A] line-through' : 'text-[#222222]'
                                            }`}>
                                              {food.food_name}
                                            </span>
                                            <Badge className={`text-xs font-medium flex-shrink-0 ${
                                              isConsumed 
                                                ? 'bg-[#00C98A]/20 text-[#00C98A] border-[#00C98A]/30' 
                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                            } border`}>
                                              {food.quantity} {food.unit === 'unidade' && food.quantity > 1 ? 'unidades' : food.unit}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-1 sm:gap-2 justify-end sm:justify-start">
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
                                              <Badge className={`text-xs font-medium text-right min-w-[60px] sm:min-w-[70px] ${
                                                isConsumed 
                                                  ? 'bg-[#00C98A]/20 text-[#00C98A] border-[#00C98A]/30' 
                                                  : 'bg-blue-50 text-blue-600 border-blue-200'
                                              } border`}>
                                                {food.calories} kcal
                                              </Badge>
                                            )}
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

          {/* Orientações */}
          {hasActivePlan && planDetails?.diet_guidelines && planDetails.diet_guidelines.length > 0 && (
            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg text-[#222222] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#00C98A] flex-shrink-0" />
                  Orientações ({planDetails.diet_guidelines.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {planDetails.diet_guidelines.map((guideline: any, index: number) => (
                    <div 
                      key={guideline.id || index} 
                      className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                    >
                      <p className="font-semibold text-sm sm:text-base text-[#222222] mb-2">{guideline.title}</p>
                      <p className="text-xs sm:text-sm text-[#777777] leading-relaxed mb-3">{guideline.content}</p>
                      <Badge className="bg-[#00C98A]/20 text-[#00C98A] border-[#00C98A]/30 text-xs">
                        {guideline.guideline_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
            </>
          )}
        </TabsContent>
        
        {/* Aba: Metas */}
        <TabsContent value="challenges" className="mt-6">
          <DailyChallengesWidget patientId={patientId} />
        </TabsContent>
        
        {/* Aba: Progresso */}
        <TabsContent value="progress" className="mt-6 space-y-6">
          <WeeklyProgressChart patientId={patientId} />
          <AdherenceCharts patientId={patientId} lowAdherenceThreshold={70} />
        </TabsContent>
        
        {/* Aba: Conquistas */}
        <TabsContent value="gamification" className="mt-6">
          <GamificationWidget patientId={patientId} />
        </TabsContent>
        
        {/* Aba: Orientações */}
        <TabsContent value="orientations" className="mt-6 space-y-6">
          {patient?.telefone && (
            <ExamsHistory
              patientId={patient?.id}
              telefone={patient.telefone}
              onUpdate={() => {
                // Recarregar se necessário
              }}
              refreshTrigger={refreshTrigger}
              allowDelete={true} // Portal do paciente permite deletar
            />
          )}
        </TabsContent>
        
        {/* Aba: Minha Evolução */}
        <TabsContent value="evolution" className="mt-6">
          <PatientEvolutionTab 
            patientId={patientId}
            checkins={checkins}
            patient={patient}
            bodyCompositions={bodyCompositions}
            achievements={achievements}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Substituições */}
      <Dialog open={substitutionsModalOpen} onOpenChange={setSubstitutionsModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative pb-4">
            <button
              onClick={() => setSubstitutionsModalOpen(false)}
              className="absolute right-0 top-0 rounded-full p-2 hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Fechar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500 hover:text-gray-700"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <DialogTitle className="text-[#222222] text-lg sm:text-xl font-bold flex items-center gap-2 pr-12">
              <RefreshCw className="w-5 h-5 text-[#00C98A] flex-shrink-0" />
              <span className="truncate">Opções de Substituição</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#777777] pr-8">
              Você pode substituir <strong className="text-[#222222]">{selectedFoodSubstitutions?.foodName}</strong> por qualquer uma das opções abaixo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-2">
            {selectedFoodSubstitutions?.substitutions.map((sub: any, index: number) => (
              <div 
                key={index}
                className="p-3 sm:p-4 rounded-lg border border-[#00C98A]/30 bg-[#00C98A]/5 hover:bg-[#00C98A]/10 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#222222] text-sm sm:text-base truncate">
                      {sub.food_name}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#777777] mt-1">
                      Quantidade: <span className="font-medium text-[#00C98A]">{sub.quantity} {sub.unit}</span>
                      {sub.custom_unit_name && (
                        <span className="ml-2 text-xs block sm:inline mt-1 sm:mt-0">
                          ({sub.custom_unit_name}: {sub.custom_unit_grams}g)
                        </span>
                      )}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-[#00C98A] flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>
                Essas são opções equivalentes que você pode usar no lugar do alimento original, escolha a que preferir.
              </span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


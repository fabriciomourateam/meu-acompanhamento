import { useDietPlans } from '@/hooks/use-diet-plans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Utensils, Calendar, Eye, Edit, X, CheckCircle, History, Star, Copy, Trash2, BookOpen, Save, Package, Upload, MoreVertical, ChevronDown, Sparkles, TrendingUp, Clock, AlertTriangle, Check, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dietService } from '@/lib/diet-service';
import { calcularTotaisPlano } from '@/utils/diet-calculations';
import { DietPlanImportModal } from '@/components/import/DietPlanImportModal';
import { SaveAsTemplateModal } from './SaveAsTemplateModal';
import { TemplateLibraryModal } from './TemplateLibraryModal';
import { FoodGroupsManager } from './FoodGroupsManager';
import { WeeklyProgressChart } from './WeeklyProgressChart';
import { GamificationWidget } from './GamificationWidget';
import { DailyChallengesWidget } from './DailyChallengesWidget';
import { PatientEvolutionTab } from './PatientEvolutionTab';

interface DietPlansListProps {
  patientId: string;
}

export function DietPlansList({ patientId }: DietPlansListProps) {
  const { plans, loading, error, releasePlan, refetch } = useDietPlans(patientId);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [patientUserId, setPatientUserId] = useState<string | null>(null);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templatePlanId, setTemplatePlanId] = useState<string | null>(null);
  const [foodGroupsManagerOpen, setFoodGroupsManagerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [activePlan, setActivePlan] = useState<any>(null);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [patientWeight, setPatientWeight] = useState<number | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [substitutionsModalOpen, setSubstitutionsModalOpen] = useState(false);
  const [selectedFoodSubstitutions, setSelectedFoodSubstitutions] = useState<{ foodName: string; substitutions: any[] } | null>(null);
  const [consumedMeals, setConsumedMeals] = useState<Set<string>>(new Set());
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  const [patientName, setPatientName] = useState<string>('');

  // Função para obter frase motivadora do dia
  const getDailyMotivationalPhrase = () => {
    const phrases = [
      'Cada refeição é um passo em direção aos seus objetivos! 💪',
      'Você está no caminho certo! Continue assim! 🌟',
      'Pequenas escolhas diárias geram grandes resultados! ✨',
      'Seu compromisso com a saúde é inspirador! 🎯',
      'Cada dia é uma nova oportunidade de cuidar de si! 🌈',
      'Você está construindo um futuro mais saudável! 🚀',
      'Consistência é a chave do sucesso! 🔑',
      'Seu esforço de hoje será sua vitória de amanhã! 🏆',
      'Acredite no processo e confie na jornada! 💚',
      'Você é mais forte do que imagina! 💪',
      'Cada refeição equilibrada é uma vitória! 🎉',
      'Seu bem-estar é sua prioridade! ❤️',
      'Transformação começa com uma refeição de cada vez! 🌱',
      'Você está fazendo a diferença na sua vida! ⭐',
      'Mantenha o foco e siga em frente! 🎯',
      'Sua dedicação é admirável! 👏',
      'Cada escolha saudável te aproxima dos seus sonhos! 🌟',
      'Você está no controle da sua jornada! 🧭',
      'Pequenos progressos diários levam a grandes mudanças! 📈',
      'Sua saúde é seu maior investimento! 💎',
      'Continue firme, você está indo muito bem! 🚀',
      'Cada refeição é uma oportunidade de nutrir seu corpo! 🥗',
      'Você está criando hábitos que transformam vidas! 🌿',
      'Seu comprometimento é inspirador! 💫',
      'A jornada de mil milhas começa com um passo! 🚶',
      'Você está escrevendo sua história de sucesso! 📖',
      'Cada dia é uma chance de ser melhor! 🌅',
      'Seu futuro agradece pelas escolhas de hoje! 🙏',
      'Você está no caminho da transformação! 🦋',
      'Mantenha a motivação e siga seus objetivos! 🎯',
    ];

    // Usar o dia do ano (1-365) para selecionar uma frase
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    
    return phrases[dayOfYear % phrases.length];
  };

  // Buscar user_id, peso e nome do paciente
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const { data } = await supabase
          .from('patients')
          .select('user_id, peso_inicial, telefone, nome')
          .eq('id', patientId)
          .single();
        
        if (data) {
          setPatientUserId(data.user_id);
          setPatientName(data.nome || '');
          
          // Tentar obter peso do paciente (peso_inicial ou do último checkin)
          if (data.peso_inicial) {
            const peso = parseFloat(data.peso_inicial.toString().replace(',', '.'));
            if (!isNaN(peso) && peso > 0) {
              setPatientWeight(peso);
            }
          }
          
          // Se não tiver peso_inicial, buscar do último checkin
          if (!data.peso_inicial && data.telefone) {
            const { data: checkins } = await supabase
              .from('checkin')
              .select('peso')
              .eq('telefone', data.telefone)
              .order('data_checkin', { ascending: false })
              .limit(1)
              .single();
            
            if (checkins?.peso) {
              const peso = parseFloat(checkins.peso.toString().replace(',', '.'));
              if (!isNaN(peso) && peso > 0) {
                setPatientWeight(peso);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do paciente:', error);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  // Listener para evento de abrir formulário
  useEffect(() => {
    const handleOpenForm = (event: CustomEvent) => {
      if (event.detail.patientId === patientId) {
        navigate(`/patients/${patientId}/diet-plan/new`);
      }
    };

    window.addEventListener('open-diet-plan-form' as any, handleOpenForm as EventListener);
    return () => {
      window.removeEventListener('open-diet-plan-form' as any, handleOpenForm as EventListener);
    };
  }, [patientId, navigate]);

  // Encontrar plano ativo
  useEffect(() => {
    const active = plans.find((p: any) => p.status === 'active' || p.active);
    setActivePlan(active || null);
  }, [plans]);

  // Separar planos ativos e inativos com filtro de favoritos
  // IMPORTANTE: Este hook deve ser chamado ANTES de qualquer return condicional
  const { activePlans, inactivePlans } = useMemo(() => {
    let active = plans.filter((p: any) => p.status === 'active' || p.active);
    // Corrigido: planos inativos são aqueles que NÃO são ativos
    let inactive = plans.filter((p: any) => !(p.status === 'active' || p.active));
    
    // Filtrar por favoritos se necessário
    if (showFavoritesOnly) {
      active = active.filter((p: any) => p.favorite);
      inactive = inactive.filter((p: any) => p.favorite);
    }
    
    return { activePlans: active, inactivePlans: inactive };
  }, [plans, showFavoritesOnly]);

  const handleRelease = async (planId: string, planName: string) => {
    if (!confirm(`Deseja liberar o plano "${planName}" para o paciente?`)) {
      return;
    }

    try {
      await releasePlan(planId);
      toast({
        title: 'Plano liberado!',
        description: `O plano "${planName}" foi liberado para o paciente.`,
      });
      refetch();
    } catch (err) {
      toast({
        title: 'Erro ao liberar plano',
        description: err instanceof Error ? err.message : 'Ocorreu um erro ao liberar o plano.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = async (plan: any) => {
    try {
      setSelectedPlan(plan);
      // Buscar detalhes completos do plano
      const details = await dietService.getById(plan.id);
      setPlanDetails(details);
      setIsDetailsOpen(true);
      
      // Carregar refeições consumidas (banco de dados + localStorage como fallback)
      const today = new Date().toISOString().split('T')[0];
      try {
        const { dietConsumptionService } = await import('@/lib/diet-consumption-service');
        const consumption = await dietConsumptionService.getConsumptionHistory(
          patientId,
          today,
          today
        );
        
        if (consumption && consumption.length > 0 && consumption[0].consumed_meals) {
          setConsumedMeals(new Set(consumption[0].consumed_meals as string[]));
        } else {
          // Fallback para localStorage
          const storageKey = `consumed_meals_${plan.id}_${today}`;
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            setConsumedMeals(new Set(JSON.parse(stored)));
          } else {
            setConsumedMeals(new Set());
          }
        }
      } catch (error) {
        // Se der erro, usar localStorage
        console.error('Erro ao carregar do banco, usando localStorage:', error);
        const storageKey = `consumed_meals_${plan.id}_${today}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          setConsumedMeals(new Set(JSON.parse(stored)));
        } else {
          setConsumedMeals(new Set());
        }
      }
    } catch (err) {
      toast({
        title: 'Erro ao carregar detalhes',
        description: err instanceof Error ? err.message : 'Ocorreu um erro ao carregar os detalhes do plano.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleMealConsumed = async (mealId: string) => {
    if (!selectedPlan || !planDetails) return;
    
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `consumed_meals_${selectedPlan.id}_${today}`;
    const newConsumed = new Set(consumedMeals);
    
    if (newConsumed.has(mealId)) {
      newConsumed.delete(mealId);
    } else {
      newConsumed.add(mealId);
    }
    
    setConsumedMeals(newConsumed);
    localStorage.setItem(storageKey, JSON.stringify(Array.from(newConsumed)));
    
    // Salvar no banco de dados
    try {
      const { dietConsumptionService } = await import('@/lib/diet-consumption-service');
      await dietConsumptionService.saveDailyConsumption(
        patientId,
        selectedPlan.id,
        Array.from(newConsumed),
        planDetails
      );
      
      // Adicionar pontos por refeição consumida
      if (newConsumed.has(mealId)) {
        await dietConsumptionService.addPoints(
          patientId,
          10,
          'meal_consumed',
          'Refeição consumida'
        );
        
        // Verificar se completou o dia (100%)
        const totais = calcularTotais(planDetails);
        const consumedCalories = Array.from(newConsumed).reduce((sum, id) => {
          const meal = planDetails.diet_meals?.find((m: any) => m.id === id);
          if (meal) {
            const mealTotals = calcularTotaisPlano({ diet_meals: [meal] });
            return sum + mealTotals.calorias;
          }
          return sum;
        }, 0);
        
        const completionPercentage = totais.calorias > 0 
          ? (consumedCalories / totais.calorias) * 100 
          : 0;
        
        if (completionPercentage >= 100) {
          // Dia completo! Adicionar mais pontos
          await dietConsumptionService.addPoints(
            patientId,
            50,
            'daily_complete',
            'Dia completo! Todas as refeições consumidas'
          );
          
          // Verificar conquistas
          await dietConsumptionService.checkAndUnlockAchievements(patientId);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar consumo no banco:', error);
      // Não mostrar erro para o usuário, apenas logar
    }
  };

  const handleEdit = (plan: any) => {
    navigate(`/patients/${patientId}/diet-plan/${plan.id}/edit`);
  };

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o plano "${planName}"?\n\nEsta ação não pode ser desfeita e irá deletar todas as refeições, alimentos e orientações associadas.`)) {
      return;
    }

    try {
      await dietService.delete(planId);
      toast({
        title: 'Plano deletado!',
        description: `O plano "${planName}" foi deletado com sucesso.`,
      });
      refetch();
    } catch (err) {
      toast({
        title: 'Erro ao deletar plano',
        description: err instanceof Error ? err.message : 'Ocorreu um erro ao deletar o plano.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro: {error}</p>
          <Button onClick={refetch} variant="outline" className="mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calcular totais do plano ativo
  const calcularTotais = (plan: any) => {
    if (!plan) return { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
    return calcularTotaisPlano(plan);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header moderno */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/30">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-white tracking-tight bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
            <Utensils className="w-8 h-8 text-cyan-400" />
            Planos Alimentares
          </h2>
          <p className="text-slate-400 text-sm">
            Gerencie e monitore os planos nutricionais do paciente
          </p>
        </div>
        {/* Botões para criar e importar planos */}
        <div className="flex justify-end gap-2 flex-wrap">
        <DietPlanImportModal 
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onImportComplete={() => {
            refetch();
            toast({
              title: "Planos importados!",
              description: "Os planos foram importados com sucesso.",
            });
            setImportModalOpen(false);
          }} 
        />
        <TemplateLibraryModal
          open={templateLibraryOpen}
          onOpenChange={setTemplateLibraryOpen}
          patientId={patientId}
          onTemplateSelected={(planId) => {
            refetch();
            setTemplateLibraryOpen(false);
            toast({
              title: "Template aplicado!",
              description: "Plano criado a partir do template.",
            });
          }}
        />
        <Button
          onClick={() => setTemplateLibraryOpen(true)}
          variant="outline"
          className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 transition-all duration-300"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Biblioteca
        </Button>
        <Button
          onClick={() => setFoodGroupsManagerOpen(true)}
          variant="outline"
          className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 transition-all duration-300"
        >
          <Package className="w-4 h-4 mr-2" />
          Grupos
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-lg text-white">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Plano
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate(`/patients/${patientId}/diet-plan/new`)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Plano
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar Planos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      {/* Filtro de Favoritos */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={
              showFavoritesOnly 
                ? "bg-gradient-to-r from-amber-100 to-yellow-100 border-amber-300 text-amber-700 hover:from-amber-200 hover:to-yellow-200 hover:border-amber-400 shadow-sm transition-all duration-300" 
                : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300 transition-all duration-300"
            }
          >
            <Star className={`w-4 h-4 mr-2 ${showFavoritesOnly ? 'fill-yellow-400' : ''}`} />
            {showFavoritesOnly ? 'Mostrar Todos' : 'Apenas Favoritos'}
          </Button>
          {showFavoritesOnly && (
            <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">
              {activePlans.length + inactivePlans.length} favorito(s)
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs para Plano Ativo e Histórico */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
          <TabsTrigger 
            value="active"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-green-300 data-[state=active]:border-green-500/50 data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/20 transition-all duration-300"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Plano Ativo {showFavoritesOnly && activePlans.length > 0 && `(${activePlans.length})`}
          </TabsTrigger>
          <TabsTrigger 
            value="history"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-700/50 data-[state=active]:to-slate-600/50 data-[state=active]:text-slate-300 data-[state=active]:border-slate-600/50 data-[state=active]:shadow-lg transition-all duration-300"
          >
            <History className="h-4 w-4 mr-2" />
            Histórico ({inactivePlans.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Plano Ativo */}
        <TabsContent value="active" className="space-y-4">
          {activePlans.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/40">
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-6">
              <Utensils className="w-10 h-10 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum plano alimentar cadastrado ainda</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Os planos criados via N8N ou manualmente aparecerão aqui. Comece criando seu primeiro plano!
            </p>
            <Button
              onClick={() => navigate(`/patients/${patientId}/diet-plan/new`)}
              className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activePlans.map((plan) => {
            const handleDuplicatePlan = async () => {
              try {
                // Buscar dados completos do plano
                const planData = await dietService.getById(plan.id);
                if (!planData) {
                  toast({
                    title: 'Erro',
                    description: 'Plano não encontrado',
                    variant: 'destructive',
                  });
                  return;
                }
                
                // Obter user_id do usuário autenticado
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  toast({
                    title: 'Erro',
                    description: 'Usuário não autenticado',
                    variant: 'destructive',
                  });
                  return;
                }
                
                // Criar novo plano duplicado
                const newPlan = {
                  patient_id: patientId,
                  user_id: user.id,
                  name: `${planData.name} (Cópia)`,
                  notes: planData.notes || null,
                  total_calories: planData.total_calories || null,
                  total_protein: planData.total_protein || null,
                  total_carbs: planData.total_carbs || null,
                  total_fats: planData.total_fats || null,
                  status: 'draft' as const,
                  active: false,
                  favorite: false,
                };
                
                const createdPlan = await dietService.create(newPlan);
                
                if (!createdPlan || !createdPlan.id) {
                  toast({
                    title: 'Erro',
                    description: 'Falha ao criar plano duplicado',
                    variant: 'destructive',
                  });
                  return;
                }
                
                // Duplicar refeições
                if (planData.diet_meals && planData.diet_meals.length > 0) {
                  for (const meal of planData.diet_meals) {
                    const newMeal = {
                      diet_plan_id: createdPlan.id,
                      meal_type: meal.meal_type,
                      meal_name: meal.meal_name,
                      meal_order: meal.meal_order || 0,
                      suggested_time: meal.suggested_time || null,
                      calories: meal.calories || null,
                      protein: meal.protein || null,
                      carbs: meal.carbs || null,
                      fats: meal.fats || null,
                      instructions: meal.instructions || null,
                      day_of_week: meal.day_of_week || null,
                    };
                    
                    const createdMeal = await dietService.createMeal(newMeal);
                    
                    if (!createdMeal || !createdMeal.id) {
                      console.error('Erro ao criar refeição:', meal);
                      continue;
                    }
                    
                    // Duplicar alimentos
                    if (meal.diet_foods && meal.diet_foods.length > 0) {
                      for (const food of meal.diet_foods) {
                        try {
                          await dietService.createFood({
                            meal_id: createdMeal.id,
                            food_name: food.food_name || food.name || '',
                            quantity: food.quantity || 0,
                            unit: food.unit || 'g',
                            calories: food.calories || null,
                            protein: food.protein || null,
                            carbs: food.carbs || null,
                            fats: food.fats || null,
                            notes: food.notes || null,
                            food_order: food.food_order || 0,
                          });
                        } catch (foodError) {
                          console.error('Erro ao criar alimento:', food, foodError);
                        }
                      }
                    }
                  }
                }
                
                // Duplicar orientações
                if (planData.diet_guidelines && planData.diet_guidelines.length > 0) {
                  for (const guideline of planData.diet_guidelines) {
                    try {
                      await dietService.createGuideline({
                        diet_plan_id: createdPlan.id,
                        guideline_type: guideline.guideline_type,
                        title: guideline.title,
                        content: guideline.content,
                        priority: guideline.priority || 'medium',
                      });
                    } catch (guidelineError) {
                      console.error('Erro ao criar orientação:', guideline, guidelineError);
                    }
                  }
                }
                
                console.log('✅ Plano duplicado criado:', createdPlan);
                console.log('📊 Total de refeições duplicadas:', planData.diet_meals?.length || 0);
                console.log('📋 Status do plano:', createdPlan.status, 'Active:', createdPlan.active);
                
                toast({
                  title: 'Plano duplicado!',
                  description: `Plano "${createdPlan.name}" criado com sucesso. Verifique a aba "Histórico".`,
                });
                
                // Aguardar um pouco antes de refetch para garantir que o banco processou
                await new Promise(resolve => setTimeout(resolve, 300));
                await refetch();
                console.log('🔄 Lista atualizada após duplicação');
              } catch (err) {
                console.error('Erro ao duplicar plano:', err);
                toast({
                  title: 'Erro ao duplicar plano',
                  description: err instanceof Error ? err.message : 'Ocorreu um erro ao duplicar o plano. Verifique o console para mais detalhes.',
                  variant: 'destructive',
                });
              }
            };

            return (
        <Card key={plan.id} className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 mb-2 text-[#222222]">
                  {plan.name}
                  <Badge 
                    variant={
                      plan.status === 'active' ? 'default' :
                      plan.status === 'draft' ? 'secondary' : 'outline'
                    }
                    className="bg-[#00C98A]/20 text-[#00C98A] border-[#00C98A]/30"
                  >
                    {plan.status === 'active' ? 'Ativo' : plan.status === 'draft' ? 'Rascunho' : plan.status}
                  </Badge>
                  {plan.favorite && (
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-600 bg-yellow-50">
                      <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                      Favorito
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-[#777777]">
                  {plan.notes || 'Sem observações'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Totais do plano */}
              {(() => {
                const totais = calcularTotais(plan);
                return (
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-xs text-[#777777]">Calorias</p>
                      <p className="text-lg font-semibold text-[#222222]">
                        {totais.calorias.toLocaleString('pt-BR')} kcal
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#777777]">Proteína</p>
                      <p className="text-lg font-semibold text-[#222222]">
                        {totais.proteinas.toFixed(1)}g
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#777777]">Carboidratos</p>
                      <p className="text-lg font-semibold text-[#222222]">
                        {totais.carboidratos.toFixed(1)}g
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#777777]">Gorduras</p>
                      <p className="text-lg font-semibold text-[#222222]">
                        {totais.gorduras.toFixed(1)}g
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Botões de ação - Design moderno */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/30">
              {plan.status !== 'active' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleRelease(plan.id, plan.name)}
                  className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/50 text-green-300 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/70 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Liberar Plano
                </Button>
              )}
              {plan.status === 'active' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={async () => {
                    try {
                      await supabase
                        .from('diet_plans')
                        .update({ status: 'draft', active: false })
                        .eq('id', plan.id);
                      toast({
                        title: 'Plano desativado!',
                        description: 'O plano foi movido para rascunho.',
                      });
                      refetch();
                    } catch (err) {
                      toast({
                        title: 'Erro',
                        description: 'Erro ao desativar plano',
                        variant: 'destructive',
                      });
                    }
                  }}
                  className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 transition-all duration-300"
                ><X className="w-4 h-4 mr-2" />Desativar
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={() => handleEdit(plan)}
                className="bg-gradient-to-r from-[#00C98A] to-[#00A875] hover:from-[#00A875] hover:to-[#00C98A] text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-gradient-to-r from-[#00C98A] to-[#00A875] hover:from-[#00A875] hover:to-[#00C98A] text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  ><MoreVertical className="w-4 h-4 mr-2" />
                    Ações
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await supabase
                          .from('diet_plans')
                          .update({ favorite: !plan.favorite })
                          .eq('id', plan.id);
                        
                        toast({
                          title: plan.favorite ? 'Removido dos favoritos!' : 'Adicionado aos favoritos!',
                          description: plan.favorite 
                            ? 'O plano foi removido dos favoritos.' 
                            : 'O plano foi adicionado aos favoritos.',
                        });
                        refetch();
                      } catch (err) {
                        toast({
                          title: 'Erro',
                          description: 'Erro ao atualizar favorito',
                          variant: 'destructive',
                        });
                      }
                    }}
                    className={plan.favorite ? "text-yellow-400" : ""}
                  >
                    <Star className={`w-4 h-4 mr-2 ${plan.favorite ? 'fill-yellow-400' : ''}`} />
                    {plan.favorite ? 'Remover dos Favoritos' : 'Favoritar'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setTemplatePlanId(plan.id);
                      setSaveTemplateOpen(true);
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar como Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    try {
                      // Buscar dados completos do plano
                      const planData = await dietService.getById(plan.id);
                      if (!planData) {
                        toast({
                          title: 'Erro',
                          description: 'Plano não encontrado',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      // Obter user_id do usuário autenticado
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) {
                        toast({
                          title: 'Erro',
                          description: 'Usuário não autenticado',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      // Criar novo plano duplicado
                      const newPlan = {
                        patient_id: patientId,
                        user_id: user.id,
                        name: `${planData.name} (Cópia)`,
                        notes: planData.notes || null,
                        total_calories: planData.total_calories || null,
                        total_protein: planData.total_protein || null,
                        total_carbs: planData.total_carbs || null,
                        total_fats: planData.total_fats || null,
                        status: 'draft' as const,
                        active: false,
                        favorite: false,
                      };
                      
                      const createdPlan = await dietService.create(newPlan);
                      
                      if (!createdPlan || !createdPlan.id) {
                        toast({
                          title: 'Erro',
                          description: 'Falha ao criar plano duplicado',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      // Duplicar refeições
                      if (planData.diet_meals && planData.diet_meals.length > 0) {
                        for (const meal of planData.diet_meals) {
                          const newMeal = {
                            diet_plan_id: createdPlan.id,
                            meal_type: meal.meal_type,
                            meal_name: meal.meal_name,
                            meal_order: meal.meal_order || 0,
                            suggested_time: meal.suggested_time || null,
                            calories: meal.calories || null,
                            protein: meal.protein || null,
                            carbs: meal.carbs || null,
                            fats: meal.fats || null,
                            instructions: meal.instructions || null,
                            day_of_week: meal.day_of_week || null,
                          };
                          
                          const createdMeal = await dietService.createMeal(newMeal);
                          
                          if (!createdMeal || !createdMeal.id) {
                            console.error('Erro ao criar refeição:', meal);
                            continue;
                          }
                          
                          // Duplicar alimentos
                          if (meal.diet_foods && meal.diet_foods.length > 0) {
                            for (const food of meal.diet_foods) {
                              try {
                                await dietService.createFood({
                                  meal_id: createdMeal.id,
                                  food_name: food.food_name || food.name || '',
                                  quantity: food.quantity || 0,
                                  unit: food.unit || 'g',
                                  calories: food.calories || null,
                                  protein: food.protein || null,
                                  carbs: food.carbs || null,
                                  fats: food.fats || null,
                                  notes: food.notes || null,
                                  food_order: food.food_order || 0,
                                });
                              } catch (foodError) {
                                console.error('Erro ao criar alimento:', food, foodError);
                              }
                            }
                          }
                        }
                      }
                      
                      // Duplicar orientações
                      if (planData.diet_guidelines && planData.diet_guidelines.length > 0) {
                        for (const guideline of planData.diet_guidelines) {
                          try {
                            await dietService.createGuideline({
                              diet_plan_id: createdPlan.id,
                              guideline_type: guideline.guideline_type,
                              title: guideline.title,
                              content: guideline.content,
                              priority: guideline.priority || 'medium',
                            });
                          } catch (guidelineError) {
                            console.error('Erro ao criar orientação:', guideline, guidelineError);
                          }
                        }
                      }
                      
                      console.log('✅ Plano duplicado criado:', createdPlan);
                      console.log('📊 Total de refeições duplicadas:', planData.diet_meals?.length || 0);
                      console.log('📋 Status do plano:', createdPlan.status, 'Active:', createdPlan.active);
                      
                      toast({
                        title: 'Plano duplicado!',
                        description: `Plano "${createdPlan.name}" criado com sucesso. Verifique a aba "Histórico".`,
                      });
                      
                      // Aguardar um pouco antes de refetch para garantir que o banco processou
                      await new Promise(resolve => setTimeout(resolve, 300));
                      await refetch();
                      console.log('🔄 Lista atualizada após duplicação');
                    } catch (err) {
                      console.error('Erro ao duplicar plano:', err);
                      toast({
                        title: 'Erro ao duplicar plano',
                        description: err instanceof Error ? err.message : 'Ocorreu um erro ao duplicar o plano. Verifique o console para mais detalhes.',
                        variant: 'destructive',
                      });
                    }
                  }}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleViewDetails(plan)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDelete(plan.id, plan.name)}
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            </div>
          </CardContent>
        </Card>
            );
          })}
        </>
      )}
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="history" className="space-y-4">
          {inactivePlans.length === 0 ? (
            <Card className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/40">
              <CardContent className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-slate-600/30 mb-6">
                  <History className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum plano no histórico</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  Planos desativados ou finalizados aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {inactivePlans.map((plan) => {
            const handleDuplicatePlanInactive = async () => {
              try {
                // Buscar dados completos do plano
                const planData = await dietService.getById(plan.id);
                if (!planData) {
                  toast({
                    title: 'Erro',
                    description: 'Plano não encontrado',
                    variant: 'destructive',
                  });
                  return;
                }
                
                // Obter user_id do usuário autenticado
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  toast({
                    title: 'Erro',
                    description: 'Usuário não autenticado',
                    variant: 'destructive',
                  });
                  return;
                }
                
                // Criar novo plano duplicado
                const newPlan = {
                  patient_id: patientId,
                  user_id: user.id,
                  name: `${planData.name} (Cópia)`,
                  notes: planData.notes || null,
                  total_calories: planData.total_calories || null,
                  total_protein: planData.total_protein || null,
                  total_carbs: planData.total_carbs || null,
                  total_fats: planData.total_fats || null,
                  status: 'draft' as const,
                  active: false,
                  favorite: false,
                };
                
                const createdPlan = await dietService.create(newPlan);
                
                if (!createdPlan || !createdPlan.id) {
                  toast({
                    title: 'Erro',
                    description: 'Falha ao criar plano duplicado',
                    variant: 'destructive',
                  });
                  return;
                }
                
                // Duplicar refeições
                if (planData.diet_meals && planData.diet_meals.length > 0) {
                  for (const meal of planData.diet_meals) {
                    const newMeal = {
                      diet_plan_id: createdPlan.id,
                      meal_type: meal.meal_type,
                      meal_name: meal.meal_name,
                      meal_order: meal.meal_order || 0,
                      suggested_time: meal.suggested_time || null,
                      calories: meal.calories || null,
                      protein: meal.protein || null,
                      carbs: meal.carbs || null,
                      fats: meal.fats || null,
                      instructions: meal.instructions || null,
                      day_of_week: meal.day_of_week || null,
                    };
                    
                    const createdMeal = await dietService.createMeal(newMeal);
                    
                    if (!createdMeal || !createdMeal.id) {
                      console.error('Erro ao criar refeição:', meal);
                      continue;
                    }
                    
                    // Duplicar alimentos
                    if (meal.diet_foods && meal.diet_foods.length > 0) {
                      for (const food of meal.diet_foods) {
                        try {
                          await dietService.createFood({
                            meal_id: createdMeal.id,
                            food_name: food.food_name || food.name || '',
                            quantity: food.quantity || 0,
                            unit: food.unit || 'g',
                            calories: food.calories || null,
                            protein: food.protein || null,
                            carbs: food.carbs || null,
                            fats: food.fats || null,
                            notes: food.notes || null,
                            food_order: food.food_order || 0,
                          });
                        } catch (foodError) {
                          console.error('Erro ao criar alimento:', food, foodError);
                        }
                      }
                    }
                  }
                }
                
                // Duplicar orientações
                if (planData.diet_guidelines && planData.diet_guidelines.length > 0) {
                  for (const guideline of planData.diet_guidelines) {
                    try {
                      await dietService.createGuideline({
                        diet_plan_id: createdPlan.id,
                        guideline_type: guideline.guideline_type,
                        title: guideline.title,
                        content: guideline.content,
                        priority: guideline.priority || 'medium',
                      });
                    } catch (guidelineError) {
                      console.error('Erro ao criar orientação:', guideline, guidelineError);
                    }
                  }
                }
                
                console.log('✅ Plano duplicado criado:', createdPlan);
                console.log('📊 Total de refeições duplicadas:', planData.diet_meals?.length || 0);
                console.log('📋 Status do plano:', createdPlan.status, 'Active:', createdPlan.active);
                
                toast({
                  title: 'Plano duplicado!',
                  description: `Plano "${createdPlan.name}" criado com sucesso. Verifique a aba "Histórico".`,
                });
                
                // Aguardar um pouco antes de refetch para garantir que o banco processou
                await new Promise(resolve => setTimeout(resolve, 300));
                await refetch();
                console.log('🔄 Lista atualizada após duplicação');
              } catch (err) {
                console.error('Erro ao duplicar plano:', err);
                toast({
                  title: 'Erro ao duplicar plano',
                  description: err instanceof Error ? err.message : 'Ocorreu um erro ao duplicar o plano. Verifique o console para mais detalhes.',
                  variant: 'destructive',
                });
              }
            };

            return (
        <Card 
          key={plan.id}
          className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 opacity-75 hover:opacity-100"
        >

          
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-[#222222]">
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="secondary"
                      className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-slate-600/50 text-slate-300"
                    >
                      {plan.status === 'draft' ? (
                        <>
                          <Edit className="w-3 h-3 mr-1" />
                          Rascunho
                        </>
                      ) : (
                        plan.status
                      )}
                    </Badge>
                    {plan.favorite && (
                      <Badge className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50 text-yellow-300 shadow-lg shadow-yellow-500/20">
                        <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                        Favorito
                      </Badge>
                    )}
                  </div>
                </div>
                {plan.notes && (
                  <CardDescription className="text-[#777777]">
                    {plan.notes}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-5">
              {/* Totais do plano - Design moderno */}
              {(() => {
                const totais = calcularTotais(plan);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-[#777777]">Calorias</p>
                      </div>
                      <p className="text-lg font-semibold text-[#222222]">
                        {totais.calorias.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-[#777777] mt-1">kcal</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-[#777777]">Proteína</p>
                      </div>
                      <p className="text-lg font-semibold text-[#222222]">
                        {totais.proteinas.toFixed(1)}
                      </p>
                      <p className="text-xs text-[#777777] mt-1">gramas</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-[#777777]">Carboidratos</p>
                      </div>
                      <p className="text-lg font-semibold text-[#222222]">
                        {totais.carboidratos.toFixed(1)}
                      </p>
                      <p className="text-xs text-[#777777] mt-1">gramas</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-lg p-4 hover:from-emerald-500/10 hover:to-teal-500/10 transition-all duration-300 group/nutrient">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400/50 group-hover/nutrient:scale-125 transition-transform" />
                        <p className="text-xs text-[#777777]">Gorduras</p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-300/80 group-hover/nutrient:text-emerald-300 transition-colors">
                        {totais.gorduras.toFixed(1)}
                      </p>
                      <p className="text-xs text-[#777777] mt-1">gramas</p>
                    </div>
                  </div>
                );
              })()}

              {/* Botões de ação - Design moderno */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/20">
              {plan.status !== 'active' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleRelease(plan.id, plan.name)}
                  className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/50 text-green-300 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/70 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Liberar Plano
                </Button>
              )}
              {plan.status === 'active' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={async () => {
                    try {
                      await supabase
                        .from('diet_plans')
                        .update({ status: 'draft', active: false })
                        .eq('id', plan.id);
                      toast({
                        title: 'Plano desativado!',
                        description: 'O plano foi movido para rascunho.',
                      });
                      refetch();
                    } catch (err) {
                      toast({
                        title: 'Erro',
                        description: 'Erro ao desativar plano',
                        variant: 'destructive',
                      });
                    }
                  }}
                  className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 transition-all duration-300"
                ><X className="w-4 h-4 mr-2" />Desativar
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-gradient-to-r from-[#00C98A] to-[#00A875] hover:from-[#00A875] hover:to-[#00C98A] text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  ><MoreVertical className="w-4 h-4 mr-2" />
                    Ações
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await supabase
                          .from('diet_plans')
                          .update({ favorite: !plan.favorite })
                          .eq('id', plan.id);
                        
                        toast({
                          title: plan.favorite ? 'Removido dos favoritos!' : 'Adicionado aos favoritos!',
                          description: plan.favorite 
                            ? 'O plano foi removido dos favoritos.' 
                            : 'O plano foi adicionado aos favoritos.',
                        });
                        refetch();
                      } catch (err) {
                        toast({
                          title: 'Erro',
                          description: 'Erro ao atualizar favorito',
                          variant: 'destructive',
                        });
                      }
                    }}
                    className={plan.favorite ? "text-yellow-400" : ""}
                  >
                    <Star className={`w-4 h-4 mr-2 ${plan.favorite ? 'fill-yellow-400' : ''}`} />
                    {plan.favorite ? 'Remover dos Favoritos' : 'Favoritar'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setTemplatePlanId(plan.id);
                      setSaveTemplateOpen(true);
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar como Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicatePlanInactive}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleViewDetails(plan)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(plan)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDelete(plan.id, plan.name)}
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            </div>
          </CardContent>
        </Card>
            );
          })}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Salvar como Template */}
      {templatePlanId && (
        <SaveAsTemplateModal
          open={saveTemplateOpen}
          onOpenChange={(open) => {
            setSaveTemplateOpen(open);
            if (!open) setTemplatePlanId(null);
          }}
          planId={templatePlanId}
          onTemplateCreated={() => {
            refetch();
          }}
        />
      )}

      {/* Modal de Grupos de Alimentos */}
      <FoodGroupsManager
        open={foodGroupsManagerOpen}
        onOpenChange={setFoodGroupsManagerOpen}
      />

      {/* Modal de detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border-0 bg-[#F5F7FB] shadow-2xl">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-[#222222] text-2xl font-bold flex items-center gap-3">
              <Utensils className="h-6 w-6 text-[#00C98A]" />
              {patientName || 'Plano Alimentar'}
            </DialogTitle>
            <DialogDescription className="text-[#777777] mt-2 text-base">
              {getDailyMotivationalPhrase()}
            </DialogDescription>
          </DialogHeader>
          {planDetails && (
            <div className="pt-4">
              {/* Abas: Plano Alimentar, Metas, Progresso, Conquistas e Minha Evolução */}
              <Tabs defaultValue="diet" className="mt-6">
                <TabsList className="flex w-full flex-wrap bg-gray-100 gap-1 p-1">
                  <TabsTrigger value="diet" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] flex-1 min-w-[120px]">
                    Plano Alimentar
                  </TabsTrigger>
                  <TabsTrigger value="challenges" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] flex-1 min-w-[80px]">
                    Metas
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] flex-1 min-w-[100px]">
                    Progresso
                  </TabsTrigger>
                  <TabsTrigger value="gamification" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] flex-1 min-w-[100px]">
                    Conquistas
                  </TabsTrigger>
                  <TabsTrigger value="evolution" className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] flex-1 min-w-[140px]">
                    Minha Evolução
                  </TabsTrigger>
                </TabsList>
                
                {/* Aba: Plano Alimentar */}
                <TabsContent value="diet" className="mt-4 space-y-6">
                  {/* Resumo de Calorias e Macros */}
                  {(() => {
                    const totais = calcularTotais(planDetails);
                    // Meta = total real do plano (soma de todas as refeições)
                    const metaCalorias = totais.calorias;
                    const metaCarboidratos = totais.carboidratos;
                    const metaProteinas = totais.proteinas;
                    const metaGorduras = totais.gorduras;
                    
                    let caloriasConsumidas = 0;
                    let proteinasConsumidas = 0;
                    let carboidratosConsumidas = 0;
                    let gordurasConsumidas = 0;
                    
                    if (planDetails.diet_meals) {
                      planDetails.diet_meals.forEach((meal: any) => {
                        if (consumedMeals.has(meal.id)) {
                          const mealTotals = calcularTotaisPlano({ diet_meals: [meal] });
                          caloriasConsumidas += mealTotals.calorias || 0;
                          proteinasConsumidas += mealTotals.proteinas || 0;
                          carboidratosConsumidas += mealTotals.carboidratos || 0;
                          gordurasConsumidas += mealTotals.gorduras || 0;
                        }
                      });
                    }
                    
                    const caloriasRestantes = Math.max(0, metaCalorias - caloriasConsumidas);
                    const percentualConsumido = metaCalorias > 0 ? Math.min(100, (caloriasConsumidas / metaCalorias) * 100) : 0;
                    
                    return (
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex flex-col items-center justify-center mb-6">
                          {/* Círculo de Progresso de Calorias */}
                          <div className="relative w-48 h-48 mb-4">
                            <svg className="transform -rotate-90 w-48 h-48">
                              <circle
                                cx="96"
                                cy="96"
                                r="84"
                                stroke="#E5E7EB"
                                strokeWidth="12"
                                fill="none"
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
                                className="transition-all duration-500"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <p className="text-4xl font-bold text-[#222222]">{Math.round(caloriasRestantes)}</p>
                              <p className="text-sm text-[#777777] mt-1">Kcal restantes</p>
                            </div>
                          </div>
                          
                          {/* Informações de Consumo */}
                          <div className="flex gap-6 text-center">
                            <div>
                              <p className="text-2xl font-bold text-[#222222]">{Math.round(caloriasConsumidas)}</p>
                              <p className="text-xs text-[#777777] mt-1">Consumidas</p>
                            </div>
                            <div className="w-px bg-gray-200"></div>
                            <div>
                              <p className="text-2xl font-bold text-[#222222]">{Math.round(metaCalorias)}</p>
                              <p className="text-xs text-[#777777] mt-1">Meta do dia</p>
                            </div>
                          </div>
                        </div>

                        {/* Macros */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                          <div className="text-center">
                            <p className="text-lg font-semibold text-[#222222]">
                              {carboidratosConsumidas.toFixed(0)} / {metaCarboidratos.toFixed(0)}g
                            </p>
                            <p className="text-xs text-[#777777] mt-1">Carboidratos</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-[#222222]">
                              {proteinasConsumidas.toFixed(0)} / {metaProteinas.toFixed(0)}g
                            </p>
                            <p className="text-xs text-[#777777] mt-1">Proteínas</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-[#222222]">
                              {gordurasConsumidas.toFixed(0)} / {metaGorduras.toFixed(0)}g
                            </p>
                            <p className="text-xs text-[#777777] mt-1">Gorduras</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Refeições */}
                  {planDetails.diet_meals && planDetails.diet_meals.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                            <Utensils className="w-5 h-5 text-[#00C98A]" />
                            Hoje
                          </h3>
                          <p className="text-xs text-[#777777] mt-1">
                            {consumedMeals.size} de {planDetails.diet_meals.length} refeições consumidas
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#777777]">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      </div>
                      
                      {/* Barra de Progresso Geral */}
                      <div className="mb-4 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#00C98A] to-[#00A875] h-full rounded-full transition-all duration-500"
                          style={{ width: `${(consumedMeals.size / planDetails.diet_meals.length) * 100}%` }}
                        />
                      </div>
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
                                  className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${
                                    isConsumed 
                                      ? 'border-[#00C98A] bg-[#00C98A]/5' 
                                      : 'border-gray-100 hover:shadow-md'
                                  }`}
                                >
                                  <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 rounded-t-xl transition-colors">
                                      <div className="flex items-center gap-3 flex-1">
                                        <div 
                                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                                            isConsumed
                                              ? 'bg-gradient-to-br from-[#00C98A] to-[#00A875]'
                                              : 'bg-gradient-to-br from-gray-200 to-gray-300'
                                          }`}
                                        >
                                          {isConsumed ? (
                                            <Check className="w-5 h-5 text-white" />
                                          ) : (
                                            <Utensils className="w-5 h-5 text-gray-500" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className={`text-base font-semibold transition-colors ${
                                            isConsumed ? 'text-[#00A875]' : 'text-[#222222]'
                                          }`}>
                                            {meal.meal_name}
                                          </h4>
                                          {meal.suggested_time && (
                                            <p className="text-xs text-[#777777] mt-0.5">
                                              {meal.suggested_time}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right flex items-center gap-3 flex-shrink-0">
                                        <div>
                                          <p className={`text-sm font-semibold transition-colors ${
                                            isConsumed ? 'text-[#00A875]' : 'text-[#222222]'
                                          }`}>
                                            {isConsumed ? mealTotals.calorias : 0} / {mealTotals.calorias}kcal
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleMealConsumed(meal.id);
                                          }}
                                          className={`w-10 h-10 p-0 rounded-full transition-all duration-200 ${
                                            isConsumed
                                              ? 'bg-gradient-to-br from-[#00C98A] to-[#00A875] hover:from-[#00A875] hover:to-[#00C98A] text-white shadow-md'
                                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
                                          }`}
                                        >
                                          {isConsumed ? (
                                            <Check className="w-5 h-5" />
                                          ) : (
                                            <Plus className="w-5 h-5" />
                                          )}
                                        </Button>
                                        <ChevronRight 
                                          className={`w-5 h-5 text-[#777777] transition-transform duration-200 ${
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
                                            // Parsear substituições do campo notes
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
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                                                  isConsumed
                                                    ? 'bg-[#00C98A]/5 border-[#00C98A]/20'
                                                    : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                                                }`}
                                              >
                                                <div className="flex items-center gap-3 flex-1">
                                                  {isConsumed && (
                                                    <CheckCircle className="w-4 h-4 text-[#00C98A] flex-shrink-0" />
                                                  )}
                                                  <span className={`font-medium text-sm ${
                                                    isConsumed ? 'text-[#00A875] line-through' : 'text-[#222222]'
                                                  }`}>
                                                    {food.food_name} - {food.quantity} {food.unit}
                                                  </span>
                                                  {substitutions.length > 0 && !isConsumed && (
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => {
                                                        setSelectedFoodSubstitutions({ foodName: food.food_name, substitutions });
                                                        setSubstitutionsModalOpen(true);
                                                      }}
                                                      className="text-[#00C98A] hover:text-[#00A875] hover:bg-[#00C98A]/10 h-6 px-2 rounded-lg transition-all duration-200 text-xs"
                                                    >
                                                      <Package className="w-3 h-3 mr-1" />
                                                      Substitutos ({substitutions.length})
                                                    </Button>
                                                  )}
                                                </div>
                                                {food.calories && (
                                                  <span className={`text-xs font-medium ${
                                                    isConsumed ? 'text-[#00A875]' : 'text-[#777777]'
                                                  }`}>
                                                    {food.calories} kcal
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-[#777777] text-center py-4">Nenhum alimento adicionado</p>
                                      )}
                                      {meal.instructions && (
                                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                          <p className="text-xs text-amber-800 font-medium mb-1 flex items-center gap-2">
                                            <AlertTriangle className="w-3 h-3" />
                                            Instruções:
                                          </p>
                                          <p className="text-sm text-amber-900 leading-relaxed">{meal.instructions}</p>
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Orientações */}
                  {planDetails.diet_guidelines && planDetails.diet_guidelines.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-[#222222] mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#00C98A]" />
                        Orientações ({planDetails.diet_guidelines.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {planDetails.diet_guidelines.map((guideline: any, index: number) => (
                          <div 
                            key={guideline.id || index} 
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                          >
                            <p className="font-semibold text-[#222222] mb-2">{guideline.title}</p>
                            <p className="text-sm text-[#777777] leading-relaxed mb-3">{guideline.content}</p>
                            <Badge className="bg-[#00C98A]/10 text-[#00A875] border-[#00C98A]/20">
                              {guideline.guideline_type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {/* Aba: Metas */}
                <TabsContent value="challenges" className="mt-4">
                  <DailyChallengesWidget patientId={patientId} />
                </TabsContent>
                
                {/* Aba: Progresso */}
                <TabsContent value="progress" className="mt-4">
                  <WeeklyProgressChart patientId={patientId} />
                </TabsContent>
                
                {/* Aba: Conquistas */}
                <TabsContent value="gamification" className="mt-4">
                  <GamificationWidget patientId={patientId} />
                </TabsContent>
                
                {/* Aba: Minha Evolução */}
                <TabsContent value="evolution" className="mt-4">
                  <PatientEvolutionTab patientId={patientId} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Substituições */}
      <Dialog open={substitutionsModalOpen} onOpenChange={setSubstitutionsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 bg-[#F5F7FB] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#222222] text-xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-[#00C98A]" />
              Substituições para {selectedFoodSubstitutions?.foodName}
            </DialogTitle>
            <DialogDescription className="text-[#777777]">
              Alimentos que podem ser usados como substitutos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-4">
            {selectedFoodSubstitutions?.substitutions && selectedFoodSubstitutions.substitutions.length > 0 ? (
              selectedFoodSubstitutions.substitutions.map((sub: any, index: number) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#222222] font-semibold">{sub.food_name}</p>
                      <p className="text-[#777777] text-sm mt-1">
                        {sub.quantity} {sub.unit}
                      </p>
                    </div>
                    <Badge className="bg-[#00C98A]/10 text-[#00A875] border-[#00C98A]/20">
                      Substituto
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#777777] text-center py-8">Nenhuma substituição disponível</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}










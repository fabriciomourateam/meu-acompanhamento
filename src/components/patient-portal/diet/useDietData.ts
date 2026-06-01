import { useState, useEffect } from 'react';
import { dietService } from '@/lib/diet-service';
import { dietConsumptionService } from '@/lib/diet-consumption-service';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

// Hook que concentra TODO o estado e a lógica da aba de Dieta (carregar planos,
// trocar de plano, marcar refeição consumida + confete, persistência em
// localStorage). Extraído do PatientDietPortal pra desacoplar dieta do resto do
// portal. O componente-pai chama uma vez e passa o retorno pro seletor de planos
// e pro <DietTab>.
export function useDietData(patientId: string) {
  const { toast } = useToast();
  const [activePlan, setActivePlan] = useState<any>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [consumedMeals, setConsumedMeals] = useState<Set<string>>(new Set());
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  // Grupos de refeições-opção recolhidos (por id da refeição principal). Vazio = todas expandidas.
  // Persistido por paciente neste aparelho (localStorage).
  const collapsedOptionsKey = `diet_collapsed_options_${patientId}`;
  const [collapsedOptionGroups, setCollapsedOptionGroups] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`diet_collapsed_options_${patientId}`);
      return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const toggleOptionGroup = (mainMealId: string) => {
    setCollapsedOptionGroups(prev => {
      const next = new Set(prev);
      if (next.has(mainMealId)) next.delete(mainMealId); else next.add(mainMealId);
      try { localStorage.setItem(collapsedOptionsKey, JSON.stringify([...next])); } catch { /* ignora */ }
      return next;
    });
  };
  const [substitutionsModalOpen, setSubstitutionsModalOpen] = useState(false);
  const [selectedFoodSubstitutions, setSelectedFoodSubstitutions] = useState<{
    foodName: string;
    substitutions: any[];
  } | null>(null);
  const [releasedPlans, setReleasedPlans] = useState<any[]>([]);

  useEffect(() => {
    loadDietData();
  }, [patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lembrar a dieta que o aluno deixou aberta (por aparelho), para reabri-la por
  // padrao na proxima visita quando ele tem 2+ dietas ativas (semana/fim de semana).
  useEffect(() => {
    if (patientId && activePlan?.id) {
      localStorage.setItem(`diet-last-plan-${patientId}`, activePlan.id);
    }
  }, [patientId, activePlan?.id]);

  // Ao abrir o portal, reavaliar conquistas: consolida o dia anterior (se virou
  // completo) e estorna conquistas de dia concedidas prematuramente.
  useEffect(() => {
    if (patientId) {
      dietConsumptionService.checkAndUnlockAchievements(patientId).catch(() => {});
    }
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

  // Validar refeições consumidas quando o plano muda ou carrega
  useEffect(() => {
    if (planDetails?.diet_meals && consumedMeals.size > 0) {
      const validIds = new Set(planDetails.diet_meals.map((m: any) => m.id));
      let hasInvalid = false;
      const validConsumed = new Set<string>();

      consumedMeals.forEach(id => {
        if (validIds.has(id)) {
          validConsumed.add(id);
        } else {
          hasInvalid = true;
        }
      });

      if (hasInvalid) {
        console.log('🧹 Removendo IDs de refeições inválidas/antigas');
        setConsumedMeals(validConsumed);
        // Atualizar localStorage também
        const today = new Date().toISOString().split('T')[0];
        const key = `consumedMeals_${patientId}_${today}`;
        localStorage.setItem(key, JSON.stringify(Array.from(validConsumed)));
      }
    }
  }, [planDetails]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDietData = async () => {
    try {
      setLoading(true);

      // Buscar planos do paciente
      const plans = await dietService.getByPatientId(patientId);

      // Filtrar apenas planos liberados (is_released = true)
      const released = plans.filter((p: any) => p.is_released === true);
      setReleasedPlans(released);

      // Preferência: a última dieta que o aluno deixou aberta (por aparelho).
      const savedId = localStorage.getItem(`diet-last-plan-${patientId}`);
      const saved = savedId ? released.find((p: any) => p.id === savedId) : null;

      // Encontrar plano ativo entre os liberados
      const active = released.find((p: any) => p.status === 'active' || p.active);

      // Ordem de escolha: última aberta → ativo → primeiro liberado
      const selectedPlan = saved || active || released[0];

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
    const willConsume = !newConsumedMeals.has(mealId);

    // Refeições-opção e principal são vinculadas (parent_meal_id): marcar/desmarcar
    // uma reflete na outra. Reúne os ids vinculados ao alvo.
    const meals = planDetails?.diet_meals || [];
    const clicked = meals.find((m: any) => m.id === mealId);
    const linkedIds = new Set<string>([mealId]);
    if (clicked?.parent_meal_id) linkedIds.add(clicked.parent_meal_id); // opção → sua principal
    meals.forEach((m: any) => { if (m.parent_meal_id === mealId) linkedIds.add(m.id); }); // principal → suas opções

    linkedIds.forEach((id) => {
      if (willConsume) {
        newConsumedMeals.add(id);
      } else {
        newConsumedMeals.delete(id);
      }
    });

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

  return {
    activePlan,
    planDetails,
    loading,
    consumedMeals,
    expandedMeals,
    setExpandedMeals,
    collapsedOptionGroups,
    toggleOptionGroup,
    substitutionsModalOpen,
    setSubstitutionsModalOpen,
    selectedFoodSubstitutions,
    setSelectedFoodSubstitutions,
    releasedPlans,
    handleChangePlan,
    handleToggleMealConsumed,
  };
}

export type UseDietDataReturn = ReturnType<typeof useDietData>;

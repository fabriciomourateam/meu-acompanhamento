import { useState, useEffect } from 'react';
import { dietService } from '@/lib/diet-service';
import { dietConsumptionService } from '@/lib/diet-consumption-service';
import { dailyChallengesService } from '@/lib/daily-challenges-service';
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
  // Consumo granular por alimento (ids de diet_foods). A refeição é considerada
  // "consumida" quando todos os seus alimentos estão marcados; os macros do card
  // de topo somam alimento a alimento (consumo parcial conta proporcional).
  const [consumedFoods, setConsumedFoods] = useState<Set<string>>(new Set());
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  // Grupos de refeições-opção recolhidos (por id da refeição principal). Vazio = todas expandidas.
  // Persistido por paciente neste aparelho (localStorage). Semântica invertida:
  // o set guarda os grupos que o aluno EXPANDIU (default = todos colapsados).
  // Reduz a poluição visual da lista quando há várias opções por refeição.
  // A chave de localStorage mudou (sufixo _v2) pra invalidar persistência antiga.
  const expandedOptionsKey = `diet_expanded_options_${patientId}_v2`;
  const [expandedOptionGroups, setExpandedOptionGroups] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(expandedOptionsKey);
      return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const toggleOptionGroup = (mainMealId: string) => {
    setExpandedOptionGroups(prev => {
      const next = new Set(prev);
      if (next.has(mainMealId)) next.delete(mainMealId); else next.add(mainMealId);
      try { localStorage.setItem(expandedOptionsKey, JSON.stringify([...next])); } catch { /* ignora */ }
      return next;
    });
  };
  // Escolha do dia: qual refeição de cada grupo (principal + opções) está "em uso"
  // hoje. Mapa { principalMealId -> mealIdEscolhido }. Persistido por dia; some ao
  // virar o dia (chave com a data). Default = a própria principal.
  const [primaryChoices, setPrimaryChoices] = useState<Record<string, string>>({});
  const setPrimaryChoice = (principalMealId: string, chosenMealId: string) => {
    setPrimaryChoices((prev) => {
      const next = { ...prev };
      if (chosenMealId === principalMealId) {
        delete next[principalMealId]; // voltou à principal → remove a escolha
      } else {
        next[principalMealId] = chosenMealId;
      }
      try {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`diet_primary_choice_${patientId}_${today}`, JSON.stringify(next));
      } catch { /* ignora */ }
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
    const savedFoods = localStorage.getItem(`consumedFoods_${patientId}_${today}`);
    if (savedFoods) {
      try {
        setConsumedFoods(new Set(JSON.parse(savedFoods)));
      } catch (e) {
        console.error('Erro ao carregar alimentos consumidos:', e);
      }
    }
    const savedChoices = localStorage.getItem(`diet_primary_choice_${patientId}_${today}`);
    if (savedChoices) {
      try {
        setPrimaryChoices(JSON.parse(savedChoices) || {});
      } catch (e) {
        console.error('Erro ao carregar escolha do dia:', e);
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
        setConsumedFoods(new Set());
        setPrimaryChoices({});

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

  // Ids de uma refeição: a própria + sua principal + suas opções (parent_meal_id).
  // "Coma OU principal OU opção" → marcar uma reflete nas vinculadas.
  const getLinkedMealIds = (mealId: string): Set<string> => {
    const meals = planDetails?.diet_meals || [];
    const clicked = meals.find((m: any) => m.id === mealId);
    const ids = new Set<string>([mealId]);
    if (clicked?.parent_meal_id) ids.add(clicked.parent_meal_id);
    meals.forEach((m: any) => { if (m.parent_meal_id === mealId) ids.add(m.id); });
    return ids;
  };

  const foodIdsOfMeal = (meal: any): string[] =>
    (meal?.diet_foods || []).map((f: any) => f.id).filter(Boolean);

  // Persiste refeições + alimentos consumidos, dispara confete quando o dia fica
  // completo e sincroniza com o banco. Centraliza o que antes vivia no toggle.
  const persistConsumption = async (
    newConsumedMeals: Set<string>,
    newConsumedFoods: Set<string>,
    justCompletedMealId?: string,
  ) => {
    setConsumedMeals(newConsumedMeals);
    setConsumedFoods(newConsumedFoods);

    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`consumedMeals_${patientId}_${today}`, JSON.stringify(Array.from(newConsumedMeals)));
    localStorage.setItem(`consumedFoods_${patientId}_${today}`, JSON.stringify(Array.from(newConsumedFoods)));

    // Confete só quando acabamos de completar uma refeição e o dia inteiro fechou.
    if (justCompletedMealId && planDetails?.diet_meals) {
      const allMealsConsumed = planDetails.diet_meals.every((meal: any) => newConsumedMeals.has(meal.id));
      if (allMealsConsumed) {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#00C98A', '#00A875', '#ffffff'] });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#00C98A', '#00A875', '#ffffff'] });
        }, 250);
        toast({
          title: "Parabéns! 🎉",
          description: "Você completou todas as refeições de hoje! Continue assim!",
          className: "bg-green-500 text-white border-green-600",
        });
        // Marca a meta "Siga a Dieta" do dia (idempotente, best-effort).
        if (patientId) {
          dailyChallengesService.completeChallenge(patientId, 'seguiu_dieta')
            .catch((e) => console.error('Falha ao marcar meta seguiu_dieta:', e));
        }
      }
    }

    if (planDetails) {
      try {
        await dietConsumptionService.saveDailyConsumption(patientId, planDetails.id, Array.from(newConsumedMeals), planDetails);
        await dietConsumptionService.checkAndUnlockAchievements(patientId);
      } catch (error) {
        console.error('Erro ao salvar consumo:', error);
      }
    }
  };

  // Botão (+) da refeição: marca/desmarca a refeição inteira (e suas vinculadas),
  // refletindo em todos os alimentos delas.
  const handleToggleMealConsumed = async (mealId: string) => {
    const meals = planDetails?.diet_meals || [];
    const willConsume = !consumedMeals.has(mealId);
    const newMeals = new Set(consumedMeals);
    const newFoods = new Set(consumedFoods);

    getLinkedMealIds(mealId).forEach((id) => {
      const meal = meals.find((m: any) => m.id === id);
      const foodIds = foodIdsOfMeal(meal);
      if (willConsume) {
        newMeals.add(id);
        foodIds.forEach((f) => newFoods.add(f));
      } else {
        newMeals.delete(id);
        foodIds.forEach((f) => newFoods.delete(f));
      }
    });

    await persistConsumption(newMeals, newFoods, willConsume ? mealId : undefined);
  };

  // Toggle de um alimento. Ao completar todos os alimentos da refeição, ela (e
  // suas vinculadas) viram "consumida"; ao desmarcar um item, ela deixa de ser.
  const handleToggleFoodConsumed = async (mealId: string, foodId: string) => {
    const meals = planDetails?.diet_meals || [];
    const meal = meals.find((m: any) => m.id === mealId);
    if (!meal) return;

    const newFoods = new Set(consumedFoods);
    if (newFoods.has(foodId)) newFoods.delete(foodId); else newFoods.add(foodId);

    const foodIds = foodIdsOfMeal(meal);
    const allConsumed = foodIds.length > 0 && foodIds.every((f) => newFoods.has(f));
    const newMeals = new Set(consumedMeals);
    const linked = getLinkedMealIds(mealId);

    if (allConsumed) {
      linked.forEach((id) => {
        newMeals.add(id);
        foodIdsOfMeal(meals.find((m: any) => m.id === id)).forEach((f) => newFoods.add(f));
      });
    } else {
      // Refeição ficou parcial: deixa de contar como consumida; as vinculadas
      // (opções) também voltam ao estado não-consumido.
      linked.forEach((id) => {
        newMeals.delete(id);
        if (id !== mealId) foodIdsOfMeal(meals.find((m: any) => m.id === id)).forEach((f) => newFoods.delete(f));
      });
    }

    await persistConsumption(newMeals, newFoods, allConsumed ? mealId : undefined);
  };

  return {
    activePlan,
    planDetails,
    loading,
    consumedMeals,
    consumedFoods,
    expandedMeals,
    setExpandedMeals,
    expandedOptionGroups,
    toggleOptionGroup,
    primaryChoices,
    setPrimaryChoice,
    substitutionsModalOpen,
    setSubstitutionsModalOpen,
    selectedFoodSubstitutions,
    setSelectedFoodSubstitutions,
    releasedPlans,
    handleChangePlan,
    handleToggleMealConsumed,
    handleToggleFoodConsumed,
  };
}

export type UseDietDataReturn = ReturnType<typeof useDietData>;

import { useState, useEffect, useRef } from 'react';
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
import { formatTextToPlain, sanitizeRichHtml } from '@/lib/utils';
import { WeeklyProgressChart } from '@/components/diets/WeeklyProgressChart';
import { WeeklyHabitsGrid } from '@/components/diets/WeeklyHabitsGrid';
import { GamificationWidget } from '@/components/diets/GamificationWidget';
import { PatientEvolutionTab } from '@/components/diets/PatientEvolutionTab';
import { AdherenceCharts } from '@/components/diets/AdherenceCharts';
import { ExamsHistory } from '@/components/exams/ExamsHistory';
import { LeaderboardWidget } from '@/components/diets/LeaderboardWidget';
import { CommunityFeed } from '@/components/patient-portal/community/CommunityFeed';
import { PatientSubstitutionsTab } from '@/components/patient-portal/substitutions/PatientSubstitutionsTab';
import { MobileBottomNav } from '@/components/patient-portal/MobileBottomNav';
import { portalSettingsService, type PortalConfig } from '@/lib/portal-settings-service';
import { communityService } from '@/lib/community-service';
import {
  Check,
  Plus,
  X,
  ChevronRight,
  CheckCircle,
  Package,
  MapPin,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Share2,
  LogOut,
  Utensils,
  Apple,
  Activity,
  Clock,
  Dumbbell,
  Droplets,
  BookOpen,
  Pill,
  FlaskConical,
  ListChecks,
  ClipboardList,
  AlertTriangle,
  FileText,
  Info,
  RefreshCw,
  ArrowLeftRight,
  Star,
  ExternalLink
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
  console.log("VERSION: EMERALD REF 3.0 LOADED"); // DEBUG LOG
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
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);
  const [activeTab, setActiveTab] = useState<string>('diet');
  // Visibilidade configurável pelo treinador no /admin (default: tudo visível).
  const showDiet = portalConfig?.visibility?.tab_diet !== false;
  const showChallenges = portalConfig?.challenges?.show_tab !== false;
  const showRanking = portalConfig?.visibility?.tab_ranking !== false;
  const showCommunity = portalConfig?.community?.show_tab !== false;
  const showResults = portalConfig?.visibility?.tab_results !== false;
  // Subabas da Dieta
  const showMeals = portalConfig?.visibility?.diet_meals !== false;
  const showSupplements = portalConfig?.visibility?.diet_supplements !== false;
  const showSubstitutions = portalConfig?.visibility?.diet_substitutions !== false;

  const mainTabVisible: Record<string, boolean> = {
    diet: showDiet,
    challenges: showChallenges,
    ranking: showRanking,
    community: showCommunity,
    results: showResults,
  };
  const ALL_MAIN_TABS = ['diet', 'challenges', 'ranking', 'community', 'results'] as const;
  const TAB_ORDER = ALL_MAIN_TABS.filter((t) => mainTabVisible[t]);
  const hiddenNavTabs = ALL_MAIN_TABS.filter((t) => !mainTabVisible[t]);
  // Primeira subaba visível da Dieta (para o defaultValue do Tabs aninhado)
  const firstDietSubtab = showMeals
    ? 'meals'
    : showSupplements
      ? 'supplements'
      : showSubstitutions
        ? 'substitutions'
        : '__none__';
  const visibleDietSubtabs = [showMeals, showSupplements, showSubstitutions].filter(Boolean).length;
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goToTab = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwipe = (deltaX: number, deltaY: number) => {
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
    const idx = TAB_ORDER.indexOf(activeTab);
    // deltaX > 0 → dedo arrastou para esquerda → próxima aba (à direita)
    // deltaX < 0 → dedo arrastou para direita → aba anterior (à esquerda)
    if (deltaX > 0 && idx < TAB_ORDER.length - 1) goToTab(TAB_ORDER[idx + 1]);
    if (deltaX < 0 && idx > 0) goToTab(TAB_ORDER[idx - 1]);
  };

  const trainerUserId = patient?.user_id || '';

  useEffect(() => {
    if (trainerUserId) {
      portalSettingsService.getConfig(trainerUserId).then(setPortalConfig);
    }
  }, [trainerUserId]);

  // Se a aba ativa foi ocultada pelo treinador, cair na primeira aba visível.
  useEffect(() => {
    if (TAB_ORDER.length > 0 && !TAB_ORDER.includes(activeTab as any)) {
      setActiveTab(TAB_ORDER[0]);
    }
  }, [portalConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  // Selo de "novos" da Comunidade: posts novos desde a última visita (mesma
  // chave de localStorage usada pelo feed). Aparece no menu/aba mesmo fora dela.
  const [communityUnread, setCommunityUnread] = useState(0);
  useEffect(() => {
    if (!patientId) return;
    const lastSeen = localStorage.getItem(`community_last_seen_${patientId}`);
    if (!lastSeen) return; // primeira visita: sem selo
    communityService
      .getUnreadByCategory(patientId, lastSeen)
      .then((m) => setCommunityUnread(Object.values(m).reduce((a, b) => a + b, 0)))
      .catch(() => {});
  }, [patientId]);

  // Ao abrir a Comunidade, zera o selo (o próprio feed atualiza a "última visita").
  useEffect(() => {
    if (activeTab === 'community') setCommunityUnread(0);
  }, [activeTab]);

  useEffect(() => {
    loadDietData();
  }, [patientId]);

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
  }, [planDetails]);

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

  // Refeições-opção (alternativas) são modeladas como refeições-filhas via
  // parent_meal_id. A semântica é "coma OU a principal OU a opção", então elas
  // NÃO devem entrar no somatório de macros/calorias (evita dupla contagem).
  const isOptionMeal = (meal: any) => {
    if (meal?.parent_meal_id) return true;
    if (meal?.exclude_from_macros) return true;
    const name = (meal?.meal_name || '').toLowerCase();
    return name.includes('🔁') || name.includes('opção');
  };

  const calcularTotais = (plan: any) => {
    if (!plan || !plan.diet_meals) {
      return { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
    }
    // Somar apenas refeições principais — exclui as refeições-opção
    const mainMeals = plan.diet_meals.filter((meal: any) => !isOptionMeal(meal));
    return calcularTotaisPlano({ ...plan, diet_meals: mainMeals });
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
      // Refeições-opção não entram na soma (evita dupla contagem com a principal)
      if (isOptionMeal(meal)) return;
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

  // Contagem de refeições considera apenas as principais (exclui refeições-opção)
  const mainMeals = (planDetails?.diet_meals || []).filter((m: any) => !isOptionMeal(m));
  const mainMealsCount = mainMeals.length;
  const consumedMainCount = mainMeals.filter((m: any) => consumedMeals.has(m.id)).length;

  // Extrair lógica de categorias das guidelines para fora do JSX
  // Ordena igual ao MyShape: por priority (asc) e, em empate, por created_at (asc)
  const guidelines = [...(planDetails?.diet_guidelines || [])].sort((a: any, b: any) => {
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
  });

  // Utility para checar tipo explícito OU palavras-chave no título (para retrocompatibilidade)
  const isManipulated = (g: any) => {
    if (g.guideline_type === 'manipulated') return true;
    const title = (g.title || '').toLowerCase();
    return title.includes('manipulado') || title.includes('fórmula');
  };

  const isProtocol = (g: any) => {
    if (g.guideline_type === 'protocol') return true;
    const title = (g.title || '').toLowerCase();
    return title.includes('protocolo') || title.includes('ciclo');
  };

  const isSupplement = (g: any) => {
    // Tipos explícitos de suplementação (ex.: 'supplement', 'supplement_suplementacao')
    if (typeof g.guideline_type === 'string' && g.guideline_type.startsWith('supplement') && !isManipulated(g) && !isProtocol(g)) return true;
    const title = (g.title || '').toLowerCase();
    return (title.includes('suplementação') || title.includes('suplemento') || title.includes('junto com')) && !isManipulated(g) && !isProtocol(g);
  };

  const nutritionGuidelines = guidelines.filter((g: any) =>
    !isManipulated(g) && !isProtocol(g) && !isSupplement(g) && g.guideline_type !== 'between_meals'
  );

  const supplementGuidelines = guidelines.filter(isSupplement);
  const manipulatedGuidelines = guidelines.filter(isManipulated);
  const protocolGuidelines = guidelines.filter(isProtocol);

  const renderCategory = (
    items: any[],
    title: string,
    Icon: any,
    colorClass: string,
    bgLightClass: string,
    borderClass: string,
    defaultOpen: boolean = true
  ) => {
    if (items.length === 0) return null;

    return (
      <Collapsible defaultOpen={defaultOpen} className="space-y-3 group/category bg-white rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-1 sm:p-2 rounded-2xl hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-slate-100 to-transparent`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass}`} />
            </div>
            <h3 className="text-lg sm:text-lg font-bold text-slate-800 tracking-wide mt-0.5">
              {title}
            </h3>
          </div>
          <div className="p-2.5 rounded-full bg-slate-50 group-data-[state=open]/category:bg-slate-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-500 transform transition-transform group-data-[state=open]/category:rotate-90" />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="grid gap-3 pt-3">
            {items.map((guideline: any, index: number) => (
              <Collapsible key={guideline.id || index} className="group/item">
                <div
                  className={`bg-white rounded-2xl border ${borderClass} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative`}
                >
                  {/* Subtle edge highlight */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-white/60 to-transparent opacity-50 pointer-events-none z-0`} />

                  <CollapsibleTrigger className="w-full flex items-center justify-between py-2.5 px-4 hover:bg-slate-50/80 transition-colors text-left min-h-[48px] relative z-10">
                    <span className="font-semibold text-sm sm:text-base text-slate-700 pr-4">{formatTextToPlain(guideline.title)}</span>
                    <div className={`p-1.5 rounded-full ${bgLightClass} group-data-[state=open]/item:bg-slate-100 transition-colors`}>
                      <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass} group-data-[state=open]/item:text-slate-500 transform transition-transform group-data-[state=open]/item:rotate-90`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="relative z-10">
                    <div className="px-4 pb-4 pt-0">
                      <div className="h-px w-full bg-slate-100 mb-3" />
                      <div
                        className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none prose-p:my-1 prose-headings:mb-2 prose-headings:mt-3 prose-a:text-blue-600"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(guideline.content) }}
                      />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-5">
      {/* Seletor de Planos (quando houver múltiplos planos liberados) */}
      {releasedPlans.length > 1 && (
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 mb-0.5">Plano Alimentar Ativo</p>
                <p className="text-xs text-slate-500">Você tem {releasedPlans.length} planos disponíveis</p>
              </div>
              <Select value={activePlan?.id} onValueChange={handleChangePlan}>
                <SelectTrigger className="w-full sm:w-[280px] bg-white border-slate-300 text-slate-700 min-h-[44px]">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-700">
                  {releasedPlans.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id} className="py-3 hover:bg-slate-100 focus:bg-slate-100 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{plan.name}</span>
                        {(plan.status === 'active' || plan.active) && (
                          <Badge className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0">
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

      {/* Bottom nav mobile — fora do Tabs mas controla o value */}
      <MobileBottomNav
        value={activeTab as any}
        onChange={(v) => goToTab(v)}
        hidden={hiddenNavTabs as any}
        badges={{ community: communityUnread }}
      />

      {/* Abas: Plano Alimentar, Metas, Resultados e Ranking */}
      <Tabs
        value={activeTab}
        onValueChange={goToTab}
        className="w-full"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || touchStartY.current === null) return;
          handleSwipe(
            touchStartX.current - e.changedTouches[0].clientX,
            touchStartY.current - e.changedTouches[0].clientY,
          );
          touchStartX.current = null;
          touchStartY.current = null;
        }}
      >
        {/* Desktop: abas em linha */}
        <TabsList className="sticky top-0 z-50 hidden sm:flex items-center w-full bg-slate-200/95 backdrop-blur-md p-1 shadow-md rounded-t-lg min-h-[48px]">
          {showDiet && (
            <TabsTrigger value="diet" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-md transition-all h-full flex items-center justify-center">
              Dieta
            </TabsTrigger>
          )}
          {showChallenges && (
            <TabsTrigger value="challenges" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-md transition-all h-full flex items-center justify-center">
              Metas
            </TabsTrigger>
          )}
          {showRanking && (
            <TabsTrigger value="ranking" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-md transition-all h-full flex items-center justify-center">
              Ranking
            </TabsTrigger>
          )}
          {showCommunity && (
            <TabsTrigger value="community" className="relative flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-md transition-all h-full flex items-center justify-center gap-1.5">
              Comunidade
              {communityUnread > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                  {communityUnread > 9 ? '9+' : communityUnread}
                </span>
              )}
            </TabsTrigger>
          )}
          {showResults && (
            <TabsTrigger value="results" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-md transition-all h-full flex items-center justify-center">
              Evolução
            </TabsTrigger>
          )}
        </TabsList>

        {/* Mobile: navegação via MobileBottomNav (fora deste bloco) */}

        {/* Aba: Dieta — sub-tabs Plano Alimentar + Suplementos */}
        <TabsContent value="diet" className="mt-6 space-y-4">
          <Tabs defaultValue={firstDietSubtab} className="w-full">
            {visibleDietSubtabs > 1 && (
              <TabsList
                className={`grid w-full bg-slate-100 p-1 rounded-lg h-auto ${
                  visibleDietSubtabs === 2 ? 'grid-cols-2' : 'grid-cols-3'
                }`}
              >
                {showMeals && (
                  <TabsTrigger
                    value="meals"
                    className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 py-2 rounded-md transition-all"
                  >
                    Plano Alimentar
                  </TabsTrigger>
                )}
                {showSupplements && (
                  <TabsTrigger
                    value="supplements"
                    className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 py-2 rounded-md transition-all"
                  >
                    Suplementos
                  </TabsTrigger>
                )}
                {showSubstitutions && (
                  <TabsTrigger
                    value="substitutions"
                    className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 py-2 rounded-md transition-all"
                  >
                    Substituições
                  </TabsTrigger>
                )}
              </TabsList>
            )}

            <TabsContent value="meals" className="mt-4 space-y-6">
          {!hasActivePlan ? (
            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardContent className="p-5 sm:p-6 text-center">
                <Utensils className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Nenhum plano ativo</h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Seu nutricionista ainda não liberou um plano alimentar para você.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Resumo de Calorias e Macros */}
              <Card className="!bg-white rounded-2xl shadow-lg border border-slate-200 transition-all duration-300 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-5 sm:gap-7">
                    {/* Círculo - lado esquerdo */}
                    <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0">
                      <svg className="transform -rotate-90 w-36 h-36 sm:w-40 sm:h-40">
                        <defs>
                          <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                          </linearGradient>
                        </defs>
                        {/* Mobile */}
                        <circle cx="72" cy="72" r="62" stroke="rgba(0,0,0,0.06)" strokeWidth="10" fill="none" className="sm:hidden" />
                        <circle
                          cx="72" cy="72" r="62"
                          stroke="url(#emerald-gradient)"
                          strokeWidth="10" fill="none"
                          strokeDasharray={`${2 * Math.PI * 62}`}
                          strokeDashoffset={`${2 * Math.PI * 62 * (1 - percentualConsumido / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-500 sm:hidden"
                        />
                        {/* Desktop */}
                        <circle cx="80" cy="80" r="70" stroke="rgba(0,0,0,0.06)" strokeWidth="10" fill="none" className="hidden sm:block" />
                        <circle
                          cx="80" cy="80" r="70"
                          stroke="url(#emerald-gradient)"
                          strokeWidth="10" fill="none"
                          strokeDasharray={`${2 * Math.PI * 70}`}
                          strokeDashoffset={`${2 * Math.PI * 70 * (1 - percentualConsumido / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-500 hidden sm:block"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{Math.round(caloriasConsumidas)}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">/ {Math.round(metaCalorias)} kcal</p>
                      </div>
                    </div>

                    {/* Macros - lado direito, empilhados */}
                    <div className="flex-1 space-y-3 sm:space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Carbos</span>
                          <span className="text-sm font-bold text-slate-800">
                            {carboidratosConsumidos.toFixed(0)}<span className="text-xs text-slate-400 font-normal"> / {metaCarboidratos.toFixed(0)}g</span>
                          </span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((carboidratosConsumidos / metaCarboidratos) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Proteínas</span>
                          <span className="text-sm font-bold text-slate-800">
                            {proteinasConsumidas.toFixed(0)}<span className="text-xs text-slate-400 font-normal"> / {metaProteinas.toFixed(0)}g</span>
                          </span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((proteinasConsumidas / metaProteinas) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Gorduras</span>
                          <span className="text-sm font-bold text-slate-800">
                            {gordurasConsumidas.toFixed(0)}<span className="text-xs text-slate-400 font-normal"> / {metaGorduras.toFixed(0)}g</span>
                          </span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((gordurasConsumidas / metaGorduras) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Refeições e Substituições - Conteúdo original */}
              {hasActivePlan && planDetails?.diet_meals && planDetails.diet_meals.length > 0 && (
                <Card className="!bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-slate-900 flex items-center gap-2">
                          <Apple className="w-5 h-5 text-emerald-500" />
                          {planDetails.name || 'Plano Alimentar'}
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                          {consumedMainCount} de {mainMealsCount} refeições consumidas
                        </p>
                      </div>
                    </div>

                    {/* Barra de Progresso Segmentada Moderna */}
                    <div className="mt-4 flex gap-1.5 h-3">
                      {Array.from({ length: mainMealsCount }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full bg-slate-100 transition-all duration-500 border border-transparent ${i < consumedMainCount
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] border-emerald-200/50'
                            : 'bg-slate-100 border-slate-200'
                            }`}
                        />
                      ))}
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
                          const isOption = isOptionMeal(meal);
                          // Refeição-opção dentro de um grupo recolhido: não renderiza.
                          if (isOption && collapsedOptionGroups.has(meal.parent_meal_id)) {
                            return null;
                          }
                          // Quantas opções esta refeição principal possui (para o botão recolher).
                          const optionCount = !isOption
                            ? planDetails.diet_meals.filter((m: any) => m.parent_meal_id === meal.id).length
                            : 0;
                          const optionsCollapsed = collapsedOptionGroups.has(meal.id);
                          // Remove o emoji 🔁 do nome — a sinalização passa a ser o badge "Opção"
                          const displayName = isOption
                            ? (meal.meal_name || '').replace(/🔁/g, '').trim()
                            : meal.meal_name;

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
                                style={{
                                  backgroundColor: isConsumed ? '#d1fae5' : (isOption ? '#f8fafc' : 'white'),
                                  borderColor: isConsumed ? '#6ee7b7' : '#e2e8f0',
                                  color: '#0f172a'
                                }}
                                className={`rounded-xl border transition-all duration-300 transform hover:scale-[1.01] ${isConsumed
                                  ? 'shadow-sm'
                                  : 'hover:border-emerald-300 hover:shadow-lg'
                                  } ${isOption ? 'ml-4 sm:ml-8 border-l-4 border-l-slate-300' : ''}`}
                              >
                                <CollapsibleTrigger asChild>
                                  <div className="flex items-center justify-between p-3 sm:p-4 cursor-pointer rounded-t-xl transition-all duration-200">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                      <div
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${isConsumed
                                          ? 'bg-emerald-100 text-emerald-600'
                                          : isOption
                                            ? '!bg-emerald-50 !text-emerald-500'
                                            : '!bg-emerald-50 !text-emerald-500'
                                          }`}
                                      >
                                        {isConsumed ? (
                                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                        ) : isOption ? (
                                          <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                        ) : (
                                          <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                          {isOption && (
                                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 border text-xs w-fit gap-1 order-first">
                                              <RefreshCw className="w-3 h-3" />
                                              Opção
                                            </Badge>
                                          )}
                                          <h4 className={`text-sm sm:text-base font-semibold transition-colors text-slate-900 text-balance`}>
                                            {displayName}
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
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                        : '!bg-emerald-50 !text-emerald-600 !border-emerald-100'
                                        }`}>
                                        {isConsumed ? (mealTotals.calorias || 0).toFixed(0) : 0} / {(mealTotals.calorias || 0).toFixed(0)} kcal
                                      </Badge>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleMealConsumed(meal.id);
                                        }}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full transition-all duration-200 min-h-[44px] min-w-[44px] ${isConsumed
                                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
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
                                              style={{ backgroundColor: 'white' }}
                                              className={`p-2 sm:p-3 rounded-lg border transition-all duration-300 gap-2 ${isConsumed
                                                ? 'border-emerald-100'
                                                : 'border-slate-100 hover:border-emerald-200 shadow-sm'
                                                }`}
                                            >
                                              <div className="flex items-start sm:items-center justify-between gap-2">
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                  {isConsumed && (
                                                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <span className={`font-medium text-xs sm:text-sm block ${isConsumed ? 'text-slate-500 line-through' : 'text-slate-700'
                                                      }`}>
                                                      {food.food_name}
                                                    </span>
                                                    <Badge className={`text-xs font-medium mt-1 inline-flex ${isConsumed
                                                      ? 'bg-slate-100 text-slate-500 border-slate-200'
                                                      : 'bg-slate-100 text-slate-600 border-slate-200'
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
                                                  <Badge className={`text-xs font-medium text-right min-w-[60px] sm:min-w-[70px] ${isConsumed
                                                    ? 'bg-slate-50 text-slate-400 border-slate-100'
                                                    : '!bg-emerald-50 !text-emerald-600 !border-emerald-100'
                                                    } border`}>
                                                    {food.calories} kcal
                                                  </Badge>
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
                                          Observações:
                                        </p>
                                        <div
                                          className="text-sm text-amber-800 leading-relaxed prose prose-sm max-w-none prose-p:my-1"
                                          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(meal.instructions) }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </CollapsibleContent>

                                {/* Recolher/expandir as refeições-opção desta principal */}
                                {!isOption && optionCount > 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleOptionGroup(meal.id); }}
                                    style={{ background: 'radial-gradient(ellipse 55% 130% at 50% 50%, rgba(16,185,129,0.08), rgba(16,185,129,0) 70%)' }}
                                    className="flex w-full items-center justify-center gap-1.5 border-t border-emerald-100/70 px-4 py-2 text-xs font-semibold text-emerald-600 transition-all duration-200 rounded-b-xl hover:text-emerald-700"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    {optionsCollapsed
                                      ? `Ver ${optionCount} ${optionCount === 1 ? 'opção' : 'opções'}`
                                      : `Ocultar ${optionCount === 1 ? 'opção' : 'opções'}`}
                                    <ChevronRight
                                      className={`w-3.5 h-3.5 transition-transform duration-200 ${optionsCollapsed ? '' : 'rotate-90'}`}
                                    />
                                  </button>
                                )}
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

              {/* Orientações Nutricionais */}
              {hasActivePlan && planDetails?.diet_guidelines && planDetails.diet_guidelines.length > 0 && (
                <div className="space-y-6 mt-8">
                  <div className="space-y-4">
                    {renderCategory(
                      nutritionGuidelines,
                      "Orientações Nutricionais",
                      ClipboardList,
                      "text-emerald-500",
                      "bg-emerald-500/10",
                      "border-emerald-100"
                    )}
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

            <TabsContent value="supplements" className="mt-4 space-y-6">
          {!hasActivePlan ? (
            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardContent className="p-5 sm:p-6 text-center">
                <Pill className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Sem suplementação</h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Seu nutricionista ainda não cadastrou informações de suplementação.
                </p>
              </CardContent>
            </Card>
          ) : supplementGuidelines.length === 0 && manipulatedGuidelines.length === 0 && protocolGuidelines.length === 0 ? (
            <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardContent className="p-5 sm:p-6 text-center">
                <Pill className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Sem protocolos ativos</h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Não há suplementos, manipulados ou protocolos definidos para este plano.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                {renderCategory(
                  supplementGuidelines,
                  "Suplementação",
                  Pill,
                  "text-blue-500",
                  "bg-blue-500/10",
                  "border-blue-100",
                  false
                )}
                {renderCategory(
                  manipulatedGuidelines,
                  "Manipulados",
                  FlaskConical,
                  "text-purple-500",
                  "bg-purple-500/10",
                  "border-purple-100",
                  false
                )}
                {renderCategory(
                  protocolGuidelines,
                  "Protocolo",
                  ListChecks,
                  "text-amber-500",
                  "bg-amber-500/10",
                  "border-amber-100",
                  false
                )}
              </div>

              {/* Card Suplementos Custo Benefício */}
              {patient?.user_id === 'a9798432-60bd-4ac8-a035-d139a47ad59b' && (
                <Card className="relative overflow-hidden border-0 rounded-2xl shadow-xl mt-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 opacity-90 layer-bg"></div>
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                  <CardContent className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 z-10">
                    <div className="text-center sm:text-left text-white flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold mb-2 flex items-center justify-center sm:justify-start gap-2">
                        <Star className="w-6 h-6 text-amber-300 fill-amber-300/50" />
                        Em dúvida sobre qual marca escolher?
                      </h3>
                      <p className="text-emerald-50 text-sm sm:text-base leading-relaxed max-w-xl">
                        Preparamos uma lista exclusiva com as melhores opções de suplementos do mercado, priorizando a máxima qualidade com o melhor custo-benefício para seus resultados.
                      </p>
                    </div>
                    <Button
                      onClick={() => window.open('https://area-de-membros-fabriciomourateam.vercel.app/#/suplementos-lista', '_blank')}
                      className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-600 font-bold px-8 py-6 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 group whitespace-nowrap"
                    >
                      <span>Ver Recomendações</span>
                      <ExternalLink className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
            </TabsContent>

            <TabsContent value="substitutions" className="mt-4 space-y-4">
              <PatientSubstitutionsTab patientId={patientId} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Aba: Metas (com histórico semanal) */}
        <TabsContent value="challenges" className="mt-6 space-y-6">
          <DailyChallengesWidget patientId={patientId} />
          <WeeklyHabitsGrid patientId={patientId} />
        </TabsContent>

        {/* Aba: Resultados (Fusão de Progresso e Evolução) */}
        <TabsContent value="results" className="mt-6 space-y-8">
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚖️</span> Evolução Corporal
            </h3>
            <PatientEvolutionTab
              patientId={patientId}
              checkins={checkins}
              patient={patient}
              bodyCompositions={bodyCompositions}
              achievements={achievements}
              refreshTrigger={refreshTrigger}
              isPatientView={true}
            />
          </section>
        </TabsContent>

        {/* Aba: Ranking & Conquistas */}
        <TabsContent value="ranking" className="mt-6 space-y-6">
          {trainerUserId && (
            <LeaderboardWidget
              patientId={patientId}
              trainerUserId={trainerUserId}
              periods={portalConfig?.ranking?.periods ?? ['monthly', 'all_time']}
            />
          )}

          {(!portalConfig || portalConfig.ranking.show_gamification) && (
            <GamificationWidget patientId={patientId} />
          )}

          {portalConfig?.ranking?.show_weekly_progress && (
            <WeeklyProgressChart patientId={patientId} />
          )}

          {portalConfig?.ranking?.show_adherence && (
            <AdherenceCharts patientId={patientId} lowAdherenceThreshold={70} />
          )}
        </TabsContent>

        {showCommunity && (
          <TabsContent value="community" className="mt-6">
            {trainerUserId ? (
              <CommunityFeed
                patientId={patientId}
                trainerUserId={trainerUserId}
                trainerInstagram={portalConfig?.branding?.instagram || ''}
                shareCaption={portalConfig?.branding?.share_caption || ''}
              />
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">
                Comunidade indisponível no momento.
              </p>
            )}
          </TabsContent>
        )}
      </Tabs >

      {/* Modal de Substituições */}
      < Dialog open={substitutionsModalOpen} onOpenChange={setSubstitutionsModalOpen} >
        <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900 max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="relative pb-4 border-b border-slate-200">
            <button
              onClick={() => setSubstitutionsModalOpen(false)}
              className="absolute right-0 top-0 rounded-full p-2 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-slate-500 hover:text-slate-900" />
            </button>
            <DialogTitle className="text-slate-900 text-lg sm:text-xl font-bold flex items-center gap-2 pr-12">
              <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin-slow" />
              <span className="truncate">Opções de Substituição</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 pr-8">
              Você pode substituir <strong className="text-emerald-600">{selectedFoodSubstitutions?.foodName}</strong> por qualquer uma das opções abaixo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-2 mt-4 custom-scrollbar">
            {selectedFoodSubstitutions?.substitutions.map((sub: any, index: number) => (
              <div
                key={index}
                className="p-3 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors text-sm sm:text-base truncate">
                      {sub.food_name}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Quantidade: <span className="font-medium text-emerald-600">{sub.quantity} {sub.unit}</span>
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

          <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
            <p className="text-xs text-cyan-700 flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>
                Essas são opções equivalentes que você pode usar no lugar do alimento original.
              </span>
            </p>
          </div>
        </DialogContent>
      </Dialog >
    </div >
  );
}



import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { calcularTotaisPlano } from '@/utils/diet-calculations';
import { formatTextToPlain, sanitizeRichHtml } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ExamsHistory } from '@/components/exams/ExamsHistory';
import { PatientSubstitutionsTab } from '@/components/patient-portal/substitutions/PatientSubstitutionsTab';
import {
  Check,
  Plus,
  X,
  ChevronRight,
  CheckCircle,
  Utensils,
  Apple,
  Pill,
  FlaskConical,
  ListChecks,
  ClipboardList,
  AlertTriangle,
  Info,
  RefreshCw,
  ArrowLeftRight,
  Star,
  ExternalLink,
} from 'lucide-react';
import type { UseDietDataReturn } from './useDietData';

interface DietTabProps {
  diet: UseDietDataReturn;
  patientId: string;
  patient?: any;
  refreshTrigger?: number;
  showMeals: boolean;
  showSupplements: boolean;
  showSubstitutions: boolean;
  firstDietSubtab: string;
  visibleDietSubtabs: number;
}

// Refeições-opção (alternativas) são modeladas como refeições-filhas via
// parent_meal_id. A semântica é "coma OU a principal OU a opção", então elas
// NÃO devem entrar no somatório de macros/calorias (evita dupla contagem).
function isOptionMeal(meal: any) {
  if (meal?.parent_meal_id) return true;
  if (meal?.exclude_from_macros) return true;
  const name = (meal?.meal_name || '').toLowerCase();
  return name.includes('🔁') || name.includes('opção');
}

/** Badge "Opção" clicável: ao tocar, abre tooltip explicando que é alternativa
 *  à refeição principal. Fecha ao clicar fora ou tocar de novo. Sem dependências. */
function OptionBadge() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative inline-block order-first" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-expanded={open}
        aria-label="O que e uma refeicao opcao?"
        className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
      >
        <RefreshCw className="w-3 h-3" />
        Opção
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-1.5 w-[240px] rounded-lg border border-emerald-200 bg-white p-3 text-xs leading-relaxed text-slate-700 shadow-xl"
        >
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-slate-900">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            Refeição alternativa
          </p>
          <p>
            Você pode fazer esta refeição <strong>no lugar</strong> da principal — escolha uma das duas, não as duas.
          </p>
          <p className="mt-1.5 text-slate-500">
            Toque em <em>"Usar hoje"</em> pra contabilizá-la no seu plano do dia.
          </p>
        </div>
      )}
    </div>
  );
}

export function DietTab({
  diet,
  patientId,
  patient,
  refreshTrigger,
  showMeals,
  showSupplements,
  showSubstitutions,
  firstDietSubtab,
  visibleDietSubtabs,
}: DietTabProps) {
  const {
    activePlan,
    planDetails,
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
    handleToggleMealConsumed,
    handleToggleFoodConsumed,
  } = diet;

  // Cache de gramas-por-unidade dos alimentos do modal de Substituições.
  // O MyShape grava substituições só com {food_name, unit, quantity} — sem
  // custom_unit_grams pra frutas como "3 ameixas". Aqui buscamos no food_database
  // a tabela `common_units` (ex: [{unit:"unidade média", grams:42}]) e usamos
  // como fallback no render. Chave = food_name lowercase.
  const [substitutionGramsMap, setSubstitutionGramsMap] = useState<Map<string, number>>(new Map());
  useEffect(() => {
    if (!substitutionsModalOpen || !selectedFoodSubstitutions) return;
    const subs = selectedFoodSubstitutions.substitutions || [];
    const names = Array.from(new Set(
      subs.filter((s: any) => !Number(s.custom_unit_grams))
          .map((s: any) => String(s.food_name || '').trim())
          .filter(Boolean)
    ));
    if (names.length === 0) { setSubstitutionGramsMap(new Map()); return; }
    let cancelled = false;
    supabase.from('food_database')
      .select('name, common_units')
      .in('name', names as string[])
      .then(({ data }) => {
        if (cancelled) return;
        const m = new Map<string, number>();
        (data || []).forEach((row: any) => {
          const arr = Array.isArray(row.common_units) ? row.common_units : [];
          // Pega a primeira unidade com grams > 0 (cobre "unidade média", "fatia", etc).
          const u = arr.find((x: any) => Number(x?.grams) > 0);
          if (u) m.set(String(row.name).toLowerCase(), Number(u.grams));
        });
        setSubstitutionGramsMap(m);
      });
    return () => { cancelled = true; };
  }, [substitutionsModalOpen, selectedFoodSubstitutions]);

  // Refeição "em uso" de cada grupo (principal + opções): default a principal,
  // sobrescrita pela escolha do dia. Exatamente UMA por grupo conta nos macros.
  const mealIdSet = new Set((planDetails?.diet_meals || []).map((m: any) => m.id));
  const activeIdOfGroup = (principalId: string) => {
    const chosen = primaryChoices[principalId];
    // Se a escolha do dia aponta pra refeição inexistente (plano mudou), volta à principal.
    return chosen && mealIdSet.has(chosen) ? chosen : principalId;
  };
  const isCountedMeal = (meal: any) => {
    // opção "solta" (sem parent, marcada por nome/flag) nunca entra na soma
    if (!meal.parent_meal_id && isOptionMeal(meal)) return false;
    const principalId = meal.parent_meal_id || meal.id;
    return meal.id === activeIdOfGroup(principalId);
  };

  // Remover o return early - mostrar abas mesmo sem plano ativo
  const hasActivePlan = activePlan && planDetails;

  const totais = hasActivePlan
    ? calcularTotaisPlano({ ...planDetails, diet_meals: (planDetails.diet_meals || []).filter(isCountedMeal) })
    : { calorias: 0, carboidratos: 0, proteinas: 0, gorduras: 0 };
  const metaCalorias = totais.calorias;
  const metaCarboidratos = totais.carboidratos;
  const metaProteinas = totais.proteinas;
  const metaGorduras = totais.gorduras;

  let caloriasConsumidas = 0;
  let carboidratosConsumidos = 0;
  let proteinasConsumidas = 0;
  let gordurasConsumidas = 0;

  if (hasActivePlan && planDetails?.diet_meals) {
    planDetails.diet_meals.forEach((meal: any) => {
      // Só a refeição "em uso" do grupo entra na soma (evita dupla contagem).
      if (!isCountedMeal(meal)) return;
      const foods = meal.diet_foods || [];
      if (foods.length > 0) {
        // Soma alimento a alimento: consumo parcial conta proporcional.
        foods.forEach((food: any) => {
          if (consumedFoods.has(food.id)) {
            caloriasConsumidas += food.calories || 0;
            carboidratosConsumidos += food.carbs || 0;
            proteinasConsumidas += food.protein || 0;
            gordurasConsumidas += food.fats || 0;
          }
        });
      } else if (consumedMeals.has(meal.id)) {
        // Refeição sem alimentos detalhados: usa o total da refeição.
        const mealTotals = calcularTotaisPlano({ diet_meals: [meal] });
        caloriasConsumidas += mealTotals.calorias;
        carboidratosConsumidos += mealTotals.carboidratos;
        proteinasConsumidas += mealTotals.proteinas;
        gordurasConsumidas += mealTotals.gorduras;
      }
    });
  }
  caloriasConsumidas = Math.round(caloriasConsumidas);
  carboidratosConsumidos = Math.round(carboidratosConsumidos * 10) / 10;
  proteinasConsumidas = Math.round(proteinasConsumidas * 10) / 10;
  gordurasConsumidas = Math.round(gordurasConsumidas * 10) / 10;

  const percentualConsumido = metaCalorias > 0 ? Math.min(100, (caloriasConsumidas / metaCalorias) * 100) : 0;

  // Contagem considera só a refeição "em uso" de cada grupo (1 por grupo)
  const mainMeals = (planDetails?.diet_meals || []).filter(isCountedMeal);
  const mainMealsCount = mainMeals.length;
  const consumedMainCount = mainMeals.filter((m: any) => consumedMeals.has(m.id)).length;

  // Ordem de exibição: cada grupo (principal + opções) sai junto, com a refeição
  // "em uso hoje" no topo do grupo — quando o aluno escolhe uma opção, ela sobe
  // pro lugar da principal e a principal desce pra posição de opção.
  const displayMeals = (() => {
    const meals = [...(planDetails?.diet_meals || [])].sort((a: any, b: any) => (a.meal_order || 0) - (b.meal_order || 0));
    const childrenByParent = new Map<string, any[]>();
    const principals: any[] = [];
    for (const m of meals) {
      if (m.parent_meal_id) {
        const arr = childrenByParent.get(m.parent_meal_id) || [];
        arr.push(m);
        childrenByParent.set(m.parent_meal_id, arr);
      } else {
        principals.push(m);
      }
    }
    const out: any[] = [];
    for (const p of principals) {
      const activeId = activeIdOfGroup(p.id);
      const group = [p, ...(childrenByParent.get(p.id) || [])];
      group.sort((a: any, b: any) => (a.id === activeId ? -1 : b.id === activeId ? 1 : 0)); // ativa primeiro; resto mantém ordem
      out.push(...group);
    }
    // Opções órfãs (principal ausente): mantém ao final, sem perder nada.
    for (const [pid, arr] of childrenByParent) {
      if (!principals.some((p) => p.id === pid)) out.push(...arr);
    }
    return out;
  })();

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
    // O banco usa 'supplement_manipulados' (do MyShape); 'manipulated' é o nome legado.
    const t = g.guideline_type;
    if (t === 'manipulated' || t === 'supplement_manipulados' || t === 'supplement_manipulado') return true;
    const title = (g.title || '').toLowerCase();
    return title.includes('manipulado') || title.includes('fórmula');
  };

  const isProtocol = (g: any) => {
    // O banco usa 'supplement_protocolo' (do MyShape); 'protocol' é o nome legado.
    const t = g.guideline_type;
    if (t === 'protocol' || t === 'supplement_protocolo' || t === 'supplement_protocolos') return true;
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
    <>
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
                        <CardTitle className="text-slate-900 text-base sm:text-lg font-semibold flex items-center gap-2">
                          <Apple className="w-4 h-4 text-emerald-500" />
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
                      {displayMeals
                        .map((meal: any, index: number) => {
                          const mealTotals = calcularTotaisPlano({ diet_meals: [meal] });
                          const isConsumed = consumedMeals.has(meal.id);
                          // Kcal consumidas desta refeição (parcial = soma dos alimentos marcados).
                          const mealHasFoods = (meal.diet_foods || []).length > 0;
                          const mealConsumedKcal = mealHasFoods
                            ? (meal.diet_foods || []).reduce((s: number, f: any) => s + (consumedFoods.has(f.id) ? (f.calories || 0) : 0), 0)
                            : (isConsumed ? (mealTotals.calorias || 0) : 0);
                          const isExpanded = expandedMeals.has(meal.id);
                          const isOption = isOptionMeal(meal);
                          // Escolha do dia: refeição "em uso" do grupo (default = principal).
                          const principalId = meal.parent_meal_id || meal.id;
                          const isActive = isCountedMeal(meal);
                          const groupSwapped = activeIdOfGroup(principalId) !== principalId;
                          // Mostra estilo de "opção" quando não é a refeição em uso do grupo
                          // (inclui a principal rebaixada após uma troca).
                          const showAsOption = !isActive;
                          // Opção dentro de um grupo recolhido só some se NÃO for a em uso hoje.
                          // Default = colapsado (set guarda os que o aluno expandiu).
                          if (isOption && !isActive && !expandedOptionGroups.has(meal.parent_meal_id)) {
                            return null;
                          }
                          // Quantas opções esta refeição principal possui (para o botão recolher).
                          const optionCount = !isOption
                            ? planDetails.diet_meals.filter((m: any) => m.parent_meal_id === meal.id).length
                            : 0;
                          // Faz parte de um grupo com alternativas (principal c/ opções, ou uma opção).
                          const inSwappableGroup = !!meal.parent_meal_id || optionCount > 0;
                          const optionsCollapsed = !expandedOptionGroups.has(meal.id);
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
                                  backgroundColor: isConsumed ? '#d1fae5' : (showAsOption ? '#f8fafc' : 'white'),
                                  borderColor: isConsumed ? '#6ee7b7' : '#e2e8f0',
                                  color: '#0f172a'
                                }}
                                // Opção: menos indent, borda esquerda fina emerald
                                // (em vez de slate-300 grossa) — indica filiação com
                                // a principal verde acima. Sem hover-scale/shadow-lg
                                // pra nao competir visualmente com a principal.
                                className={`rounded-xl border transition-all duration-300 ${isConsumed
                                  ? 'shadow-sm'
                                  : (showAsOption ? 'hover:border-emerald-300' : 'hover:border-emerald-300 hover:shadow-lg transform hover:scale-[1.01]')
                                  } ${showAsOption ? 'ml-3 sm:ml-6 border-l-2 border-l-emerald-300' : ''}`}
                              >
                                <CollapsibleTrigger asChild>
                                  <div className="flex items-center justify-between p-3 sm:p-4 cursor-pointer rounded-t-xl transition-all duration-200">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                      {/* Circulo verde com icone fica SO nas refeicoes principais
                                          (e quando ja foi consumida). Em refeicao-opcao o badge
                                          'Opcao' assume o papel de marcador visual a esquerda. */}
                                      {!showAsOption && (
                                        <div
                                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${isConsumed
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : '!bg-emerald-50 !text-emerald-500'
                                            }`}
                                        >
                                          {isConsumed ? (
                                            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                          ) : (
                                            <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
                                          )}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        {/* Refeicao-opcao: badge 'Opcao' (que ja inclui o icone circular)
                                            fica SEMPRE na linha do titulo — assume o papel do icone
                                            esquerdo. Principal mantem layout flex-col em mobile. */}
                                        <div className={`flex items-center gap-1.5 sm:gap-2 ${showAsOption ? 'flex-row flex-wrap' : 'flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'}`}>
                                          {isActive && groupSwapped && (
                                            <Badge className="bg-emerald-500 text-white border-emerald-600 border text-xs w-fit gap-1 order-first">
                                              <Check className="w-3 h-3" />
                                              Em uso hoje
                                            </Badge>
                                          )}
                                          {showAsOption && <OptionBadge />}
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
                                        {mealConsumedKcal.toFixed(0)} / {(mealTotals.calorias || 0).toFixed(0)} kcal
                                      </Badge>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleMealConsumed(meal.id);
                                        }}
                                        aria-label={isConsumed ? 'Desmarcar refeição' : 'Marcar refeição como consumida'}
                                        // Discreto quando não-consumido (chip outline), forte quando ok.
                                        // Reduz o "ruído verde" da tela inteira com vários cards.
                                        className={`w-7 h-7 sm:w-8 sm:h-8 p-0 rounded-full transition-all duration-200 min-h-[36px] min-w-[36px] ${isConsumed
                                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                                          : 'bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-none'
                                          }`}
                                      >
                                        {isConsumed ? (
                                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        ) : (
                                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        )}
                                      </Button>
                                      <ChevronRight
                                        className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''
                                          }`}
                                      />
                                    </div>
                                  </div>
                                </CollapsibleTrigger>

                                {/* Troca opção↔principal do dia (zera ao virar o dia).
                                    'Usar hoje' (era 'Trocar por hoje') — mais direto:
                                    sinaliza que vai contar essa no lugar da principal. */}
                                {inSwappableGroup && !isConsumed && (
                                  <div className="flex items-center justify-end gap-2 px-3 sm:px-4 pb-2 -mt-1">
                                    {!isActive ? (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setPrimaryChoice(principalId, meal.id); }}
                                        title="Usar esta opção no lugar da refeição principal hoje"
                                        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[11px] font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                                      >
                                        <ArrowLeftRight className="w-3 h-3" />
                                        Usar hoje
                                      </button>
                                    ) : groupSwapped ? (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setPrimaryChoice(principalId, principalId); }}
                                        title="Desfazer a troca e voltar à refeição original"
                                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50"
                                      >
                                        <RefreshCw className="w-3 h-3" />
                                        Desfazer troca
                                      </button>
                                    ) : null}
                                  </div>
                                )}

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

                                          const foodConsumed = consumedFoods.has(food.id);

                                          return (
                                            <div
                                              key={food.id || foodIndex}
                                              style={{ backgroundColor: 'white' }}
                                              className={`p-2 sm:p-3 rounded-lg border transition-all duration-300 gap-2 ${foodConsumed
                                                ? 'border-emerald-100'
                                                : 'border-slate-100 hover:border-emerald-200 shadow-sm'
                                                }`}
                                            >
                                              <div className="flex items-start sm:items-center justify-between gap-2">
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleToggleFoodConsumed(meal.id, food.id);
                                                    }}
                                                    aria-label={foodConsumed ? 'Desmarcar alimento' : 'Marcar alimento como consumido'}
                                                    className="flex-shrink-0 mt-0.5 transition-transform duration-150 hover:scale-110"
                                                  >
                                                    {foodConsumed ? (
                                                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                    ) : (
                                                      <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                                                    )}
                                                  </button>
                                                  <div className="flex-1 min-w-0">
                                                    <span className={`font-medium text-xs sm:text-sm block ${foodConsumed ? 'text-slate-500 line-through' : 'text-slate-700'
                                                      }`}>
                                                      {food.food_name}
                                                    </span>
                                                    <Badge className={`text-xs font-medium mt-1 inline-flex ${foodConsumed
                                                      ? 'bg-slate-100 text-slate-500 border-slate-200'
                                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                                      } border`}>
                                                      {(() => {
                                                        // Mostra peso em gramas pra medidas caseiras (colher, pedaco,
                                                        // unidade, fatia etc) usando custom_unit_grams cadastrado pelo
                                                        // nutri no controle-de-pacientes. Esconde pra unidades base
                                                        // (g/ml/etc), 'a vontade' ou quando nao tem peso salvo.
                                                        const unitRaw = String(food.unit || '').toLowerCase().trim();
                                                        const isBase = ['g', 'gramas', 'grama', 'kg', 'ml', 'mililitro', 'mililitros', 'l', 'litro', 'litros'].includes(unitRaw);
                                                        const isAVontade = unitRaw === 'à vontade' || unitRaw === 'a vontade';
                                                        const cug = Number(food.custom_unit_grams) || 0;
                                                        const qty = Number(food.quantity) || 0;
                                                        const grams = cug > 0 ? cug * qty : 0;
                                                        const unitLabel = food.unit === 'unidade' && food.quantity > 1 ? 'unidades' : food.unit;
                                                        if (grams > 0 && !isBase && !isAVontade) {
                                                          const gramsLabel = grams < 10 ? `${grams.toFixed(1).replace(/\.0$/, '')}g` : `${Math.round(grams)}g`;
                                                          return <>{food.quantity} {unitLabel} <span className="opacity-60">({gramsLabel})</span></>;
                                                        }
                                                        return <>{food.quantity} {unitLabel}</>;
                                                      })()}
                                                    </Badge>
                                                  </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                                                  {substitutions.length > 0 && !foodConsumed && (
                                                    // Era um Button shadcn (h-7 sm:h-8 + min-h-[44px]) que
                                                    // ficava enorme ao lado do '117 kcal'. Vira chip outline
                                                    // emerald compacto com texto 'Substitutos' (mais claro
                                                    // que 'Trocar' — bate com o vocabulario da aba).
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFoodSubstitutions({
                                                          foodName: food.food_name,
                                                          substitutions: substitutions
                                                        });
                                                        setSubstitutionsModalOpen(true);
                                                      }}
                                                      title="Ver alimentos substitutos com porções equivalentes"
                                                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[11px] font-medium text-emerald-600 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
                                                    >
                                                      <RefreshCw className="w-3 h-3" />
                                                      Substitutos
                                                    </button>
                                                  )}
                                                  <Badge className={`text-xs font-medium text-right min-w-[60px] sm:min-w-[70px] ${foodConsumed
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

                                {/* Recolher/expandir as refeições-opção desta principal.
                                    Chip discreto centralizado, sem barra verde no rodapé. */}
                                {!isOption && optionCount > 0 && (
                                  <div className="flex justify-center pb-2 pt-0.5">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleOptionGroup(meal.id); }}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      {optionsCollapsed
                                        ? `Ver ${optionCount} ${optionCount === 1 ? 'opção' : 'opções'}`
                                        : `Ocultar ${optionCount === 1 ? 'opção' : 'opções'}`}
                                      <ChevronRight
                                        className={`w-3 h-3 transition-transform duration-200 ${optionsCollapsed ? '' : 'rotate-90'}`}
                                      />
                                    </button>
                                  </div>
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

              {/* Card Suplementos Custo Benefício — versão compacta */}
              {patient?.user_id === 'a9798432-60bd-4ac8-a035-d139a47ad59b' && (
                <Card className="relative overflow-hidden border-0 rounded-xl shadow-md mt-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 opacity-90 layer-bg"></div>
                  <CardContent className="relative p-3 sm:p-4 flex items-center gap-3 z-10">
                    <Star className="w-5 h-5 text-amber-300 fill-amber-300/50 shrink-0" />
                    <div className="text-left text-white flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold leading-tight">
                        Em dúvida sobre qual marca escolher?
                      </h3>
                      <p className="text-emerald-50 text-xs mt-0.5 line-clamp-2">
                        Lista exclusiva com as melhores opções com o melhor custo-benefício.
                      </p>
                    </div>
                    <Button
                      onClick={() => window.open('https://area-de-membros-fabriciomourateam.vercel.app/#/suplementos-lista', '_blank')}
                      className="shrink-0 bg-white hover:bg-emerald-50 text-emerald-600 font-semibold px-3 py-2 h-auto rounded-lg text-xs sm:text-sm whitespace-nowrap"
                    >
                      Ver lista
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
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

      {/* Modal de Substituições */}
      <Dialog open={substitutionsModalOpen} onOpenChange={setSubstitutionsModalOpen}>
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
                      Quantidade:{' '}
                      {(() => {
                        const unitRaw = String(sub.unit || '').toLowerCase().trim();
                        const isBase = ['g', 'gramas', 'grama', 'kg', 'ml', 'mililitro', 'mililitros', 'l', 'litro', 'litros'].includes(unitRaw);
                        const isAVontade = unitRaw === 'à vontade' || unitRaw === 'a vontade';
                        // Fallback: se custom_unit_grams nao veio na substituicao,
                        // pega do food_database.common_units (lookup feito no useEffect).
                        const cug = Number(sub.custom_unit_grams)
                          || substitutionGramsMap.get(String(sub.food_name || '').toLowerCase())
                          || 0;
                        const qty = Number(sub.quantity) || 0;
                        const grams = cug > 0 ? cug * qty : 0;
                        if (grams > 0 && !isBase && !isAVontade) {
                          const gramsLabel = grams < 10 ? `${grams.toFixed(1).replace(/\.0$/, '')}g` : `${Math.round(grams)}g`;
                          return (
                            <span className="font-medium text-emerald-600">
                              {sub.quantity} {sub.unit} <span className="opacity-70">({gramsLabel})</span>
                            </span>
                          );
                        }
                        return <span className="font-medium text-emerald-600">{sub.quantity} {sub.unit}</span>;
                      })()}
                      {sub.custom_unit_name && (
                        <span className="ml-2 text-xs block sm:inline mt-1 sm:mt-0 opacity-70">
                          medida: {sub.custom_unit_name}
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
      </Dialog>
    </>
  );
}

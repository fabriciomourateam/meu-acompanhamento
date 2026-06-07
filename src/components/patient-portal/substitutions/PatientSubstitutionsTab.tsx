import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Sparkles, ArrowRight } from "lucide-react";
import {
  fetchAllPatientFoods,
  type PatientFood,
} from "@/lib/patient-substitutions-service";
import {
  CATEGORY_TO_MACRO_GROUP,
  MACRO_GROUPS,
  type MacroGroupId,
} from "@/lib/food-macro-groups";
import { useFoodFavorites } from "@/lib/use-food-favorites";
import { useToast } from "@/hooks/use-toast";
import { MacroGroupTabs } from "./MacroGroupTabs";
import { FoodGrid } from "./FoodGrid";
import { SubstitutionsPanel } from "./SubstitutionsPanel";
import { FoodAutocomplete } from "./FoodAutocomplete";
import { InlineComparison } from "./InlineComparison";
import { Skeleton } from "@/components/ui/skeleton";

function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

interface PatientSubstitutionsTabProps {
  patientId: string;
}

export function PatientSubstitutionsTab({ patientId }: PatientSubstitutionsTabProps) {
  const { toast } = useToast();
  const [allFoods, setAllFoods] = useState<PatientFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const favorites = useFoodFavorites(patientId);

  const [activeTab, setActiveTab] = useState<MacroGroupId | "favs">("carbos");
  const [search, setSearch] = useState("");
  // Paginacao no client: carrega 20 alimentos por vez (~5 linhas em qualquer
  // breakpoint do grid). Reseta sempre que muda filtro/busca/aba pra nao
  // carregar tudo de uma vez (a aba Carboidratos tinha ~40 itens).
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeTab, search]);
  const [selected, setSelected] = useState<PatientFood | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [baseFood, setBaseFood] = useState<PatientFood | null>(null);
  const [targetFood, setTargetFood] = useState<PatientFood | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllPatientFoods()
      .then((foods) => {
        if (!cancelled) {
          setAllFoods(foods);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const result: Record<MacroGroupId, number> = {
      carbos: 0,
      proteinas: 0,
      frutas: 0,
      vegetais: 0,
      gorduras: 0,
      laticinios: 0,
      bebidas: 0,
    };
    for (const f of allFoods) {
      result[f.macro_group] = (result[f.macro_group] ?? 0) + 1;
    }
    return result;
  }, [allFoods]);

  const visibleFoods = useMemo(() => {
    let filtered = allFoods;
    const q = stripDiacritics(search.trim().toLowerCase());

    if (q.length > 0) {
      filtered = filtered.filter((f) => stripDiacritics(f.name.toLowerCase()).includes(q));
    } else if (activeTab === "favs") {
      const favSet = new Set(favorites.list);
      filtered = filtered.filter((f) => favSet.has(f.id));
    } else {
      filtered = filtered.filter(
        (f) => CATEGORY_TO_MACRO_GROUP[f.category?.toLowerCase()?.trim() ?? ""] === activeTab
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const aHas = a.common_units.length > 0 ? 1 : 0;
      const bHas = b.common_units.length > 0 ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      return a.name.localeCompare(b.name, "pt-BR");
    });

    return sorted;
  }, [allFoods, activeTab, favorites.list, search]);

  const handleToggleFavorite = useCallback(
    (id: string) => {
      const food = allFoods.find((f) => f.id === id);
      const wasFav = favorites.has(id);
      favorites.toggle(id);
      if (food) {
        if (wasFav) {
          toast({ title: "Removido dos favoritos", description: food.name });
        } else {
          toast({ title: "⭐ Adicionado aos favoritos", description: food.name });
        }
      }
    },
    [allFoods, favorites, toast]
  );

  const onboardedRef = useRef(false);
  useEffect(() => {
    if (!patientId || onboardedRef.current) return;
    if (typeof window === "undefined") return;
    const key = `myshape:subs-onboarded:${patientId}`;
    if (window.localStorage.getItem(key)) return;
    onboardedRef.current = true;
    const t = setTimeout(() => {
      toast({
        title: "👋 Toque num alimento",
        description: "Veja substitutos com macros equivalentes. ⭐ pra favoritar.",
        duration: 6000,
      });
      try {
        window.localStorage.setItem(key, "1");
      } catch {
        /* quota — ignora */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [patientId, toast]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || allFoods.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-3xl mb-2">🍽️</p>
        <p className="text-sm">
          {error
            ? "Erro ao carregar alimentos. Tente recarregar a página."
            : "Nenhum alimento disponível."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero — instruções rápidas */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-3 sm:p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900">Substitua sem culpa</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              Compare dois alimentos direto, ou toque na lista pra ver opções equivalentes
              do mesmo grupo com gramas já ajustadas.
            </p>
          </div>
        </div>
      </div>

      {/* Comparador direto: A → B */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50/60 p-3 sm:p-4 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
          Comparar dois alimentos
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <FoodAutocomplete
              foods={allFoods}
              value={baseFood}
              onChange={setBaseFood}
              placeholder="Qual alimento substituir?"
            />
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
          <div className="flex-1 min-w-0">
            <FoodAutocomplete
              foods={allFoods}
              value={targetFood}
              onChange={setTargetFood}
              placeholder="Por qual?"
            />
          </div>
        </div>
        {baseFood && targetFood && (
          <InlineComparison base={baseFood} target={targetFood} />
        )}
      </div>

      {/* Separador */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] uppercase tracking-wide text-slate-400">
          ou explore por grupo
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar alimento... (ex: banana, frango, arroz)"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/40"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tabs por macrogrupo */}
      <div className="sticky top-0 z-10 -mx-1 bg-white/80 px-1 py-2 backdrop-blur-sm">
        <MacroGroupTabs
          active={activeTab}
          onChange={setActiveTab}
          favoritesCount={favorites.list.length}
          counts={counts}
        />
      </div>

      {/* Resumo numérico */}
      <p className="text-xs text-slate-500">
        {search ? (
          <>
            {visibleFoods.length} resultado{visibleFoods.length !== 1 ? "s" : ""} para "{search}"
          </>
        ) : activeTab === "favs" ? (
          <>{favorites.list.length} favorito{favorites.list.length !== 1 ? "s" : ""}</>
        ) : (
          <>
            {visibleFoods.length} alimento{visibleFoods.length !== 1 ? "s" : ""} •{" "}
            {MACRO_GROUPS.find((g) => g.id === activeTab)?.label}
          </>
        )}
      </p>

      {/* Grid de alimentos */}
      <FoodGrid
        foods={visibleFoods.slice(0, visibleCount)}
        onSelect={(f) => {
          setSelected(f);
          setPanelOpen(true);
        }}
        hasFavorite={favorites.has}
        onToggleFavorite={handleToggleFavorite}
        searchTerm={search.trim() || undefined}
        onSuggestionClick={setSearch}
        emptyMessage={
          search
            ? `Nenhum alimento encontrado para "${search}".`
            : activeTab === "favs"
            ? "Você ainda não tem favoritos. Toque na ⭐ de um alimento para adicionar."
            : `Nenhum alimento em ${
                MACRO_GROUPS.find((g) => g.id === activeTab)?.label ?? "esta categoria"
              }.`
        }
      />

      {/* Botao 'Carregar mais' quando ha alimentos ainda nao mostrados */}
      {visibleCount < visibleFoods.length && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Carregar mais
            <span className="text-[10px] font-normal text-slate-400">
              ({visibleFoods.length - visibleCount} restante{visibleFoods.length - visibleCount !== 1 ? 's' : ''})
            </span>
          </button>
        </div>
      )}

      {/* Painel lateral com substituições */}
      <SubstitutionsPanel food={selected} open={panelOpen} onOpenChange={setPanelOpen} />
    </div>
  );
}

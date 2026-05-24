import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Search } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FoodItem {
  id: string;
  name: string;
  category: string | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fats_per_100g: number | null;
}

interface SubstitutionListWidgetProps {
  trainerUserId: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Proteínas': '🥩',
  'Carboidratos': '🍚',
  'Gorduras': '🥑',
  'Frutas': '🍎',
  'Legumes': '🥦',
  'Verduras': '🥬',
  'Laticínios': '🧀',
  'Leguminosas': '🫘',
  'Oleaginosas': '🥜',
  'Bebidas': '🥤',
};

function categoryIcon(cat: string): string {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '🍽️';
}

export function SubstitutionListWidget({ trainerUserId }: SubstitutionListWidgetProps) {
  const [grouped, setGrouped] = useState<Record<string, FoodItem[]>>({});
  const [allItems, setAllItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('food_database')
      .select('id, name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g')
      .eq('is_active', true)
      .order('category')
      .order('name')
      .then(({ data, error }) => {
        if (cancelled || error || !data) {
          if (!cancelled) setLoading(false);
          return;
        }
        const items = data as FoodItem[];
        setAllItems(items);
        buildGrouped(items, '');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [trainerUserId]);

  const buildGrouped = (items: FoodItem[], q: string) => {
    const filtered = q.trim()
      ? items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()))
      : items;
    const map: Record<string, FoodItem[]> = {};
    for (const item of filtered) {
      const cat = item.category || 'Outros';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    setGrouped(map);
    if (q.trim()) {
      setOpenCategories(new Set(Object.keys(map)));
    }
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    buildGrouped(allItems, q);
  };

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl bg-slate-700/40" />
        ))}
      </div>
    );
  }

  const categories = Object.keys(grouped);
  const total = allItems.length;

  if (total === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-3xl mb-2">🍽️</p>
        <p className="text-sm">Nenhum alimento cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar alimento..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <p className="text-xs text-slate-400">
        {total} alimentos · {Object.keys(grouped).length} categorias
        {search ? ` · ${Object.values(grouped).flat().length} resultado(s)` : ''}
      </p>

      {categories.length === 0 && (
        <p className="text-center text-sm text-slate-500 py-6">Nenhum resultado para "{search}".</p>
      )}

      {categories.map(cat => {
        const items = grouped[cat];
        const isOpen = openCategories.has(cat);

        return (
          <Collapsible key={cat} open={isOpen} onOpenChange={() => toggleCategory(cat)}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{categoryIcon(cat)}</span>
                  <span className="text-sm font-semibold text-slate-700">{cat}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-1 ml-2 space-y-1">
                {items.map(food => {
                  const kcal = food.calories_per_100g;
                  const p = food.protein_per_100g;
                  const c = food.carbs_per_100g;
                  const g = food.fats_per_100g;
                  return (
                    <div
                      key={food.id}
                      className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 font-medium truncate">{food.name}</p>
                        {kcal != null && (
                          <p className="text-xs text-slate-400 mt-0.5">{kcal} kcal / 100g</p>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs shrink-0 ml-3">
                        {p != null && p > 0 && (
                          <span className="text-blue-500 font-semibold">{p}g P</span>
                        )}
                        {c != null && c > 0 && (
                          <span className="text-purple-500 font-semibold">{c}g C</span>
                        )}
                        {g != null && g > 0 && (
                          <span className="text-emerald-500 font-semibold">{g}g G</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

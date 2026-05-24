import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FoodItem {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  gram_equivalent: number | null;
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
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!trainerUserId) return;
    let cancelled = false;

    supabase
      .from('food_database')
      .select('id, name, category, calories, protein, carbs, fat, unit, gram_equivalent')
      .eq('user_id', trainerUserId)
      .order('category')
      .order('name')
      .then(({ data, error }) => {
        if (cancelled || error || !data) {
          if (!cancelled) setLoading(false);
          return;
        }
        const map: Record<string, FoodItem[]> = {};
        for (const item of data as FoodItem[]) {
          const cat = item.category || 'Outros';
          if (!map[cat]) map[cat] = [];
          map[cat].push(item);
        }
        setGrouped(map);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [trainerUserId]);

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

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-3xl mb-2">🍽️</p>
        <p className="text-sm">Nenhum alimento cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 mb-4">
        {Object.values(grouped).flat().length} alimentos em {categories.length} categorias
      </p>

      {categories.map(cat => {
        const items = grouped[cat];
        const isOpen = openCategories.has(cat);
        const icon = categoryIcon(cat);

        return (
          <Collapsible key={cat} open={isOpen} onOpenChange={() => toggleCategory(cat)}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm font-semibold text-slate-200">{cat}</span>
                  <span className="text-xs text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-1.5 ml-2 space-y-1">
                {items.map(food => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-700/30 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 font-medium truncate">{food.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {food.gram_equivalent
                          ? `${food.gram_equivalent}g`
                          : `1 ${food.unit}`}
                        {food.calories ? ` · ${food.calories} kcal` : ''}
                      </p>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400 shrink-0 ml-3">
                      {food.protein > 0 && (
                        <span className="text-blue-400 font-medium">{food.protein}g P</span>
                      )}
                      {food.carbs > 0 && (
                        <span className="text-purple-400 font-medium">{food.carbs}g C</span>
                      )}
                      {food.fat > 0 && (
                        <span className="text-emerald-400 font-medium">{food.fat}g G</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { foodSuggestionsService, FoodSuggestion } from '@/lib/diet-food-suggestions-service';

interface FoodSuggestionsDropdownProps {
  mealType: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  existingFoods?: string[];
  onSelect: (foodName: string) => void;
  children: React.ReactNode;
}

export function FoodSuggestionsDropdown({
  mealType,
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFats,
  existingFoods,
  onSelect,
  children,
}: FoodSuggestionsDropdownProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadSuggestions();
    }
  }, [open, mealType, targetCalories, targetProtein, targetCarbs, targetFats, existingFoods]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await foodSuggestionsService.suggestFoods({
        mealType,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFats,
        existingFoods,
      }, 8);
      setSuggestions(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar sugestões',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (food: FoodSuggestion) => {
    await foodSuggestionsService.recordFoodUsage(food.food_name, mealType);
    onSelect(food.food_name);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-96 bg-slate-900 border-cyan-500/30 text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold text-cyan-300">Sugestões Inteligentes</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm">
              Nenhuma sugestão disponível
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suggestions.map((food, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(food)}
                  className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-white">{food.food_name}</div>
                      <div className="text-xs text-slate-400 mt-1">{food.reason}</div>
                    </div>
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-300 text-xs">
                      {food.match_score}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Cal:</span>
                      <span className="text-cyan-400 ml-1">{Math.round(food.calories_per_100g)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">P:</span>
                      <span className="text-cyan-400 ml-1">{Math.round(food.protein_per_100g * 10) / 10}g</span>
                    </div>
                    <div>
                      <span className="text-slate-400">C:</span>
                      <span className="text-cyan-400 ml-1">{Math.round(food.carbs_per_100g * 10) / 10}g</span>
                    </div>
                    <div>
                      <span className="text-slate-400">G:</span>
                      <span className="text-cyan-400 ml-1">{Math.round(food.fats_per_100g * 10) / 10}g</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

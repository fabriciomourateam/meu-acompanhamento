import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Loader2, Search, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { foodSubstitutionService, FoodSubstitution } from '@/lib/diet-food-substitution-service';
import { supabase } from '@/integrations/supabase/client';

interface Food {
  id?: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
}

interface FoodSubstitutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalFood: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  onSubstitute: (substitution: FoodSubstitution, newQuantity: number) => void;
  foodDatabase?: Food[];
  onFoodSaved?: () => void;
}

export function FoodSubstitutionModal({
  open,
  onOpenChange,
  originalFood,
  onSubstitute,
  foodDatabase = [],
  onFoodSaved,
}: FoodSubstitutionModalProps) {
  const { toast } = useToast();
  const [substitutions, setSubstitutions] = useState<FoodSubstitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubstitution, setSelectedSubstitution] = useState<FoodSubstitution | null>(null);
  const [newQuantity, setNewQuantity] = useState(originalFood.quantity.toString());
  const [searchMode, setSearchMode] = useState<'suggestions' | 'search'>('suggestions');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      loadSubstitutions();
      setNewQuantity(originalFood.quantity.toString());
      setSelectedSubstitution(null);
      setSearchMode('suggestions');
      setSearchTerm('');
      setFilteredFoods([]);
    }
  }, [open, originalFood]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.length >= 2 && searchMode === 'search') {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        const filtered = foodDatabase.filter((food) =>
          food.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 20);
        setFilteredFoods(filtered);
        setIsSearching(false);
      }, 200);
    } else {
      setFilteredFoods([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, foodDatabase, searchMode]);

  const loadSubstitutions = async () => {
    setLoading(true);
    try {
      const data = await foodSubstitutionService.findSubstitutions(originalFood, 10);
      setSubstitutions(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao buscar substituições',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFoodFromSearch = (food: Food) => {
    const substitution: FoodSubstitution = {
      food_name: food.name,
      category: 'Outros',
      calories_per_100g: food.calories_per_100g,
      protein_per_100g: food.protein_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      fats_per_100g: food.fats_per_100g,
      similarity_score: 0,
      quantity_adjustment: originalFood.quantity,
    };
    setSelectedSubstitution(substitution);
    setSearchMode('suggestions');
  };

  const handleSaveNewFood = async () => {
    if (!searchTerm || searchTerm.length < 3) {
      toast({
        title: 'Erro',
        description: 'Digite pelo menos 3 caracteres para salvar um novo alimento',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('food_database')
        .select('id')
        .eq('name', searchTerm.trim())
        .single();

      if (existing) {
        toast({
          title: 'Alimento já existe',
          description: 'Este alimento já está no banco de dados',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('food_database')
        .insert({
          name: searchTerm.trim(),
          category: 'Outros',
          calories_per_100g: 0,
          protein_per_100g: 0,
          carbs_per_100g: 0,
          fats_per_100g: 0,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: 'Alimento salvo!',
        description: `${searchTerm} foi adicionado ao banco de dados.`,
      });

      onFoodSaved?.();

      const newFood: Food = {
        name: searchTerm.trim(),
        calories_per_100g: 0,
        protein_per_100g: 0,
        carbs_per_100g: 0,
        fats_per_100g: 0,
      };

      handleSelectFoodFromSearch(newFood);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar o alimento',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubstitute = () => {
    if (!selectedSubstitution) {
      toast({
        title: 'Erro',
        description: 'Selecione uma substituição',
        variant: 'destructive',
      });
      return;
    }

    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Erro',
        description: 'Quantidade inválida',
        variant: 'destructive',
      });
      return;
    }

    onSubstitute(selectedSubstitution, quantity);
    onOpenChange(false);
    toast({
      title: 'Alimento substituído',
      description: `${originalFood.name} substituído por ${selectedSubstitution.food_name}`,
    });
  };

  const calculateAdjustedMacros = (substitution: FoodSubstitution, quantity: number) => {
    const quantityInGrams = foodSubstitutionService.convertToGrams(quantity, originalFood.unit);
    const multiplier = quantityInGrams / 100;

    return {
      calories: Math.round(substitution.calories_per_100g * multiplier),
      protein: Math.round(substitution.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(substitution.carbs_per_100g * multiplier * 10) / 10,
      fats: Math.round(substitution.fats_per_100g * multiplier * 10) / 10,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-green-500/30 bg-white text-[#222222]">
        <DialogHeader>
          <DialogTitle className="text-[#222222] flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-[#00C98A]" />
            Substituir Alimento
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            Encontre alternativas para <strong>{originalFood.name}</strong> mantendo macros similares
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alimento Original */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-sm text-[#777777] mb-2">Alimento Original</div>
            <div className="font-semibold text-[#222222] mb-3">{originalFood.name}</div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-[#777777]">Calorias</div>
                <div className="text-[#00A875] font-semibold">{originalFood.calories}</div>
              </div>
              <div>
                <div className="text-[#777777]">Proteínas</div>
                <div className="text-[#00A875] font-semibold">{originalFood.protein}g</div>
              </div>
              <div>
                <div className="text-[#777777]">Carboidratos</div>
                <div className="text-[#00A875] font-semibold">{originalFood.carbs}g</div>
              </div>
              <div>
                <div className="text-[#777777]">Gorduras</div>
                <div className="text-[#00A875] font-semibold">{originalFood.fats}g</div>
              </div>
            </div>
          </div>

          {/* Modo de busca ou sugestões */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={searchMode === 'suggestions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('suggestions')}
              className={searchMode === 'suggestions' ? 'bg-[#00C98A] hover:bg-[#00A875] text-white' : 'bg-[#222222] hover:bg-[#333333] text-white border-0'}
            >
              Sugestões
            </Button>
            <Button
              type="button"
              variant={searchMode === 'search' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSearchMode('search');
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className={searchMode === 'search' ? 'bg-[#00C98A] hover:bg-[#00A875] text-white' : 'bg-[#222222] hover:bg-[#333333] text-white border-0'}
            >
              Buscar Alimento
            </Button>
          </div>

          {/* Campo de busca */}
          {searchMode === 'search' && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#777777]" />
              <Input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome do alimento..."
                className="pl-10 border-green-500/30 bg-white text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-white focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-green-500/10 focus-visible:ring-offset-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredFoods.length > 0) {
                    handleSelectFoodFromSearch(filteredFoods[0]);
                  } else if (e.key === 'Escape') {
                    setSearchMode('suggestions');
                  }
                }}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-[#777777]" />
              )}
            </div>
          )}

          {/* Lista de resultados da busca */}
          {searchMode === 'search' && (
            <div className="mb-4 border border-green-500/30 rounded-lg max-h-60 overflow-y-auto">
              {searchTerm.length < 2 ? (
                <div className="p-8 text-center text-[#777777]">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Digite pelo menos 2 caracteres para buscar</p>
                </div>
              ) : filteredFoods.length === 0 ? (
                <div className="p-8 text-center text-[#777777]">
                  <p className="mb-4">Nenhum alimento encontrado</p>
                  {!foodDatabase.find((food) => food.name.toLowerCase() === searchTerm.toLowerCase()) && searchTerm.length >= 3 && (
                    <Button
                      type="button"
                      onClick={handleSaveNewFood}
                      disabled={saving}
                      className="bg-[#00C98A] hover:bg-[#00A875] text-white"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar "{searchTerm}" como novo alimento
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-green-500/10">
                  {filteredFoods.map((food, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectFoodFromSearch(food)}
                      className="w-full text-left px-4 py-3 hover:bg-green-500/10 transition-colors focus:bg-green-500/10 focus:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-[#222222]">{food.name}</div>
                          <div className="text-xs text-[#777777] mt-1">
                            {Math.round(food.calories_per_100g)} kcal • P: {Math.round(food.protein_per_100g * 10) / 10}g • C: {Math.round(food.carbs_per_100g * 10) / 10}g • G: {Math.round(food.fats_per_100g * 10) / 10}g
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {!foodDatabase.find((food) => food.name.toLowerCase() === searchTerm.toLowerCase()) && searchTerm.length >= 3 && (
                    <div className="px-4 py-3 bg-green-500/5 border-t border-green-500/30">
                      <div className="text-xs text-[#777777] mb-2">Alimento não encontrado</div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveNewFood}
                        disabled={saving}
                        className="w-full bg-[#00C98A] hover:bg-[#00A875] text-white"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 mr-2" />
                            Salvar "{searchTerm}" como novo alimento
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Lista de Substituições */}
          {searchMode === 'suggestions' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#00C98A]" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-[#222222]">Substituições Sugeridas</div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {substitutions.map((sub, index) => {
                  const adjustedMacros = calculateAdjustedMacros(sub, parseFloat(newQuantity) || originalFood.quantity);
                  const isSelected = selectedSubstitution?.food_name === sub.food_name;

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedSubstitution(sub)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-green-500/20 border-green-500/50'
                          : 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-[#222222]">{sub.food_name}</div>
                          <div className="text-xs text-[#777777] mt-1">{sub.category}</div>
                        </div>
                        <Badge variant="outline" className="border-green-500/50 text-[#00A875] bg-green-500/10">
                          {Math.round(sub.similarity_score)}% similar
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-[#777777]">Calorias</div>
                          <div className="text-[#00A875] font-semibold">{adjustedMacros.calories}</div>
                          <div className="text-xs text-[#777777]">
                            ({Math.round(sub.calories_per_100g)}/100g)
                          </div>
                        </div>
                        <div>
                          <div className="text-[#777777]">Proteínas</div>
                          <div className="text-[#00A875] font-semibold">{adjustedMacros.protein}g</div>
                          <div className="text-xs text-[#777777]">
                            ({Math.round(sub.protein_per_100g * 10) / 10}g/100g)
                          </div>
                        </div>
                        <div>
                          <div className="text-[#777777]">Carboidratos</div>
                          <div className="text-[#00A875] font-semibold">{adjustedMacros.carbs}g</div>
                          <div className="text-xs text-[#777777]">
                            ({Math.round(sub.carbs_per_100g * 10) / 10}g/100g)
                          </div>
                        </div>
                        <div>
                          <div className="text-[#777777]">Gorduras</div>
                          <div className="text-[#00A875] font-semibold">{adjustedMacros.fats}g</div>
                          <div className="text-xs text-[#777777]">
                            ({Math.round(sub.fats_per_100g * 10) / 10}g/100g)
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
              )}
            </>
          )}

          {/* Quantidade */}
          {selectedSubstitution && (
            <div className="space-y-2">
              <Label className="text-[#222222]">Nova Quantidade</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="border-green-500/30 bg-green-500/10 text-[#222222] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-green-500/10 focus-visible:ring-offset-0"
                />
                <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-md text-[#222222]">
                  {originalFood.unit}
                </div>
              </div>
              <div className="text-xs text-[#777777]">
                Quantidade sugerida: {Math.round(selectedSubstitution.quantity_adjustment)}g
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-[#222222] hover:bg-[#333333] text-white border-0"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubstitute}
            disabled={!selectedSubstitution}
            className="bg-[#00C98A] hover:bg-[#00A875] text-white"
          >
            Substituir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Food {
  id?: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
}

interface FoodSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodDatabase: Food[];
  onSelect: (food: Food) => void;
  onFoodSaved?: () => void;
}

export function FoodSelectionModal({
  open,
  onOpenChange,
  foodDatabase,
  onSelect,
  onFoodSaved,
}: FoodSelectionModalProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setFilteredFoods([]);
      // Focar no input quando o modal abrir
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        const filtered = foodDatabase.filter((food) =>
          food.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 20); // Mostrar até 20 resultados
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
  }, [searchTerm, foodDatabase]);

  const handleSelectFood = (food: Food) => {
    onSelect(food);
    onOpenChange(false);
    setSearchTerm('');
    setFilteredFoods([]);
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
      // Verificar se já existe
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

      // Criar novo alimento com valores padrão
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

      // Criar objeto food para selecionar
      const newFood: Food = {
        name: searchTerm.trim(),
        calories_per_100g: 0,
        protein_per_100g: 0,
        carbs_per_100g: 0,
        fats_per_100g: 0,
      };

      handleSelectFood(newFood);
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

  const exactMatch = foodDatabase.find((food) =>
    food.name.toLowerCase() === searchTerm.toLowerCase()
  );
  const showSaveOption = !exactMatch && searchTerm.length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border-green-500/30 bg-white text-[#222222]">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-[#222222]">Selecionar Alimento</DialogTitle>
          <DialogDescription className="text-[#777777]">
            Digite o nome do alimento para buscar ou criar um novo
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Campo de busca */}
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
                  handleSelectFood(filteredFoods[0]);
                } else if (e.key === 'Escape') {
                  onOpenChange(false);
                }
              }}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-[#777777]" />
            )}
          </div>

          {/* Lista de resultados */}
          <div className="flex-1 overflow-y-auto border border-green-500/30 rounded-lg">
            {searchTerm.length < 2 ? (
              <div className="p-8 text-center text-[#777777]">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Digite pelo menos 2 caracteres para buscar</p>
              </div>
            ) : filteredFoods.length === 0 && !showSaveOption ? (
              <div className="p-8 text-center text-[#777777]">
                <p className="mb-4">Nenhum alimento encontrado</p>
                {showSaveOption && (
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
                    onClick={() => handleSelectFood(food)}
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
                {showSaveOption && (
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
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-4">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="bg-[#00C98A] hover:bg-[#00A875] text-white border-0"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


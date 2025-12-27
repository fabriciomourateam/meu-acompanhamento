import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Plus, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Food {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
}

interface FoodSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (foodName: string) => void;
  foodDatabase: Food[];
  placeholder?: string;
  className?: string;
  onFoodSaved?: () => void;
}

export function FoodSearchInput({
  value,
  onChange,
  onSelect,
  foodDatabase,
  placeholder = "Digite o nome do alimento...",
  className = "",
  onFoodSaved,
}: FoodSearchInputProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSaveOption, setShowSaveOption] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const [userWantsSearch, setUserWantsSearch] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Debounce para buscar apenas após o usuário parar de digitar
  // Só busca se o usuário realmente quer buscar (não está apenas editando)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Só buscar se o campo está focado, tem 2+ caracteres, e o usuário quer buscar
    if (searchTerm.length >= 2 && isFocused && userWantsSearch) {
      searchTimeoutRef.current = setTimeout(() => {
        setIsSearching(true);
        const filtered = foodDatabase.filter((food) =>
          food.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
        setFilteredFoods(filtered);
        setIsSearching(false);
        
        const exactMatch = foodDatabase.find((food) =>
          food.name.toLowerCase() === searchTerm.toLowerCase()
        );
        setShowSaveOption(!exactMatch && searchTerm.length >= 3);
        
        // Só abrir o popover se houver resultados ou opção de salvar
        if (filtered.length > 0 || (!exactMatch && searchTerm.length >= 3)) {
          setOpen(true);
        } else {
          setOpen(false);
        }
      }, 400); // Aguardar 400ms após parar de digitar
    } else if (!isFocused || !userWantsSearch) {
      // Não fechar imediatamente, apenas quando perder o foco
      if (!isFocused) {
        setFilteredFoods([]);
        setShowSaveOption(false);
        setOpen(false);
      }
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, foodDatabase, isFocused, userWantsSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setHasSelected(false); // Permitir edição após seleção
    
    // Se o usuário está digitando e já tinha selecionado algo, não buscar automaticamente
    // Só buscar se o usuário realmente quer (ex: ao focar novamente)
    if (hasSelected && newValue.length > 0) {
      setUserWantsSearch(false);
    }
  };

  const handleSelectFood = (foodName: string) => {
    onChange(foodName);
    onSelect(foodName);
    setOpen(false);
    setSearchTerm(foodName);
    setHasSelected(true);
    setUserWantsSearch(false); // Não buscar automaticamente após seleção
    // Focar novamente no input para permitir edição
    setTimeout(() => {
      inputRef.current?.focus();
      // Selecionar todo o texto para facilitar edição
      inputRef.current?.select();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredFoods.length > 0 && open) {
      e.preventDefault();
      handleSelectFood(filteredFoods[0].name);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setUserWantsSearch(false);
    } else if (e.key === 'ArrowDown' && open && filteredFoods.length > 0) {
      // Permitir navegação com setas
      e.preventDefault();
      // Focar no primeiro item da lista
      const firstItem = document.querySelector('[data-food-item]') as HTMLElement;
      firstItem?.focus();
    } else {
      // Quando o usuário começa a digitar, ativar busca
      if (e.key.length === 1 && !hasSelected) {
        setUserWantsSearch(true);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Só buscar automaticamente se o usuário não tinha selecionado algo antes
    // ou se o campo está vazio/novo
    if (!hasSelected || searchTerm.length === 0) {
      setUserWantsSearch(true);
      // Se já tem texto, buscar imediatamente ao focar
      if (searchTerm.length >= 2) {
        const filtered = foodDatabase.filter((food) =>
          food.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
        setFilteredFoods(filtered);
        const exactMatch = foodDatabase.find((food) =>
          food.name.toLowerCase() === searchTerm.toLowerCase()
        );
        setShowSaveOption(!exactMatch && searchTerm.length >= 3);
        if (filtered.length > 0 || (!exactMatch && searchTerm.length >= 3)) {
          setOpen(true);
        }
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Fechar o popover após um pequeno delay para permitir cliques nos itens
    setTimeout(() => {
      setOpen(false);
    }, 200);
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

      // Criar novo alimento com valores padrão (0 para macros)
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
        description: `${searchTerm} foi adicionado ao banco de dados. Você pode editar os macros depois.`,
      });

      onFoodSaved?.();
      handleSelectFood(searchTerm.trim());
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

  const shouldShowPopover = open && (filteredFoods.length > 0 || showSaveOption);

  return (
    <Popover open={shouldShowPopover && isFocused} onOpenChange={(open) => {
      if (!open) {
        setOpen(false);
      }
    }}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onDoubleClick={() => {
              // Duplo clique ativa a busca
              setUserWantsSearch(true);
              if (searchTerm.length >= 2) {
                const filtered = foodDatabase.filter((food) =>
                  food.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).slice(0, 10);
                setFilteredFoods(filtered);
                const exactMatch = foodDatabase.find((food) =>
                  food.name.toLowerCase() === searchTerm.toLowerCase()
                );
                setShowSaveOption(!exactMatch && searchTerm.length >= 3);
                if (filtered.length > 0 || (!exactMatch && searchTerm.length >= 3)) {
                  setOpen(true);
                }
              }
            }}
            placeholder={placeholder}
            className={className}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-[#777777]" />
          )}
          {!isSearching && searchTerm.length > 0 && !open && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setUserWantsSearch(true);
                if (searchTerm.length >= 2) {
                  const filtered = foodDatabase.filter((food) =>
                    food.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).slice(0, 10);
                  setFilteredFoods(filtered);
                  const exactMatch = foodDatabase.find((food) =>
                    food.name.toLowerCase() === searchTerm.toLowerCase()
                  );
                  setShowSaveOption(!exactMatch && searchTerm.length >= 3);
                  if (filtered.length > 0 || (!exactMatch && searchTerm.length >= 3)) {
                    setOpen(true);
                  }
                }
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-green-500/10 rounded transition-colors"
              title="Buscar alimento"
            >
              <Search className="h-4 w-4 text-[#777777]" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-green-500/30" align="start">
        <div className="max-h-60 overflow-y-auto">
          {filteredFoods.length === 0 && !showSaveOption ? (
            <div className="p-4 text-sm text-[#777777] text-center">
              Nenhum alimento encontrado
            </div>
          ) : (
            <div className="py-1">
              {filteredFoods.map((food, index) => (
                <button
                  key={index}
                  data-food-item
                  onClick={() => handleSelectFood(food.name)}
                  className="w-full text-left px-4 py-2 hover:bg-green-500/10 transition-colors border-b border-green-500/10 last:border-b-0 focus:bg-green-500/10 outline-none"
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
                <div className="px-4 py-3 border-t border-green-500/30 bg-green-500/5">
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
      </PopoverContent>
    </Popover>
  );
}


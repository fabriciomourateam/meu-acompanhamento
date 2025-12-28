import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ArrowUpDown, Search } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface FoodSubstitution {
  food_name: string;
  quantity: number;
  unit: string;
  custom_unit_name?: string;
  custom_unit_grams?: number;
}

interface FoodSubstitutionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalFoodName: string;
  originalFoodQuantity?: number;
  originalFoodUnit?: string;
  originalFoodCalories?: number;
  originalFoodProtein?: number;
  originalFoodCarbs?: number;
  originalFoodFats?: number;
  substitutions: FoodSubstitution[];
  onSave: (substitutions: FoodSubstitution[]) => void;
  onSwapWithMain?: (substitution: FoodSubstitution, substitutionMacros: { calories: number; protein: number; carbs: number; fats: number } | null) => void;
}

interface FoodData {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
}

const units = ['g', 'kg', 'ml', 'unidade', 'unidades', 'colher de sopa', 'colher de chá', 'xícara', 'fatia', 'pedaço', 'porção', 'medida personalizada'];

export function FoodSubstitutionsModal({
  open,
  onOpenChange,
  originalFoodName,
  originalFoodQuantity = 100,
  originalFoodUnit = 'g',
  originalFoodCalories,
  originalFoodProtein,
  originalFoodCarbs,
  originalFoodFats,
  substitutions: initialSubstitutions,
  onSave,
  onSwapWithMain,
}: FoodSubstitutionsModalProps) {
  const { toast } = useToast();
  const [substitutions, setSubstitutions] = useState<FoodSubstitution[]>(initialSubstitutions || []);
  const [foodDatabase, setFoodDatabase] = useState<FoodData[]>([]);
  const [originalFoodData, setOriginalFoodData] = useState<FoodData | null>(null);
  const [substitutionsFoodData, setSubstitutionsFoodData] = useState<Map<number, FoodData>>(new Map());
  const [newSubstitution, setNewSubstitution] = useState<FoodSubstitution>({
    food_name: '',
    quantity: originalFoodQuantity,
    unit: originalFoodUnit,
  });
  const [customUnitGrams, setCustomUnitGrams] = useState<Map<number, number>>(new Map());
  const [customUnitNames, setCustomUnitNames] = useState<Map<number, string>>(new Map());
  const [showCustomUnitInput, setShowCustomUnitInput] = useState<number | null>(null);
  const [showFoodDropdown, setShowFoodDropdown] = useState(false);
  const [filteredFoods, setFilteredFoods] = useState<FoodData[]>([]);
  const foodInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSubstitutions(initialSubstitutions || []);
      setNewSubstitution({
        food_name: '',
        quantity: originalFoodQuantity,
        unit: originalFoodUnit,
      });
      setShowFoodDropdown(false);
      setFilteredFoods([]);
      
      // Carregar medidas personalizadas das substituições existentes
      const gramsMap = new Map<number, number>();
      const namesMap = new Map<number, string>();
      initialSubstitutions?.forEach((sub, index) => {
        if (sub.custom_unit_grams) {
          gramsMap.set(index, sub.custom_unit_grams);
        }
        if (sub.custom_unit_name) {
          namesMap.set(index, sub.custom_unit_name);
        }
      });
      setCustomUnitGrams(gramsMap);
      setCustomUnitNames(namesMap);
      
      loadFoodDatabase();
      loadOriginalFoodData();
    }
  }, [open, initialSubstitutions, originalFoodQuantity, originalFoodUnit]);

  // Filtrar alimentos quando digita
  useEffect(() => {
    if (newSubstitution.food_name.length >= 2) {
      const filtered = foodDatabase.filter((food) =>
        food.name.toLowerCase().includes(newSubstitution.food_name.toLowerCase())
      ).slice(0, 10);
      setFilteredFoods(filtered);
      setShowFoodDropdown(filtered.length > 0);
    } else {
      setFilteredFoods([]);
      setShowFoodDropdown(false);
    }
  }, [newSubstitution.food_name, foodDatabase]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        foodInputRef.current &&
        !foodInputRef.current.contains(event.target as Node)
      ) {
        setShowFoodDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadFoodDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('food_database')
        .select('name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setFoodDatabase(data || []);
    } catch (error) {
      console.error('Erro ao carregar banco de alimentos:', error);
    }
  };

  const loadOriginalFoodData = async () => {
    try {
      // Tentar busca exata primeiro
      let { data, error } = await supabase
        .from('food_database')
        .select('name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g')
        .ilike('name', originalFoodName)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      // Se não encontrar, tentar busca parcial com primeira palavra
      if (!data || error) {
        const cleanName = originalFoodName.split(/[,\(]/)[0].trim();
        const firstWords = cleanName.split(' ').slice(0, 2).join(' ');
        
        const result = await supabase
          .from('food_database')
          .select('name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g')
          .ilike('name', `%${firstWords}%`)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (!error && data) {
        setOriginalFoodData(data);
      } else {
        setOriginalFoodData(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do alimento original:', error);
    }
  };

  const loadSubstitutionFoodData = async (index: number, foodName: string) => {
    try {
      const { data, error } = await supabase
        .from('food_database')
        .select('name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g')
        .ilike('name', `%${foodName}%`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setSubstitutionsFoodData(prev => {
          const newMap = new Map(prev);
          newMap.set(index, data);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados da substituição:', error);
    }
  };

  const addSubstitution = () => {
    if (!newSubstitution.food_name.trim() || newSubstitution.quantity <= 0) {
      toast({
        title: 'Erro',
        description: 'Preencha o nome e quantidade do alimento antes de adicionar',
        variant: 'destructive',
      });
      return;
    }
    
    const newIndex = substitutions.length;
    setSubstitutions([...substitutions, newSubstitution]);
    
    // Carregar dados nutricionais da nova substituição
    loadSubstitutionFoodData(newIndex, newSubstitution.food_name);
    
    // Limpar formulário
    setNewSubstitution({
      food_name: '',
      quantity: originalFoodQuantity,
      unit: originalFoodUnit,
    });
  };

  const removeSubstitution = (index: number) => {
    setSubstitutions(substitutions.filter((_, i) => i !== index));
    setSubstitutionsFoodData(prev => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
  };

  const updateSubstitution = (index: number, field: keyof FoodSubstitution, value: string | number) => {
    const updated = [...substitutions];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSubstitutions(updated);
    
    if (field === 'food_name' && typeof value === 'string' && value.length > 0) {
      loadSubstitutionFoodData(index, value);
    }
  };

  const calculateMacros = (foodData: FoodData | null, quantity: number, unit: string, customGrams?: number) => {
    if (!foodData) return null;
    
    let quantityInGrams = quantity;
    if (unit === 'kg') quantityInGrams = quantity * 1000;
    else if (unit === 'ml') quantityInGrams = quantity;
    else if (unit === 'unidade' || unit === 'unidades') quantityInGrams = quantity * 100;
    else if (unit === 'colher de sopa') quantityInGrams = quantity * 15;
    else if (unit === 'colher de chá') quantityInGrams = quantity * 5;
    else if (unit === 'xícara') quantityInGrams = quantity * 240;
    else if (unit === 'fatia') quantityInGrams = quantity * (customGrams || 30);
    else if (unit === 'pedaço') quantityInGrams = quantity * (customGrams || 50);
    else if (unit === 'porção') quantityInGrams = quantity * (customGrams || 100);
    else if (unit === 'medida personalizada') quantityInGrams = quantity * (customGrams || 100);
    
    const factor = quantityInGrams / 100;
    
    return {
      calories: Math.round(foodData.calories_per_100g * factor),
      protein: Math.round(foodData.protein_per_100g * factor * 10) / 10,
      carbs: Math.round(foodData.carbs_per_100g * factor * 10) / 10,
      fats: Math.round(foodData.fats_per_100g * factor * 10) / 10,
    };
  };

  const handleSave = () => {
    const invalid = substitutions.some(
      (sub) => !sub.food_name.trim() || sub.quantity <= 0 || !sub.unit.trim()
    );

    if (invalid) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos das substituições corretamente',
        variant: 'destructive',
      });
      return;
    }

    // Adicionar informações de medidas personalizadas às substituições
    const substitutionsWithCustomUnits = substitutions.map((sub, index) => ({
      ...sub,
      custom_unit_grams: customUnitGrams.get(index),
      custom_unit_name: customUnitNames.get(index),
    }));

    onSave(substitutionsWithCustomUnits);
    onOpenChange(false);
    toast({
      title: 'Substituições salvas!',
      description: `${substitutions.length} substituição(ões) adicionada(s) para ${originalFoodName}`,
    });
  };

  // Calcular diferença percentual
  const getDiff = (original: number, substitution: number) => {
    if (!original || original === 0) return 0;
    return ((substitution - original) / original) * 100;
  };

  // Renderizar badge de diferença (removido - não mostrar mais)

  // Determinar cor de fundo baseada na similaridade
  const getBackgroundColor = (avgDiff: number) => {
    if (avgDiff <= 10) return 'bg-green-50'; // Muito similar
    if (avgDiff <= 20) return 'bg-yellow-50'; // Moderadamente diferente
    return 'bg-orange-50'; // Muito diferente
  };

  // Usar macros do alimento da dieta se fornecidos, senão calcular do banco de dados
  const originalMacros = (originalFoodCalories !== undefined && 
                          originalFoodProtein !== undefined && 
                          originalFoodCarbs !== undefined && 
                          originalFoodFats !== undefined) 
    ? {
        calories: originalFoodCalories,
        protein: originalFoodProtein,
        carbs: originalFoodCarbs,
        fats: originalFoodFats,
      }
    : calculateMacros(originalFoodData, originalFoodQuantity, originalFoodUnit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#222222] text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#00C98A]" />
            Substituições para {originalFoodName}
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            Adicione alimentos substitutos que o paciente pode usar no lugar de <strong>{originalFoodName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tabela de Comparação */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#777777]">Alimento</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-[#777777]">Qtd</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-[#777777]">Calorias</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-[#777777]">Proteínas</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-[#777777]">Carbos</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-[#777777]">Gorduras</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-[#777777] w-20">Ações</th>
                </tr>
              </thead>
              <tbody>
                {/* Linha do Alimento Original - Sempre mostrar */}
                <tr className="bg-green-100 border-b-2 border-green-300">
                  <td className="py-3 px-4 font-bold text-[#222222]">{originalFoodName}</td>
                  <td className="py-3 px-3 text-center text-sm font-medium text-[#777777]">{originalFoodQuantity}{originalFoodUnit}</td>
                  <td className="py-3 px-3 text-center font-bold text-[#00A875]">
                    {originalMacros?.calories || '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#00A875]">
                    {originalMacros?.protein ? `${originalMacros.protein}g` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#00A875]">
                    {originalMacros?.carbs ? `${originalMacros.carbs}g` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#00A875]">
                    {originalMacros?.fats ? `${originalMacros.fats}g` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-xs bg-[#00C98A] text-white px-2 py-1 rounded font-medium">Base</span>
                  </td>
                </tr>
                
                {/* Linhas das Substituições */}
                {substitutions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#777777]">
                      <p>Nenhuma opção de substituição adicionada ainda.</p>
                      <p className="text-sm mt-2">Clique em "Adicionar Substituição" para começar.</p>
                    </td>
                  </tr>
                ) : (
                  substitutions.map((sub, index) => {
                    const substitutionMacros = calculateMacros(
                      substitutionsFoodData.get(index) || null,
                      sub.quantity,
                      sub.unit,
                      customUnitGrams.get(index) || sub.custom_unit_grams
                    );

                    // Calcular diferença para cor de fundo
                    let bgColor = 'bg-white';
                    if (originalMacros && substitutionMacros) {
                      const caloriesDiff = getDiff(originalMacros.calories, substitutionMacros.calories);
                      const proteinDiff = getDiff(originalMacros.protein, substitutionMacros.protein);
                      const carbsDiff = getDiff(originalMacros.carbs, substitutionMacros.carbs);
                      const fatsDiff = getDiff(originalMacros.fats, substitutionMacros.fats);
                      const avgDiff = Math.abs((Math.abs(caloriesDiff) + Math.abs(proteinDiff) + Math.abs(carbsDiff) + Math.abs(fatsDiff)) / 4);
                      bgColor = getBackgroundColor(avgDiff);
                    }

                    return (
                      <tr key={index} className={`${bgColor} border-b border-gray-200 hover:opacity-90 transition-all`}>
                        <td className="py-3 px-4 font-medium text-[#222222]">
                          <Input
                            type="text"
                            value={sub.food_name}
                            onChange={(e) => updateSubstitution(index, 'food_name', e.target.value)}
                            onBlur={() => loadSubstitutionFoodData(index, sub.food_name)}
                            className="border-gray-300 bg-white text-[#222222] h-8 text-sm"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1 justify-center">
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={sub.quantity}
                                onChange={(e) => updateSubstitution(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="border-gray-300 bg-white text-[#222222] h-8 w-16 text-sm text-center"
                              />
                              <Select
                                value={sub.unit}
                                onValueChange={(value) => {
                                  updateSubstitution(index, 'unit', value);
                                  if (['fatia', 'pedaço', 'porção', 'medida personalizada'].includes(value)) {
                                    setShowCustomUnitInput(index);
                                  }
                                }}
                              >
                                <SelectTrigger className="border-gray-300 bg-white text-[#222222] h-8 w-24 text-xs">
                                  <SelectValue>
                                    {sub.unit === 'medida personalizada' && (customUnitNames.get(index) || sub.custom_unit_name)
                                      ? (customUnitNames.get(index) || sub.custom_unit_name)
                                      : sub.unit}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  {units.map((unit) => (
                                    <SelectItem key={unit} value={unit} className="text-[#222222] text-xs">
                                      {unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {['fatia', 'pedaço', 'porção', 'medida personalizada'].includes(sub.unit) && (
                              <div className="flex items-center gap-1">
                                {sub.unit === 'medida personalizada' && (
                                  <Input
                                    type="text"
                                    placeholder="nome da medida"
                                    value={customUnitNames.get(index) || sub.custom_unit_name || ''}
                                    onChange={(e) => {
                                      const newMap = new Map(customUnitNames);
                                      newMap.set(index, e.target.value);
                                      setCustomUnitNames(newMap);
                                    }}
                                    className="border-green-300 bg-white text-[#222222] h-7 w-28 text-xs"
                                  />
                                )}
                                <Input
                                  type="number"
                                  step="1"
                                  min="1"
                                  placeholder="gramas"
                                  value={customUnitGrams.get(index) || sub.custom_unit_grams || ''}
                                  onChange={(e) => {
                                    const newMap = new Map(customUnitGrams);
                                    newMap.set(index, parseFloat(e.target.value) || 0);
                                    setCustomUnitGrams(newMap);
                                  }}
                                  className="border-green-300 bg-white text-[#222222] h-7 w-16 text-xs text-center"
                                />
                                <span className="text-xs text-[#777777]">g</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-[#00A875]">
                            {substitutionMacros?.calories || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-[#00A875]">
                            {substitutionMacros?.protein || '-'}g
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-[#00A875]">
                            {substitutionMacros?.carbs || '-'}g
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-[#00A875]">
                            {substitutionMacros?.fats || '-'}g
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            {onSwapWithMain && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  onSwapWithMain(sub, substitutionMacros);
                                  onOpenChange(false);
                                  toast({
                                    title: 'Alimento trocado!',
                                    description: `${sub.food_name} agora é o alimento principal`,
                                  });
                                }}
                                title="Trocar com o alimento principal"
                                className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 h-7 w-7 p-0 rounded-lg transition-all duration-300"
                              >
                                <ArrowUpDown className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSubstitution(index)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0 rounded-lg transition-all duration-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Formulário para Adicionar Nova Substituição */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-[#222222] mb-3">Adicionar Nova Substituição</div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <Label className="text-[#777777] text-sm mb-1 block">Nome do Alimento *</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#777777]" />
                    <Input
                      ref={foodInputRef}
                      type="text"
                      value={newSubstitution.food_name}
                      onChange={(e) => {
                        setNewSubstitution({ ...newSubstitution, food_name: e.target.value });
                      }}
                      onFocus={() => {
                        if (newSubstitution.food_name.length >= 2 && filteredFoods.length > 0) {
                          setShowFoodDropdown(true);
                        }
                      }}
                      placeholder="Digite para buscar alimentos..."
                      className="pl-10 border-green-300 bg-white text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                  
                  {/* Dropdown customizado de alimentos */}
                  {showFoodDropdown && filteredFoods.length > 0 && (
                    <div 
                      ref={dropdownRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-green-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                    >
                      {filteredFoods.map((food, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setNewSubstitution({ ...newSubstitution, food_name: food.name });
                            setShowFoodDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 focus:bg-green-50 focus:outline-none"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-[#222222] text-sm">{food.name}</div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                                  {Math.round(food.calories_per_100g)} kcal
                                </span>
                                <span className="text-xs text-blue-600">
                                  P: {food.protein_per_100g.toFixed(1)}g
                                </span>
                                <span className="text-xs text-purple-600">
                                  C: {food.carbs_per_100g.toFixed(1)}g
                                </span>
                                <span className="text-xs text-emerald-600">
                                  G: {food.fats_per_100g.toFixed(1)}g
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                      {newSubstitution.food_name.length >= 2 && (
                        <div className="px-4 py-2 bg-gray-50 text-xs text-[#777777] border-t border-gray-200">
                          {filteredFoods.length} alimento(s) encontrado(s) • Digite para refinar a busca
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Mensagem quando não encontra */}
                  {newSubstitution.food_name.length >= 2 && filteredFoods.length === 0 && showFoodDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
                      <p className="text-sm text-[#777777]">Nenhum alimento encontrado</p>
                      <p className="text-xs text-[#999999] mt-1">Você pode digitar o nome manualmente</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-3">
                <Label className="text-[#777777] text-sm mb-1 block">Quantidade *</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0"
                  value={newSubstitution.quantity}
                  onChange={(e) => {
                    setNewSubstitution({ ...newSubstitution, quantity: parseFloat(e.target.value) || 0 });
                  }}
                  className="border-green-300 bg-white text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/20"
                />
              </div>

              <div className="col-span-3">
                <Label className="text-[#777777] text-sm mb-1 block">Unidade *</Label>
                <Select
                  value={newSubstitution.unit}
                  onValueChange={(value) => {
                    setNewSubstitution({ ...newSubstitution, unit: value });
                  }}
                >
                  <SelectTrigger className="border-green-300 bg-white text-[#222222] focus:border-green-500 focus:ring-green-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit} className="text-[#222222]">
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={addSubstitution}
            className="w-full bg-[#00C98A] hover:bg-[#00A875] text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Substituição
          </Button>
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
            onClick={handleSave}
            className="bg-[#00C98A] hover:bg-[#00A875] text-white"
          >
            Salvar Substituições
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

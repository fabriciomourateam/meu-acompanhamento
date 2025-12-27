import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface QuickPortionAdjustmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    total_calories?: number | null;
    total_protein?: number | null;
    total_carbs?: number | null;
    total_fats?: number | null;
    meals?: Array<{
      calories?: number | null;
      protein?: number | null;
      carbs?: number | null;
      fats?: number | null;
      foods?: Array<{
        quantity: number;
        calories?: number | null;
        protein?: number | null;
        carbs?: number | null;
        fats?: number | null;
      }>;
    }>;
  };
  onApply: (adjustedPlan: any) => void;
}

export function QuickPortionAdjustment({
  open,
  onOpenChange,
  plan,
  onApply,
}: QuickPortionAdjustmentProps) {
  const { toast } = useToast();
  const [multiplier, setMultiplier] = useState(1.0);
  const [inputValue, setInputValue] = useState('100');

  // Calcular novos valores
  const calculateNewValues = (mult: number) => {
    return {
      total_calories: plan.total_calories ? Math.round(plan.total_calories * mult) : null,
      total_protein: plan.total_protein ? Math.round((plan.total_protein * mult) * 10) / 10 : null,
      total_carbs: plan.total_carbs ? Math.round((plan.total_carbs * mult) * 10) / 10 : null,
      total_fats: plan.total_fats ? Math.round((plan.total_fats * mult) * 10) / 10 : null,
      meals: plan.meals?.map(meal => ({
        ...meal,
        calories: meal.calories ? Math.round(meal.calories * mult) : null,
        protein: meal.protein ? Math.round((meal.protein * mult) * 10) / 10 : null,
        carbs: meal.carbs ? Math.round((meal.carbs * mult) * 10) / 10 : null,
        fats: meal.fats ? Math.round((meal.fats * mult) * 10) / 10 : null,
        foods: meal.foods?.map(food => ({
          ...food,
          quantity: Math.round((food.quantity * mult) * 100) / 100,
          calories: food.calories ? Math.round(food.calories * mult) : null,
          protein: food.protein ? Math.round((food.protein * mult) * 10) / 10 : null,
          carbs: food.carbs ? Math.round((food.carbs * mult) * 10) / 10 : null,
          fats: food.fats ? Math.round((food.fats * mult) * 10) / 10 : null,
        })),
      })),
    };
  };

  const handleMultiplierChange = (value: number[]) => {
    const mult = value[0] / 100;
    setMultiplier(mult);
    setInputValue(value[0].toString());
  };

  const handleInputChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 50 && numValue <= 200) {
      setInputValue(value);
      setMultiplier(numValue / 100);
    }
  };

  const handleApply = () => {
    if (!plan.total_calories) {
      toast({
        title: 'Erro',
        description: 'O plano precisa ter valores de macros definidos',
        variant: 'destructive'
      });
      return;
    }

    const adjusted = calculateNewValues(multiplier);
    onApply(adjusted);

    toast({
      title: 'Ajuste aplicado! ✅',
      description: `Porções ajustadas para ${inputValue}% dos valores originais`,
    });

    onOpenChange(false);
  };

  const newValues = calculateNewValues(multiplier);
  const percentageChange = ((multiplier - 1) * 100).toFixed(1);
  const isIncrease = multiplier > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-green-500/30 text-[#222222] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#222222]">
            <RefreshCw className="w-5 h-5 text-[#00C98A]" />
            Ajuste Rápido de Porções
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            Ajuste todas as porções proporcionalmente usando um multiplicador
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Controle de multiplicador */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[#222222] text-lg">Percentual de ajuste</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="50"
                  max="200"
                  step="1"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-20 border-green-500/30 bg-green-500/10 text-[#222222] text-center focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15"
                />
                <span className="text-[#222222]">%</span>
              </div>
            </div>

            <Slider
              value={[parseFloat(inputValue)]}
              onValueChange={handleMultiplierChange}
              min={50}
              max={200}
              step={1}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-[#777777]">
              <span>50% (-50%)</span>
              <span>100% (Original)</span>
              <span>200% (+100%)</span>
            </div>
          </div>

          {/* Preview dos valores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
            <div>
              <div className="text-xs text-[#777777] mb-1">Calorias</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-[#222222]">
                  {newValues.total_calories || 'N/A'}
                </div>
                {plan.total_calories && (
                  <div className={`text-xs flex items-center gap-1 ${
                    isIncrease ? 'text-[#00A875]' : 'text-orange-600'
                  }`}>
                    {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {percentageChange}%
                  </div>
                )}
              </div>
              {plan.total_calories && (
                <div className="text-xs text-[#777777] mt-1">
                  Original: {plan.total_calories}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-[#777777] mb-1">Proteínas</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-[#222222]">
                  {newValues.total_protein?.toFixed(1) || 'N/A'}g
                </div>
              </div>
              {plan.total_protein && (
                <div className="text-xs text-[#777777] mt-1">
                  Original: {plan.total_protein.toFixed(1)}g
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-[#777777] mb-1">Carboidratos</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-[#222222]">
                  {newValues.total_carbs?.toFixed(1) || 'N/A'}g
                </div>
              </div>
              {plan.total_carbs && (
                <div className="text-xs text-[#777777] mt-1">
                  Original: {plan.total_carbs.toFixed(1)}g
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-[#777777] mb-1">Gorduras</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-[#222222]">
                  {newValues.total_fats?.toFixed(1) || 'N/A'}g
                </div>
              </div>
              {plan.total_fats && (
                <div className="text-xs text-[#777777] mt-1">
                  Original: {plan.total_fats.toFixed(1)}g
                </div>
              )}
            </div>
          </div>

          {/* Informação */}
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-[#222222]">
              <strong>Como funciona:</strong> Todas as quantidades de alimentos e macros serão ajustadas proporcionalmente. 
              Por exemplo, 120% aumentará tudo em 20%, e 80% reduzirá tudo em 20%.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMultiplier(1.0);
                setInputValue('100');
                onOpenChange(false);
              }}
              className="border-gray-300 text-white hover:bg-gray-100 hover:text-[#222222]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              className="bg-[#00C98A] hover:bg-[#00A875] text-white"
            >
              Aplicar Ajuste
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



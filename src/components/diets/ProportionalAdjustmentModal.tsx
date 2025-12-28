import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { proportionalAdjustmentService, ProportionalAdjustment } from '@/lib/diet-proportional-adjustment-service';

interface ProportionalAdjustmentModalProps {
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

export function ProportionalAdjustmentModal({
  open,
  onOpenChange,
  plan,
  onApply,
}: ProportionalAdjustmentModalProps) {
  const { toast } = useToast();
  const [percentage, setPercentage] = useState('10');
  const [adjustCalories, setAdjustCalories] = useState(true);
  const [adjustProtein, setAdjustProtein] = useState(true);
  const [adjustCarbs, setAdjustCarbs] = useState(true);
  const [adjustFats, setAdjustFats] = useState(true);
  const [maintainRatios, setMaintainRatios] = useState(true);
  const [preview, setPreview] = useState<any>(null);

  React.useEffect(() => {
    if (open && plan) {
      calculatePreview();
    }
  }, [open, percentage, adjustCalories, adjustProtein, adjustCarbs, adjustFats, maintainRatios, plan]);

  const calculatePreview = () => {
    const percentageNum = parseFloat(percentage) || 0;
    if (percentageNum === 0) {
      setPreview(null);
      return;
    }

    const adjustment: ProportionalAdjustment = {
      percentage: percentageNum,
      adjustCalories,
      adjustProtein,
      adjustCarbs,
      adjustFats,
      maintainRatios,
    };

    const adjusted = proportionalAdjustmentService.adjustPlan(plan, adjustment);
    setPreview(adjusted);
  };

  const handleApply = () => {
    if (!preview) {
      toast({
        title: 'Erro',
        description: 'Calcule o ajuste primeiro',
        variant: 'destructive',
      });
      return;
    }

    onApply(preview);
    onOpenChange(false);
    toast({
      title: 'Ajuste aplicado',
      description: `Plano ajustado em ${percentage}%`,
    });
  };

  const percentageNum = parseFloat(percentage) || 0;
  const isIncrease = percentageNum > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-green-500/30 bg-white text-[#222222]">
        <DialogHeader>
          <DialogTitle className="text-[#222222] flex items-center gap-2">
            {isIncrease ? (
              <TrendingUp className="h-5 w-5 text-[#00C98A]" />
            ) : (
              <TrendingDown className="h-5 w-5 text-[#00C98A]" />
            )}
            Ajuste Proporcional
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            Ajuste todo o plano proporcionalmente mantendo as proporções entre macros
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Porcentagem */}
          <div className="space-y-2">
            <Label className="text-[#222222]">Porcentagem de Ajuste</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="border-green-500/30 bg-green-500/10 text-[#222222] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15"
                placeholder="10"
              />
              <span className="text-[#222222]">%</span>
            </div>
            <div className="text-xs text-[#777777]">
              Use valores positivos para aumentar (ex: 20 = +20%) ou negativos para diminuir (ex: -10 = -10%)
            </div>
          </div>

          {/* Opções de Ajuste */}
          <div className="space-y-3">
            <Label className="text-[#222222]">Ajustar:</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adjust-calories"
                  checked={adjustCalories}
                  onCheckedChange={(checked) => setAdjustCalories(checked as boolean)}
                />
                <label htmlFor="adjust-calories" className="text-sm text-[#222222] cursor-pointer">
                  Calorias
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adjust-protein"
                  checked={adjustProtein}
                  onCheckedChange={(checked) => setAdjustProtein(checked as boolean)}
                />
                <label htmlFor="adjust-protein" className="text-sm text-[#222222] cursor-pointer">
                  Proteínas
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adjust-carbs"
                  checked={adjustCarbs}
                  onCheckedChange={(checked) => setAdjustCarbs(checked as boolean)}
                />
                <label htmlFor="adjust-carbs" className="text-sm text-[#222222] cursor-pointer">
                  Carboidratos
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adjust-fats"
                  checked={adjustFats}
                  onCheckedChange={(checked) => setAdjustFats(checked as boolean)}
                />
                <label htmlFor="adjust-fats" className="text-sm text-[#222222] cursor-pointer">
                  Gorduras
                </label>
              </div>
            </div>
          </div>

          {/* Manter Proporções */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="maintain-ratios"
              checked={maintainRatios}
              onCheckedChange={(checked) => setMaintainRatios(checked as boolean)}
            />
            <label htmlFor="maintain-ratios" className="text-sm text-[#222222] cursor-pointer">
              Manter proporções entre macros
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-sm font-semibold text-[#222222] mb-3">Preview do Ajuste</div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-[#777777]">Calorias</div>
                  <div className="text-lg font-bold text-[#00A875]">
                    {preview.total_calories ? Math.round(preview.total_calories) : 'N/A'}
                  </div>
                  {plan.total_calories && (
                    <div className="text-xs text-[#777777]">
                      {isIncrease ? '+' : ''}{Math.round(preview.total_calories! - plan.total_calories)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-[#777777]">Proteínas</div>
                  <div className="text-lg font-bold text-[#00A875]">
                    {preview.total_protein ? `${Math.round(preview.total_protein * 10) / 10}g` : 'N/A'}
                  </div>
                  {plan.total_protein && (
                    <div className="text-xs text-[#777777]">
                      {isIncrease ? '+' : ''}{Math.round((preview.total_protein! - plan.total_protein) * 10) / 10}g
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-[#777777]">Carboidratos</div>
                  <div className="text-lg font-bold text-[#00A875]">
                    {preview.total_carbs ? `${Math.round(preview.total_carbs * 10) / 10}g` : 'N/A'}
                  </div>
                  {plan.total_carbs && (
                    <div className="text-xs text-[#777777]">
                      {isIncrease ? '+' : ''}{Math.round((preview.total_carbs! - plan.total_carbs) * 10) / 10}g
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-[#777777]">Gorduras</div>
                  <div className="text-lg font-bold text-[#00A875]">
                    {preview.total_fats ? `${Math.round(preview.total_fats * 10) / 10}g` : 'N/A'}
                  </div>
                  {plan.total_fats && (
                    <div className="text-xs text-[#777777]">
                      {isIncrease ? '+' : ''}{Math.round((preview.total_fats! - plan.total_fats) * 10) / 10}g
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {percentageNum === 0 && (
            <Alert className="border-yellow-500 bg-yellow-500/10">
              <AlertDescription className="text-yellow-700">
                Digite uma porcentagem para ver o preview do ajuste
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 text-white hover:bg-gray-100 hover:text-[#222222]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            disabled={!preview || percentageNum === 0}
            className="bg-[#00C98A] hover:bg-[#00A875] text-white"
          >
            Aplicar Ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

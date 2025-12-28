import React, { useState, useEffect } from 'react';
import { GitCompare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { dietService } from '@/lib/diet-service';
import { calcularTotaisPlano } from '@/utils/diet-calculations';

interface PlanComparatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId: string;
}

export function PlanComparatorModal({
  open,
  onOpenChange,
  currentPlanId,
}: PlanComparatorModalProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadPlans();
      loadCurrentPlan();
    }
  }, [open, currentPlanId]);

  const loadPlans = async () => {
    try {
      const { data: currentPlanData } = await dietService.getById(currentPlanId);
      if (!currentPlanData) return;

      const patientId = currentPlanData.patient_id;
      const allPlans = await dietService.getByPatientId(patientId);
      const filteredPlans = allPlans.filter((p: any) => p.id !== currentPlanId);
      setPlans(filteredPlans);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar planos',
        variant: 'destructive',
      });
    }
  };

  const loadCurrentPlan = async () => {
    try {
      setLoading(true);
      const plan = await dietService.getById(currentPlanId);
      setCurrentPlan(plan);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar plano atual',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      setLoading(true);
      const plan = await dietService.getById(planId);
      setSelectedPlan(plan);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar plano',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDifference = (current: number | null, selected: number | null) => {
    if (!current || !selected) return null;
    const diff = selected - current;
    const percentage = (diff / current) * 100;
    return { diff, percentage };
  };

  const currentTotals = currentPlan ? calcularTotaisPlano(currentPlan) : null;
  const selectedTotals = selectedPlan ? calcularTotaisPlano(selectedPlan) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border-green-500/30 bg-white text-[#222222]">
        <DialogHeader>
          <DialogTitle className="text-[#222222] flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-[#00C98A]" />
            Comparar Planos
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            Compare o plano atual com outro plano do mesmo paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Plano */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#222222]">
              Selecionar Plano para Comparar
            </label>
            <Select value={selectedPlanId} onValueChange={(value) => {
              setSelectedPlanId(value);
              handleSelectPlan(value);
            }}>
              <SelectTrigger className="border-green-500/30 bg-green-500/10 text-[#222222] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15">
                <SelectValue placeholder="Escolha um plano" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id} className="text-[#222222]">
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comparação */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#00C98A]" />
            </div>
          ) : currentTotals && selectedTotals ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Plano Atual */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-4">
                  <div className="font-semibold text-[#222222] mb-4">
                    {currentPlan?.name || 'Plano Atual'}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-[#777777]">Calorias</div>
                      <div className="text-xl font-bold text-[#00A875]">{currentTotals.calorias}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#777777]">Proteínas</div>
                      <div className="text-xl font-bold text-[#00A875]">{currentTotals.proteinas}g</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#777777]">Carboidratos</div>
                      <div className="text-xl font-bold text-[#00A875]">{currentTotals.carboidratos}g</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#777777]">Gorduras</div>
                      <div className="text-xl font-bold text-[#00A875]">{currentTotals.gorduras}g</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plano Selecionado */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-4">
                  <div className="font-semibold text-[#222222] mb-4">
                    {selectedPlan?.name || 'Plano Selecionado'}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-[#777777]">Calorias</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold text-[#00A875]">{selectedTotals.calorias}</div>
                        {(() => {
                          const diff = calculateDifference(currentTotals.calorias, selectedTotals.calorias);
                          return diff && (
                            <Badge variant={diff.diff > 0 ? 'default' : 'secondary'} className={diff.diff > 0 ? 'bg-green-500/20 border-green-500/50 text-green-700' : 'bg-red-500/20 border-red-500/50 text-red-700'}>
                              {diff.diff > 0 ? '+' : ''}{Math.round(diff.diff)} ({diff.percentage > 0 ? '+' : ''}{Math.round(diff.percentage)}%)
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#777777]">Proteínas</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold text-[#00A875]">{selectedTotals.proteinas}g</div>
                        {(() => {
                          const diff = calculateDifference(currentTotals.proteinas, selectedTotals.proteinas);
                          return diff && (
                            <Badge variant={diff.diff > 0 ? 'default' : 'secondary'} className={diff.diff > 0 ? 'bg-green-500/20 border-green-500/50 text-green-700' : 'bg-red-500/20 border-red-500/50 text-red-700'}>
                              {diff.diff > 0 ? '+' : ''}{Math.round(diff.diff * 10) / 10}g
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#777777]">Carboidratos</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold text-[#00A875]">{selectedTotals.carboidratos}g</div>
                        {(() => {
                          const diff = calculateDifference(currentTotals.carboidratos, selectedTotals.carboidratos);
                          return diff && (
                            <Badge variant={diff.diff > 0 ? 'default' : 'secondary'} className={diff.diff > 0 ? 'bg-green-500/20 border-green-500/50 text-green-700' : 'bg-red-500/20 border-red-500/50 text-red-700'}>
                              {diff.diff > 0 ? '+' : ''}{Math.round(diff.diff * 10) / 10}g
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#777777]">Gorduras</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold text-[#00A875]">{selectedTotals.gorduras}g</div>
                        {(() => {
                          const diff = calculateDifference(currentTotals.gorduras, selectedTotals.gorduras);
                          return diff && (
                            <Badge variant={diff.diff > 0 ? 'default' : 'secondary'} className={diff.diff > 0 ? 'bg-green-500/20 border-green-500/50 text-green-700' : 'bg-red-500/20 border-red-500/50 text-red-700'}>
                              {diff.diff > 0 ? '+' : ''}{Math.round(diff.diff * 10) / 10}g
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-[#777777]">
              Selecione um plano para comparar
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

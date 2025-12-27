import React, { useState, useEffect } from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { foodGroupsService, FoodGroup } from '@/lib/diet-food-groups-service';
import { supabase } from '@/integrations/supabase/client';

interface FoodGroupsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealIndex: number;
  onGroupAdded: (foods: Array<{ food_name: string; quantity: number; unit: string; calories: number | null; protein: number | null; carbs: number | null; fats: number | null; notes: string | null }>) => void;
}

export function FoodGroupsModal({
  open,
  onOpenChange,
  mealIndex,
  onGroupAdded,
}: FoodGroupsModalProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<FoodGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadGroups();
    }
  }, [open]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await foodGroupsService.getAll();
      setGroups(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar grupos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async (groupId: string) => {
    try {
      setLoading(true);
      const group = await foodGroupsService.getById(groupId);
      if (!group) {
        throw new Error('Grupo não encontrado');
      }

      // Buscar alimentos do banco TACO para calcular macros
      const { data: foods } = await supabase
        .from('food_database')
        .select('*')
        .in('name', group.items.map(item => item.food_name))
        .eq('is_active', true);

      const foodsMap = new Map(foods?.map(f => [f.name, f]) || []);

      // Preparar alimentos para adicionar
      const foodsToAdd = group.items.map((item, index) => {
        const food = foodsMap.get(item.food_name);
        const quantityInGrams = foodGroupsService.convertToGrams(item.quantity, item.unit);
        const multiplier = quantityInGrams / 100;

        return {
          food_name: item.food_name,
          quantity: item.quantity,
          unit: item.unit,
          calories: food ? Math.round(food.calories_per_100g * multiplier) : null,
          protein: food ? Math.round(food.protein_per_100g * multiplier * 10) / 10 : null,
          carbs: food ? Math.round(food.carbs_per_100g * multiplier * 10) / 10 : null,
          fats: food ? Math.round(food.fats_per_100g * multiplier * 10) / 10 : null,
          notes: null,
        };
      });

      onGroupAdded(foodsToAdd);
      onOpenChange(false);
      toast({
        title: 'Grupo adicionado',
        description: `${foodsToAdd.length} alimento(s) do grupo foram adicionados à refeição`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar grupo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-green-500/30 bg-white text-[#222222]">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-[#222222] flex items-center gap-2">
            <Package className="h-5 w-5 text-[#00C98A]" />
            Grupos de Alimentos
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            Selecione um grupo para adicionar todos os alimentos de uma vez
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-[#777777]">Carregando...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-[#777777]">
              Nenhum grupo criado ainda. Crie grupos de alimentos para usar aqui.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="bg-white border-green-500/30 hover:border-green-500/50 transition-colors shadow-sm hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-[#222222] flex items-center gap-2">
                          {group.name}
                          {group.is_favorite && (
                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-600 text-xs">
                              Favorito
                            </Badge>
                          )}
                        </CardTitle>
                        {group.description && (
                          <p className="text-sm text-[#777777] mt-1">{group.description}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="text-xs text-[#777777]">
                        {group.items.length} alimento(s) no grupo
                      </div>
                      <div className="text-xs text-[#777777] max-h-20 overflow-y-auto">
                        {group.items.map((item, idx) => (
                          <div key={idx}>
                            {item.food_name} - {item.quantity}{item.unit}
                            {idx < group.items.length - 1 && ', '}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddGroup(group.id)}
                      disabled={loading}
                      className="w-full bg-[#00C98A] hover:bg-[#00A875] text-white border-0"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Grupo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-gray-200">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[#00C98A] hover:bg-[#00A875] text-white border-0"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


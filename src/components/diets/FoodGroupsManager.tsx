import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { foodGroupsService, FoodGroup, FoodGroupItem } from '@/lib/diet-food-groups-service';
import { supabase } from '@/integrations/supabase/client';

interface FoodGroupsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FoodGroupsManager({ open, onOpenChange }: FoodGroupsManagerProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<FoodGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FoodGroup | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [] as FoodGroupItem[],
  });

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

  const handleCreate = async () => {
    try {
      if (!formData.name || formData.items.length === 0) {
        toast({
          title: 'Erro',
          description: 'Preencha o nome e adicione pelo menos um alimento',
          variant: 'destructive',
        });
        return;
      }

      await foodGroupsService.create(formData.name, formData.description || null, formData.items);
      await loadGroups();
      setFormData({ name: '', description: '', items: [] });
      setCreateDialogOpen(false);
      toast({
        title: 'Grupo criado',
        description: 'Grupo de alimentos criado com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar grupo',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Tem certeza que deseja deletar este grupo?')) return;

    try {
      await foodGroupsService.delete(groupId);
      await loadGroups();
      toast({
        title: 'Grupo deletado',
        description: 'Grupo removido com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar grupo',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFavorite = async (groupId: string, currentFavorite: boolean) => {
    try {
      await foodGroupsService.update(groupId, { is_favorite: !currentFavorite });
      await loadGroups();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar favorito',
        variant: 'destructive',
      });
    }
  };

  const addFoodItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { food_name: '', quantity: 100, unit: 'g', item_order: formData.items.length },
      ],
    });
  };

  const removeFoodItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems.map((item, i) => ({ ...item, item_order: i })),
    });
  };

  const updateFoodItem = (index: number, field: keyof FoodGroupItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl text-white">
        <DialogHeader>
          <DialogTitle className="text-cyan-300 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gerenciar Grupos de Alimentos
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Crie grupos de alimentos para adicionar rapidamente combinações comuns às refeições
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Grupo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl text-white">
                <DialogHeader>
                  <DialogTitle className="text-cyan-300">Criar Grupo de Alimentos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-cyan-200/70">Nome do Grupo *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-slate-950/50 border-slate-700 text-white"
                      placeholder="Ex: Arroz e Feijão"
                    />
                  </div>
                  <div>
                    <Label className="text-cyan-200/70">Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-slate-950/50 border-slate-700 text-white"
                      placeholder="Descrição opcional do grupo"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-cyan-200/70">Alimentos do Grupo *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addFoodItem}
                        className="border-cyan-500/50 text-cyan-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Alimento
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            value={item.food_name}
                            onChange={(e) => updateFoodItem(index, 'food_name', e.target.value)}
                            placeholder="Nome do alimento"
                            className="flex-1 bg-slate-950/50 border-slate-700 text-white"
                          />
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateFoodItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            placeholder="Qtd"
                            className="w-24 bg-slate-950/50 border-slate-700 text-white"
                          />
                          <Input
                            value={item.unit}
                            onChange={(e) => updateFoodItem(index, 'unit', e.target.value)}
                            placeholder="Unidade"
                            className="w-32 bg-slate-950/50 border-slate-700 text-white"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFoodItem(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false);
                      setFormData({ name: '', description: '', items: [] });
                    }}
                    className="border-slate-700 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    Criar Grupo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400">Carregando...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Nenhum grupo criado ainda. Crie seu primeiro grupo!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="bg-slate-800/50 border-slate-700"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white flex items-center gap-2">
                          {group.name}
                          {group.is_favorite && (
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          )}
                        </CardTitle>
                        {group.description && (
                          <p className="text-sm text-slate-400 mt-1">{group.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleFavorite(group.id, group.is_favorite)}
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          <Star className={`w-4 h-4 ${group.is_favorite ? 'fill-yellow-400' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(group.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="text-slate-300">
                          {item.food_name} - {item.quantity}{item.unit}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-slate-400">
                      Usado {group.usage_count || 0} vez(es)
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
















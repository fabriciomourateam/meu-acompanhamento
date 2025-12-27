import React, { useState } from 'react';
import { Save } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { dietTemplateService } from '@/lib/diet-template-service';

interface SaveAsTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  onTemplateCreated?: () => void;
  onSaved?: () => void;
}

const categories = [
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'ganho_peso', label: 'Ganho de Peso' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'outros', label: 'Outros' },
];

export function SaveAsTemplateModal({
  open,
  onOpenChange,
  planId,
  onTemplateCreated,
}: SaveAsTemplateModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'outros',
    description: '',
    is_public: false,
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do template é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await dietTemplateService.createFromPlan(planId, {
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
        is_public: formData.is_public,
      });

      toast({
        title: 'Template criado',
        description: 'Plano salvo como template com sucesso',
      });

      setFormData({ name: '', category: 'outros', description: '', is_public: false });
      onOpenChange(false);
      onTemplateCreated?.();
      onSaved?.();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl text-white">
        <DialogHeader>
          <DialogTitle className="text-cyan-300 flex items-center gap-2">
            <Save className="h-5 w-5" />
            Salvar como Template
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Salve este plano como template para reutilizar em outros pacientes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-cyan-200/70">Nome do Template *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Template Emagrecimento"
              className="bg-slate-950/50 border-slate-700 text-white"
            />
          </div>

          <div>
            <Label className="text-cyan-200/70">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-cyan-200/70">Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do template..."
              className="bg-slate-950/50 border-slate-700 text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked as boolean })}
            />
            <label htmlFor="is-public" className="text-sm text-slate-300 cursor-pointer">
              Tornar template público (outros nutricionistas poderão usar)
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.name.trim()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {loading ? 'Salvando...' : 'Salvar Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

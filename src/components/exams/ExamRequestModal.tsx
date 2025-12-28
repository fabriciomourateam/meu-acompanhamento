import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { laboratoryExamsService, ExamType } from '@/lib/laboratory-exams-service';
import { FlaskConical, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExamRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId?: string;
  telefone: string;
  onSuccess?: () => void;
}

export function ExamRequestModal({
  open,
  onOpenChange,
  patientId,
  telefone,
  onSuccess,
}: ExamRequestModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<Set<string>>(new Set());
  const [customExams, setCustomExams] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      loadExamTypes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Função para limpar formulário
  const clearForm = () => {
    setSelectedTypeIds(new Set());
    setCustomExams('');
    setInstructions('');
    setNotes('');
  };

  const loadExamTypes = async () => {
    try {
      setLoadingTypes(true);
      const types = await laboratoryExamsService.getExamTypes();
      setExamTypes(types);
    } catch (error: any) {
      console.error('Erro ao carregar tipos de exames:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os tipos de exames',
        variant: 'destructive'
      });
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleTypeToggle = useCallback((typeId: string, checked: boolean) => {
    setSelectedTypeIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(typeId);
      } else {
        newSet.delete(typeId);
      }
      return newSet;
    });
  }, []);

  const handleRemoveSelectedType = useCallback((typeId: string) => {
    setSelectedTypeIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(typeId);
      return newSet;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedExams: Array<{ typeId: string | null; name: string; category: string | null }> = [];

    // Adicionar exames selecionados da lista
    selectedTypeIds.forEach(typeId => {
      const selectedType = examTypes.find(t => t.id === typeId);
      if (selectedType) {
        selectedExams.push({
          typeId,
          name: selectedType.name,
          category: selectedType.category || null,
        });
      }
    });

    // Adicionar exames customizados (um por linha)
    const customExamsList = customExams
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    customExamsList.forEach(examName => {
      selectedExams.push({
        typeId: null,
        name: examName,
        category: null,
      });
    });

    if (selectedExams.length === 0) {
      toast({
        title: 'Nenhum exame selecionado',
        description: 'Por favor, selecione pelo menos um exame ou digite um exame customizado',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Criar todos os exames
      const promises = selectedExams.map(exam =>
        laboratoryExamsService.create({
          patient_id: patientId || null,
          telefone,
          exam_type_id: exam.typeId,
          exam_name: exam.name,
          exam_category: exam.category,
          instructions: instructions || null,
          notes: notes || null,
          status: 'requested',
        })
      );

      const results = await Promise.all(promises);
      console.log('✅ Exames criados com sucesso:', results.length, 'exames');
      console.log('Detalhes dos exames:', results.map(r => ({ id: r.id, nome: r.exam_name, telefone: r.telefone, patient_id: r.patient_id })));

      toast({
        title: 'Exames solicitados! ✅',
        description: `${selectedExams.length} exame(s) solicitado(s) com sucesso`,
      });

      // Limpar formulário
      clearForm();

      // Fechar modal
      onOpenChange(false);

      // Aguardar um pouco para garantir que o banco processou, depois atualizar
      setTimeout(() => {
        if (onSuccess) {
          console.log('Chamando onSuccess para atualizar lista de exames');
          onSuccess();
        }
      }, 1000); // Aumentar delay para garantir que o banco processou
    } catch (error: any) {
      console.error('Erro ao solicitar exames:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível solicitar os exames',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <FlaskConical className="w-5 h-5 text-blue-400" />
            Solicitar Exame Laboratorial
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Selecione múltiplos exames da lista ou digite exames customizados. Todos serão solicitados ao paciente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Exames selecionados (tags) */}
          {selectedTypeIds.size > 0 && (
            <div className="space-y-2">
              <Label className="text-slate-300">Exames Selecionados</Label>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedTypeIds).map(typeId => {
                  const type = examTypes.find(t => t.id === typeId);
                  if (!type) return null;
                  return (
                    <Badge
                      key={typeId}
                      className="bg-blue-600 text-white px-3 py-1 flex items-center gap-2"
                    >
                      {type.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedType(typeId)}
                        className="hover:bg-blue-700 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de tipos de exames com checkboxes */}
          <div className="space-y-2">
            <Label className="text-slate-300">Selecionar Exames</Label>
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 max-h-[200px] overflow-y-auto">
              {loadingTypes ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-400">Carregando...</span>
                </div>
              ) : examTypes.length === 0 ? (
                <p className="text-slate-400 text-sm">Nenhum tipo de exame disponível</p>
              ) : (
                <div className="space-y-2">
                  {examTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-slate-700/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedTypeIds.has(type.id)}
                        onCheckedChange={(checked) => handleTypeToggle(type.id, !!checked)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white">{type.name}</div>
                        {type.description && (
                          <div className="text-xs text-slate-400 mt-0.5">{type.description}</div>
                        )}
                        {type.category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {type.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Exames customizados */}
          <div className="space-y-2">
            <Label htmlFor="custom_exams" className="text-slate-300">
              Outros Exames (um por linha)
            </Label>
            <Textarea
              id="custom_exams"
              value={customExams}
              onChange={(e) => setCustomExams(e.target.value)}
              placeholder="Digite os nomes dos exames, um por linha:&#10;Ex:&#10;Hemograma Completo&#10;Glicemia de Jejum&#10;Perfil Lipídico"
              className="bg-slate-700/50 border-slate-600 text-white min-h-[100px]"
              rows={4}
            />
            <p className="text-xs text-slate-400">
              Digite um exame por linha para adicionar exames que não estão na lista acima
            </p>
          </div>

          {/* Instruções para o paciente */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-slate-300">Instruções para o Paciente</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Jejum de 12 horas. Evitar exercícios físicos 24h antes."
              className="bg-slate-700/50 border-slate-600 text-white min-h-[100px]"
              rows={4}
            />
          </div>

          {/* Observações internas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">Observações Internas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações que apenas você verá..."
              className="bg-slate-700/50 border-slate-600 text-white min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingTypes || (selectedTypeIds.size === 0 && !customExams.trim())}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Solicitando...
                </>
              ) : (
                `Solicitar ${selectedTypeIds.size + (customExams.trim() ? customExams.split('\n').filter(l => l.trim()).length : 0)} Exame(s)`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


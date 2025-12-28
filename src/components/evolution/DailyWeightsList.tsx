import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { weightTrackingService, WeightEntry } from '@/lib/weight-tracking-service';
import { Scale, Trash2, Calendar, Sunrise, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DailyWeightsListProps {
  telefone: string;
  onUpdate?: () => void;
}

export function DailyWeightsList({ telefone, onUpdate }: DailyWeightsListProps) {
  const { toast } = useToast();
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [weightToDelete, setWeightToDelete] = useState<WeightEntry | null>(null);
  const [isMinimized, setIsMinimized] = useState(true); // Minimizado por padrão

  useEffect(() => {
    loadWeights();
  }, [telefone]);

  const loadWeights = async () => {
    try {
      setLoading(true);
      const data = await weightTrackingService.getByTelefone(telefone);
      // Ordenar do mais recente para o mais antigo
      setWeights(data.sort((a, b) => new Date(b.data_pesagem).getTime() - new Date(a.data_pesagem).getTime()));
    } catch (error: any) {
      console.error('Erro ao carregar pesos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pesos registrados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (weight: WeightEntry) => {
    setWeightToDelete(weight);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!weightToDelete) return;

    try {
      await weightTrackingService.delete(weightToDelete.id);
      toast({
        title: 'Peso excluído! ✅',
        description: 'O registro de peso foi removido com sucesso',
      });
      setDeleteDialogOpen(false);
      setWeightToDelete(null);
      loadWeights();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Erro ao excluir peso:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o peso',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">Carregando pesos...</p>
        </CardContent>
      </Card>
    );
  }

  if (weights.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Scale className="w-5 h-5 text-blue-400" />
            Pesos Diários Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum peso diário registrado ainda</p>
            <p className="text-slate-500 text-sm mt-2">Use o botão "Registrar Peso" para começar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <Scale className="w-5 h-5 text-blue-400" />
              Pesos Diários Registrados
              <Badge variant="outline" className="ml-2 text-xs">
                {weights.length}
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-400 hover:text-white"
            >
              {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {!isMinimized && (
          <CardContent>
            <div className="space-y-3">
              {weights.map((weight) => {
                const pesoValue = weight.peso_jejum || weight.peso_dia;
                const isFasting = weight.tipo === 'jejum';
                
                return (
                  <div
                    key={weight.id}
                    className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30 hover:border-slate-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            isFasting 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {isFasting ? (
                              <Sunrise className="w-4 h-4" />
                            ) : (
                              <Calendar className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-lg">
                                {pesoValue?.toFixed(1)} kg
                              </span>
                              <Badge className={
                                isFasting
                                  ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                                  : 'bg-blue-600/20 text-blue-400 border-blue-600/30'
                              }>
                                {isFasting ? 'Jejum' : 'Dia'}
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-sm mt-1">
                              {new Date(weight.data_pesagem).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {weight.observacoes && (
                          <p className="text-slate-400 text-sm mt-2 pl-12">
                            {weight.observacoes}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(weight)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir registro de peso?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. O peso de{' '}
              <strong>
                {weightToDelete?.peso_jejum?.toFixed(1) || weightToDelete?.peso_dia?.toFixed(1)} kg
              </strong>{' '}
              registrado em{' '}
              <strong>
                {weightToDelete 
                  ? new Date(weightToDelete.data_pesagem).toLocaleDateString('pt-BR')
                  : ''
                }
              </strong>{' '}
              será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

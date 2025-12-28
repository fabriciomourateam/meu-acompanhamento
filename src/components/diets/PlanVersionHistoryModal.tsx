import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { dietVersionHistoryService, PlanVersion } from '@/lib/diet-version-history-service';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlanVersionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  onVersionRestored?: () => void;
}

export function PlanVersionHistoryModal({
  open,
  onOpenChange,
  planId,
  onVersionRestored,
}: PlanVersionHistoryModalProps) {
  const { toast } = useToast();
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (open && planId) {
      loadVersions();
    }
  }, [open, planId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await dietVersionHistoryService.getVersions(planId);
      setVersions(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar versões',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      setLoading(true);
      const version = await dietVersionHistoryService.createVersion(planId);
      await loadVersions();
      toast({
        title: 'Versão criada',
        description: `Versão ${version.version_number} salva com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar versão',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    try {
      setRestoring(versionId);
      await dietVersionHistoryService.restoreVersion(versionId);
      toast({
        title: 'Versão restaurada',
        description: 'O plano foi restaurado para esta versão',
      });
      onVersionRestored?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao restaurar versão',
        variant: 'destructive',
      });
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta versão?')) return;

    try {
      await dietVersionHistoryService.deleteVersion(versionId);
      await loadVersions();
      toast({
        title: 'Versão deletada',
        description: 'Versão removida com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar versão',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-green-500/30 bg-white text-[#222222]">
        <DialogHeader>
          <DialogTitle className="text-[#222222] flex items-center gap-2">
            <History className="h-5 w-5 text-[#00C98A]" />
            Histórico de Versões
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            Gerencie versões anteriores do plano e restaure quando necessário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão Criar Versão */}
          <Button
            onClick={handleCreateVersion}
            disabled={loading}
            className="w-full bg-[#00C98A] hover:bg-[#00A875] text-white"
          >
            <History className="w-4 h-4 mr-2" />
            Criar Versão Atual
          </Button>

          {/* Lista de Versões */}
          {loading && versions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#00C98A]" />
            </div>
          ) : versions.length === 0 ? (
            <Alert className="border-yellow-500 bg-yellow-500/10">
              <AlertDescription className="text-yellow-700">
                Nenhuma versão salva ainda. Crie uma versão para começar a rastrear mudanças.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <Card
                  key={version.id}
                  className="bg-green-500/10 border-green-500/30"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-[#222222] flex items-center gap-2">
                          {version.name}
                          <Badge variant="outline" className="border-green-500/50 text-[#00A875] bg-green-500/10">
                            v{version.version_number}
                          </Badge>
                        </CardTitle>
                        <div className="text-xs text-[#777777] mt-1">
                          {new Date(version.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(version.id)}
                          disabled={restoring === version.id}
                          className="border-green-500/50 text-[#00A875] hover:bg-green-500/20"
                        >
                          {restoring === version.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(version.id)}
                          className="border-red-500/50 text-red-600 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-[#777777]">Calorias</div>
                        <div className="text-[#00A875] font-semibold">
                          {version.total_calories ? Math.round(version.total_calories) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#777777]">Proteínas</div>
                        <div className="text-[#00A875] font-semibold">
                          {version.total_protein ? `${Math.round(version.total_protein * 10) / 10}g` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#777777]">Carboidratos</div>
                        <div className="text-[#00A875] font-semibold">
                          {version.total_carbs ? `${Math.round(version.total_carbs * 10) / 10}g` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#777777]">Gorduras</div>
                        <div className="text-[#00A875] font-semibold">
                          {version.total_fats ? `${Math.round(version.total_fats * 10) / 10}g` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-[#777777]">
                      {version.meals.length} refeição(ões)
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

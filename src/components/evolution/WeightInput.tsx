import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { weightTrackingService } from '@/lib/weight-tracking-service';
import { Scale, Sunrise, Calendar } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface WeightInputProps {
  telefone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialDate?: string; // Data inicial (opcional)
}

export function WeightInput({ 
  telefone, 
  open, 
  onOpenChange, 
  onSuccess,
  initialDate 
}: WeightInputProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [peso, setPeso] = useState('');
  const [tipo, setTipo] = useState<'jejum' | 'dia'>('jejum');
  const [dataPesagem, setDataPesagem] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [observacoes, setObservacoes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!peso || parseFloat(peso) <= 0) {
      toast({
        title: 'Peso inválido',
        description: 'Por favor, informe um peso válido',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const pesoNum = parseFloat(peso);

      await weightTrackingService.create({
        telefone,
        data_pesagem: dataPesagem,
        tipo,
        peso_jejum: tipo === 'jejum' ? pesoNum : null,
        peso_dia: tipo === 'dia' ? pesoNum : null,
        observacoes: observacoes || null,
      });

      toast({
        title: 'Peso registrado! ✅',
        description: `Peso ${tipo === 'jejum' ? 'em jejum' : 'do dia'} registrado com sucesso`,
      });

      // Limpar formulário
      setPeso('');
      setObservacoes('');
      setTipo('jejum');
      setDataPesagem(new Date().toISOString().split('T')[0]);

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao registrar peso:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível registrar o peso',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Scale className="w-5 h-5 text-green-400" />
            Registrar Peso
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Registre seu peso para acompanhar sua evolução
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de peso */}
          <div className="space-y-3">
            <Label className="text-slate-300">Tipo de pesagem</Label>
            <RadioGroup value={tipo} onValueChange={(value) => setTipo(value as 'jejum' | 'dia')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="jejum" id="jejum" className="border-slate-600" />
                <Label htmlFor="jejum" className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <Sunrise className="w-4 h-4 text-yellow-400" />
                  Peso em Jejum (Recomendado)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dia" id="dia" className="border-slate-600" />
                <Label htmlFor="dia" className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Peso do Dia
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-slate-500">
              {tipo === 'jejum' 
                ? 'Peso em jejum é mais confiável para análise de evolução' 
                : 'Peso do dia quando não estiver em jejum'}
            </p>
          </div>

          {/* Data da pesagem */}
          <div className="space-y-2">
            <Label htmlFor="data" className="text-slate-300">Data da pesagem</Label>
            <Input
              id="data"
              type="date"
              value={dataPesagem}
              onChange={(e) => setDataPesagem(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Peso */}
          <div className="space-y-2">
            <Label htmlFor="peso" className="text-slate-300">Peso (kg)</Label>
            <Input
              id="peso"
              type="number"
              step="0.1"
              min="30"
              max="300"
              placeholder="70.5"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              required
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-slate-300">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Após treino, antes do almoço..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
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
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Salvando...' : 'Registrar Peso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}






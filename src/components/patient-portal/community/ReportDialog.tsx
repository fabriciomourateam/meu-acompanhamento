import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { communityService } from '@/lib/community-service';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  targetType: 'post' | 'comment';
  targetId: string;
}

export function ReportDialog({ open, onOpenChange, patientId, targetType, targetId }: ReportDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await communityService.report(patientId, targetType, targetId, reason.trim() || null);
      toast({ title: 'Denúncia enviada', description: 'Obrigado. O treinador irá analisar.' });
      setReason('');
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao denunciar:', err);
      toast({ title: 'Erro ao denunciar', description: 'Tente novamente em instantes.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-800">Denunciar {targetType === 'post' ? 'publicação' : 'comentário'}</DialogTitle>
          <DialogDescription className="text-slate-500">
            Descreva (opcional) o motivo. O conteúdo será analisado pelo treinador.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="Motivo da denúncia (opcional)"
          className="min-h-[80px] resize-none bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-rose-500 hover:bg-rose-600">
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Enviar denúncia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOrCreatePatientToken, getPortalUrl } from '@/lib/patient-portal-service';

interface PortalPDFButtonProps {
  telefone: string;
  patientName: string;
}

export function PortalPDFButton({ telefone, patientName }: PortalPDFButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDownloadPortalPDF = async () => {
    try {
      setLoading(true);
      
      toast({
        title: 'Preparando download...',
        description: 'Gerando o PDF do Portal do Aluno',
      });

      // Obter ou criar token do portal
      const result = await getOrCreatePatientToken(telefone);
      
      if (!result) {
        toast({
          title: 'Erro',
          description: 'Não foi possível gerar o link do portal',
          variant: 'destructive'
        });
        return;
      }

      // Gerar URL do portal com parâmetro de auto-download em PDF
      const portalUrl = getPortalUrl(result.token);
      const timestamp = Date.now();
      const downloadUrl = `${portalUrl}?autoDownload=pdf&name=${encodeURIComponent(patientName)}&t=${timestamp}`;
      
      // Abrir portal em nova aba (ele automaticamente iniciará o download do PDF)
      window.open(downloadUrl, '_blank');
      
      toast({
        title: 'Portal aberto! 📄',
        description: 'O download do PDF iniciará em breve. A aba fechará automaticamente.',
      });
      
    } catch (error) {
      console.error('Erro ao baixar PDF do portal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o PDF do portal',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownloadPortalPDF}
      disabled={loading}
      variant="outline"
      className="gap-2 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Preparando...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4 text-red-500" />
          Baixar Evolução (PDF)
        </>
      )}
    </Button>
  );
}

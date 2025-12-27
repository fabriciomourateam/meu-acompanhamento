import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Download, MessageCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ShareData } from '@/lib/share-generator';
import { generateShareImage, generateWhatsAppMessage, shareViaWhatsApp, downloadImage } from '@/lib/share-generator';

interface ShareButtonProps {
  data: ShareData;
}

export function ShareButton({ data }: ShareButtonProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const handleGenerateImage = async () => {
    setGenerating(true);
    try {
      const imageData = await generateShareImage(data);
      await downloadImage(imageData);
      
      toast({
        title: 'Imagem gerada!',
        description: 'Sua imagem de evolução foi baixada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar a imagem. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    const message = generateWhatsAppMessage(data);
    shareViaWhatsApp(message);
    
    toast({
      title: 'WhatsApp aberto!',
      description: 'Compartilhe sua evolução com seus amigos.',
    });
  };

  const handleCopyText = () => {
    const message = decodeURIComponent(generateWhatsAppMessage(data));
    navigator.clipboard.writeText(message);
    
    toast({
      title: 'Texto copiado!',
      description: 'O texto da sua evolução foi copiado para a área de transferência.',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar Evolução
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-card border-slate-700">
        <DropdownMenuItem onClick={handleShareWhatsApp} className="cursor-pointer">
          <MessageCircle className="w-4 h-4 mr-2 text-green-400" />
          Compartilhar no WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleGenerateImage} className="cursor-pointer" disabled={generating}>
          <Download className="w-4 h-4 mr-2 text-blue-400" />
          Baixar Imagem
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyText} className="cursor-pointer">
          <Share2 className="w-4 h-4 mr-2 text-purple-400" />
          Copiar Texto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


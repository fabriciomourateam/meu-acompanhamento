import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Download, FileImage, FileText, Smartphone } from 'lucide-react';
import * as domtoimage from 'dom-to-image-more';
import html2canvas from 'html2canvas';

interface EvolutionExporterProps {
  containerRef: React.RefObject<HTMLDivElement>;
  patientName: string;
  disabled?: boolean;
}

export function EvolutionExporter({ 
  containerRef, 
  patientName, 
  disabled = false 
}: EvolutionExporterProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const generateFileName = (format: string) => {
    const date = new Date().toISOString().split('T')[0];
    const safeName = patientName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `evolucao-${safeName}-${date}.${format}`;
  };

  const hideInteractiveElements = () => {
    const elements = document.querySelectorAll('.hide-in-export');
    elements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
  };

  const showInteractiveElements = () => {
    const elements = document.querySelectorAll('.hide-in-export');
    elements.forEach(el => {
      (el as HTMLElement).style.display = '';
    });
  };

  const waitForCharts = async () => {
    console.log('🔍 Aguardando renderização de gráficos...');
    
    // Aguardar renderização inicial
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (!containerRef.current) return;
    
    // Verificar e corrigir canvas problemáticos
    const canvases = containerRef.current.querySelectorAll('canvas');
    console.log(`📊 Encontrados ${canvases.length} canvas na página`);
    
    canvases.forEach((canvas, index) => {
      const c = canvas as HTMLCanvasElement;
      console.log(`Canvas ${index}: ${c.width}x${c.height}`);
      
      // Se canvas tem dimensões inválidas, ocultar ou corrigir
      if (c.width === 0 || c.height === 0) {
        console.log(`⚠️ Canvas ${index} tem dimensões inválidas - ocultando`);
        c.style.display = 'none';
        c.classList.add('hide-in-export');
      }
    });
    
    // Aguardar mais um pouco após correções
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Preparação de canvas concluída');
  };

  const exportAsNativeScreenshot = async () => {
    try {
      if (!('getDisplayMedia' in navigator.mediaDevices)) {
        throw new Error('Screenshot nativo não suportado');
      }

      hideInteractiveElements();
      
      toast({
        title: '📸 Screenshot Nativo',
        description: '1. Selecione "Esta aba"\n2. Clique em "Compartilhar"\n3. Download automático!'
      });

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());

      const link = document.createElement('a');
      link.download = generateFileName('png');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast({
        title: '✅ Captura Realizada!',
        description: 'Screenshot de alta qualidade baixado com sucesso!'
      });

    } catch (error) {
      console.error('Erro no screenshot nativo:', error);
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast({
          title: 'Captura cancelada',
          description: 'Você cancelou a captura de tela',
          variant: 'destructive'
        });
      } else {
        // Fallback para dom-to-image
        await exportAsPNG();
      }
    } finally {
      showInteractiveElements();
    }
  };

  const exportAsPNG = async () => {
    if (!containerRef.current) {
      toast({
        title: 'Erro',
        description: 'Elemento não encontrado para exportação',
        variant: 'destructive'
      });
      return;
    }

    try {
      setExporting(true);
      hideInteractiveElements();
      
      toast({
        title: 'Gerando PNG...',
        description: 'Aguarde enquanto criamos sua imagem de alta qualidade'
      });

      await waitForCharts();

      let dataURL;
      
      try {
        console.log('🎯 Tentando html2canvas com configuração robusta...');
        
        // Usar html2canvas diretamente com configuração mais robusta
        const canvas = await html2canvas(containerRef.current, {
          scale: 1.5, // Reduzir escala para evitar problemas
          logging: true,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#0f172a',
          removeContainer: true,
          foreignObjectRendering: false, // Desabilitar para evitar problemas
          ignoreElements: (element) => {
            // Ignorar elementos problemáticos
            if (element.classList.contains('hide-in-export')) return true;
            if (element.tagName === 'CANVAS') {
              const c = element as HTMLCanvasElement;
              if (c.width === 0 || c.height === 0) {
                console.log('🚫 Ignorando canvas com dimensões inválidas');
                return true;
              }
            }
            return false;
          }
        });
        
        dataURL = canvas.toDataURL('image/png', 0.95);
        console.log('✅ html2canvas funcionou!');
        
      } catch (error) {
        console.log('❌ html2canvas falhou, tentando dom-to-image...');
        
        try {
          // Fallback para dom-to-image com configuração mais simples
          dataURL = await domtoimage.toPng(containerRef.current, {
            quality: 0.9,
            bgcolor: '#0f172a',
            filter: (element) => {
              if (element.classList.contains('hide-in-export')) return false;
              if (element.tagName === 'CANVAS') {
                const c = element as HTMLCanvasElement;
                return c.width > 0 && c.height > 0;
              }
              return true;
            }
          });
          console.log('✅ dom-to-image funcionou como fallback!');
        } catch (error2) {
          console.log('❌ Ambas as bibliotecas falharam, usando captura básica...');
          throw new Error('Não foi possível capturar a imagem com as bibliotecas disponíveis');
        }
      }

      if (!dataURL || dataURL === 'data:,' || dataURL.length < 100) {
        throw new Error('Falha ao gerar imagem válida');
      }

      const link = document.createElement('a');
      link.download = generateFileName('png');
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'PNG gerado! 🎉',
        description: 'Sua evolução foi exportada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao gerar PNG:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Tente usar o Screenshot Nativo para melhor resultado',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
      showInteractiveElements();
    }
  };

  const exportAsPDF = async () => {
    if (!containerRef.current) return;

    try {
      setExporting(true);
      hideInteractiveElements();
      
      toast({
        title: 'Gerando PDF...',
        description: 'Aguarde enquanto criamos seu relatório profissional'
      });

      await waitForCharts();

      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(containerRef.current, {
        scale: 1.2,
        useCORS: true,
        logging: true,
        backgroundColor: '#0f172a',
        removeContainer: true,
        foreignObjectRendering: false,
        allowTaint: true,
        ignoreElements: (element) => {
          if (element.classList.contains('hide-in-export')) return true;
          if (element.tagName === 'CANVAS') {
            const c = element as HTMLCanvasElement;
            return c.width === 0 || c.height === 0;
          }
          return false;
        }
      });

      const imgData = canvas.toDataURL('image/png', 0.9);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const pdfWidth = 210; // A4 width in mm
      const imgHeightMM = (imgHeight * pdfWidth) / imgWidth;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, imgHeightMM]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM, undefined, 'FAST');
      pdf.save(generateFileName('pdf'));

      toast({
        title: 'PDF gerado! 📄',
        description: 'Seu relatório profissional foi baixado'
      });

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PDF',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
      showInteractiveElements();
    }
  };

  const exportAsJPEG = async () => {
    if (!containerRef.current) return;

    try {
      setExporting(true);
      hideInteractiveElements();
      
      toast({
        title: 'Gerando JPEG...',
        description: 'Criando versão otimizada para compartilhamento'
      });

      await waitForCharts();

      const canvas = await html2canvas(containerRef.current, {
        scale: 1.2,
        logging: true,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        removeContainer: true,
        foreignObjectRendering: false,
        ignoreElements: (element) => {
          if (element.classList.contains('hide-in-export')) return true;
          if (element.tagName === 'CANVAS') {
            const c = element as HTMLCanvasElement;
            return c.width === 0 || c.height === 0;
          }
          return false;
        }
      });

      const dataURL = canvas.toDataURL('image/jpeg', 0.9);

      const link = document.createElement('a');
      link.download = generateFileName('jpg');
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'JPEG gerado! 📱',
        description: 'Versão otimizada para compartilhamento criada'
      });

    } catch (error) {
      console.error('Erro ao gerar JPEG:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o JPEG',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
      showInteractiveElements();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || exporting}
          className="border-slate-600 hover:bg-slate-800 text-white min-h-[44px]"
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white w-64">
        <DropdownMenuItem
          onClick={exportAsNativeScreenshot}
          disabled={exporting}
          className="text-white hover:bg-green-700 cursor-pointer py-3 bg-green-600/20 border-l-4 border-green-500"
        >
          <FileImage className="w-4 h-4 mr-2 text-green-400" />
          <div className="flex flex-col">
            <span>📸 Screenshot Nativo</span>
            <span className="text-xs text-green-300">Máxima qualidade</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => {
            toast({
              title: '📸 Captura Manual Recomendada',
              description: 'Use Ctrl+Shift+S (Windows) ou Cmd+Shift+4 (Mac) para captura de tela manual com máxima qualidade',
            });
          }}
          className="text-white hover:bg-blue-700 cursor-pointer py-3 bg-blue-600/20 border-l-4 border-blue-500"
        >
          <FileImage className="w-4 h-4 mr-2 text-blue-400" />
          <div className="flex flex-col">
            <span>📷 Captura Manual</span>
            <span className="text-xs text-blue-300">Ctrl+Shift+S (recomendado)</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={exportAsPNG}
          disabled={exporting}
          className="text-white hover:bg-slate-700 cursor-pointer py-3"
        >
          <FileImage className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span>PNG (Experimental)</span>
            <span className="text-xs text-slate-400">Pode ter problemas com gráficos</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={exportAsPDF}
          disabled={exporting}
          className="text-white hover:bg-slate-700 cursor-pointer py-3"
        >
          <FileText className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span>PDF (Experimental)</span>
            <span className="text-xs text-slate-400">Pode ter problemas com gráficos</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={exportAsJPEG}
          disabled={exporting}
          className="text-white hover:bg-slate-700 cursor-pointer py-3"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span>JPEG (Experimental)</span>
            <span className="text-xs text-slate-400">Pode ter problemas com gráficos</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
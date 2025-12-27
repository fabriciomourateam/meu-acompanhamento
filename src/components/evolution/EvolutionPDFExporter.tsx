import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Download, Eye, FileImage, FileText } from 'lucide-react';
import { EvolutionExportPage } from './EvolutionExportPage';
import html2canvas from 'html2canvas';

interface PatientData {
  nome: string;
  data_nascimento?: string | null;
  telefone?: string;
  peso_inicial?: number | string | null;
  altura_inicial?: number | string | null;
  created_at?: string;
  sexo?: string | null;
  percentual_gordura_inicial?: number | string | null;
}

interface CheckinData {
  data_checkin: string;
  peso?: string;
  medida?: string;
  treino?: string;
  cardio?: string;
  agua?: string;
  sono?: string;
  pontuacao_total?: number;
}

interface BodyCompositionData {
  date?: string;
  data_avaliacao?: string;
  bodyFat?: number | null;
  percentual_gordura?: number | null;
  muscleMass?: number | null;
  massa_muscular?: number | null;
  visceralFat?: number | null;
  gordura_visceral?: number | null;
}

interface EvolutionPDFExporterProps {
  patient: PatientData;
  checkins: CheckinData[];
  bodyCompositions?: BodyCompositionData[];
  disabled?: boolean;
}

export function EvolutionPDFExporter({ 
  patient,
  checkins,
  bodyCompositions,
  disabled = false 
}: EvolutionPDFExporterProps) {
  const { toast } = useToast();
  const [showExportPage, setShowExportPage] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMode, setExportMode] = useState<'preview' | 'png' | 'pdf' | null>(null);

  const exportDirect = async (format: 'png' | 'pdf') => {
    setExportMode(format);
    setShowExportPage(true);
  };

  const handleDirectExport = async (exportRef: HTMLDivElement, format: 'png' | 'pdf') => {
    try {
      setExporting(true);
      toast({
        title: format === 'png' ? '📸 Gerando PNG...' : '📄 Gerando PDF...',
        description: 'Aguarde enquanto criamos seu arquivo'
      });

      const canvas = await html2canvas(exportRef, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        logging: false,
      });

      if (format === 'png') {
        const dataURL = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `evolucao-${patient.nome?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataURL;
        link.click();
        toast({ title: 'PNG gerado! 🎉', description: 'Sua evolução foi exportada' });
      } else {
        const { jsPDF } = await import('jspdf');
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfWidth = 210;
        const imgHeightMM = (canvas.height * pdfWidth) / canvas.width;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, imgHeightMM] });
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM);
        pdf.save(`evolucao-${patient.nome?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
        toast({ title: 'PDF gerado! 📄', description: 'Seu relatório foi baixado' });
      }
      setShowExportPage(false);
      setExportMode(null);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({ title: 'Erro', description: 'Não foi possível gerar o arquivo', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled || exporting} className="border-slate-600 hover:bg-slate-800 text-white min-h-[44px]">
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exportando...' : 'Exportar ▼'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white w-56 z-[9999]">
          <DropdownMenuItem onClick={() => { setExportMode('preview'); setShowExportPage(true); }} className="text-white hover:bg-slate-700 cursor-pointer py-3">
            <Eye className="w-4 h-4 mr-3 text-blue-400" />
            <div className="flex flex-col">
              <span>👁️ Visualizar</span>
              <span className="text-xs text-slate-400">Pré-visualizar antes de baixar</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportDirect('png')} className="text-white hover:bg-green-700/50 cursor-pointer py-3">
            <FileImage className="w-4 h-4 mr-3 text-green-400" />
            <div className="flex flex-col">
              <span>📸 Baixar PNG</span>
              <span className="text-xs text-slate-400">Download direto da imagem</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportDirect('pdf')} className="text-white hover:bg-purple-700/50 cursor-pointer py-3">
            <FileText className="w-4 h-4 mr-3 text-purple-400" />
            <div className="flex flex-col">
              <span>📄 Baixar PDF</span>
              <span className="text-xs text-slate-400">Download direto do PDF</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showExportPage && (
        <EvolutionExportPage
          patient={patient}
          checkins={checkins}
          bodyCompositions={bodyCompositions}
          onClose={() => { setShowExportPage(false); setExportMode(null); }}
          directExportMode={exportMode === 'png' || exportMode === 'pdf' ? exportMode : undefined}
          onDirectExport={handleDirectExport}
        />
      )}
    </>
  );
}

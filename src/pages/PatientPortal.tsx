import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import * as domtoimage from 'dom-to-image-more';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { checkinService } from '@/lib/checkin-service';
import { supabase } from '@/integrations/supabase/client';
import { validateToken } from '@/lib/patient-portal-service';
import { EvolutionCharts } from '@/components/evolution/EvolutionCharts';
import { PhotoComparison } from '@/components/evolution/PhotoComparison';
import { Timeline } from '@/components/evolution/Timeline';
import { AchievementBadges } from '@/components/evolution/AchievementBadges';
import { TrendsAnalysis } from '@/components/evolution/TrendsAnalysis';
import { BodyFatChart } from '@/components/evolution/BodyFatChart';
import { BodyCompositionMetrics } from '@/components/evolution/BodyCompositionMetrics';
import { detectAchievements } from '@/lib/achievement-system';
import { analyzeTrends } from '@/lib/trends-analysis';
import { InstallPWAButton } from '@/components/InstallPWAButton';
import { PatientDietPortal } from '@/components/patient-portal/PatientDietPortal';
import { EvolutionExportPage } from '@/components/evolution/EvolutionExportPage';
import { dietService } from '@/lib/diet-service';
import { calcularTotaisPlano } from '@/utils/diet-calculations';
import { DietPDFGenerator } from '@/lib/diet-pdf-generator';
import { DietPremiumPDFGenerator } from '@/lib/diet-pdf-premium-generator';
import { 
  Activity, 
  Calendar,
  AlertCircle,
  RefreshCw,
  Lock,
  Download,
  TrendingUp,
  Weight,
  Flame,
  Smartphone,
  FileText,
  Scale,
  MoreVertical,
  Eye,
  FileImage
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WeightInput } from '@/components/evolution/WeightInput';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

const getDailyMotivationalPhrase = () => {
  const phrases = [
    'Cada refeição é um passo em direção aos seus objetivos! 💪',
    'Você está no caminho certo! Continue assim! 🌟',
    'Pequenas escolhas diárias geram grandes resultados! ✨',
    'Seu compromisso com a saúde é inspirador! 🎯',
    'Cada dia é uma nova oportunidade de cuidar de si! 🌈',
    'Você está construindo um futuro mais saudável! 🚀',
    'Consistência é a chave do sucesso! 🔑',
    'Seu esforço de hoje será sua vitória de amanhã! 🏆',
    'Acredite no processo e confie na jornada! 💚',
    'Você é mais forte do que imagina! 💪',
    'Cada refeição equilibrada é uma vitória! 🎉',
    'Seu bem-estar é sua prioridade! ❤️',
    'Transformação começa com uma refeição de cada vez! 🌱',
    'Você está fazendo a diferença na sua vida! ⭐',
    'Mantenha o foco e siga em frente! 🎯',
    'Sua dedicação é admirável! 👏',
    'Cada escolha saudável te aproxima dos seus sonhos! 🌟',
    'Você está no controle da sua jornada! 🧭',
    'Pequenos progressos diários levam a grandes mudanças! 📈',
    'Sua saúde é seu maior investimento! 💎',
    'Continue firme, você está indo muito bem! 🚀',
    'Cada refeição é uma oportunidade de nutrir seu corpo! 🥗',
    'Você está criando hábitos que transformam vidas! 🌿',
    'Seu comprometimento é inspirador! 💫',
    'A jornada de mil milhas começa com um passo! 🚶',
    'Você está escrevendo sua história de sucesso! 📖',
    'Cada dia é uma chance de ser melhor! 🌅',
    'Seu futuro agradece pelas escolhas de hoje! 🙏',
    'Você está no caminho da transformação! 🦋',
    'Mantenha a motivação e siga seus objetivos! 🎯',
  ];

  // Usar o dia do ano (1-365) para selecionar uma frase
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  return phrases[dayOfYear % phrases.length];
};

export default function PatientPortal() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [bodyCompositions, setBodyCompositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [weightInputOpen, setWeightInputOpen] = useState(false);
  const [chartsRefreshTrigger, setChartsRefreshTrigger] = useState(0);
  const [showEvolutionExport, setShowEvolutionExport] = useState(false);
  const [evolutionExportMode, setEvolutionExportMode] = useState<'png' | 'pdf' | null>(null);

  // Calcular dados
  const achievements = checkins.length > 0 ? detectAchievements(checkins, bodyCompositions) : [];

  // Calcular idade do paciente
  const calcularIdade = (dataNascimento: string | null) => {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  useEffect(() => {
    loadPortalData();
  }, [token]);

  // Salvar token no localStorage para PWA (permite abrir direto no portal)
  useEffect(() => {
    if (token) {
      localStorage.setItem('portal_access_token', token);
    }
  }, [token]);

  // Trocar manifest para o portal do paciente (PWA abre direto no portal)
  useEffect(() => {
    // Salvar referência do manifest original
    const originalManifest = document.querySelector('link[rel="manifest"]');
    const originalHref = originalManifest?.getAttribute('href');
    
    // Trocar para o manifest do portal
    if (originalManifest) {
      originalManifest.setAttribute('href', '/manifest-portal.json');
    }
    
    // Atualizar meta tags para o portal
    document.title = 'Meu Portal - Grow Nutri';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Acompanhe sua dieta, progresso e conquistas com seu nutricionista.');
    }
    
    // Restaurar ao sair da página
    return () => {
      if (originalManifest && originalHref) {
        originalManifest.setAttribute('href', originalHref);
      }
      document.title = 'Grow Nutri - Controle da sua Empresa';
    };
  }, []);

  // Auto-download quando parâmetro autoDownload está presente
  useEffect(() => {
    if (!loading && patient && portalRef.current) {
      const urlParams = new URLSearchParams(window.location.search);
      const autoDownloadFormat = urlParams.get('autoDownload'); // 'png', 'pdf', ou 'jpeg'
      
      if (autoDownloadFormat) {
        console.log(`🎯 Auto-download ${autoDownloadFormat.toUpperCase()} detectado! Iniciando captura...`);
        
        // Aguardar renderização completa dos gráficos
        setTimeout(async () => {
          console.log(`📸 Capturando portal como ${autoDownloadFormat.toUpperCase()}...`);
          
          if (autoDownloadFormat === 'png' || autoDownloadFormat === 'jpeg') {
            await handleExportEvolutionImage();
          } else if (autoDownloadFormat === 'pdf') {
            await handleExportEvolutionPDF();
          }
          
          console.log('✅ Download iniciado! Fechando aba em 3 segundos...');
          
          // Fechar aba automaticamente após download
          setTimeout(() => {
            window.close();
          }, 3000);
        }, 3000); // Aumentar tempo para garantir que gráficos carregaram
      }
    }
  }, [loading, patient]);

  async function loadPortalData() {
    if (!token) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // MODO TESTE: Usar telefone fixo para demonstração
      let telefone;
      
      if (token === 'teste123') {
        telefone = '11999999999'; // Telefone de teste
      } else {
        // Validar token real
        telefone = await validateToken(token);
        
        if (!telefone) {
          // Token inválido ou expirado - limpar localStorage e redirecionar para login
          localStorage.removeItem('portal_access_token');
          setUnauthorized(true);
          setLoading(false);
          toast({
            title: 'Sessão expirada',
            description: 'Por favor, faça login novamente com seu telefone',
            variant: 'destructive'
          });
          // Redirecionar para login após 2 segundos
          setTimeout(() => {
            navigate('/portal', { replace: true });
          }, 2000);
          return;
        }
      }

      // Buscar todos os dados em paralelo para melhor performance
      const [checkinsData, patientResult, bioResult] = await Promise.all([
        checkinService.getByPhone(telefone),
        supabase
          .from('patients')
          .select('*')
          .eq('telefone', telefone)
          .single(),
        (supabase as any)
          .from('body_composition')
          .select('*')
          .eq('telefone', telefone)
          .order('data_avaliacao', { ascending: false })
      ]);
      
      if (checkinsData.length === 0) {
        toast({
          title: 'Nenhum check-in encontrado',
          description: 'Este paciente ainda não possui check-ins registrados',
          variant: 'destructive'
        });
      }
      
      setCheckins(checkinsData);
      setPatient(patientResult.data);
      
      // Salvar patient_id para usar nos componentes de dieta
      if (patientResult.data?.id) {
        setPatientId(patientResult.data.id);
      }

      if (bioResult.data) {
        setBodyCompositions(bioResult.data);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do portal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  // Função simples para aguardar carregamento
  const waitForChartsToLoad = async () => {
    console.log('🔍 Aguardando carregamento...');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('✅ Tempo de espera concluído');
        resolve();
      }, 1000);
    });
  };

  async function handleExportEvolutionImage() {
    console.log('🎯 Função handleExportEvolutionImage chamada');
    
    if (!patient) {
      console.error('❌ Paciente não encontrado');
      toast({
        title: 'Erro',
        description: 'Dados do paciente não carregados',
        variant: 'destructive'
      });
      return;
    }

    if (!portalRef.current) {
      console.error('❌ Referência do portal não encontrada');
      toast({
        title: 'Erro',
        description: 'Elemento do portal não encontrado',
        variant: 'destructive'
      });
      return;
    }

    try {
      setExporting(true);
      console.log('🚀 Iniciando captura de imagem...');
      console.log('👤 Paciente:', patient.nome);
      console.log('📱 Portal ref:', portalRef.current);
      
      toast({
        title: 'Gerando imagem...',
        description: 'Aguarde enquanto criamos seu relatório'
      });

      // Aguardar carregamento
      console.log('⏳ Aguardando 3 segundos...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('📸 Iniciando html2canvas...');
      console.log('📏 Dimensões do elemento:', {
        width: portalRef.current.offsetWidth,
        height: portalRef.current.offsetHeight,
        scrollWidth: portalRef.current.scrollWidth,
        scrollHeight: portalRef.current.scrollHeight
      });

      // Verificar todos os canvas antes de capturar
      const allCanvas = portalRef.current.querySelectorAll('canvas');
      console.log(`🔍 Encontrados ${allCanvas.length} canvas na página:`);
      allCanvas.forEach((canvas, index) => {
        const c = canvas as HTMLCanvasElement;
        console.log(`Canvas ${index}: ${c.width}x${c.height} (${c.className || 'sem classe'})`);
        if (c.width === 0 || c.height === 0) {
          console.log(`⚠️ Canvas ${index} tem dimensões inválidas e será ignorado`);
        }
      });

      let dataURL;
      
      try {
        // Tentar com dom-to-image com máxima qualidade
        console.log('🎯 Tentativa 1: dom-to-image alta qualidade...');
        dataURL = await domtoimage.toPng(portalRef.current, {
          quality: 1.0, // Máxima qualidade
          bgcolor: '#0f172a',
          width: portalRef.current.offsetWidth * 2, // Dobrar resolução
          height: portalRef.current.offsetHeight * 2,
          style: {
            transform: 'scale(2)', // Escalar para alta resolução
            transformOrigin: 'top left'
          },
          filter: (element) => {
            // Apenas ocultar botões interativos
            return !element.classList.contains('hide-in-pdf');
          }
        });
        console.log('✅ dom-to-image funcionou!');
      } catch (error1) {
        console.log('❌ dom-to-image falhou, tentando html2canvas...');
        console.log('🎯 Tentativa 2: html2canvas básico...');
        
        try {
          // Tentar html2canvas com alta qualidade
          const canvas = await html2canvas(portalRef.current, {
            scale: 2, // Alta resolução
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#0f172a',
            width: portalRef.current.offsetWidth,
            height: portalRef.current.offsetHeight,
            ignoreElements: (element) => {
              // Apenas ocultar botões interativos
              return element.classList.contains('hide-in-pdf');
            }
          });
          dataURL = canvas.toDataURL('image/png', 1.0); // Máxima qualidade
          console.log('✅ html2canvas funcionou como fallback!');
        } catch (error2) {
          console.log('❌ html2canvas também falhou, tentando captura simples...');
          console.log('🎯 Tentativa 3: captura sem elementos complexos...');
          
          // Última tentativa: usar API nativa de screenshot se disponível
          if ('getDisplayMedia' in navigator.mediaDevices) {
            console.log('🎯 Tentando API nativa de screenshot...');
            // Implementar captura nativa aqui se necessário
          }
          
          // Fallback: html2canvas com configuração básica mas boa qualidade
          const canvas = await html2canvas(portalRef.current, {
            scale: 1.5, // Boa qualidade
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#0f172a',
            ignoreElements: (element) => {
              // Ignorar apenas elementos realmente problemáticos
              return element.classList.contains('hide-in-pdf') ||
                     (element.tagName === 'CANVAS' && (element as HTMLCanvasElement).width === 0);
            }
          });
          dataURL = canvas.toDataURL('image/png', 1.0); // Máxima qualidade
          console.log('✅ Captura básica funcionou!');
        }
      }

      if (!dataURL || dataURL === 'data:,' || dataURL.length < 100) {
        throw new Error('Falha ao gerar imagem válida');
      }

      console.log('✅ Imagem gerada com sucesso!');
      console.log('📏 Tamanho da imagem:', Math.round(dataURL.length / 1024), 'KB');

      console.log('💾 Iniciando download...');
      const link = document.createElement('a');
      link.download = `evolucao-${patient.nome?.replace(/\s+/g, '-') || 'paciente'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ Download iniciado com sucesso!');
      
      toast({
        title: 'Imagem gerada! 🎉',
        description: 'Seu relatório foi baixado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro detalhado:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('❌ Mensagem do erro:', error.message);
      }
      
      toast({
        title: 'Erro ao gerar imagem',
        description: `Detalhes: ${errorMessage}`,
        variant: 'destructive'
      });
    } finally {
      console.log('🏁 Finalizando função...');
      setExporting(false);
    }
  }

  async function handleExportEvolutionPDF() {
    if (!patient || !portalRef.current) return;

    try {
      setExporting(true);
      toast({
        title: 'Gerando PDF...',
        description: 'Aguarde enquanto criamos seu relatório'
      });

      // Aguardar que todos os gráficos carreguem
      await waitForChartsToLoad();

      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf');

      // Ocultar apenas botões interativos
      const elementsToHide = portalRef.current.querySelectorAll('.hide-in-pdf');
      const originalDisplay: string[] = [];
      
      elementsToHide.forEach((el, index) => {
        originalDisplay[index] = (el as HTMLElement).style.display;
        (el as HTMLElement).style.display = 'none';
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(portalRef.current, {
        scale: 1.5,
        useCORS: true,
        logging: true,
        backgroundColor: '#0f172a',
        width: portalRef.current.scrollWidth,
        height: portalRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        allowTaint: true,
        ignoreElements: (element) => {
          return element.classList.contains('hide-in-pdf');
        }
      });

      elementsToHide.forEach((el, index) => {
        (el as HTMLElement).style.display = originalDisplay[index];
      });

      // Converter para PDF
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
      pdf.save(`evolucao-${patient.nome?.replace(/\s+/g, '-') || 'paciente'}-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'PDF gerado! 🎉',
        description: 'Seu relatório foi baixado com sucesso'
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
    }
  }

  async function handleExportDietPDF() {
    if (!patient || !patientId) return;

    try {
      setExporting(true);
      toast({
        title: 'Gerando PDF...',
        description: 'Aguarde enquanto criamos seu plano alimentar em PDF'
      });

      // Buscar dados do plano alimentar
      const plans = await dietService.getByPatientId(patientId);
      const activePlan = plans.find((p: any) => p.status === 'active' || p.active);
      
      if (!activePlan) {
        toast({
          title: 'Erro',
          description: 'Nenhum plano alimentar ativo encontrado',
          variant: 'destructive'
        });
        setExporting(false);
        return;
      }

      const planDetails = await dietService.getById(activePlan.id);

      // Usar o gerador melhorado de PDF
      await DietPDFGenerator.generatePDF(
        planDetails as any,
        patient,
        {
          theme: 'light', // Pode adicionar opção de escolha mais tarde
          showMacrosPerMeal: true
        }
      );

      setExporting(false);
      toast({
        title: 'PDF gerado! ✅',
        description: 'Seu plano alimentar foi baixado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível gerar o PDF',
        variant: 'destructive'
      });
      setExporting(false);
    }
  }

  async function handleExportDietPremiumPDF() {
    if (!patient || !patientId) return;

    try {
      setExporting(true);
      toast({
        title: 'Gerando PDF Premium...',
        description: 'Aguarde enquanto criamos seu plano alimentar premium'
      });

      // Buscar dados do plano alimentar
      const plans = await dietService.getByPatientId(patientId);
      const activePlan = plans.find((p: any) => p.status === 'active' || p.active);
      
      if (!activePlan) {
        toast({
          title: 'Erro',
          description: 'Nenhum plano alimentar ativo encontrado',
          variant: 'destructive'
        });
        setExporting(false);
        return;
      }

      const planDetails = await dietService.getById(activePlan.id);

      // Usar o NOVO gerador premium de PDF
      await DietPremiumPDFGenerator.generatePremiumPDF(
        planDetails as any,
        patient,
        {
          theme: 'dark',
          showMacrosPerMeal: true
        }
      );

      setExporting(false);
      toast({
        title: 'PDF Premium gerado! 🎉',
        description: 'Seu plano alimentar premium foi baixado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF Premium:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível gerar o PDF Premium',
        variant: 'destructive'
      });
      setExporting(false);
    }
  }

  // Função para exportar evolução diretamente
  function handleExportEvolution(format: 'png' | 'pdf') {
    setEvolutionExportMode(format);
    setShowEvolutionExport(true);
  }

  // Callback quando a exportação direta é concluída
  async function handleDirectEvolutionExport(exportRef: HTMLDivElement, format: 'png' | 'pdf') {
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
        link.download = `evolucao-${patient?.nome?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`;
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
        pdf.save(`evolucao-${patient?.nome?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
        toast({ title: 'PDF gerado! 📄', description: 'Seu relatório foi baixado' });
      }
      setShowEvolutionExport(false);
      setEvolutionExportMode(null);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({ title: 'Erro', description: 'Não foi possível gerar o arquivo', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full glass-card border-slate-700">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Acesso Negado</h1>
            <p className="text-slate-400">
              Este link de acesso é inválido ou expirou. Entre em contato com seu treinador para obter um novo link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={portalRef} className="min-h-screen relative overflow-hidden">
      {/* Background Premium Moderno */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Gradiente radial para profundidade */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.12),transparent_50%)]" />
        
        {/* Padrão de grade sutil */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Efeito de brilho animado */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Linhas de gradiente decorativas */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      </div>
      
      {/* Conteúdo com z-index */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header do Portal */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
        >
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              📊 Meu Acompanhamento
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              Acompanhe seu progresso e conquistas
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center w-full sm:w-auto hide-in-pdf">
            <InstallPWAButton />
            <Button
              onClick={() => setWeightInputOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all whitespace-nowrap flex-1 sm:flex-none min-h-[44px] text-sm sm:text-base"
            >
              <Scale className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Registrar Peso</span>
              <span className="sm:hidden">Peso</span>
            </Button>
            
            {/* Menu de ações: Dieta, Evolução e Atualizar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 hover:bg-slate-800 text-white min-h-[44px] min-w-[44px] px-3"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white w-56">
                <DropdownMenuItem
                  onClick={handleExportDietPremiumPDF}
                  disabled={exporting}
                  className="text-white hover:bg-slate-700 cursor-pointer py-3"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {exporting ? 'Gerando...' : 'Baixar Dieta PDF'}
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={handleExportDietPDF}
                  disabled={exporting}
                  className="text-white hover:bg-slate-700 cursor-pointer py-3"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {exporting ? 'Gerando...' : 'Baixar Dieta (Impressão)'}
                </DropdownMenuItem>
                
                {/* Opções de Evolução */}
                {patient && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setShowEvolutionExport(true)}
                      className="text-white hover:bg-blue-700/50 cursor-pointer py-3"
                    >
                      <Eye className="w-4 h-4 mr-2 text-blue-400" />
                      Visualizar Evolução
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportEvolution('png')}
                      className="text-white hover:bg-green-700/50 cursor-pointer py-3"
                    >
                      <FileImage className="w-4 h-4 mr-2 text-green-400" />
                      Baixar Evolução PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportEvolution('pdf')}
                      className="text-white hover:bg-purple-700/50 cursor-pointer py-3"
                    >
                      <FileText className="w-4 h-4 mr-2 text-purple-400" />
                      Baixar Evolução PDF
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuItem
                  onClick={loadPortalData}
                  className="text-white hover:bg-slate-700 cursor-pointer py-3"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Dados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Card de Informações do Paciente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <Avatar className="w-14 h-14 sm:w-20 sm:h-20 border-4 border-blue-500/30 flex-shrink-0">
                  <AvatarFallback className="bg-blue-500/20 text-blue-300 text-lg sm:text-2xl font-bold">
                    {patient?.nome?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg sm:text-2xl font-bold text-white truncate">{patient?.nome || 'Seu Nome'}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{checkins.length} check-ins</span>
                    </div>
                    {checkins.length > 0 && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm truncate">
                          Desde {new Date(checkins[checkins.length - 1]?.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>


        {/* Plano Alimentar, Metas e Progresso */}
        {patientId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <PatientDietPortal 
              patientId={patientId} 
              patientName={patient?.nome || 'Paciente'}
              checkins={checkins}
              patient={patient}
              bodyCompositions={bodyCompositions}
              achievements={achievements}
              refreshTrigger={chartsRefreshTrigger}
            />
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-white py-4 sm:py-6 px-4">
          {getDailyMotivationalPhrase()}
        </div>
        </div>
      </div>

      {/* Modal de Registro de Peso */}
      {patient?.telefone && (
        <WeightInput
          telefone={patient.telefone}
          open={weightInputOpen}
          onOpenChange={setWeightInputOpen}
          onSuccess={() => {
            loadPortalData(); // Recarregar dados para atualizar gráficos
            // Forçar atualização dos gráficos
            setChartsRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {/* Modal de Exportação da Evolução */}
      {showEvolutionExport && patient && (
        <EvolutionExportPage
          patient={patient}
          checkins={checkins}
          bodyCompositions={bodyCompositions}
          onClose={() => { setShowEvolutionExport(false); setEvolutionExportMode(null); }}
          directExportMode={evolutionExportMode || undefined}
          onDirectExport={handleDirectEvolutionExport}
        />
      )}
    </div>
  );
}


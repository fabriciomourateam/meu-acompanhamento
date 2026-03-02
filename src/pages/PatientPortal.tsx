import { useState, useEffect, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
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
import { detectAchievements } from '@/lib/achievement-system';
import { analyzeTrends } from '@/lib/trends-analysis';
import { InstallPWAButton } from '@/components/InstallPWAButton';
import { MembersAreaButton } from '@/components/patient-portal/MembersAreaButton';
import { PatientDietPortal } from '@/components/patient-portal/PatientDietPortal';
import { dietService } from '@/lib/diet-service';
import { calcularTotaisPlano } from '@/utils/diet-calculations';
import { DietPDFGenerator } from '@/lib/diet-pdf-generator';
import { DietPremiumPDFGenerator } from '@/lib/diet-pdf-premium-generator';
import { classificarIMC } from '@/lib/body-calculations';

// Lazy load componentes pesados com tipagem
const EvolutionCharts = lazy(() => import('@/components/evolution/EvolutionCharts').then(m => ({ default: m.EvolutionCharts }))) as any;
const PhotoComparison = lazy(() => import('@/components/evolution/PhotoComparison').then(m => ({ default: m.PhotoComparison }))) as any;
const Timeline = lazy(() => import('@/components/evolution/Timeline').then(m => ({ default: m.Timeline }))) as any;
const AchievementBadges = lazy(() => import('@/components/evolution/AchievementBadges').then(m => ({ default: m.AchievementBadges }))) as any;
const TrendsAnalysis = lazy(() => import('@/components/evolution/TrendsAnalysis').then(m => ({ default: m.TrendsAnalysis }))) as any;
const BodyFatChart = lazy(() => import('@/components/evolution/BodyFatChart').then(m => ({ default: m.BodyFatChart }))) as any;
const BodyCompositionMetrics = lazy(() => import('@/components/evolution/BodyCompositionMetrics').then(m => ({ default: m.BodyCompositionMetrics }))) as any;
const EvolutionExportPage = lazy(() => import('@/components/evolution/EvolutionExportPage').then(m => ({ default: m.EvolutionExportPage }))) as any;
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
  FileImage,
  LogOut
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WeightInput } from '@/components/evolution/WeightInput';
import { StreakHeader } from '@/components/patient-portal/StreakHeader';
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

  // Memoizar cálculos pesados
  const achievements = useMemo(() => {
    return checkins.length > 0 ? detectAchievements(checkins, bodyCompositions) : [];
  }, [checkins, bodyCompositions]);

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
      localStorage.setItem('portal_token', token); // Garantir consistência
    }
  }, [token]);

  // Memoizar função de logout
  const handleLogout = useCallback(() => {
    // Ler a rota de login antes de limpar tudo
    const loginRoute = localStorage.getItem('portal_login_route') || '/portal';
    // Limpar token do localStorage
    localStorage.removeItem('portal_access_token');
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_phone');
    // Redirecionar para a página de login original (personalizada ou padrão)
    navigate(loginRoute, { replace: true });
    toast({
      title: 'Logout realizado',
      description: 'Você saiu do portal com sucesso'
    });
  }, [navigate, toast]);

  // Atualizar título da página quando entrar no portal
  useEffect(() => {
    document.title = 'Meu Acompanhamento - Portal do Paciente';

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Acompanhe sua dieta, progresso e conquistas com seu nutricionista.');
    }

    // Restaurar ao sair da página
    return () => {
      document.title = 'Meu Acompanhamento';
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
      let telefone: string | null;

      if (token === 'teste123') {
        telefone = '11999999999';
      } else {
        telefone = await validateToken(token);
        if (!telefone) {
          localStorage.removeItem('portal_access_token');
          setUnauthorized(true);
          setLoading(false);
          toast({
            title: 'Sessão expirada',
            description: 'Por favor, faça login novamente',
            variant: 'destructive'
          });
          setTimeout(() => navigate(localStorage.getItem('portal_login_route') || '/portal', { replace: true }), 2000);
          return;
        }
      }

      console.log('📱 Telefone validado:', telefone);

      // 1. Buscar Paciente PRIMEIRO para ter o ID e o telefone OFICIAL do banco via RPC
      // Esse RPC burla o RLS para leitura anônima estrita do próprio perfil
      const { data: profileResult, error: patientError } = await supabase.rpc('get_patient_profile', {
        phone_number: telefone
      });

      let patientData = null;
      if (profileResult && profileResult.length > 0) {
        patientData = profileResult[0];
      } else {
        console.error('❌ Falha ao buscar perfil do paciente via RPC:', patientError);
      }

      setPatient(patientData || null);

      // 2. Definir os telefones para busca de check-ins
      // Se achou o paciente, o telefone DELE é o mestre. Se não, usamos as variações do token.
      const basePhone = patientData?.telefone || telefone;
      const cleanBasePhone = basePhone.replace(/\D/g, '');

      const searchPhones = new Set<string>([basePhone, cleanBasePhone]);
      if (cleanBasePhone.startsWith('55')) {
        searchPhones.add(cleanBasePhone.slice(2));
        searchPhones.add('+' + cleanBasePhone);
      } else {
        searchPhones.add('55' + cleanBasePhone);
        searchPhones.add('+55' + cleanBasePhone);
      }

      const uniquePhones = Array.from(searchPhones);
      console.log('📊 Buscando Check-ins e Bio para:', uniquePhones);

      if (patientData?.id) {
        setPatientId(patientData.id);
        console.log('🆔 ID do Paciente:', patientData.id);
      }

      // 3. Buscar dados usando os telefones identificados
      const searchFilter = uniquePhones.map(p => `telefone.eq."${p}"`).join(',');

      const [checkinsResult, bioResult] = await Promise.all([
        supabase
          .from('checkin')
          .select('*')
          .or(searchFilter)
          .order('data_checkin', { ascending: false }),
        supabase
          .from('body_composition')
          .select('*')
          .or(searchFilter)
          .order('data_avaliacao', { ascending: false })
          .limit(50)
      ]);

      if (checkinsResult.error) console.error('❌ Erro Checkins:', checkinsResult.error);
      if (bioResult.error) console.error('❌ Erro Bioimpedância:', bioResult.error);

      const checkinsData = checkinsResult.data || [];
      console.log(`✅ ${checkinsData.length} Check-ins encontrados`);
      setCheckins(checkinsData);

      let bioData = bioResult.data || [];
      console.log(`✅ ${bioData.length} Registros de Bioimpedância encontrados`);

      setCheckins(checkinsData);

      // Processar dados de composição corporal
      if (bioData.length > 0) {
        const processedData = bioData.map((item: any) => ({
          ...item,
          classificacao: item.classificacao || (item.imc ? classificarIMC(item.imc) : '')
        }));
        setBodyCompositions(processedData);
      } else {
        setBodyCompositions([]);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados do portal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus dados completamente',
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

        {/* Geometria Abstrata (Deep Polygons) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 mix-blend-overlay">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-slate-600 blur-[1px] transition-transform duration-[20s] hover:scale-105" style={{ clipPath: 'polygon(0 0, 100% 0, 60% 100%, 20% 80%)' }} />
          <div className="absolute top-[10%] -right-[10%] w-[60%] h-[80%] bg-slate-900 blur-[1px] transition-transform duration-[20s] hover:scale-105" style={{ clipPath: 'polygon(50% 0%, 100% 20%, 80% 100%, 10% 80%)' }} />
          <div className="absolute -bottom-[20%] left-[10%] w-[80%] h-[60%] bg-slate-950 blur-[2px] transition-transform duration-[20s] hover:scale-105" style={{ clipPath: 'polygon(20% 0%, 90% 10%, 100% 100%, 0% 100%)' }} />
          <div className="absolute top-[30%] left-[20%] w-[50%] h-[50%] bg-slate-500/30 blur-[3px]" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
        </div>

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
            <div className="flex-1 min-w-0">
              {patientId ? (
                <StreakHeader
                  patientId={patientId}
                  patientName={patient?.nome || 'Meu Acompanhamento'}
                />
              ) : (
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                    📊 Meu Acompanhamento
                  </h1>
                  <p className="text-sm sm:text-base text-slate-400 mt-1">
                    Acompanhe seu progresso e conquistas
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center hide-in-pdf">
              <InstallPWAButton />

              {patient?.user_id === 'a9798432-60bd-4ac8-a035-d139a47ad59b' && (
                <MembersAreaButton />
              )}

              {/* Botão de Peso removido a pedido */}

              {/* Menu de ações simplificado */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 hover:bg-slate-800 text-white min-w-[40px] px-0"
                  >
                    <MoreVertical className="w-4 h-4" />
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

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-400 hover:bg-red-500/10 cursor-pointer py-3 border-t border-slate-700 mt-1"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair do Portal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <EvolutionExportPage
            patient={patient}
            checkins={checkins}
            bodyCompositions={bodyCompositions}
            onClose={() => { setShowEvolutionExport(false); setEvolutionExportMode(null); }}
            directExportMode={evolutionExportMode || undefined}
            onDirectExport={handleDirectEvolutionExport}
          />
        </Suspense>
      )}
    </div>
  );
}


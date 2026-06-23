import { useRef, useState, useEffect } from 'react';
import { parseLocalDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { X, FileImage, FileText } from 'lucide-react';
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
  pontuacao_treino?: number;
  pontuacao_cardio?: number;
  pontuacao_agua?: number;
  pontuacao_sono?: number;
  pontuacao_alimentacao?: number;
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

interface EvolutionExportPageProps {
  patient: PatientData;
  checkins: CheckinData[];
  bodyCompositions?: BodyCompositionData[];
  onClose: () => void;
  directExportMode?: 'png' | 'pdf';
  onDirectExport?: (exportRef: HTMLDivElement, format: 'png' | 'pdf') => void;
}

export function EvolutionExportPage({ 
  patient, 
  checkins, 
  bodyCompositions = [],
  onClose,
  directExportMode,
  onDirectExport
}: EvolutionExportPageProps) {
  const { toast } = useToast();
  const exportRef = useRef<HTMLDivElement>(null);
  const exportedRef = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTimeout(() => setReady(true), 500);
  }, []);

  // Se for export direto, executar quando estiver pronto. O guard exportedRef
  // evita disparo duplo: setExporting no pai re-renderiza e passa um novo
  // onDirectExport, o que reativava este effect e baixava 2x.
  useEffect(() => {
    if (ready && directExportMode && onDirectExport && exportRef.current && !exportedRef.current) {
      exportedRef.current = true;
      onDirectExport(exportRef.current, directExportMode);
    }
  }, [ready, directExportMode, onDirectExport]);

  const calcularIdade = (dataNascimento: string | null | undefined): number | null => {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = parseLocalDate(dataNascimento) ?? new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const formatDateFull = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Calcular dados
  const idade = calcularIdade(patient.data_nascimento);
  
  // Peso inicial: usar do paciente ou do primeiro check-in
  const primeiroCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null;
  const pesoInicialPaciente = patient.peso_inicial ? parseFloat(patient.peso_inicial.toString()) : null;
  const pesoInicialCheckin = primeiroCheckin?.peso ? parseFloat(primeiroCheckin.peso.replace(',', '.')) : null;
  const pesoInicial = pesoInicialPaciente || pesoInicialCheckin;
  
  // Peso atual: usar do último check-in
  const ultimoCheckin = checkins[0];
  const pesoAtual = ultimoCheckin?.peso ? parseFloat(ultimoCheckin.peso.replace(',', '.')) : null;
  
  // Variação: calcular se tiver ambos os pesos
  const variacao = pesoInicial && pesoAtual && checkins.length > 1 ? (pesoAtual - pesoInicial) : null;
  const isNegative = variacao !== null && variacao < 0;
  const isNeutral = variacao !== null && Math.abs(variacao) < 0.1;
  const lastBodyComp = bodyCompositions[0];

  // Altura: o banco guarda em CENTÍMETROS (ex.: 180). Normaliza pra metros pros
  // cálculos de IMC/TMB, tolerando o caso raro de já vir em metros (< 3).
  const alturaRaw = patient.altura_inicial ? parseFloat(patient.altura_inicial.toString()) : null;
  const alturaMetros = alturaRaw && alturaRaw > 0 ? (alturaRaw > 3 ? alturaRaw / 100 : alturaRaw) : null;
  const alturaCmDisplay = alturaMetros ? Math.round(alturaMetros * 100) : null;
  const pesoParaCalculo = pesoAtual || pesoInicial;
  
  // Calcular IMC
  const imc = pesoParaCalculo && alturaMetros ? pesoParaCalculo / (alturaMetros * alturaMetros) : null;
  const getIMCClassificacao = (imc: number) => {
    if (imc < 18.5) return { texto: 'Abaixo do peso', cor: 'text-yellow-600' };
    if (imc < 25) return { texto: 'Peso normal', cor: 'text-green-600' };
    if (imc < 30) return { texto: 'Sobrepeso', cor: 'text-orange-600' };
    return { texto: 'Obesidade', cor: 'text-red-600' };
  };
  
  // Percentual de gordura (do paciente ou da última composição corporal)
  const percentualGordura = lastBodyComp?.bodyFat || lastBodyComp?.percentual_gordura || 
    (patient.percentual_gordura_inicial ? parseFloat(patient.percentual_gordura_inicial.toString()) : null);
  
  // Calcular Massa Gorda e Massa Magra
  const massaGorda = pesoParaCalculo && percentualGordura ? (pesoParaCalculo * percentualGordura / 100) : null;
  const massaMagra = pesoParaCalculo && percentualGordura ? (pesoParaCalculo * (100 - percentualGordura) / 100) : null;
  
  // Calcular TMB (Taxa Metabólica Basal) - Fórmula de Mifflin-St Jeor
  const calcularTMB = () => {
    if (!pesoParaCalculo || !alturaMetros || !idade) return null;
    const alturaCm = alturaMetros * 100;
    const sexo = patient.sexo?.toLowerCase();
    
    if (sexo === 'masculino' || sexo === 'm') {
      // Homens: TMB = 10 × peso(kg) + 6.25 × altura(cm) - 5 × idade + 5
      return Math.round(10 * pesoParaCalculo + 6.25 * alturaCm - 5 * idade + 5);
    } else {
      // Mulheres: TMB = 10 × peso(kg) + 6.25 × altura(cm) - 5 × idade - 161
      return Math.round(10 * pesoParaCalculo + 6.25 * alturaCm - 5 * idade - 161);
    }
  };
  const tmb = calcularTMB();

  // Dados de peso para o gráfico
  const weightData: { date: string; peso: number }[] = [];
  if (pesoInicial && patient.created_at) {
    weightData.push({ date: formatDate(patient.created_at), peso: pesoInicial });
  }
  [...checkins].reverse().forEach(c => {
    if (c.peso) {
      weightData.push({ 
        date: formatDate(c.data_checkin), 
        peso: parseFloat(c.peso.replace(',', '.')) 
      });
    }
  });

  // Dados de % gordura para o gráfico
  const bodyFatData = bodyCompositions
    .filter(bc => bc.bodyFat || bc.percentual_gordura)
    .map(bc => ({
      date: formatDate(bc.date || bc.data_avaliacao || ''),
      value: (bc.bodyFat || bc.percentual_gordura) as number
    }))
    .reverse();

  // Dados de pontuações para o gráfico - usando campos reais do check-in
  const scoreData = checkins
    .slice(0, 8)
    .reverse()
    .map(c => {
      // Usar os campos de pontos do check-in (pontos_treinos, pontos_cardios, etc)
      const checkinAny = c as any;
      return {
        date: formatDate(c.data_checkin),
        treino: parseFloat(checkinAny.pontos_treinos || '0') || 0,
        cardio: parseFloat(checkinAny.pontos_cardios || '0') || 0,
        sono: parseFloat(checkinAny.pontos_sono || '0') || 0,
        agua: parseFloat(checkinAny.pontos_agua || '0') || 0,
        stress: parseFloat(checkinAny.pontos_stress || '0') || 0,
        refeicoesLivres: parseFloat(checkinAny.pontos_refeicao_livre || '0') || 0,
        beliscadas: parseFloat(checkinAny.pontos_beliscos || '0') || 0,
      };
    })
    .filter(d => d.treino > 0 || d.cardio > 0 || d.sono > 0 || d.agua > 0 || d.stress > 0 || d.refeicoesLivres > 0 || d.beliscadas > 0);

  const minPeso = weightData.length > 0 ? Math.min(...weightData.map(d => d.peso)) - 2 : 0;
  const maxPeso = weightData.length > 0 ? Math.max(...weightData.map(d => d.peso)) + 2 : 100;
  const rangePeso = maxPeso - minPeso || 1;

  const minFat = bodyFatData.length > 0 ? Math.min(...bodyFatData.map(d => d.value)) - 2 : 0;
  const maxFat = bodyFatData.length > 0 ? Math.max(...bodyFatData.map(d => d.value)) + 2 : 50;
  const rangeFat = maxFat - minFat || 1;

  // Largura "desktop" usada na exportação. No celular o layout é estreito/empilhado;
  // aqui forçamos a largura de web + a avaliação dos breakpoints (windowWidth) pra o
  // PDF/imagem sair no mesmo formato da versão web, independente do aparelho.
  const EXPORT_WIDTH = 1080;
  const captureExport = async (): Promise<HTMLCanvasElement> => {
    const node = exportRef.current as HTMLDivElement;
    const prevWidth = node.style.width;
    const prevMaxWidth = node.style.maxWidth;
    node.style.width = `${EXPORT_WIDTH}px`;
    node.style.maxWidth = `${EXPORT_WIDTH}px`;
    try {
      return await html2canvas(node, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc',
        logging: false,
        width: EXPORT_WIDTH,
        windowWidth: EXPORT_WIDTH,
      });
    } finally {
      node.style.width = prevWidth;
      node.style.maxWidth = prevMaxWidth;
    }
  };

  const exportAsImage = async (format: 'png' | 'jpeg') => {
    if (!exportRef.current) return;

    try {
      setExporting(true);
      toast({
        title: `Gerando ${format.toUpperCase()}...`,
        description: 'Aguarde enquanto criamos sua imagem'
      });

      const canvas = await captureExport();

      const dataURL = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.95 : 1.0);
      
      const link = document.createElement('a');
      link.download = `evolucao-${patient.nome?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.${format}`;
      link.href = dataURL;
      link.click();

      toast({
        title: `${format.toUpperCase()} gerado! 🎉`,
        description: 'Sua evolução foi exportada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar a imagem',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!exportRef.current) return;

    try {
      setExporting(true);
      toast({
        title: 'Gerando PDF...',
        description: 'Aguarde enquanto criamos seu relatório'
      });

      const { jsPDF } = await import('jspdf');

      const canvas = await captureExport();

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = 210;
      const imgHeightMM = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, imgHeightMM]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM);
      pdf.save(`evolucao-${patient.nome?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'PDF gerado! 📄',
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
  };

  // Componente de Card de Métrica (estilo portal - sem gradientes para exportação)
  const MetricCard = ({ 
    title, 
    value, 
    unit, 
    subtitle, 
    bgColor, 
    iconBg, 
    textColor,
    icon 
  }: { 
    title: string; 
    value: string | number; 
    unit?: string; 
    subtitle: string; 
    bgColor: string;
    iconBg: string;
    textColor: string;
    icon: string;
  }) => (
    <div className={`relative overflow-hidden rounded-xl p-4 border border-slate-200 shadow-lg`} style={{ backgroundColor: bgColor }}>
      <div className="relative">
        <div className={`text-xs ${textColor} flex items-center gap-2 font-medium mb-2`}>
          <div className={`p-1.5 rounded-lg ${iconBg}`}>
            <span className="text-sm">{icon}</span>
          </div>
          {title}
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
          {unit && <span className={`text-base ml-1 font-normal ${textColor}`}>{unit}</span>}
        </div>
        <p className={`text-xs mt-0.5 font-medium ${textColor}`}>{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 ${directExportMode ? 'bg-black/95' : 'bg-black/90'} flex items-start justify-center overflow-auto p-4`} style={{ zIndex: 9999 }}>
      {/* Loading overlay para export direto */}
      {directExportMode && (
        <div className="fixed inset-0 flex items-center justify-center z-[10001]">
          <div className="text-center text-white">
            <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
            <p className="text-lg">Gerando {directExportMode.toUpperCase()}...</p>
            <p className="text-sm text-slate-400 mt-2">Aguarde um momento</p>
          </div>
        </div>
      )}
      
      {/* Botões de ação - só mostrar no modo preview */}
      {!directExportMode && (
        <div className="fixed top-4 right-4 flex gap-2" style={{ zIndex: 10000 }}>
        <Button
          onClick={() => exportAsImage('png')}
          disabled={exporting || !ready}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <FileImage className="w-4 h-4 mr-2" />
          PNG
        </Button>
        <Button
          onClick={exportAsPDF}
          disabled={exporting || !ready}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          PDF
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </Button>
        </div>
      )}

      {/* Conteúdo para exportação */}
      <div 
        ref={exportRef}
        className="w-[900px] min-h-screen"
        style={{
          backgroundColor: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
              📊 Meu Acompanhamento
            </h1>
            <p className="text-slate-500 mt-2">Acompanhe seu progresso e conquistas</p>
          </div>

          {/* Card do Paciente */}
          <div className="bg-white backdrop-blur rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl font-bold text-blue-700 border-4 border-blue-500/30">
                {patient.nome?.charAt(0) || 'P'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{patient.nome}</h2>
                <div className="flex gap-4 mt-2 text-slate-600 text-sm">
                  {checkins.length > 0 ? (
                    <>
                      <span className="flex items-center gap-1">✅ {checkins.length} check-ins</span>
                      <span className="flex items-center gap-1">📅 Desde {formatDate(checkins[checkins.length - 1]?.data_checkin)}</span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1">🚀 Início da jornada</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mensagem quando não há check-ins */}
          {checkins.length === 0 && (
            <div className="bg-white backdrop-blur rounded-2xl p-8 border border-slate-200 text-center">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sua jornada está começando!</h3>
              <p className="text-slate-500">
                Complete seu primeiro check-in para começar a acompanhar sua evolução.
              </p>
              {pesoInicial && (
                <p className="text-emerald-600 mt-4">
                  Peso inicial registrado: <strong>{pesoInicial.toFixed(1)} kg</strong>
                </p>
              )}
            </div>
          )}

          {/* Métricas Principais - Grid 6 colunas como no portal */}
          <div className="grid grid-cols-6 gap-3">
            {/* Check-ins - Azul */}
            <MetricCard
              title="Check-ins"
              value={checkins.length}
              subtitle="Total de avaliações"
              bgColor="rgba(37, 99, 235, 0.25)"
              iconBg="bg-blue-500/30"
              textColor="text-blue-700"
              icon="📋"
            />

            {/* Idade - Cyan */}
            {idade && (
              <MetricCard
                title="Idade"
                value={idade}
                unit="anos"
                subtitle="Idade atual"
                bgColor="rgba(6, 182, 212, 0.25)"
                iconBg="bg-cyan-500/30"
                textColor="text-cyan-700"
                icon="🎂"
              />
            )}

            {/* Altura - Violet */}
            {alturaCmDisplay && (
              <MetricCard
                title="Altura"
                value={alturaCmDisplay.toString()}
                unit="cm"
                subtitle="Altura"
                bgColor="rgba(139, 92, 246, 0.25)"
                iconBg="bg-violet-500/30"
                textColor="text-violet-700"
                icon="📏"
              />
            )}

            {/* Peso Inicial - Emerald */}
            {pesoInicial && (
              <MetricCard
                title="Peso Inicial"
                value={pesoInicial.toFixed(1)}
                unit="kg"
                subtitle={pesoInicialPaciente 
                  ? (patient.created_at ? formatDate(patient.created_at) : 'Cadastro') 
                  : (primeiroCheckin?.data_checkin ? formatDate(primeiroCheckin.data_checkin) : '1º Check-in')}
                bgColor="rgba(16, 185, 129, 0.25)"
                iconBg="bg-emerald-500/30"
                textColor="text-emerald-700"
                icon="⚖️"
              />
            )}

            {/* Peso Atual - Indigo (mostrar se tiver check-in ou se for diferente do inicial) */}
            {pesoAtual && (checkins.length > 1 || !pesoInicial) && (
              <MetricCard
                title="Peso Atual"
                value={pesoAtual.toFixed(1)}
                unit="kg"
                subtitle={ultimoCheckin?.data_checkin ? formatDate(ultimoCheckin.data_checkin) : ''}
                bgColor="rgba(99, 102, 241, 0.25)"
                iconBg="bg-indigo-500/30"
                textColor="text-indigo-700"
                icon="🏋️"
              />
            )}

            {/* Variação - Dinâmico */}
            {variacao !== null && (
              <MetricCard
                title="Variação"
                value={`${variacao > 0 ? '+' : ''}${variacao.toFixed(1)}`}
                unit="kg"
                subtitle={isNeutral ? 'Sem variação' : isNegative ? 'Perda de peso' : 'Ganho de peso'}
                bgColor={
                  isNeutral 
                    ? 'rgba(100, 116, 139, 0.25)'
                    : isNegative 
                      ? 'rgba(16, 185, 129, 0.25)'
                      : 'rgba(245, 158, 11, 0.25)'
                }
                iconBg={isNeutral ? 'bg-slate-500/30' : isNegative ? 'bg-emerald-500/30' : 'bg-orange-500/30'}
                textColor={isNeutral ? 'text-slate-700' : isNegative ? 'text-emerald-700' : 'text-orange-700'}
                icon={isNegative ? '📉' : variacao > 0 ? '📈' : '➡️'}
              />
            )}
          </div>

          {/* Composição Corporal Atual - Mostrar sempre que tiver dados calculáveis */}
          {(lastBodyComp || imc || massaGorda || massaMagra || tmb) && (
            <div className="bg-white backdrop-blur rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                🏋️ Composição Corporal Atual
                {lastBodyComp?.date || lastBodyComp?.data_avaliacao ? (
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    Última avaliação: {formatDateFull(lastBodyComp.date || lastBodyComp.data_avaliacao || '')}
                  </span>
                ) : null}
              </h3>
              <div className="grid grid-cols-5 gap-4">
                {/* % Gordura Corporal - PRIMEIRO CARD */}
                {percentualGordura && (
                  <div className="rounded-xl p-4 border border-orange-500/30" style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-orange-500/30">
                        <span>🔥</span>
                      </div>
                      <p className="text-orange-700 text-sm font-medium">% Gordura</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{percentualGordura.toFixed(1)}<span className="text-lg">%</span></p>
                    <p className="text-xs text-orange-600 mt-1">Gordura corporal</p>
                  </div>
                )}
                
                {/* IMC */}
                {imc && (
                  <div className="rounded-xl p-4 border border-blue-500/30" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/30">
                        <span>📊</span>
                      </div>
                      <p className="text-blue-700 text-sm font-medium">IMC</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{imc.toFixed(1)}</p>
                    <p className={`text-xs mt-1 ${getIMCClassificacao(imc).cor}`}>{getIMCClassificacao(imc).texto}</p>
                  </div>
                )}
                
                {/* Massa Gorda */}
                {massaGorda && (
                  <div className="rounded-xl p-4 border border-amber-500/30" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/30">
                        <span>⚖️</span>
                      </div>
                      <p className="text-amber-800 text-sm font-medium">Massa Gorda</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{massaGorda.toFixed(1)}<span className="text-lg">kg</span></p>
                  </div>
                )}
                
                {/* Massa Magra */}
                {massaMagra && (
                  <div className="rounded-xl p-4 border border-green-500/30" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-green-500/30">
                        <span>💪</span>
                      </div>
                      <p className="text-green-700 text-sm font-medium">Massa Magra</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{massaMagra.toFixed(1)}<span className="text-lg">kg</span></p>
                    {percentualGordura && <p className="text-xs text-green-600 mt-1">{(100 - percentualGordura).toFixed(1)}% do peso</p>}
                  </div>
                )}
                
                {/* TMB */}
                {tmb && (
                  <div className="rounded-xl p-4 border border-purple-500/30" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-purple-500/30">
                        <span>⚡</span>
                      </div>
                      <p className="text-purple-700 text-sm font-medium">TMB</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{tmb}<span className="text-lg">kcal</span></p>
                    <p className="text-xs text-purple-600 mt-1">Gasto em repouso/dia</p>
                  </div>
                )}
                
                {/* Gordura Visceral (se tiver da avaliação) */}
                {lastBodyComp && (lastBodyComp.visceralFat || lastBodyComp.gordura_visceral) && (
                  <div className="rounded-xl p-4 border border-red-500/30" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-red-500/30">
                        <span>⚠️</span>
                      </div>
                      <p className="text-red-700 text-sm font-medium">Gordura Visceral</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{lastBodyComp.visceralFat || lastBodyComp.gordura_visceral}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evolução do Peso - Gráfico de Linha SVG (mostrar mesmo com 1 ponto) */}
          {weightData.length >= 1 && (() => {
            // svgWidth casa com a largura real do card no export (EXPORT_WIDTH
            // 1080 − p-8 64 − p-6 48 = 968): viewBox == container ⇒ escala 1.0,
            // o gráfico preenche a largura toda (antes era 800 e sobrava espaço
            // vazio à direita no html2canvas).
            const svgWidth = 968;
            const svgHeight = 200;
            const padding = { top: 30, right: 40, bottom: 40, left: 50 };
            const chartWidth = svgWidth - padding.left - padding.right;
            const chartHeight = svgHeight - padding.top - padding.bottom;
            
            const points = weightData.map((d, i) => {
              // Se só tem 1 ponto, centralizar
              const x = weightData.length === 1 
                ? padding.left + chartWidth / 2 
                : padding.left + (i / (weightData.length - 1)) * chartWidth;
              const y = padding.top + chartHeight - ((d.peso - minPeso) / rangePeso) * chartHeight;
              return { x, y, peso: d.peso, date: d.date, isFirst: i === 0, isLast: i === weightData.length - 1 };
            });
            
            const linePath = weightData.length > 1 
              ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
              : '';
            
            return (
              <div className="bg-white backdrop-blur rounded-2xl p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">📈 Evolução do Peso</h3>
                <p className="text-slate-500 text-sm mb-4">Acompanhamento do peso ao longo do tempo</p>
                
                <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible" style={{ display: 'block', width: `${svgWidth}px`, height: `${svgHeight}px` }}>
                  {/* Linhas de grade horizontais */}
                  {[0, 1, 2, 3, 4].map(i => {
                    const y = padding.top + (i / 4) * chartHeight;
                    const value = maxPeso - (i / 4) * rangePeso;
                    return (
                      <g key={i}>
                        <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                        <text x={padding.left - 8} y={y + 4} fill="#94a3b8" fontSize="11" textAnchor="end">{value.toFixed(0)}</text>
                      </g>
                    );
                  })}
                  
                  {/* Linha do gráfico (só se tiver mais de 1 ponto) */}
                  {linePath && <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                  
                  {/* Pontos e labels */}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r={p.isFirst || p.isLast ? 8 : 5} fill={p.isFirst ? '#10b981' : p.isLast ? '#3b82f6' : '#64748b'} stroke="#fff" strokeWidth="2" />
                      <text x={p.x} y={p.y - 14} fill="#0f172a" fontSize="11" fontWeight="bold" textAnchor="middle">{p.peso.toFixed(1)}</text>
                      <text x={p.x} y={svgHeight - 8} fill="#94a3b8" fontSize="10" textAnchor="middle">{p.date}</text>
                    </g>
                  ))}
                </svg>
                
                <div className="flex justify-center gap-6 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></span> Peso Inicial</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></span> Peso Atual</span>
                </div>
              </div>
            );
          })()}

          {/* Evolução do % de Gordura Corporal - Gráfico de Linha SVG (mostrar mesmo com 1 ponto) */}
          {bodyFatData.length >= 1 && (() => {
            const svgWidth = 968;
            const svgHeight = 180;
            const padding = { top: 30, right: 40, bottom: 40, left: 50 };
            const chartWidth = svgWidth - padding.left - padding.right;
            const chartHeight = svgHeight - padding.top - padding.bottom;
            
            const points = bodyFatData.map((d, i) => {
              // Se só tem 1 ponto, centralizar
              const x = bodyFatData.length === 1 
                ? padding.left + chartWidth / 2 
                : padding.left + (i / (bodyFatData.length - 1)) * chartWidth;
              const y = padding.top + chartHeight - ((d.value - minFat) / rangeFat) * chartHeight;
              return { x, y, value: d.value, date: d.date, isLast: i === bodyFatData.length - 1 };
            });
            
            const linePath = bodyFatData.length > 1 
              ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
              : '';
            
            return (
              <div className="bg-white backdrop-blur rounded-2xl p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">🔥 Evolução do % de Gordura Corporal</h3>
                <p className="text-slate-500 text-sm mb-4">Acompanhamento da composição corporal</p>
                
                <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible" style={{ display: 'block', width: `${svgWidth}px`, height: `${svgHeight}px` }}>
                  {/* Linhas de grade horizontais */}
                  {[0, 1, 2, 3].map(i => {
                    const y = padding.top + (i / 3) * chartHeight;
                    const value = maxFat - (i / 3) * rangeFat;
                    return (
                      <g key={i}>
                        <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                        <text x={padding.left - 8} y={y + 4} fill="#94a3b8" fontSize="11" textAnchor="end">{value.toFixed(0)}%</text>
                      </g>
                    );
                  })}
                  
                  {/* Linha do gráfico (só se tiver mais de 1 ponto) */}
                  {linePath && <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                  
                  {/* Pontos e labels */}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r={p.isLast ? 8 : 5} fill={p.isLast ? '#f59e0b' : '#fb923c'} stroke="#fff" strokeWidth="2" />
                      <text x={p.x} y={p.y - 14} fill="#0f172a" fontSize="11" fontWeight="bold" textAnchor="middle">{p.value.toFixed(1)}%</text>
                      <text x={p.x} y={svgHeight - 8} fill="#94a3b8" fontSize="10" textAnchor="middle">{p.date}</text>
                    </g>
                  ))}
                </svg>
              </div>
            );
          })()}

          {/* Evolução das Pontuações - Gráfico de Linhas SVG */}
          {scoreData.length > 0 && (() => {
            const svgWidth = 968;
            const svgHeight = 220;
            const padding = { top: 30, right: 40, bottom: 40, left: 50 };
            const chartWidth = svgWidth - padding.left - padding.right;
            const chartHeight = svgHeight - padding.top - padding.bottom;
            const maxScore = 10; // Pontuação máxima por categoria
            
            // Definir categorias com cores
            const categories = [
              { key: 'treino', name: 'Treino', color: '#f59e0b' },
              { key: 'cardio', name: 'Cardio', color: '#ef4444' },
              { key: 'sono', name: 'Sono', color: '#8b5cf6' },
              { key: 'agua', name: 'Água', color: '#3b82f6' },
              { key: 'stress', name: 'Stress', color: '#10b981' },
              { key: 'refeicoesLivres', name: 'Ref. Livres', color: '#ec4899' },
              { key: 'beliscadas', name: 'Beliscadas', color: '#f97316' },
            ];
            
            // Calcular pontos para cada categoria
            const getPoints = (key: string) => {
              return scoreData.map((d, i) => {
                const value = (d as any)[key] || 0;
                const x = scoreData.length > 1 
                  ? padding.left + (i / (scoreData.length - 1)) * chartWidth
                  : padding.left + chartWidth / 2;
                const y = padding.top + chartHeight - (value / maxScore) * chartHeight;
                return { x, y, value };
              });
            };
            
            // Filtrar categorias que têm dados
            const activeCategories = categories.filter(cat => 
              scoreData.some(d => ((d as any)[cat.key] || 0) > 0)
            );
            
            return (
              <div className="bg-white backdrop-blur rounded-2xl p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">🏆 Evolução das Pontuações</h3>
                <p className="text-slate-500 text-sm mb-4">Performance em diferentes categorias</p>
                
                <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible" style={{ display: 'block', width: `${svgWidth}px`, height: `${svgHeight}px` }}>
                  {/* Linhas de grade horizontais */}
                  {[0, 2, 4, 6, 8, 10].map((val, i) => {
                    const y = padding.top + chartHeight - (val / maxScore) * chartHeight;
                    return (
                      <g key={i}>
                        <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                        <text x={padding.left - 8} y={y + 4} fill="#94a3b8" fontSize="11" textAnchor="end">{val}</text>
                      </g>
                    );
                  })}
                  
                  {/* Linhas de cada categoria */}
                  {activeCategories.map((cat) => {
                    const points = getPoints(cat.key);
                    if (points.length === 0) return null;
                    // Com 2+ pontos desenha a linha; com 1 ponto mostra só o marcador.
                    const linePath = points.length >= 2
                      ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                      : '';
                    return (
                      <g key={cat.key}>
                        {linePath && <path d={linePath} fill="none" stroke={cat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                        {points.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r={points.length === 1 ? 5 : 4} fill={cat.color} stroke="#ffffff" strokeWidth="1.5" />
                        ))}
                      </g>
                    );
                  })}
                  
                  {/* Labels de data no eixo X */}
                  {scoreData.map((d, i) => {
                    const x = scoreData.length > 1 
                      ? padding.left + (i / (scoreData.length - 1)) * chartWidth
                      : padding.left + chartWidth / 2;
                    return (
                      <text key={i} x={x} y={svgHeight - 8} fill="#94a3b8" fontSize="10" textAnchor="middle">{d.date}</text>
                    );
                  })}
                </svg>
                
                {/* Legenda com todas as cores */}
                <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs text-slate-500">
                  {activeCategories.map(cat => (
                    <span key={cat.key} className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }}></span> {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Footer */}
          <div className="text-center text-slate-500 text-sm py-4 border-t border-slate-200">
            Relatório gerado em {new Date().toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
import { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EvolutionCharts } from '@/components/evolution/EvolutionCharts';
import { PhotoComparison } from '@/components/evolution/PhotoComparison';
import { BodyFatChart } from '@/components/evolution/BodyFatChart';
import { BodyCompositionMetrics } from '@/components/evolution/BodyCompositionMetrics';
import { AIInsights } from '@/components/evolution/AIInsights';
import { EvolutionExporter } from '@/components/evolution/EvolutionExporter';
import { 
  Activity, 
  Calendar,
  TrendingUp,
  Weight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface ExportableEvolutionViewProps {
  patient: Patient;
  checkins: Checkin[];
  bodyCompositions?: any[];
  achievements?: any[];
  refreshTrigger?: number;
  showExportButton?: boolean;
}

export const ExportableEvolutionView = forwardRef<HTMLDivElement, ExportableEvolutionViewProps>(
  ({ patient, checkins, bodyCompositions = [], achievements = [], refreshTrigger, showExportButton = true }, ref) => {
    
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

    const idade = calcularIdade(patient.data_nascimento);

    // Calcular dados de peso
    const weightData = [];
    if ((patient as any)?.peso_inicial) {
      const dataInicial = (patient as any)?.data_fotos_iniciais || patient.created_at;
      weightData.push({
        data: new Date(dataInicial).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        peso: parseFloat((patient as any).peso_inicial.toString())
      });
    }
    checkins.slice().reverse().forEach((c) => {
      if (c.peso) {
        weightData.push({
          data: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          peso: parseFloat(c.peso.replace(',', '.'))
        });
      }
    });

    const weightChange = weightData.length >= 2 
      ? (weightData[weightData.length - 1].peso - weightData[0].peso).toFixed(1)
      : '0.0';
    const isNegative = parseFloat(weightChange) < 0;
    const isNeutral = Math.abs(parseFloat(weightChange)) < 0.1;

    return (
      <div 
        ref={ref}
        className="min-h-screen relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {/* Background decorativo para exportação */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.12),transparent_50%)]" />
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
        </div>
        
        {/* Conteúdo */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          
          {/* Header */}
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
            
            {/* Botão de exportação (oculto na exportação) */}
            {showExportButton && (
              <div className="hide-in-export">
                <EvolutionExporter 
                  containerRef={{ current: ref?.current || null } as React.RefObject<HTMLDivElement>}
                  patientName={patient.nome}
                />
              </div>
            )}
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
                        <span className="text-xs sm:text-sm">{checkins.length}</span>
                        <span className="text-xs sm:text-sm">Total de avaliações</span>
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

          {/* Cards de Métricas Principais */}
          {checkins.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                
                {/* Check-ins */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600/30 via-blue-500/20 to-indigo-600/30 border-0 shadow-lg shadow-blue-500/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent" />
                  <CardHeader className="pb-1 relative">
                    <CardTitle className="text-xs sm:text-sm text-blue-200 flex items-center gap-2 font-medium">
                      <div className="p-1.5 rounded-lg bg-blue-500/30 backdrop-blur-sm">
                        <Activity className="w-3.5 h-3.5 text-blue-300" />
                      </div>
                      Check-ins
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative pt-0">
                    <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{checkins.length}</div>
                    <p className="text-[10px] sm:text-xs text-blue-200/70 mt-0.5">Total de avaliações</p>
                  </CardContent>
                </Card>

                {/* Idade */}
                {idade && (
                  <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-600/30 via-cyan-500/20 to-teal-600/30 border-0 shadow-lg shadow-cyan-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent" />
                    <CardHeader className="pb-1 relative">
                      <CardTitle className="text-xs sm:text-sm text-cyan-200 flex items-center gap-2 font-medium">
                        <div className="p-1.5 rounded-lg bg-cyan-500/30 backdrop-blur-sm">
                          <Calendar className="w-3.5 h-3.5 text-cyan-300" />
                        </div>
                        Idade
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                      <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {idade}
                        <span className="text-base sm:text-lg ml-1 font-normal text-cyan-200/80">anos</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-cyan-200/70 mt-0.5">Idade atual</p>
                    </CardContent>
                  </Card>
                )}

                {/* Peso Inicial */}
                {weightData.length > 0 && (
                  <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600/30 via-green-500/20 to-teal-600/30 border-0 shadow-lg shadow-emerald-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent" />
                    <CardHeader className="pb-1 relative">
                      <CardTitle className="text-xs sm:text-sm text-emerald-200 flex items-center gap-2 font-medium">
                        <div className="p-1.5 rounded-lg bg-emerald-500/30 backdrop-blur-sm">
                          <Weight className="w-3.5 h-3.5 text-emerald-300" />
                        </div>
                        Peso Inicial
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                      <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {weightData[0]?.peso?.toFixed(1)}
                        <span className="text-base sm:text-lg ml-1 font-normal text-emerald-200/80">kg</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-emerald-200/70 mt-0.5">
                        {weightData[0]?.data}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Peso Atual */}
                {checkins[0]?.peso && (
                  <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600/30 via-blue-500/20 to-violet-600/30 border-0 shadow-lg shadow-indigo-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-transparent" />
                    <CardHeader className="pb-1 relative">
                      <CardTitle className="text-xs sm:text-sm text-indigo-200 flex items-center gap-2 font-medium">
                        <div className="p-1.5 rounded-lg bg-indigo-500/30 backdrop-blur-sm">
                          <Weight className="w-3.5 h-3.5 text-indigo-300" />
                        </div>
                        Peso Atual
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                      <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {parseFloat(checkins[0].peso.replace(',', '.')).toFixed(1)}
                        <span className="text-base sm:text-lg ml-1 font-normal text-indigo-200/80">kg</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-indigo-200/70 mt-0.5">
                        {new Date(checkins[0].data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Variação */}
                {weightData.length >= 2 && (
                  <Card className={`relative overflow-hidden border-0 shadow-lg ${
                    isNeutral 
                      ? 'bg-gradient-to-br from-slate-600/30 via-slate-500/20 to-gray-600/30 shadow-slate-500/10' 
                      : isNegative 
                        ? 'bg-gradient-to-br from-emerald-600/30 via-green-500/20 to-teal-600/30 shadow-emerald-500/10' 
                        : 'bg-gradient-to-br from-amber-600/30 via-orange-500/20 to-red-600/30 shadow-orange-500/10'
                  }`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${isNeutral ? 'from-slate-400/10' : isNegative ? 'from-emerald-400/10' : 'from-orange-400/10'} to-transparent`} />
                    <CardHeader className="pb-1 relative">
                      <CardTitle className={`text-xs sm:text-sm flex items-center gap-2 font-medium ${isNeutral ? 'text-slate-200' : isNegative ? 'text-emerald-200' : 'text-orange-200'}`}>
                        <div className={`p-1.5 rounded-lg backdrop-blur-sm ${isNeutral ? 'bg-slate-500/30' : isNegative ? 'bg-emerald-500/30' : 'bg-orange-500/30'}`}>
                          <TrendingUp className={`w-3.5 h-3.5 ${isNeutral ? 'text-slate-300' : isNegative ? 'text-emerald-300' : 'text-orange-300'}`} />
                        </div>
                        Variação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                      <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange}
                        <span className={`text-base sm:text-lg ml-1 font-normal ${isNeutral ? 'text-slate-200/80' : isNegative ? 'text-emerald-200/80' : 'text-orange-200/80'}`}>kg</span>
                      </div>
                      <p className={`text-[10px] sm:text-xs mt-0.5 ${isNeutral ? 'text-slate-200/70' : isNegative ? 'text-emerald-200/70' : 'text-orange-200/70'}`}>
                        {isNeutral ? 'Sem mudança significativa' : isNegative ? 'Perda de peso' : 'Ganho de peso'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          )}

          {/* Composição Corporal */}
          {bodyCompositions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <BodyCompositionMetrics data={bodyCompositions} />
            </motion.div>
          )}

          {/* Gráfico de Evolução do Peso */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <EvolutionCharts 
              checkins={checkins} 
              patient={patient}
              refreshTrigger={refreshTrigger}
            />
          </motion.div>

          {/* Gráfico de % Gordura */}
          {bodyCompositions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <BodyFatChart data={bodyCompositions} />
            </motion.div>
          )}

          {/* Análise com IA */}
          {checkins.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <AIInsights checkins={checkins} />
            </motion.div>
          )}

          {/* Footer com data de geração */}
          <div className="text-center text-xs text-slate-400 py-4 border-t border-slate-700/50">
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
    );
  }
);

ExportableEvolutionView.displayName = 'ExportableEvolutionView';
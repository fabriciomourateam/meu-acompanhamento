import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { checkinService } from '@/lib/checkin-service';
import { supabase } from '@/integrations/supabase/client';
import { EvolutionCharts } from '@/components/evolution/EvolutionCharts';
import { PhotoComparison } from '@/components/evolution/PhotoComparison';
import { Timeline } from '@/components/evolution/Timeline';
import { BodyFatChart } from '@/components/evolution/BodyFatChart';
import { BodyCompositionMetrics } from '@/components/evolution/BodyCompositionMetrics';
import { AIInsights } from '@/components/evolution/AIInsights';
import { DailyWeightsList } from '@/components/evolution/DailyWeightsList';
import { detectAchievements } from '@/lib/achievement-system';
import { 
  Activity, 
  Calendar,
  TrendingUp,
  Weight,
  Flame,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface PatientEvolutionTabProps {
  patientId: string;
  checkins?: Checkin[];
  patient?: Patient | null;
  bodyCompositions?: any[];
  achievements?: any[];
  refreshTrigger?: number; // Trigger para forçar atualização dos gráficos
}

export function PatientEvolutionTab({ 
  patientId, 
  checkins: propsCheckins,
  patient: propsPatient,
  bodyCompositions: propsBodyCompositions,
  achievements: propsAchievements,
  refreshTrigger
}: PatientEvolutionTabProps) {
  const { toast } = useToast();
  const [checkins, setCheckins] = useState<Checkin[]>(propsCheckins || []);
  const [patient, setPatient] = useState<Patient | null>(propsPatient || null);
  const [bodyCompositions, setBodyCompositions] = useState<any[]>(propsBodyCompositions || []);
  const [loading, setLoading] = useState(!propsCheckins);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  
  // Ref para exportação
  const evolutionContainerRef = useRef<HTMLDivElement>(null);

  // Calcular dados
  const achievements = propsAchievements || (checkins.length > 0 ? detectAchievements(checkins, bodyCompositions) : []);

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
    // Se os dados foram passados como props, usar eles
    if (propsCheckins) {
      setCheckins(propsCheckins);
      setLoading(false);
    }
    if (propsPatient) {
      setPatient(propsPatient);
    }
    if (propsBodyCompositions) {
      setBodyCompositions(propsBodyCompositions);
    }
    
    // Se não foram passados, buscar
    if (!propsCheckins && patientId) {
      loadPortalData();
    }
  }, [patientId, propsCheckins, propsPatient, propsBodyCompositions]);

  async function loadPortalData() {
    try {
      setLoading(true);

      // Buscar dados do paciente pelo ID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError || !patientData) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do paciente',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      setPatient(patientData);

      // Buscar check-ins e composição corporal em paralelo (se houver telefone)
      if (patientData.telefone) {
        const checkinsData = await checkinService.getByPhone(patientData.telefone);
        setCheckins(checkinsData);

        // Processar composição corporal em paralelo (não bloqueia)
        if (checkinsData.length > 0) {
          const bodyComps = checkinsData
            .filter(c => c.bioimpedancia && typeof c.bioimpedancia === 'object')
            .map(c => ({
              date: c.data_checkin,
              bodyFat: (c.bioimpedancia as any)?.percentual_gordura || null,
              muscleMass: (c.bioimpedancia as any)?.massa_muscular || null,
              visceralFat: (c.bioimpedancia as any)?.gordura_visceral || null,
            }))
            .filter(bc => bc.bodyFat !== null);

          setBodyCompositions(bodyComps);
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados do portal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do portal',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="bg-white">
        <CardContent className="p-8 text-center">
          <p className="text-[#777777]">Não foi possível carregar os dados do paciente</p>
        </CardContent>
      </Card>
    );
  }

  const idade = calcularIdade(patient.data_nascimento);
  const primeiroCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null;
  const ultimoCheckin = checkins.length > 0 ? checkins[0] : null;

  // Calcular dados de peso
  const weightData = [];
  if (patient?.peso_inicial) {
    const dataInicial = (patient as any)?.data_fotos_iniciais || patient.created_at;
    weightData.push({
      data: new Date(dataInicial).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      peso: parseFloat(patient.peso_inicial.toString())
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
    <div ref={evolutionContainerRef} className="space-y-6">
      {/* Cards de Resumo */}
      {checkins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Check-ins Realizados */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600/30 via-blue-500/20 to-indigo-600/30 border-0 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.02] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent" />
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-400/20 rounded-full blur-2xl" />
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
            {patient?.data_nascimento && (
              <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-600/30 via-cyan-500/20 to-teal-600/30 border-0 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent" />
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-cyan-400/20 rounded-full blur-2xl" />
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

            {/* Altura */}
            {(patient as any)?.altura_inicial && (
              <Card className="relative overflow-hidden bg-gradient-to-br from-violet-600/30 via-purple-500/20 to-fuchsia-600/30 border-0 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent" />
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple-400/20 rounded-full blur-2xl" />
                <CardHeader className="pb-1 relative">
                  <CardTitle className="text-xs sm:text-sm text-purple-200 flex items-center gap-2 font-medium">
                    <div className="p-1.5 rounded-lg bg-purple-500/30 backdrop-blur-sm">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-300" />
                    </div>
                    Altura
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {(patient as any).altura_inicial}
                    <span className="text-base sm:text-lg ml-1 font-normal text-purple-200/80">m</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-purple-200/70 mt-0.5">Altura</p>
                </CardContent>
              </Card>
            )}

            {/* Peso Inicial */}
            {weightData.length > 0 && (
              <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600/30 via-green-500/20 to-teal-600/30 border-0 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent" />
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-400/20 rounded-full blur-2xl" />
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
                    {weightData[0]?.peso?.toFixed(1) || 'N/A'}
                    {weightData[0]?.peso && <span className="text-base sm:text-lg ml-1 font-normal text-emerald-200/80">kg</span>}
                  </div>
                  <p className="text-[10px] sm:text-xs text-emerald-200/70 mt-0.5">
                    {weightData[0]?.data}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Peso Atual */}
            {checkins[0]?.peso && (
              <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600/30 via-blue-500/20 to-violet-600/30 border-0 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-transparent" />
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-400/20 rounded-full blur-2xl" />
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
              <Card className={`relative overflow-hidden border-0 shadow-lg hover:scale-[1.02] transition-all duration-300 ${
                isNeutral 
                  ? 'bg-gradient-to-br from-slate-600/30 via-slate-500/20 to-gray-600/30 shadow-slate-500/10 hover:shadow-slate-500/20' 
                  : isNegative 
                    ? 'bg-gradient-to-br from-emerald-600/30 via-green-500/20 to-teal-600/30 shadow-emerald-500/10 hover:shadow-emerald-500/20' 
                    : 'bg-gradient-to-br from-amber-600/30 via-orange-500/20 to-red-600/30 shadow-orange-500/10 hover:shadow-orange-500/20'
              }`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${isNeutral ? 'from-slate-400/10' : isNegative ? 'from-emerald-400/10' : 'from-orange-400/10'} to-transparent`} />
                <div className={`absolute -top-4 -right-4 w-20 h-20 ${isNeutral ? 'bg-slate-400/20' : isNegative ? 'bg-emerald-400/20' : 'bg-orange-400/20'} rounded-full blur-2xl`} />
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
                    {isNeutral ? 'Sem variação' : isNegative ? 'Perda de peso' : 'Ganho de peso'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}

      {/* 1. Análise Inteligente com IA (minimizado) */}
      {checkins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <AIInsights checkins={checkins} />
        </motion.div>
      )}

      {/* 2. Métricas de Composição Corporal */}
      {bodyCompositions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <BodyCompositionMetrics data={bodyCompositions} />
        </motion.div>
      )}

      {/* 3. Gráfico de % Gordura */}
      {bodyCompositions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <BodyFatChart data={bodyCompositions} />
        </motion.div>
      )}

      {/* 4. Gráficos de Evolução (Peso, Pontuações, Performance) */}
      {(checkins.length > 0 || patient) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <EvolutionCharts 
            checkins={checkins} 
            patient={patient}
            refreshTrigger={refreshTrigger || localRefreshTrigger}
          />
        </motion.div>
      )}

      {/* 5. Timeline */}
      {checkins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Timeline checkins={checkins} showEditButton={false} />
        </motion.div>
      )}

      {/* 6. Lista de Pesos Diários Registrados */}
      {patient?.telefone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <DailyWeightsList
            telefone={patient.telefone}
            onUpdate={() => {
              // Recarregar dados quando um peso for deletado
              loadPortalData();
              // Forçar atualização local dos gráficos
              setLocalRefreshTrigger(prev => prev + 1);
            }}
          />
        </motion.div>
      )}

      {/* 7. Aviso se houver poucos check-ins */}
      {checkins.length < 3 && checkins.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-900 font-semibold">Continue Firme!</p>
                <p className="text-amber-800 text-sm mt-1">
                  Você possui {checkins.length} check-in{checkins.length > 1 ? 's' : ''}. Continue registrando para ver análises mais detalhadas!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparação de Fotos */}
      {checkins.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PhotoComparison checkins={checkins} />
        </motion.div>
      )}

      {/* Mensagem quando não há dados - só mostrar se não houver check-ins E não houver paciente */}
      {checkins.length === 0 && !patient && (
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-8 text-center">
            <Activity className="w-12 h-12 text-[#00C98A] mx-auto mb-4 opacity-50" />
            <p className="text-[#777777] text-lg font-medium mb-2">
              Ainda não há check-ins registrados
            </p>
            <p className="text-sm text-[#777777]">
              Os dados de evolução aparecerão aqui quando houver check-ins registrados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


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
  isPatientView?: boolean;
}

export function PatientEvolutionTab({
  patientId,
  checkins: propsCheckins,
  patient: propsPatient,
  bodyCompositions: propsBodyCompositions,
  achievements: propsAchievements,
  refreshTrigger,
  isPatientView
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
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-slate-500">Não foi possível carregar os dados do paciente</p>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Check-ins Realizados */}
            {!isPatientView && (
              <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:scale-[1.02] hover:shadow-md transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-1 relative">
                  <CardTitle className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 font-medium">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Activity className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    Check-ins
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{checkins.length}</div>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Total de avaliações</p>
                </CardContent>
              </Card>
            )}

            {/* Idade */}
            {patient?.data_nascimento && (
              <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:scale-[1.02] hover:border-cyan-300 hover:shadow-md transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="pb-1 relative">
                  <CardTitle className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 font-medium">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    Idade
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {idade}
                    <span className="text-base sm:text-lg ml-1 font-normal text-slate-500">anos</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Idade atual</p>
                </CardContent>
              </Card>
            )}

            {/* Altura */}
            {(patient as any)?.altura_inicial && (
              <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:scale-[1.02] hover:border-purple-300 hover:shadow-md transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="pb-1 relative">
                  <CardTitle className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 font-medium">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    Altura
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {(patient as any).altura_inicial}
                    <span className="text-base sm:text-lg ml-1 font-normal text-slate-500">m</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Altura</p>
                </CardContent>
              </Card>
            )}

            {/* Peso Inicial */}
            {weightData.length > 0 && (
              <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:scale-[1.02] hover:border-indigo-300 hover:shadow-md transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="pb-1 relative">
                  <CardTitle className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 font-medium">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                      <Weight className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    Peso Inicial
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {weightData[0]?.peso?.toFixed(1) || 'N/A'}
                    {weightData[0]?.peso && <span className="text-base sm:text-lg ml-1 font-normal text-slate-500">kg</span>}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                    {weightData[0]?.data}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Peso Atual */}
            {checkins[0]?.peso && (
              <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:scale-[1.02] hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="pb-1 relative">
                  <CardTitle className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 font-medium">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                      <Weight className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    Peso Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {parseFloat(checkins[0].peso.replace(',', '.')).toFixed(1)}
                    <span className="text-base sm:text-lg ml-1 font-normal text-slate-500">kg</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                    {new Date(checkins[0].data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Variação */}
            {weightData.length >= 2 && (
              <Card className={`relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:scale-[1.02] hover:shadow-md transition-all duration-300 group ${isNeutral ? 'hover:border-slate-300' :
                isNegative ? 'hover:border-emerald-300' :
                  'hover:border-rose-300'
                }`}>
                <div className={`absolute inset-0 bg-gradient-to-br pointer-events-none ${isNeutral ? 'from-slate-500/5' : isNegative ? 'from-emerald-500/5' : 'from-rose-500/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                <CardHeader className="pb-1 relative">
                  <CardTitle className={`text-xs sm:text-sm flex items-center gap-2 font-medium text-slate-600`}>
                    <div className={`p-1.5 rounded-lg border backdrop-blur-sm transition-colors ${isNeutral ? 'bg-slate-500/10 border-slate-500/20 group-hover:bg-slate-500/20' :
                      isNegative ? 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20' :
                        'bg-rose-500/10 border-rose-500/20 group-hover:bg-rose-500/20'
                      }`}>
                      <TrendingUp className={`w-3.5 h-3.5 ${isNeutral ? 'text-slate-400' : isNegative ? 'text-emerald-400' : 'text-rose-400'}`} />
                    </div>
                    Variação
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange}
                    <span className={`text-base sm:text-lg ml-1 font-normal text-slate-500`}>kg</span>
                  </div>
                  <p className={`text-[10px] sm:text-xs mt-0.5 ${isNeutral ? 'text-slate-500' : isNegative ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                    {isNeutral ? 'Sem variação' : isNegative ? 'Perda de peso' : 'Ganho de peso'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
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
            isPatientView={isPatientView}
          />
        </motion.div>
      )}

      {/* Comparação de Fotos */}
      {checkins.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <PhotoComparison checkins={checkins} patient={patient} isPatientView={isPatientView} />
        </motion.div>
      )}

      {/* Mensagem quando não há dados - mostrar se não houver check-ins */}
      {checkins.length === 0 && (
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <Activity className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-900 text-base font-semibold mb-1">
              Ainda não há check-ins registrados
            </p>
            <p className="text-xs text-slate-500">
              Os dados de evolução aparecerão aqui quando houver check-ins registrados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


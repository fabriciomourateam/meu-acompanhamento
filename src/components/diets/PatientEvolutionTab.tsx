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
import { BodyCompositionFigure } from '@/components/evolution/BodyCompositionFigure';
import { MeasurementsChart } from '@/components/evolution/MeasurementsChart';
import { AIInsights } from '@/components/evolution/AIInsights';
import { DailyWeightsList } from '@/components/evolution/DailyWeightsList';
import { detectAchievements } from '@/lib/achievement-system';
import { parseLocalISODate } from '@/lib/utils';
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

type StatTone = 'blue' | 'cyan' | 'purple' | 'indigo' | 'sky' | 'emerald' | 'rose' | 'slate';

const STAT_TONES: Record<StatTone, { card: string; iconBox: string; value: string; subtitle: string; accentBar: string }> = {
  blue: {
    card: 'from-blue-50/80 via-white to-sky-50/30 border-blue-100/80 hover:border-blue-200 hover:shadow-blue-200/50',
    iconBox: 'bg-gradient-to-br from-blue-500 to-sky-500 shadow-lg shadow-blue-500/30',
    value: 'text-blue-700',
    subtitle: 'text-blue-700/70',
    accentBar: 'from-blue-400 to-sky-400',
  },
  cyan: {
    card: 'from-cyan-50/80 via-white to-teal-50/30 border-cyan-100/80 hover:border-cyan-200 hover:shadow-cyan-200/50',
    iconBox: 'bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30',
    value: 'text-cyan-700',
    subtitle: 'text-cyan-700/70',
    accentBar: 'from-cyan-400 to-teal-400',
  },
  purple: {
    card: 'from-purple-50/80 via-white to-violet-50/30 border-purple-100/80 hover:border-purple-200 hover:shadow-purple-200/50',
    iconBox: 'bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/30',
    value: 'text-purple-700',
    subtitle: 'text-purple-700/70',
    accentBar: 'from-purple-400 to-violet-400',
  },
  indigo: {
    card: 'from-indigo-50/80 via-white to-blue-50/30 border-indigo-100/80 hover:border-indigo-200 hover:shadow-indigo-200/50',
    iconBox: 'bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/30',
    value: 'text-indigo-700',
    subtitle: 'text-indigo-700/70',
    accentBar: 'from-indigo-400 to-blue-400',
  },
  sky: {
    card: 'from-sky-50/80 via-white to-blue-50/30 border-sky-100/80 hover:border-sky-200 hover:shadow-sky-200/50',
    iconBox: 'bg-gradient-to-br from-sky-500 to-blue-500 shadow-lg shadow-sky-500/30',
    value: 'text-sky-700',
    subtitle: 'text-sky-700/70',
    accentBar: 'from-sky-400 to-blue-400',
  },
  emerald: {
    card: 'from-emerald-50/80 via-white to-teal-50/30 border-emerald-100/80 hover:border-emerald-200 hover:shadow-emerald-200/50',
    iconBox: 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30',
    value: 'text-emerald-700',
    subtitle: 'text-emerald-700/70',
    accentBar: 'from-emerald-400 to-teal-400',
  },
  rose: {
    card: 'from-rose-50/80 via-white to-red-50/30 border-rose-100/80 hover:border-rose-200 hover:shadow-rose-200/50',
    iconBox: 'bg-gradient-to-br from-rose-500 to-red-500 shadow-lg shadow-rose-500/30',
    value: 'text-rose-700',
    subtitle: 'text-rose-700/70',
    accentBar: 'from-rose-400 to-red-400',
  },
  slate: {
    card: 'from-slate-50/80 via-white to-slate-50/30 border-slate-200/80 hover:border-slate-300 hover:shadow-slate-200/50',
    iconBox: 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg shadow-slate-500/30',
    value: 'text-slate-700',
    subtitle: 'text-slate-500',
    accentBar: 'from-slate-300 to-slate-400',
  },
};

// Gradiente do número principal por tom
const VALUE_GRADIENT: Record<StatTone, string> = {
  blue: 'from-blue-600 to-cyan-400',
  cyan: 'from-cyan-600 to-emerald-400',
  purple: 'from-purple-600 to-fuchsia-400',
  indigo: 'from-indigo-600 to-sky-400',
  sky: 'from-sky-600 to-cyan-400',
  emerald: 'from-emerald-600 to-teal-400',
  rose: 'from-rose-600 to-orange-400',
  slate: 'from-slate-700 to-slate-400',
};

interface PremiumStatCardProps {
  tone: StatTone;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: React.ReactNode;
  subtitle?: React.ReactNode;
}

function PremiumStatCard({ tone, icon, label, value, unit, subtitle }: PremiumStatCardProps) {
  const t = STAT_TONES[tone];
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${t.card} p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 group`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.accentBar}`} />
      <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-white ${t.iconBox} group-hover:scale-110 transition-transform duration-300 mb-3 sm:mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-none bg-gradient-to-r ${VALUE_GRADIENT[tone]} bg-clip-text text-transparent`}>
        {value}
        {unit && <span className="text-base sm:text-lg font-normal text-slate-400 ml-1">{unit}</span>}
      </p>
      {subtitle && (
        <p className={`text-[11px] mt-1.5 leading-snug line-clamp-2 ${t.subtitle}`}>{subtitle}</p>
      )}
    </div>
  );
}

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
        data: parseLocalISODate(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        peso: parseFloat(c.peso.replace(',', '.'))
      });
    }
  });

  const weightChange = weightData.length >= 2
    ? (weightData[weightData.length - 1].peso - weightData[0].peso).toFixed(1)
    : '0.0';
  const isNegative = parseFloat(weightChange) < 0;
  const isNeutral = Math.abs(parseFloat(weightChange)) < 0.1;

  // Tem mapa regional (boneco)? Define o layout lado-a-lado com o gráfico de % gordura.
  const hasRegional = (bodyCompositions || []).some(
    (d: any) => d?.distribuicao_regional && typeof d.distribuicao_regional === 'object',
  );

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
              <PremiumStatCard
                tone="blue"
                icon={<Activity className="w-5 h-5" />}
                label="Check-ins"
                value={checkins.length}
                subtitle="Total de avaliações"
              />
            )}

            {/* Idade */}
            {patient?.data_nascimento && (
              <PremiumStatCard
                tone="cyan"
                icon={<Calendar className="w-5 h-5" />}
                label="Idade"
                value={idade}
                unit="anos"
                subtitle="Idade atual"
              />
            )}

            {/* Altura */}
            {(patient as any)?.altura_inicial && (
              <PremiumStatCard
                tone="purple"
                icon={<TrendingUp className="w-5 h-5" />}
                label="Altura"
                value={(patient as any).altura_inicial}
                unit="m"
                subtitle="Altura registrada"
              />
            )}

            {/* Peso Inicial */}
            {weightData.length > 0 && (
              <PremiumStatCard
                tone="indigo"
                icon={<Weight className="w-5 h-5" />}
                label="Peso Inicial"
                value={weightData[0]?.peso?.toFixed(1) || 'N/A'}
                unit={weightData[0]?.peso ? 'kg' : undefined}
                subtitle={weightData[0]?.data}
              />
            )}

            {/* Peso Atual */}
            {checkins[0]?.peso && (
              <PremiumStatCard
                tone="sky"
                icon={<Weight className="w-5 h-5" />}
                label="Peso Atual"
                value={parseFloat(checkins[0].peso.replace(',', '.')).toFixed(1)}
                unit="kg"
                subtitle={parseLocalISODate(checkins[0].data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              />
            )}

            {/* Variação */}
            {weightData.length >= 2 && (
              <PremiumStatCard
                tone={isNeutral ? 'slate' : isNegative ? 'emerald' : 'rose'}
                icon={<TrendingUp className="w-5 h-5" />}
                label="Variação"
                value={
                  <>
                    {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange}
                  </>
                }
                unit="kg"
                subtitle={isNeutral ? 'Sem variação' : isNegative ? 'Perda de peso' : 'Ganho de peso'}
              />
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

      {/* 3. % Gordura + Mapa corporal (boneco) lado a lado no PC */}
      {bodyCompositions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={hasRegional ? 'grid items-stretch gap-4 lg:grid-cols-2' : ''}
        >
          <BodyFatChart data={bodyCompositions} />
          {hasRegional && <BodyCompositionFigure data={bodyCompositions} />}
        </motion.div>
      )}

      {/* 4. Evolução das medidas (cintura/quadril) — acima das pontuações */}
      {checkins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.23 }}
        >
          <MeasurementsChart checkins={checkins} />
        </motion.div>
      )}

      {/* 5. Gráficos de Evolução (Peso, Pontuações, Performance) */}
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

      {/* Comparação de Fotos — também aparece quando só há fotos baseline,
          mesmo sem check-ins ainda (caso comum de paciente recém-cadastrado). */}
      {(checkins.length >= 2 || !!(patient as any)?.foto_inicial_frente || !!(patient as any)?.foto_inicial_lado || !!(patient as any)?.foto_inicial_lado_2 || !!(patient as any)?.foto_inicial_costas) && (
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


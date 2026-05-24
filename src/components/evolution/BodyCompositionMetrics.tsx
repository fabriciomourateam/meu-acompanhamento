import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Flame, TrendingDown, Scale } from 'lucide-react';
import { classificarIMC } from '@/lib/body-calculations';

interface BodyComposition {
  data_avaliacao: string;
  percentual_gordura: number;
  peso: number;
  massa_gorda: number;
  massa_magra: number;
  imc: number;
  tmb: number;
  classificacao: string;
}

interface BodyCompositionMetricsProps {
  data: BodyComposition[];
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  // Cor base que tinge o fundo, a borda e o ícone
  tone: "fuchsia" | "blue" | "rose" | "emerald" | "purple" | "amber";
}

const TONE_STYLES: Record<MetricCardProps["tone"], {
  card: string;
  iconBox: string;
  icon: string;
  valueAccent: string;
  subtitle: string;
}> = {
  fuchsia: {
    card: "bg-gradient-to-br from-fuchsia-100 via-pink-50 to-white border-fuchsia-200 hover:border-fuchsia-400 hover:shadow-fuchsia-200/60",
    iconBox: "bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white",
    icon: "text-fuchsia-600",
    valueAccent: "text-fuchsia-700",
    subtitle: "text-fuchsia-600/80",
  },
  blue: {
    card: "bg-gradient-to-br from-blue-100 via-sky-50 to-white border-blue-200 hover:border-blue-400 hover:shadow-blue-200/60",
    iconBox: "bg-gradient-to-br from-blue-500 to-sky-500 text-white",
    icon: "text-blue-600",
    valueAccent: "text-blue-700",
    subtitle: "text-blue-600/80",
  },
  rose: {
    card: "bg-gradient-to-br from-rose-100 via-red-50 to-white border-rose-200 hover:border-rose-400 hover:shadow-rose-200/60",
    iconBox: "bg-gradient-to-br from-rose-500 to-red-500 text-white",
    icon: "text-rose-600",
    valueAccent: "text-rose-700",
    subtitle: "text-rose-600/80",
  },
  emerald: {
    card: "bg-gradient-to-br from-emerald-100 via-teal-50 to-white border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-200/60",
    iconBox: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
    icon: "text-emerald-600",
    valueAccent: "text-emerald-700",
    subtitle: "text-emerald-600/80",
  },
  purple: {
    card: "bg-gradient-to-br from-purple-100 via-violet-50 to-white border-purple-200 hover:border-purple-400 hover:shadow-purple-200/60",
    iconBox: "bg-gradient-to-br from-purple-500 to-violet-500 text-white",
    icon: "text-purple-600",
    valueAccent: "text-purple-700",
    subtitle: "text-purple-600/80",
  },
  amber: {
    card: "bg-gradient-to-br from-amber-100 via-orange-50 to-white border-amber-200 hover:border-amber-400 hover:shadow-amber-200/60",
    iconBox: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
    icon: "text-amber-600",
    valueAccent: "text-amber-700",
    subtitle: "text-amber-600/80",
  },
};

function MetricCard({ icon, label, value, subtitle, badge, tone }: MetricCardProps) {
  const t = TONE_STYLES[tone];
  return (
    <div className={`p-3 sm:p-4 rounded-2xl border-2 ${t.card} hover:shadow-lg transition-all duration-300 group`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl ${t.iconBox} shadow-sm group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {badge}
      </div>
      <p className={`text-2xl font-extrabold ${t.valueAccent} tracking-tight`}>{value}</p>
      <p className="text-xs font-semibold text-slate-700 mt-1">{label}</p>
      {subtitle && (
        <p className={`text-[10px] mt-0.5 truncate ${t.subtitle}`}>{subtitle}</p>
      )}
    </div>
  );
}

export function BodyCompositionMetrics({ data }: BodyCompositionMetricsProps) {
  if (data.length === 0) return null;

  const ultima = data[0];
  const primeira = data[data.length - 1];

  const diferencas = {
    gordura: (ultima.percentual_gordura - primeira.percentual_gordura).toFixed(1),
    peso: (ultima.peso - primeira.peso).toFixed(1),
    massaGorda: (ultima.massa_gorda - primeira.massa_gorda).toFixed(1),
    massaMagra: (ultima.massa_magra - primeira.massa_magra).toFixed(1),
    imc: (ultima.imc - primeira.imc).toFixed(1),
    tmb: (ultima.tmb - primeira.tmb).toFixed(0)
  };

  const recomposicaoPositiva = parseFloat(diferencas.gordura) < 0 && parseFloat(diferencas.massaMagra) > 0;
  const perdaMassaMagra = parseFloat(diferencas.gordura) < 0 && parseFloat(diferencas.massaMagra) < 0;
  const aumentoGordura = parseFloat(diferencas.gordura) > 0;

  // Badges de delta: verde quando bom, rosé quando ruim, neutro pra peso/imc/tmb
  const goodBadge = "bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] px-1.5 py-0";
  const badBadge = "bg-rose-100 text-rose-700 border border-rose-300 text-[10px] px-1.5 py-0";
  const neutralBadge = "bg-slate-100 text-slate-700 border border-slate-300 text-[10px] px-1.5 py-0";

  return (
    <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-slate-900 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
            <Activity className="w-4 h-4" />
          </div>
          Composição Corporal Atual
        </CardTitle>
        <CardDescription className="text-slate-500">
          Última avaliação: {new Date(ultima.data_avaliacao).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* % Gordura */}
          <MetricCard
            tone="fuchsia"
            icon={<TrendingDown className="w-4 h-4" />}
            label="% Gordura"
            value={`${ultima.percentual_gordura}%`}
            subtitle={ultima.classificacao}
            badge={data.length > 1 && (
              <Badge className={parseFloat(diferencas.gordura) < 0 ? goodBadge : badBadge}>
                {parseFloat(diferencas.gordura) < 0 ? '↓' : '↑'} {Math.abs(parseFloat(diferencas.gordura))}%
              </Badge>
            )}
          />

          {/* Peso */}
          <MetricCard
            tone="blue"
            icon={<Scale className="w-4 h-4" />}
            label="Peso Total"
            value={
              <>
                {ultima.peso}
                <span className="text-sm font-normal text-slate-500 ml-1">kg</span>
              </>
            }
            badge={data.length > 1 && (
              <Badge className={neutralBadge}>
                {parseFloat(diferencas.peso) > 0 ? '+' : ''}{diferencas.peso} kg
              </Badge>
            )}
          />

          {/* Massa Gorda */}
          <MetricCard
            tone="rose"
            icon={<div className="w-4 h-4 bg-white rounded-full" />}
            label="Massa Gorda"
            value={
              <>
                {ultima.massa_gorda}
                <span className="text-sm font-normal text-slate-500 ml-1">kg</span>
              </>
            }
            badge={data.length > 1 && (
              <Badge className={parseFloat(diferencas.massaGorda) < 0 ? goodBadge : badBadge}>
                {parseFloat(diferencas.massaGorda) < 0 ? '↓' : '↑'} {Math.abs(parseFloat(diferencas.massaGorda))} kg
              </Badge>
            )}
          />

          {/* Massa Magra */}
          <MetricCard
            tone="emerald"
            icon={<Activity className="w-4 h-4" />}
            label="Massa Magra"
            value={
              <>
                {ultima.massa_magra}
                <span className="text-sm font-normal text-slate-500 ml-1">kg</span>
              </>
            }
            badge={data.length > 1 && (
              <Badge className={parseFloat(diferencas.massaMagra) > 0 ? goodBadge : badBadge}>
                {parseFloat(diferencas.massaMagra) > 0 ? '+' : ''}{diferencas.massaMagra} kg
              </Badge>
            )}
          />

          {/* IMC */}
          <MetricCard
            tone="purple"
            icon={<Scale className="w-4 h-4" />}
            label="IMC"
            value={ultima.imc}
            subtitle={classificarIMC(ultima.imc)}
            badge={data.length > 1 && (
              <Badge className={neutralBadge}>
                {parseFloat(diferencas.imc) > 0 ? '+' : ''}{diferencas.imc}
              </Badge>
            )}
          />

          {/* TMB */}
          <MetricCard
            tone="amber"
            icon={<Flame className="w-4 h-4" />}
            label="TMB"
            value={ultima.tmb}
            subtitle="kcal por dia"
            badge={data.length > 1 && (
              <Badge className={neutralBadge}>
                {parseFloat(diferencas.tmb) > 0 ? '+' : ''}{diferencas.tmb} kcal
              </Badge>
            )}
          />
        </div>

        {data.length > 1 && (
          <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-white rounded-xl border border-blue-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500"></div>
            <p className="text-sm text-slate-700 flex items-start gap-3">
              <Activity className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span className="flex-1">
                <strong className="text-slate-900 mr-2">Análise de Evolução:</strong>
                {recomposicaoPositiva && (
                  <span className="text-emerald-700">
                    🎯 Recomposição corporal excelente! Perda de gordura com ganho de massa magra.
                  </span>
                )}
                {perdaMassaMagra && (
                  <span className="text-amber-700">
                    ⚠️ Atenção: Redução de massa magra detectada. Ajuste proteína e treino de força.
                  </span>
                )}
                {aumentoGordura && !perdaMassaMagra && (
                  <span className="text-rose-700">
                    📈 Aumento do % de gordura. Revise alimentação e atividade física.
                  </span>
                )}
                {!recomposicaoPositiva && !perdaMassaMagra && !aumentoGordura && (
                  <span className="text-slate-500">
                    Manutenção da composição corporal
                  </span>
                )}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

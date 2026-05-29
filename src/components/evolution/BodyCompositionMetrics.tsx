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
  unit?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  tone: "fuchsia" | "blue" | "rose" | "emerald" | "purple" | "amber";
}

const TONE_STYLES: Record<MetricCardProps["tone"], {
  card: string;
  iconBox: string;
  value: string;
  subtitle: string;
  accentBar: string;
}> = {
  fuchsia: {
    card: "from-fuchsia-50/80 via-white to-pink-50/30 border-fuchsia-100/80 hover:border-fuchsia-200 hover:shadow-fuchsia-200/50",
    iconBox: "bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/30",
    value: "text-fuchsia-700",
    subtitle: "text-fuchsia-700/70",
    accentBar: "from-fuchsia-400 to-pink-400",
  },
  blue: {
    card: "from-blue-50/80 via-white to-sky-50/30 border-blue-100/80 hover:border-blue-200 hover:shadow-blue-200/50",
    iconBox: "bg-gradient-to-br from-blue-500 to-sky-500 shadow-lg shadow-blue-500/30",
    value: "text-blue-700",
    subtitle: "text-blue-700/70",
    accentBar: "from-blue-400 to-sky-400",
  },
  rose: {
    card: "from-rose-50/80 via-white to-red-50/30 border-rose-100/80 hover:border-rose-200 hover:shadow-rose-200/50",
    iconBox: "bg-gradient-to-br from-rose-500 to-red-500 shadow-lg shadow-rose-500/30",
    value: "text-rose-700",
    subtitle: "text-rose-700/70",
    accentBar: "from-rose-400 to-red-400",
  },
  emerald: {
    card: "from-emerald-50/80 via-white to-teal-50/30 border-emerald-100/80 hover:border-emerald-200 hover:shadow-emerald-200/50",
    iconBox: "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30",
    value: "text-emerald-700",
    subtitle: "text-emerald-700/70",
    accentBar: "from-emerald-400 to-teal-400",
  },
  purple: {
    card: "from-purple-50/80 via-white to-violet-50/30 border-purple-100/80 hover:border-purple-200 hover:shadow-purple-200/50",
    iconBox: "bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/30",
    value: "text-purple-700",
    subtitle: "text-purple-700/70",
    accentBar: "from-purple-400 to-violet-400",
  },
  amber: {
    card: "from-amber-50/80 via-white to-orange-50/30 border-amber-100/80 hover:border-amber-200 hover:shadow-amber-200/50",
    iconBox: "bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30",
    value: "text-amber-700",
    subtitle: "text-amber-700/70",
    accentBar: "from-amber-400 to-orange-400",
  },
};

function MetricCard({ icon, label, value, unit, subtitle, badge, tone }: MetricCardProps) {
  const t = TONE_STYLES[tone];
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${t.card} p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 group`}>
      {/* Barra de accent superior */}
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.accentBar}`} />

      {/* Linha topo: ícone + badge */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-white ${t.iconBox} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {badge && <div className="pt-1">{badge}</div>}
      </div>

      {/* Label */}
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </p>

      {/* Valor principal */}
      <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${t.value} leading-none`}>
        {value}
        {unit && <span className="text-base sm:text-lg font-normal text-slate-400 ml-1">{unit}</span>}
      </p>

      {/* Subtítulo */}
      {subtitle && (
        <p className={`text-[11px] mt-1.5 leading-snug line-clamp-2 ${t.subtitle}`}>{subtitle}</p>
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

  const goodBadge = "bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 font-semibold";
  const badBadge = "bg-rose-100 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 font-semibold";
  const neutralBadge = "bg-slate-100 text-slate-700 border border-slate-200 text-[10px] px-2 py-0.5 font-semibold";

  return (
    <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-slate-900 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md shadow-blue-500/20">
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
            icon={<TrendingDown className="w-5 h-5" />}
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
            icon={<Scale className="w-5 h-5" />}
            label="Peso Total"
            value={ultima.peso}
            unit="kg"
            badge={data.length > 1 && (
              <Badge className={neutralBadge}>
                {parseFloat(diferencas.peso) > 0 ? '↑' : parseFloat(diferencas.peso) < 0 ? '↓' : ''} {Math.abs(parseFloat(diferencas.peso))} kg
              </Badge>
            )}
          />

          {/* Massa Gorda */}
          <MetricCard
            tone="rose"
            icon={<div className="w-4 h-4 bg-white rounded-full" />}
            label="Massa Gorda"
            value={ultima.massa_gorda}
            unit="kg"
            badge={data.length > 1 && (
              <Badge className={parseFloat(diferencas.massaGorda) < 0 ? goodBadge : badBadge}>
                {parseFloat(diferencas.massaGorda) < 0 ? '↓' : '↑'} {Math.abs(parseFloat(diferencas.massaGorda))} kg
              </Badge>
            )}
          />

          {/* Massa Magra */}
          <MetricCard
            tone="emerald"
            icon={<Activity className="w-5 h-5" />}
            label="Massa Magra"
            value={ultima.massa_magra}
            unit="kg"
            badge={data.length > 1 && (
              <Badge className={parseFloat(diferencas.massaMagra) > 0 ? goodBadge : badBadge}>
                {parseFloat(diferencas.massaMagra) > 0 ? '+' : ''}{diferencas.massaMagra} kg
              </Badge>
            )}
          />

          {/* IMC */}
          <MetricCard
            tone="purple"
            icon={<Scale className="w-5 h-5" />}
            label="IMC"
            value={ultima.imc}
            subtitle={classificarIMC(ultima.imc)}
            badge={data.length > 1 && (
              <Badge className={neutralBadge}>
                {parseFloat(diferencas.imc) > 0 ? '↑' : parseFloat(diferencas.imc) < 0 ? '↓' : ''} {Math.abs(parseFloat(diferencas.imc))}
              </Badge>
            )}
          />

          {/* TMB */}
          <MetricCard
            tone="amber"
            icon={<Flame className="w-5 h-5" />}
            label="TMB"
            value={ultima.tmb}
            subtitle="kcal por dia"
            badge={data.length > 1 && (
              <Badge className={neutralBadge}>
                {parseFloat(diferencas.tmb) > 0 ? '↑' : parseFloat(diferencas.tmb) < 0 ? '↓' : ''} {Math.abs(parseFloat(diferencas.tmb))} kcal
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

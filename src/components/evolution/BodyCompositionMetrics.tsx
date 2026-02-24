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

export function BodyCompositionMetrics({ data }: BodyCompositionMetricsProps) {
  if (data.length === 0) return null;

  const ultima = data[0]; // Mais recente
  const primeira = data[data.length - 1]; // Mais antiga

  const diferencas = {
    gordura: (ultima.percentual_gordura - primeira.percentual_gordura).toFixed(1),
    peso: (ultima.peso - primeira.peso).toFixed(1),
    massaGorda: (ultima.massa_gorda - primeira.massa_gorda).toFixed(1),
    massaMagra: (ultima.massa_magra - primeira.massa_magra).toFixed(1),
    imc: (ultima.imc - primeira.imc).toFixed(1),
    tmb: (ultima.tmb - primeira.tmb).toFixed(0)
  };

  // Análise de recomposição corporal
  const recomposicaoPositiva = parseFloat(diferencas.gordura) < 0 && parseFloat(diferencas.massaMagra) > 0;
  const perdaMassaMagra = parseFloat(diferencas.gordura) < 0 && parseFloat(diferencas.massaMagra) < 0;
  const aumentoGordura = parseFloat(diferencas.gordura) > 0;

  return (
    <Card className="bg-slate-900/40 border-slate-800/60 shadow-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <CardHeader className="relative pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Composição Corporal Atual
        </CardTitle>
        <CardDescription className="text-slate-400">
          Última avaliação: {new Date(ultima.data_avaliacao).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* % Gordura */}
          <div className="bg-slate-800/30 p-3 sm:p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 hover:border-fuchsia-500/30 hover:shadow-[0_0_15px_rgba(217,70,239,0.1)] transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 group-hover:bg-fuchsia-500/20 transition-colors">
                <TrendingDown className="w-4 h-4" />
              </div>
              {data.length > 1 && (
                <Badge className={`text-[10px] px-1.5 py-0 ${parseFloat(diferencas.gordura) < 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {parseFloat(diferencas.gordura) < 0 ? '↓' : '↑'} {Math.abs(parseFloat(diferencas.gordura))}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{ultima.percentual_gordura}%</p>
            <p className="text-xs font-medium text-slate-400 mt-1">% Gordura</p>
            <p className="text-[10px] text-fuchsia-300/70 mt-0.5 truncate" title={ultima.classificacao}>
              {ultima.classificacao}
            </p>
          </div>

          {/* Peso */}
          <div className="bg-slate-800/30 p-3 sm:p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <Scale className="w-4 h-4" />
              </div>
              {data.length > 1 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {parseFloat(diferencas.peso) > 0 ? '+' : ''}{diferencas.peso} kg
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{ultima.peso} <span className="text-sm font-normal text-slate-400">kg</span></p>
            <p className="text-xs font-medium text-slate-400 mt-1">Peso Total</p>
          </div>

          {/* Massa Gorda */}
          <div className="bg-slate-800/30 p-3 sm:p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 hover:border-rose-500/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
                <div className="w-4 h-4 bg-rose-400/80 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)]"></div>
              </div>
              {data.length > 1 && (
                <Badge className={`text-[10px] px-1.5 py-0 ${parseFloat(diferencas.massaGorda) < 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {parseFloat(diferencas.massaGorda) < 0 ? '↓' : '↑'} {Math.abs(parseFloat(diferencas.massaGorda))} kg
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{ultima.massa_gorda} <span className="text-sm font-normal text-slate-400">kg</span></p>
            <p className="text-xs font-medium text-slate-400 mt-1">Massa Gorda</p>
          </div>

          {/* Massa Magra */}
          <div className="bg-slate-800/30 p-3 sm:p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <Activity className="w-4 h-4" />
              </div>
              {data.length > 1 && (
                <Badge className={`text-[10px] px-1.5 py-0 ${parseFloat(diferencas.massaMagra) > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {parseFloat(diferencas.massaMagra) > 0 ? '+' : ''}{diferencas.massaMagra} kg
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{ultima.massa_magra} <span className="text-sm font-normal text-slate-400">kg</span></p>
            <p className="text-xs font-medium text-slate-400 mt-1">Massa Magra</p>
          </div>

          {/* IMC */}
          <div className="bg-slate-800/30 p-3 sm:p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <Scale className="w-4 h-4" />
              </div>
              {data.length > 1 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {parseFloat(diferencas.imc) > 0 ? '+' : ''}{diferencas.imc}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{ultima.imc}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">IMC</p>
            <p className="text-[10px] text-purple-300/70 mt-0.5">{classificarIMC(ultima.imc)}</p>
          </div>

          {/* TMB */}
          <div className="bg-slate-800/30 p-3 sm:p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 hover:border-amber-500/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <Flame className="w-4 h-4" />
              </div>
              {data.length > 1 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {parseFloat(diferencas.tmb) > 0 ? '+' : ''}{diferencas.tmb} kcal
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{ultima.tmb}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">TMB <span className="text-[10px] text-slate-500 font-normal">(kcal/dia)</span></p>
          </div>
        </div>

        {data.length > 1 && (
          <div className="mt-6 p-4 bg-slate-800/20 rounded-xl border border-slate-700/40 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500"></div>
            <p className="text-sm text-slate-300 flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="flex-1">
                <strong className="text-white mr-2">Análise de Evolução:</strong>
                {recomposicaoPositiva && (
                  <span className="text-emerald-400">
                    🎯 Recomposição corporal excelente! Perda de gordura com ganho de massa magra.
                  </span>
                )}
                {perdaMassaMagra && (
                  <span className="text-amber-400">
                    ⚠️ Atenção: Redução de massa magra detectada. Ajuste proteína e treino de força.
                  </span>
                )}
                {aumentoGordura && !perdaMassaMagra && (
                  <span className="text-rose-400">
                    📈 Aumento do % de gordura. Revise alimentação e atividade física.
                  </span>
                )}
                {!recomposicaoPositiva && !perdaMassaMagra && !aumentoGordura && (
                  <span className="text-slate-400">
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


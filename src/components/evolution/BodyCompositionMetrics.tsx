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
    <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
      <CardHeader>
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
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* % Gordura */}
          <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 p-4 rounded-lg border border-rose-500/30 hover:border-rose-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              {data.length > 1 && (
                <Badge className={`text-xs ${parseFloat(diferencas.gordura) < 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {parseFloat(diferencas.gordura) < 0 ? '↓' : '↑'} {Math.abs(parseFloat(diferencas.gordura))}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-white">{ultima.percentual_gordura}%</p>
            <p className="text-xs text-slate-400 mt-1">% Gordura</p>
            <p className="text-xs text-rose-300/70 truncate" title={ultima.classificacao}>
              {ultima.classificacao}
            </p>
          </div>

          {/* Peso */}
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-4 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <Scale className="w-4 h-4 text-blue-400" />
              {data.length > 1 && (
                <Badge className="text-xs bg-blue-500/20 text-blue-300">
                  {parseFloat(diferencas.peso) > 0 ? '+' : ''}{diferencas.peso} kg
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-white">{ultima.peso} kg</p>
            <p className="text-xs text-slate-400 mt-1">Peso Total</p>
          </div>

          {/* Massa Gorda */}
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 p-4 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-4 h-4 bg-red-500/40 rounded-full"></div>
              {data.length > 1 && (
                <Badge className={`text-xs ${parseFloat(diferencas.massaGorda) < 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {parseFloat(diferencas.massaGorda) < 0 ? '↓' : '↑'} {Math.abs(parseFloat(diferencas.massaGorda))} kg
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-red-300">{ultima.massa_gorda} kg</p>
            <p className="text-xs text-slate-400 mt-1">Massa Gorda</p>
          </div>

          {/* Massa Magra */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-4 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              {data.length > 1 && (
                <Badge className={`text-xs ${parseFloat(diferencas.massaMagra) > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {parseFloat(diferencas.massaMagra) > 0 ? '+' : ''}{diferencas.massaMagra} kg
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-emerald-300">{ultima.massa_magra} kg</p>
            <p className="text-xs text-slate-400 mt-1">Massa Magra</p>
          </div>

          {/* IMC */}
          <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 p-4 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <Scale className="w-4 h-4 text-purple-400" />
              {data.length > 1 && (
                <Badge className="text-xs bg-purple-500/20 text-purple-300">
                  {parseFloat(diferencas.imc) > 0 ? '+' : ''}{diferencas.imc}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-white">{ultima.imc}</p>
            <p className="text-xs text-slate-400 mt-1">IMC</p>
            <p className="text-xs text-purple-300/70">{classificarIMC(ultima.imc)}</p>
          </div>

          {/* TMB */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 rounded-lg border border-amber-500/30 hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-4 h-4 text-amber-400" />
              {data.length > 1 && (
                <Badge className="text-xs bg-amber-500/20 text-amber-300">
                  {parseFloat(diferencas.tmb) > 0 ? '+' : ''}{diferencas.tmb} kcal
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-amber-300">{ultima.tmb}</p>
            <p className="text-xs text-slate-400 mt-1">TMB (kcal/dia)</p>
          </div>
        </div>

        {data.length > 1 && (
          <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <strong>📊 Análise de Evolução:</strong>
              {recomposicaoPositiva && (
                <span className="text-emerald-400 font-semibold">
                  🎯 Recomposição corporal excelente! Perda de gordura com ganho de massa magra.
                </span>
              )}
              {perdaMassaMagra && (
                <span className="text-amber-400 font-semibold">
                  ⚠️ Atenção: Redução de massa magra detectada. Ajuste proteína e treino de força.
                </span>
              )}
              {aumentoGordura && !perdaMassaMagra && (
                <span className="text-red-400 font-semibold">
                  📈 Aumento do % de gordura. Revise alimentação e atividade física.
                </span>
              )}
              {!recomposicaoPositiva && !perdaMassaMagra && !aumentoGordura && (
                <span className="text-slate-400">
                  Manutenção da composição corporal
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


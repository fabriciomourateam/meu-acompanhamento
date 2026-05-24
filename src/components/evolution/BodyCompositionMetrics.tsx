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

  const cellCls = "bg-white p-3 sm:p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all group";
  const valueCls = "text-2xl font-bold text-slate-900 tracking-tight";
  const labelCls = "text-xs font-medium text-slate-600 mt-1";

  return (
    <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
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
          <div className={`${cellCls} hover:border-fuchsia-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-600">
                <TrendingDown className="w-4 h-4" />
              </div>
              {data.length > 1 && (
                <Badge className={`text-[10px] px-1.5 py-0 border ${parseFloat(diferencas.gordura) < 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {parseFloat(diferencas.gordura) < 0 ? '↓' : '↑'} {Math.abs(parseFloat(diferencas.gordura))}%
                </Badge>
              )}
            </div>
            <p className={valueCls}>{ultima.percentual_gordura}%</p>
            <p className={labelCls}>% Gordura</p>
            <p className="text-[10px] text-fuchsia-600/80 mt-0.5 truncate" title={ultima.classificacao}>
              {ultima.classificacao}
            </p>
          </div>

          {/* Peso */}
          <div className={`${cellCls} hover:border-blue-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
                <Scale className="w-4 h-4" />
              </div>
              {data.length > 1 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border border-blue-200">
                  {parseFloat(diferencas.peso) > 0 ? '+' : ''}{diferencas.peso} kg
                </Badge>
              )}
            </div>
            <p className={valueCls}>{ultima.peso} <span className="text-sm font-normal text-slate-500">kg</span></p>
            <p className={labelCls}>Peso Total</p>
          </div>

          {/* Massa Gorda */}
          <div className={`${cellCls} hover:border-rose-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600">
                <div className="w-4 h-4 bg-rose-500 rounded-full"></div>
              </div>
              {data.length > 1 && (
                <Badge className={`text-[10px] px-1.5 py-0 border ${parseFloat(diferencas.massaGorda) < 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {parseFloat(diferencas.massaGorda) < 0 ? '↓' : '↑'} {Math.abs(parseFloat(diferencas.massaGorda))} kg
                </Badge>
              )}
            </div>
            <p className={valueCls}>{ultima.massa_gorda} <span className="text-sm font-normal text-slate-500">kg</span></p>
            <p className={labelCls}>Massa Gorda</p>
          </div>

          {/* Massa Magra */}
          <div className={`${cellCls} hover:border-emerald-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
                <Activity className="w-4 h-4" />
              </div>
              {data.length > 1 && (
                <Badge className={`text-[10px] px-1.5 py-0 border ${parseFloat(diferencas.massaMagra) > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {parseFloat(diferencas.massaMagra) > 0 ? '+' : ''}{diferencas.massaMagra} kg
                </Badge>
              )}
            </div>
            <p className={valueCls}>{ultima.massa_magra} <span className="text-sm font-normal text-slate-500">kg</span></p>
            <p className={labelCls}>Massa Magra</p>
          </div>

          {/* IMC */}
          <div className={`${cellCls} hover:border-purple-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-600">
                <Scale className="w-4 h-4" />
              </div>
              {data.length > 1 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border border-purple-200">
                  {parseFloat(diferencas.imc) > 0 ? '+' : ''}{diferencas.imc}
                </Badge>
              )}
            </div>
            <p className={valueCls}>{ultima.imc}</p>
            <p className={labelCls}>IMC</p>
            <p className="text-[10px] text-purple-600/80 mt-0.5">{classificarIMC(ultima.imc)}</p>
          </div>

          {/* TMB */}
          <div className={`${cellCls} hover:border-amber-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
                <Flame className="w-4 h-4" />
              </div>
              {data.length > 1 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border border-amber-200">
                  {parseFloat(diferencas.tmb) > 0 ? '+' : ''}{diferencas.tmb} kcal
                </Badge>
              )}
            </div>
            <p className={valueCls}>{ultima.tmb}</p>
            <p className={labelCls}>TMB <span className="text-[10px] text-slate-400 font-normal">(kcal/dia)</span></p>
          </div>
        </div>

        {data.length > 1 && (
          <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden">
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

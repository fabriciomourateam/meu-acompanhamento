import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Minus, Activity } from 'lucide-react';

interface BodyComposition {
  data_avaliacao: string;
  percentual_gordura: number;
  classificacao: string;
}

interface BodyFatChartProps {
  data: BodyComposition[];
}

export function BodyFatChart({ data }: BodyFatChartProps) {
  if (data.length === 0) {
    return (
      <Card className="bg-slate-800/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Evolução do % de Gordura Corporal
          </CardTitle>
          <CardDescription className="text-slate-400">
            Nenhuma bioimpedância registrada ainda
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = data
    .map((item) => ({
      data: new Date(item.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      dataCompleta: new Date(item.data_avaliacao).toLocaleDateString('pt-BR'),
      gordura: item.percentual_gordura,
      classificacao: item.classificacao
    }))
    .reverse();

  const primeiro = data[data.length - 1].percentual_gordura;
  const ultimo = data[0].percentual_gordura;
  const diferenca = ultimo - primeiro;
  const porcentagemMudanca = primeiro !== 0 ? ((diferenca / primeiro) * 100).toFixed(1) : '0.0';

  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Evolução do % de Gordura Corporal
        </CardTitle>
        <CardDescription className="text-slate-400 flex items-center gap-2">
          {diferenca < -0.5 ? (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <TrendingDown className="w-4 h-4" />
              Redução de {Math.abs(diferenca).toFixed(1)}% ({porcentagemMudanca}%)
            </span>
          ) : diferenca > 0.5 ? (
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <TrendingUp className="w-4 h-4" />
              Aumento de {diferenca.toFixed(1)}% (+{porcentagemMudanca}%)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400">
              <Minus className="w-4 h-4" />
              Sem mudança significativa
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="data"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              domain={['dataMin - 2', 'dataMax + 2']}
              label={{ value: '% Gordura', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: '12px' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
              formatter={(value: any, name: string, props: any) => [
                `${value}%`,
                'Gordura Corporal'
              ]}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return `Data: ${payload[0].payload.dataCompleta}`;
                }
                return `Data: ${label}`;
              }}
            />
            <Line
              type="monotone"
              dataKey="gordura"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
            <p className="text-xs text-slate-400 mb-1">Primeira Avaliação</p>
            <p className="text-2xl font-bold text-white">{primeiro.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(data[data.length - 1].data_avaliacao).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
            <p className="text-xs text-slate-400 mb-1">Última Avaliação</p>
            <p className="text-2xl font-bold text-emerald-400">{ultimo.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(data[0].data_avaliacao).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {data.length > 1 && (
          <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <p className="text-xs text-slate-400">
              <strong>Meta ideal:</strong> Reduzir % de gordura mantendo ou aumentando massa magra para melhor composição corporal
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


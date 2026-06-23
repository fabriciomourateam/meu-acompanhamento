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
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Evolução do % de Gordura Corporal
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
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
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Evolução do % de Gordura Corporal
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
          {diferenca < -0.5 ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingDown className="w-4 h-4" />
              Redução de {Math.abs(diferenca).toFixed(1)}% ({porcentagemMudanca}%)
            </span>
          ) : diferenca > 0.5 ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <TrendingUp className="w-4 h-4" />
              Aumento de {diferenca.toFixed(1)}% (+{porcentagemMudanca}%)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Minus className="w-4 h-4" />
              Sem mudança significativa
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="data"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              domain={['dataMin - 2', 'dataMax + 2']}
              label={{ value: '% Gordura', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: '12px' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
              formatter={(value: any) => [`${value}%`, 'Gordura Corporal']}
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

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Primeira Avaliação</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{primeiro.toFixed(1)}%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {new Date(data[data.length - 1].data_avaliacao).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">Última Avaliação</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{ultimo.toFixed(1)}%</p>
            <p className="text-xs text-emerald-700/80 mt-1">
              {new Date(data[0].data_avaliacao).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {data.length > 1 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/50">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Meta ideal:</strong> Reduzir % de gordura mantendo ou aumentando massa magra para melhor composição corporal
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

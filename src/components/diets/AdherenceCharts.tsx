import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { dietConsumptionService, DailyConsumption } from '@/lib/diet-consumption-service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface AdherenceChartsProps {
  patientId: string;
  lowAdherenceThreshold?: number; // Percentual mínimo de adesão (padrão 70%)
}

export function AdherenceCharts({ patientId, lowAdherenceThreshold = 70 }: AdherenceChartsProps) {
  const [consumption, setConsumption] = useState<DailyConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | '3months'>('month');

  useEffect(() => {
    loadData();
  }, [patientId, period]);

  const loadData = async () => {
    try {
      setLoading(true);
      let data: DailyConsumption[] = [];

      if (period === 'week') {
        data = await dietConsumptionService.getWeeklyConsumption(patientId);
      } else if (period === 'month') {
        data = await dietConsumptionService.getMonthlyConsumption(patientId);
      } else {
        // 3 meses - buscar dados dos últimos 90 dias
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 89); // Últimos 90 dias
        
        data = await dietConsumptionService.getConsumptionHistory(
          patientId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
      }

      setConsumption(data);
    } catch (error) {
      console.error('Erro ao carregar dados de adesão:', error);
    } finally {
      setLoading(false);
    }
  };

  // Preparar dados para o gráfico
  const chartData = consumption.map((day) => {
    const date = new Date(day.consumption_date);
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      fullDate: date.toISOString().split('T')[0],
      adherence: Math.round(day.completion_percentage),
      calories: Math.round(day.total_calories_consumed),
      target: Math.round(day.target_calories || 0),
    };
  });

  // Calcular tendência
  const calculateTrend = () => {
    if (consumption.length < 2) return null;
    
    const firstHalf = consumption.slice(0, Math.floor(consumption.length / 2));
    const secondHalf = consumption.slice(Math.floor(consumption.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.completion_percentage, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.completion_percentage, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    return {
      change: Math.round(change * 10) / 10,
      isIncreasing: change > 0,
      isDecreasing: change < -5, // Considera decréscimo significativo se > 5%
    };
  };

  // Detectar alertas de baixa adesão
  const lowAdherenceDays = consumption.filter(d => d.completion_percentage < lowAdherenceThreshold);
  const consecutiveLowDays = () => {
    if (lowAdherenceDays.length === 0) return 0;
    
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    consumption.forEach((day) => {
      if (day.completion_percentage < lowAdherenceThreshold) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    });
    
    return maxConsecutive;
  };

  const trend = calculateTrend();
  const avgAdherence = consumption.length > 0
    ? Math.round(consumption.reduce((sum, d) => sum + d.completion_percentage, 0) / consumption.length)
    : 0;
  const consecutiveLow = consecutiveLowDays();

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (consumption.length === 0) {
    return (
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <CardHeader>
          <CardTitle className="text-[#222222] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#00C98A]" />
            Adesão ao Plano Alimentar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-[#777777]">Nenhum dado de consumo registrado ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card Principal - Gráfico de Tendência */}
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg text-[#222222] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#00C98A] flex-shrink-0" />
              Adesão ao Plano Alimentar
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setPeriod('week')}
                className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  period === 'week'
                    ? 'bg-[#00C98A] text-white'
                    : 'bg-gray-100 text-[#777777] hover:bg-gray-200'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  period === 'month'
                    ? 'bg-[#00C98A] text-white'
                    : 'bg-gray-100 text-[#777777] hover:bg-gray-200'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setPeriod('3months')}
                className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  period === '3months'
                    ? 'bg-[#00C98A] text-white'
                    : 'bg-gray-100 text-[#777777] hover:bg-gray-200'
                }`}
              >
                3 Meses
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estatísticas Resumo */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center p-3 sm:p-4 bg-[#00C98A]/5 rounded-xl border border-[#00C98A]/20">
              <div className="text-xl sm:text-2xl font-bold text-[#00C98A]">{avgAdherence}%</div>
              <div className="text-xs text-[#777777] mt-1">Média de Adesão</div>
            </div>
            <div className={`text-center p-3 sm:p-4 rounded-xl border ${
              trend?.isIncreasing
                ? 'bg-green-50 border-green-200'
                : trend?.isDecreasing
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-xl sm:text-2xl font-bold flex items-center justify-center gap-1 ${
                trend?.isIncreasing
                  ? 'text-green-600'
                  : trend?.isDecreasing
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}>
                {trend && (
                  <>
                    {trend.isIncreasing ? (
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : trend.isDecreasing ? (
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : null}
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </>
                )}
                {!trend && '-'}
              </div>
              <div className="text-xs text-[#777777] mt-1">Tendência</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {consumption.filter(d => d.completion_percentage >= lowAdherenceThreshold).length}
              </div>
              <div className="text-xs text-[#777777] mt-1">Dias com Boa Adesão</div>
            </div>
          </div>

          {/* Gráfico de Tendência */}
          <div className="w-full h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#777777"
                style={{ fontSize: '10px' }}
                className="sm:text-xs"
              />
              <YAxis 
                stroke="#777777"
                style={{ fontSize: '10px' }}
                className="sm:text-xs"
                domain={[0, 100]}
                label={{ value: 'Adesão (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#777777', fontSize: '10px' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#222222'
                }}
                labelStyle={{ color: '#777777', fontWeight: 'bold' }}
              />
              <Legend />
              <ReferenceLine 
                y={lowAdherenceThreshold} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label={{ value: `Limite (${lowAdherenceThreshold}%)`, position: 'right', fill: '#ef4444' }}
              />
              <Line
                type="monotone"
                dataKey="adherence"
                stroke="#00C98A"
                strokeWidth={3}
                name="Adesão (%)"
                dot={{ fill: '#00C98A', r: 4 }}
                activeDot={{ r: 6, fill: '#00A875' }}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Baixa Adesão */}
      {(lowAdherenceDays.length > 0 || consecutiveLow >= 3) && (
        <Alert className={`border-2 ${
          consecutiveLow >= 3
            ? 'border-red-500 bg-red-50'
            : 'border-yellow-500 bg-yellow-50'
        }`}>
          <AlertTriangle className={`h-5 w-5 ${
            consecutiveLow >= 3 ? 'text-red-600' : 'text-yellow-600'
          }`} />
          <AlertTitle className={`font-bold ${
            consecutiveLow >= 3 ? 'text-red-900' : 'text-yellow-900'
          }`}>
            {consecutiveLow >= 3 ? '⚠️ Alerta Crítico de Adesão' : '⚠️ Baixa Adesão Detectada'}
          </AlertTitle>
          <AlertDescription className={`mt-2 ${
            consecutiveLow >= 3 ? 'text-red-800' : 'text-yellow-800'
          }`}>
            {consecutiveLow >= 3 ? (
              <>
                <strong>{consecutiveLow} dias consecutivos</strong> com adesão abaixo de {lowAdherenceThreshold}%.
                Considere revisar o plano alimentar ou fornecer suporte adicional ao paciente.
              </>
            ) : (
              <>
                <strong>{lowAdherenceDays.length} dia(s)</strong> com adesão abaixo de {lowAdherenceThreshold}% no período analisado.
                {lowAdherenceDays.length >= consumption.length * 0.3 && (
                  <span className="block mt-1">
                    Isso representa mais de 30% dos dias. Considere verificar se há necessidade de ajustes no plano.
                  </span>
                )}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Dias com Baixa Adesão */}
      {lowAdherenceDays.length > 0 && lowAdherenceDays.length <= 10 && (
        <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <CardHeader>
            <CardTitle className="text-[#222222] text-lg">Dias com Baixa Adesão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowAdherenceDays.map((day) => {
                const date = new Date(day.consumption_date);
                return (
                  <div
                    key={day.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-red-900">
                        {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </div>
                      <div className="text-sm text-red-700">
                        {Math.round(day.total_calories_consumed)} / {Math.round(day.target_calories || 0)} kcal
                      </div>
                    </div>
                    <Badge className="bg-red-600 text-white">
                      {Math.round(day.completion_percentage)}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


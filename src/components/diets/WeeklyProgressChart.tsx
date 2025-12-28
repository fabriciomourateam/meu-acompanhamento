import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dietConsumptionService, DailyConsumption } from '@/lib/diet-consumption-service';
import { WeeklyHabitsGrid } from './WeeklyHabitsGrid';
import { Calendar, Target } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WeeklyProgressChartProps {
  patientId: string;
}

export function WeeklyProgressChart({ patientId }: WeeklyProgressChartProps) {
  const [consumption, setConsumption] = useState<DailyConsumption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyData();
  }, [patientId]);

  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      const data = await dietConsumptionService.getWeeklyConsumption(patientId);
      setConsumption(data);
    } catch (error) {
      console.error('Erro ao carregar dados semanais:', error);
    } finally {
      setLoading(false);
    }
  };

  // Preparar dados para gráficos
  const chartData = consumption.map((day) => {
    const date = new Date(day.consumption_date);
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      calorias: Math.round(day.total_calories_consumed),
      meta: Math.round(day.target_calories || 0),
      percentual: Math.round(day.completion_percentage),
      proteinas: Math.round(day.total_protein_consumed),
      carboidratos: Math.round(day.total_carbs_consumed),
      gorduras: Math.round(day.total_fats_consumed),
    };
  });

  // Calcular estatísticas
  const avgCompletion = consumption.length > 0
    ? Math.round(consumption.reduce((sum, d) => sum + d.completion_percentage, 0) / consumption.length)
    : 0;
  
  const totalDays = consumption.length;
  const perfectDays = consumption.filter(d => d.completion_percentage === 100).length;

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
            <Calendar className="w-5 h-5 text-[#00C98A]" />
            Progresso Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-[#777777]">Nenhum dado de consumo registrado ainda</p>
            <p className="text-sm text-[#777777] mt-2">Comece marcando suas refeições!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid Semanal de Hábitos */}
      <WeeklyHabitsGrid patientId={patientId} />

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-[#222222]">{avgCompletion}%</p>
            <p className="text-xs text-[#777777] mt-1">Média Semanal</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-[#222222]">{totalDays}</p>
            <p className="text-xs text-[#777777] mt-1">Dias Registrados</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-[#00C98A]">{perfectDays}</p>
            <p className="text-xs text-[#777777] mt-1">Dias Perfeitos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Percentual de Conclusão */}
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg text-[#222222] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#00C98A] flex-shrink-0" />
            Percentual de Conclusão Diária
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div style={{ width: '100%', height: '250px', minHeight: '250px' }} className="sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  stroke="#777777"
                  fontSize={10}
                  className="sm:text-xs"
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#777777"
                  fontSize={10}
                  className="sm:text-xs"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Conclusão']}
                />
                <Line 
                  type="monotone" 
                  dataKey="percentual" 
                  stroke="#00C98A" 
                  strokeWidth={3}
                  dot={{ fill: '#00C98A', r: 5 }}
                  activeDot={{ r: 8 }}
                  name="Conclusão %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}


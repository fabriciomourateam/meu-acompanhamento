import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { nutritionalAnalysisService, NutritionalAnalysis } from '@/lib/diet-nutritional-analysis-service';

interface NutritionalAnalysisCardProps {
  plan: {
    meals?: Array<{
      foods?: Array<{
        food_name: string;
        quantity: number;
        unit: string;
      }>;
    }>;
  };
}

export function NutritionalAnalysisCard({ plan }: NutritionalAnalysisCardProps) {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<NutritionalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && plan) {
      loadAnalysis();
    }
  }, [open, plan]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const data = await nutritionalAnalysisService.analyzePlan(plan);
      setAnalysis(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao analisar plano',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/50 text-green-400';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
    return 'bg-red-500/20 border-red-500/50 text-red-400';
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="bg-slate-800/50 border-slate-700">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-800/70 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise Nutricional
              </CardTitle>
              {analysis && (
                <Badge className={getScoreBadge(analysis.nutritional_density_score)}>
                  Score: {analysis.nutritional_density_score}/100
                </Badge>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Analisando...</div>
            ) : analysis ? (
              <>
                {/* Score de Densidade Nutricional */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Densidade Nutricional</span>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.nutritional_density_score)}`}>
                      {analysis.nutritional_density_score}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        analysis.nutritional_density_score >= 80
                          ? 'bg-green-500'
                          : analysis.nutritional_density_score >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${analysis.nutritional_density_score}%` }}
                    />
                  </div>
                </div>

                {/* Macros Detalhados */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Calorias</div>
                    <div className="text-xl font-bold text-cyan-400">{analysis.total_calories}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Proteínas</div>
                    <div className="text-xl font-bold text-cyan-400">{analysis.total_protein}g</div>
                    <div className="text-xs text-slate-500">{analysis.protein_percentage}%</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Carboidratos</div>
                    <div className="text-xl font-bold text-cyan-400">{analysis.total_carbs}g</div>
                    <div className="text-xs text-slate-500">{analysis.carbs_percentage}%</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Gorduras</div>
                    <div className="text-xl font-bold text-cyan-400">{analysis.total_fats}g</div>
                    <div className="text-xs text-slate-500">{analysis.fats_percentage}%</div>
                  </div>
                </div>

                {/* Fibra e Sódio */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Fibra</div>
                    <div className="text-lg font-bold text-cyan-400">{analysis.total_fiber}g</div>
                    <div className="text-xs text-slate-500">
                      {analysis.fiber_per_1000kcal}g por 1000kcal
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Sódio</div>
                    <div className="text-lg font-bold text-cyan-400">{analysis.total_sodium}mg</div>
                    <div className="text-xs text-slate-500">
                      {analysis.total_sodium > 2300 ? '⚠️ Acima do recomendado' : '✓ Dentro do recomendado'}
                    </div>
                  </div>
                </div>

                {/* Recomendações */}
                {analysis.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-cyan-300">Recomendações</div>
                    {analysis.recommendations.map((rec, index) => (
                      <Alert
                        key={index}
                        className={`${
                          rec.includes('bem balanceado')
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-yellow-500 bg-yellow-500/10'
                        }`}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription
                          className={
                            rec.includes('bem balanceado') ? 'text-green-300' : 'text-yellow-300'
                          }
                        >
                          {rec}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">
                Clique para analisar o plano nutricional
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

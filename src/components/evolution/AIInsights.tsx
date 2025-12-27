import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzePatientProgress, type AIAnalysisResult } from '@/lib/ai-analysis-service';
import type { Database } from '@/integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';

type Checkin = Database['public']['Tables']['checkin']['Row'];

interface AIInsightsProps {
  checkins: Checkin[];
}

export function AIInsights({ checkins }: AIInsightsProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isMinimized, setIsMinimized] = useState(true); // Minimizado por padrão
  const [expandedSections, setExpandedSections] = useState({
    strengths: false,
    warnings: false,
    suggestions: false,
    goals: false
  });

  useEffect(() => {
    if (checkins.length > 0) {
      const result = analyzePatientProgress(checkins);
      setAnalysis(result);
    }
  }, [checkins]);

  if (!analysis || checkins.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-sm border-purple-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Análise Inteligente
          </CardTitle>
          <CardDescription className="text-slate-400">
            Insights personalizados serão gerados assim que houver check-ins suficientes
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getTrendIcon = () => {
    switch (analysis.trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'declining':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      default:
        return <TrendingUp className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTrendText = () => {
    switch (analysis.trend) {
      case 'improving':
        return 'Em evolução positiva';
      case 'declining':
        return 'Necessita atenção';
      default:
        return 'Progresso estável';
    }
  };

  const getTrendColor = () => {
    switch (analysis.trend) {
      case 'improving':
        return 'from-emerald-500/20 to-green-600/20 border-emerald-500/30';
      case 'declining':
        return 'from-orange-500/20 to-red-600/20 border-orange-500/30';
      default:
        return 'from-blue-500/20 to-indigo-600/20 border-blue-500/30';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-sm border-purple-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-1.5 bg-purple-600/30 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">Análise do Progresso</span>
              </div>
              <p className="text-xs font-normal text-purple-300 mt-0.5">
                Insights personalizados baseados em {checkins.length} check-ins
              </p>
            </div>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-slate-400 hover:text-white"
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      {!isMinimized && (
        <CardContent className="space-y-3 p-4">
        {/* Score Geral e Tendência */}
        <div className={`bg-gradient-to-br ${getTrendColor()} rounded-lg p-3 border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="scale-90">{getTrendIcon()}</div>
              <div>
                <p className="text-xs text-slate-300">Status Geral</p>
                <p className="text-base font-bold text-white">{getTrendText()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-300">Pontuação Média</p>
              <p className="text-xl font-bold text-white">
                {analysis.overallScore.toFixed(1).replace('.', ',')}
                <span className="text-base text-slate-400">/100</span>
              </p>
            </div>
          </div>
        </div>

        {/* Pontos Fortes */}
        {analysis.strengths.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('strengths')}
              className="w-full flex items-center justify-between text-left group"
            >
              <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Pontos Fortes ({analysis.strengths.length})
              </h3>
              {expandedSections.strengths ? (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.strengths && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2"
                >
                  {analysis.strengths.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-2.5 hover:bg-emerald-900/30 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg">{insight.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-sm mb-0.5">{insight.title}</h4>
                          <p className="text-xs text-slate-300">{insight.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Pontos de Atenção */}
        {analysis.warnings.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('warnings')}
              className="w-full flex items-center justify-between text-left group"
            >
              <h3 className="text-sm font-semibold text-orange-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Pontos de Atenção ({analysis.warnings.length})
              </h3>
              {expandedSections.warnings ? (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.warnings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2"
                >
                  {analysis.warnings.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-2.5 hover:bg-orange-900/30 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg">{insight.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-sm mb-0.5">{insight.title}</h4>
                          <p className="text-xs text-slate-300 mb-1.5">{insight.description}</p>
                          {insight.recommendation && (
                            <div className="bg-orange-950/50 rounded p-1.5 mt-1.5">
                              <p className="text-[10px] text-orange-200 font-semibold mb-0.5">💡 Recomendação:</p>
                              <p className="text-[10px] text-slate-300">{insight.recommendation}</p>
                            </div>
                          )}
                        </div>
                        <Badge className={`text-[10px] px-1.5 py-0.5 ${
                          insight.priority === 'high' ? 'bg-red-600/30 text-red-200 border-red-500/30' :
                          insight.priority === 'medium' ? 'bg-orange-600/30 text-orange-200 border-orange-500/30' :
                          'bg-yellow-600/30 text-yellow-200 border-yellow-500/30'
                        }`}>
                          {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sugestões */}
        {analysis.suggestions.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('suggestions')}
              className="w-full flex items-center justify-between text-left group"
            >
              <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Sugestões de Melhoria ({analysis.suggestions.length})
              </h3>
              {expandedSections.suggestions ? (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.suggestions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2"
                >
                  {analysis.suggestions.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-2.5 hover:bg-blue-900/30 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg">{insight.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-sm mb-0.5">{insight.title}</h4>
                          <p className="text-xs text-slate-300 mb-1.5">{insight.description}</p>
                          {insight.recommendation && (
                            <div className="bg-blue-950/50 rounded p-1.5 mt-1.5">
                              <p className="text-[10px] text-blue-200 font-semibold mb-0.5">✨ Como fazer:</p>
                              <p className="text-[10px] text-slate-300">{insight.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Metas */}
        {analysis.goals.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('goals')}
              className="w-full flex items-center justify-between text-left group"
            >
              <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Metas Sugeridas ({analysis.goals.length})
              </h3>
              {expandedSections.goals ? (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.goals && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2"
                >
                  {analysis.goals.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-2.5 hover:bg-purple-900/30 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg">{insight.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-sm mb-0.5">{insight.title}</h4>
                          <p className="text-xs text-slate-300 mb-1.5">{insight.description}</p>
                          {insight.recommendation && (
                            <div className="bg-purple-950/50 rounded p-1.5 mt-1.5">
                              <p className="text-[10px] text-purple-200 font-semibold mb-0.5">🎯 Plano de ação:</p>
                              <p className="text-[10px] text-slate-300">{insight.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        </CardContent>
      )}
    </Card>
  );
}


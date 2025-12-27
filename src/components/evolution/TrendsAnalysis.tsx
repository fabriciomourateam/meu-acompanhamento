import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Info, Lightbulb, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Trend } from '@/lib/trends-analysis';

interface TrendsAnalysisProps {
  trends: Trend[];
}

export function TrendsAnalysis({ trends }: TrendsAnalysisProps) {
  const [isMinimized, setIsMinimized] = useState(true);

  if (trends.length === 0) {
    return null;
  }

  const getTypeIcon = (type: Trend['type']) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4" />;
      case 'insight':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: Trend['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-200 border-emerald-400/40 shadow-lg shadow-emerald-500/10';
      case 'negative':
        return 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-200 border-rose-400/40 shadow-lg shadow-rose-500/10';
      case 'insight':
        return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-200 border-amber-400/40 shadow-lg shadow-amber-500/10';
      default:
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-200 border-blue-400/40 shadow-lg shadow-blue-500/10';
    }
  };

  const getTypeLabel = (type: Trend['type']) => {
    switch (type) {
      case 'positive':
        return 'Positivo';
      case 'negative':
        return 'Atenção';
      case 'insight':
        return 'Insight';
      default:
        return 'Neutro';
    }
  };



  return (
    <Card className="glass-card border-white/10 overflow-hidden bg-gradient-to-br from-slate-900/50 via-slate-800/40 to-slate-900/50 backdrop-blur-3xl shadow-2xl ring-1 ring-white/5">
      <CardHeader className="bg-gradient-to-r from-white/[0.08] via-white/[0.06] to-white/[0.08] border-b border-white/10 backdrop-blur-xl relative overflow-hidden">
        {/* Efeito de brilho animado no header */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 5,
            ease: "easeInOut"
          }}
        />
        
        {/* Partículas decorativas */}
        <div className="absolute top-2 right-4 w-2 h-2 bg-blue-400/40 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-6 right-12 w-1.5 h-1.5 bg-purple-400/40 rounded-full blur-sm animate-pulse delay-75"></div>
        <div className="absolute top-4 right-20 w-1 h-1 bg-cyan-400/40 rounded-full blur-sm animate-pulse delay-150"></div>
        
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-2 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-fuchsia-500/15 rounded-lg border border-blue-400/30 shadow-md backdrop-blur-sm relative overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <TrendingUp className="w-5 h-5 text-blue-200 relative z-10" />
            </motion.div>
            <div>
              <CardTitle className="text-lg text-white font-semibold tracking-tight flex items-center gap-2">
                Análise de Tendências
                <Sparkles className="w-4 h-4 text-yellow-300/70" />
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs mt-0.5 font-light">
                Insights personalizados baseados nos seus dados
              </CardDescription>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center justify-center"
            aria-label={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? (
              <ChevronDown className="w-5 h-5 text-slate-300" />
            ) : (
              <ChevronUp className="w-5 h-5 text-slate-300" />
            )}
          </button>
        </div>
      </CardHeader>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <CardContent className="p-4 space-y-3">
        {trends.map((trend, index) => (
            <motion.div
              key={trend.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.08, 
                duration: 0.5,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ scale: 1.01 }}
            >
              <div 
                className={`
                  relative p-3 rounded-lg border border-white/10
                  bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-white/[0.01]
                  hover:from-white/[0.08] hover:via-white/[0.05] hover:to-white/[0.02]
                  hover:border-white/15 hover:shadow-lg
                  transition-all duration-300 ease-out
                  backdrop-blur-md
                  group
                  overflow-hidden
                `}
              >
                {/* Barra lateral */}
                <div className={`
                  absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
                  bg-gradient-to-b ${trend.color} 
                  group-hover:w-1.5 transition-all duration-300
                `} />

                <div className="pl-2.5 relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      {/* Ícone */}
                      <div className="relative text-2xl filter drop-shadow-lg">
                        {trend.icon}
                      </div>
                      
                      <h4 className="font-semibold text-white text-sm tracking-tight leading-tight">
                        {trend.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.1, type: "spring" }}
                      >
                        <Badge 
                          variant="outline" 
                          className={`${getTypeBadgeColor(trend.type)} text-[10px] font-medium backdrop-blur-sm px-2 py-0.5`}
                        >
                          <span className="mr-1">{getTypeIcon(trend.type)}</span>
                          {getTypeLabel(trend.type)}
                        </Badge>
                      </motion.div>
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-2"></div>

                  {/* Descrição */}
                  <p className="text-xs text-slate-200 mb-2 leading-relaxed font-light">
                    {trend.description}
                  </p>

                  {/* Recomendação */}
                  {trend.recommendation && (
                    <motion.div 
                      className="mt-2 p-2.5 bg-gradient-to-br from-blue-500/[0.08] via-purple-500/[0.06] to-fuchsia-500/[0.04] rounded-lg border border-blue-400/20 backdrop-blur-md relative overflow-hidden"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ delay: index * 0.05 + 0.2 }}
                    >
                      <div className="flex items-start gap-2 relative z-10">
                        <div className="p-1.5 bg-gradient-to-br from-blue-500/25 to-purple-500/25 rounded-md border border-blue-400/25">
                          <Lightbulb className="w-3.5 h-3.5 text-blue-200 flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-blue-200 mb-1 uppercase tracking-wide flex items-center gap-1">
                            <span>💡</span>
                            <span>Recomendação Personalizada</span>
                          </p>
                          <p className="text-xs text-slate-100 leading-relaxed font-light">
                            {trend.recommendation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

        {/* Footer com estatísticas - Design Minimalista */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Positivos */}
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                <TrendingUp className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">
                  {trends.filter(t => t.type === 'positive').length}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Positivos</div>
              </div>
            </div>

            {/* Insights */}
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-400/20">
                <Lightbulb className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">
                  {trends.filter(t => t.type === 'insight').length}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Insights</div>
              </div>
            </div>

            {/* Atenção */}
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-400/20">
                <Info className="w-4 h-4 text-rose-300" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">
                  {trends.filter(t => t.type === 'negative').length}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Atenção</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem final */}
        <motion.div 
          className="text-center mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-white/[0.02] via-white/[0.04] to-white/[0.02] rounded-full border border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: trends.length * 0.05 + 0.3 }}
        >
          <span className="text-xs text-slate-300 font-light">
            Análise baseada em <span className="font-medium text-white">algoritmos inteligentes</span> nos seus dados
          </span>
        </motion.div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}


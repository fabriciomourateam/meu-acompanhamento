import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Star, Zap, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Achievement } from '@/lib/achievement-system';

interface AchievementBadgesProps {
  achievements: Achievement[];
}

export function AchievementBadges({ achievements }: AchievementBadgesProps) {
  const [isMinimized, setIsMinimized] = useState(true);

  if (achievements.length === 0) {
    return null;
  }

  // Agrupar por tipo
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.type]) {
      acc[achievement.type] = [];
    }
    acc[achievement.type].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const typeLabels = {
    weight: { label: 'Perda de Peso', icon: Flame, color: 'text-orange-400' },
    consistency: { label: 'Consistência', icon: Star, color: 'text-blue-400' },
    performance: { label: 'Performance', icon: Zap, color: 'text-green-400' },
    body_fat: { label: 'Composição Corporal', icon: Target, color: 'text-teal-400' },
    milestone: { label: 'Marcos', icon: Trophy, color: 'text-yellow-400' }
  };

  return (
    <Card className="glass-card border-white/10 overflow-hidden bg-gradient-to-br from-slate-900/50 via-slate-800/40 to-slate-900/50 backdrop-blur-3xl shadow-2xl ring-1 ring-white/5">
      <CardHeader className="bg-gradient-to-r from-yellow-500/[0.08] via-orange-500/[0.06] to-pink-500/[0.08] border-b border-white/10 backdrop-blur-xl relative overflow-hidden">
        {/* Efeito de brilho animado */}
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
        <div className="absolute top-2 right-4 w-2 h-2 bg-yellow-400/40 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-6 right-12 w-1.5 h-1.5 bg-orange-400/40 rounded-full blur-sm animate-pulse delay-75"></div>
        <div className="absolute top-4 right-20 w-1 h-1 bg-pink-400/40 rounded-full blur-sm animate-pulse delay-150"></div>
        
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-2 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-pink-500/15 rounded-lg border border-yellow-400/30 shadow-md backdrop-blur-sm relative overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Trophy className="w-5 h-5 text-yellow-200 relative z-10" />
            </motion.div>
            <div>
              <CardTitle className="text-lg text-white font-semibold tracking-tight flex items-center gap-2">
                Conquistas Desbloqueadas
                <Star className="w-4 h-4 text-yellow-300/70" />
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs mt-0.5 font-light">
                {achievements.length} {achievements.length === 1 ? 'conquista alcançada' : 'conquistas alcançadas'}
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
            <CardContent className="p-4 space-y-4">
        {Object.entries(groupedAchievements).map(([type, typeAchievements], groupIndex) => {
          const typeInfo = typeLabels[type as keyof typeof typeLabels];
          const IconComponent = typeInfo.icon;

          return (
            <motion.div 
              key={type} 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <div className="p-1.5 bg-gradient-to-br from-white/10 to-white/5 rounded-md border border-white/10 backdrop-blur-sm">
                  <IconComponent className={`w-4 h-4 ${typeInfo.color}`} />
                </div>
                <h3 className="font-semibold text-white text-sm tracking-tight">{typeInfo.label}</h3>
                <Badge variant="secondary" className="bg-white/10 text-slate-200 border-white/20 backdrop-blur-sm text-xs px-2 py-0.5">
                  {typeAchievements.length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {typeAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      delay: (groupIndex * 0.1) + (index * 0.05),
                      duration: 0.5,
                      type: 'spring',
                      stiffness: 120
                    }}
                    whileHover={{ scale: 1.03, y: -4 }}
                  >
                    <div 
                      className={`
                        relative p-3 rounded-lg border
                        bg-gradient-to-br backdrop-blur-md
                        hover:shadow-lg
                        transition-all duration-300 ease-out
                        cursor-pointer group
                        overflow-hidden
                      `}
                      style={{
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        background: `linear-gradient(135deg, 
                          rgba(255, 255, 255, 0.06) 0%, 
                          rgba(255, 255, 255, 0.03) 50%, 
                          rgba(255, 255, 255, 0.01) 100%
                        )`
                      }}
                    >
                      {/* Overlay colorido sutil */}
                      <div 
                        className={`absolute inset-0 bg-gradient-to-br ${achievement.color} opacity-[0.25] group-hover:opacity-[0.35] transition-opacity duration-300`}
                      />
                      
                      {/* Barra lateral com cor da conquista */}
                      <div className={`
                        absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
                        bg-gradient-to-b ${achievement.color}
                        group-hover:w-1.5 transition-all duration-300
                      `} />

                      {/* Conteúdo */}
                      <div className="relative pl-2.5">
                        <div className="flex items-start gap-3">
                          {/* Ícone */}
                          <div className="relative text-2xl filter drop-shadow-lg">
                            {achievement.icon}
                          </div>

                          {/* Texto */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-sm mb-1 leading-tight">
                              {achievement.title}
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {achievement.description}
                            </p>
                            
                            {achievement.dateAchieved && (
                              <div className="mt-2 pt-2 border-t border-white/10">
                                <p className="text-xs text-slate-400">
                                  {new Date(achievement.dateAchieved).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Badge "Novo" para conquistas recentes */}
                        {achievement.dateAchieved && 
                         (new Date().getTime() - achievement.dateAchieved.getTime()) < 7 * 24 * 60 * 60 * 1000 && (
                          <motion.div 
                            className="absolute -top-1 -right-1"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: (groupIndex * 0.1) + (index * 0.05) + 0.3, type: "spring" }}
                          >
                            <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] px-1.5 py-0.5 shadow-md border border-pink-400/30">
                              ✨ NOVO
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Mensagem motivacional */}
        <motion.div 
          className="p-3 bg-gradient-to-br from-purple-500/[0.08] via-pink-500/[0.06] to-fuchsia-500/[0.04] rounded-lg border border-purple-400/20 backdrop-blur-md relative overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative flex items-center justify-center gap-2">
            <div className="text-lg">🏆</div>
            <p className="text-center text-xs text-slate-200 leading-relaxed font-light">
              <span className="font-medium text-purple-200">
                Continue assim! 
              </span>
              {' '}Cada conquista é uma prova do seu esforço e dedicação.
            </p>
            <div className="text-lg">✨</div>
          </div>
        </motion.div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}


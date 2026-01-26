import { useEffect, useState } from 'react';
import { dietConsumptionService } from '@/lib/diet-consumption-service';
import { Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface StreakHeaderProps {
    patientId: string;
    patientName?: string;
}

export function StreakHeader({ patientId, patientName }: StreakHeaderProps) {
    const [streak, setStreak] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStreak();
    }, [patientId]);

    const loadStreak = async () => {
        try {
            setLoading(true);
            const points = await dietConsumptionService.getPatientPoints(patientId);
            setStreak(points?.current_streak || 0);
        } catch (error) {
            console.error('Erro ao carregar streak:', error);
            setStreak(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 truncate">
                    {patientName || 'Meu Acompanhamento'}
                </h1>

                {/* Streak Badge */}
                {!loading && streak !== null && streak > 0 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-1 rounded-full text-xs font-bold"
                    >
                        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
                        <span>{streak} {streak === 1 ? 'dia' : 'dias'}</span>
                    </motion.div>
                )}
            </div>

            <p className="text-sm sm:text-base text-slate-400">
                Acompanhe seu progresso e conquistas
            </p>
        </div>
    );
}

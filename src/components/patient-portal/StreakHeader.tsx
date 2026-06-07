import { useEffect, useState } from 'react';
import { dietConsumptionService } from '@/lib/diet-consumption-service';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakHeaderProps {
    patientId: string;
    patientName?: string;
    /** Nivel atual (Bronze/Prata/Ouro/Platina/Diamante). Quando presente, vira
     *  chip pequeno embaixo do nome — conecta cabecalho com a gamificacao. */
    levelName?: string | null;
}

/** Saudacao por hora do dia (manha < 12, tarde < 18, noite ate as 4). */
function greetingForNow(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Bom dia';
    if (h >= 12 && h < 18) return 'Boa tarde';
    return 'Boa noite';
}

/** Primeiro nome (ignora 'da', 'de', 'do' como conectivos). */
function firstName(full: string): string {
    const parts = full.trim().split(/\s+/).filter(Boolean);
    return parts[0] || full;
}

export function StreakHeader({ patientId, patientName, levelName }: StreakHeaderProps) {
    const [streak, setStreak] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        dietConsumptionService
            .getPatientPoints(patientId)
            .then((points) => { if (!cancelled) setStreak(points?.current_streak || 0); })
            .catch((error) => {
                console.error('Erro ao carregar streak:', error);
                if (!cancelled) setStreak(0);
            });
        return () => { cancelled = true; };
    }, [patientId]);

    const fullName = patientName || 'Meu Acompanhamento';
    const fn = firstName(fullName);
    // Mostra sobrenome (fonte menor) so quando o nome completo difere do
    // primeiro — confirma identidade mas sem competir com a saudacao.
    const showSurname = fullName.trim() !== fn;

    return (
        <div className="min-w-0">
            {/* whitespace-nowrap mantem 'Bom dia, Deborah 👋' SEMPRE numa linha so.
                Se nao couber, o truncate corta com '...' no fim — melhor que ver
                o emoji 'caindo' pra linha de baixo separado do texto. */}
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight whitespace-nowrap truncate">
                {greetingForNow()}, {fn} <span aria-hidden>👋</span>
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                {showSurname && (
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">{fullName}</p>
                )}
                {streak !== null && streak > 0 && (
                    <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 border border-orange-200 text-orange-600 px-1.5 py-0 text-[10px] font-bold shrink-0"
                    >
                        <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                        {streak} {streak === 1 ? 'dia' : 'dias'}
                    </motion.span>
                )}
                {levelName && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0 text-[10px] font-bold shrink-0">
                        Nível {levelName}
                    </span>
                )}
            </div>
        </div>
    );
}

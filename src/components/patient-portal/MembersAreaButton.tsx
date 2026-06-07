import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MEMBERS_URL = "https://area-de-membros-fabriciomourateam.vercel.app/";

// Vira chip de largura total na sua propria linha do header (abaixo dos
// 3 icones de notificacao/instalar/menu). Como nao concorre por largura
// horizontal, o texto 'Area de Membros' aparece em qualquer breakpoint.
export function MembersAreaButton(_props: { installed?: boolean } = {}) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(MEMBERS_URL, "_blank", "noopener,noreferrer")}
            aria-label="Área de Membros"
            className="h-6 w-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 hover:from-yellow-400 hover:via-amber-300 hover:to-yellow-500 text-white border-transparent shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-yellow-500/30 flex items-center justify-center gap-0.5 font-semibold transition-all duration-300 px-1.5 text-[10px]"
        >
            <Crown className="w-3 h-3 drop-shadow-sm" />
            <span className="drop-shadow-sm">Área de Membros</span>
        </Button>
    );
}

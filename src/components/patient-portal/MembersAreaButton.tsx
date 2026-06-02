import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MEMBERS_URL = "https://area-de-membros-fabriciomourateam.vercel.app/";

// `installed`: quando o PWA está instalado, o botão de instalar some do topo no
// mobile, sobra espaço e mostramos coroa + "Área de Membros" (fonte menor no
// mobile). Enquanto não instalado (dois botões no topo), fica só a coroa.
export function MembersAreaButton({ installed = false }: { installed?: boolean }) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(MEMBERS_URL, "_blank", "noopener,noreferrer")}
            aria-label="Área de Membros"
            className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 hover:from-yellow-400 hover:via-amber-300 hover:to-yellow-500 text-white border-transparent shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-yellow-500/50 hover:-translate-y-0.5 flex items-center gap-2 font-bold transition-all duration-300"
        >
            <Crown className="w-5 h-5 drop-shadow-sm" />
            <span className={cn('drop-shadow-sm', installed ? 'inline text-[11px] sm:text-sm' : 'hidden sm:inline')}>
                Área de Membros
            </span>
        </Button>
    );
}

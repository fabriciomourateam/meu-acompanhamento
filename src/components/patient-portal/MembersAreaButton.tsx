import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MEMBERS_URL = "https://area-de-membros-fabriciomourateam.vercel.app/";

// No mobile o botão fica ícone-só (coroa) tanto instalado quanto não-instalado,
// pra não brigar por largura com o restante do cabeçalho (avatar, nome,
// notificações, instalar, menu). No desktop mostra "Área de Membros".
export function MembersAreaButton(_props: { installed?: boolean } = {}) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(MEMBERS_URL, "_blank", "noopener,noreferrer")}
            aria-label="Área de Membros"
            className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 hover:from-yellow-400 hover:via-amber-300 hover:to-yellow-500 text-white border-transparent shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-yellow-500/50 hover:-translate-y-0.5 flex items-center gap-2 font-bold transition-all duration-300 px-2 sm:px-3"
        >
            <Crown className="w-5 h-5 drop-shadow-sm" />
            <span className="hidden sm:inline drop-shadow-sm">
                Área de Membros
            </span>
        </Button>
    );
}

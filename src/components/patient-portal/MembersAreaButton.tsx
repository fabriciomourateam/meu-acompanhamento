import { useState, useEffect } from 'react';
import { Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

const MEMBERS_URL = "https://area-de-membros-fabriciomourateam.vercel.app/";

export function MembersAreaButton() {
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const buttonContent = (
        <Button
            variant="outline"
            size="sm"
            onClick={isMobile ? () => window.open(MEMBERS_URL, "_blank") : undefined}
            className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 hover:from-yellow-400 hover:via-amber-300 hover:to-yellow-500 text-white border-transparent shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-yellow-500/50 hover:-translate-y-0.5 flex items-center gap-2 font-bold transition-all duration-300"
        >
            <Crown className="w-5 h-5 drop-shadow-sm" />
            <span className="hidden sm:inline drop-shadow-sm">Área de Membros</span>
            <span className="sm:hidden drop-shadow-sm">Membros</span>
        </Button>
    );

    if (isMobile) {
        return buttonContent;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {buttonContent}
            </DialogTrigger>

            <DialogContent className="max-w-none w-screen h-[100dvh] sm:w-full sm:max-w-[95vw] sm:h-[90vh] p-0 flex flex-col overflow-hidden bg-slate-950 border-0 sm:border sm:border-slate-800 shadow-2xl rounded-none sm:rounded-xl gap-0">
                <DialogHeader className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 flex flex-row items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10 shrink-0">
                    <DialogTitle className="text-white flex items-center gap-2.5 m-0 text-base sm:text-lg font-bold tracking-wide">
                        <Crown className="w-6 h-6 text-amber-400" />
                        Área de Membros Exclusiva
                    </DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(false)}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 rounded-full"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                </DialogHeader>

                <div className="flex-1 w-full bg-slate-900 overflow-hidden relative">
                    <iframe
                        src={MEMBERS_URL}
                        className="absolute inset-0 w-full h-full border-0"
                        title="Área de Membros Fabricio Moura Team"
                        allowFullScreen
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

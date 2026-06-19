import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstallPWAButtonProps {
  className?: string;
}

/**
 * Botão "Instalar App" do header do portal. Abre a página /instalar (fonte única
 * de instalação: APK do Android + vídeos + passos). Some quando o app já está
 * rodando instalado (standalone).
 */
export function InstallPWAButton({ className }: InstallPWAButtonProps = {}) {
  const navigate = useNavigate();
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsInstalled(
        window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true,
      );
    check();
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener?.('change', check);
    return () => mq.removeEventListener?.('change', check);
  }, []);

  if (isInstalled) {
    return null; // Não mostrar se já estiver instalado
  }

  return (
    <Button
      onClick={() => navigate('/instalar')}
      size="sm"
      aria-label="Instalar app"
      className={cn(
        'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all px-2 sm:px-3',
        className,
      )}
    >
      <Download className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Instalar App</span>
    </Button>
  );
}

export default InstallPWAButton;

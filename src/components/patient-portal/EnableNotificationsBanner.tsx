import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pushService } from '@/lib/push-service';
import { InstallPWAButton } from '@/components/InstallPWAButton';

interface Props {
  patientId: string;
  /** Aluno do dono (Fabricio) → "Como instalar" abre a página /instalar; os demais
   *  treinadores veem o modal genérico de instruções. */
  isOwner?: boolean;
}

// Quando o aluno dispensa (X), guarda o TIMESTAMP. O banner volta a aparecer
// depois de SNOOZE_DAYS dias se ele ainda não instalou/ativou (em vez de sumir
// pra sempre). Chave nova: ignora o valor '1' legado (faz reaparecer 1x).
const DISMISS_KEY = 'notif-banner-dismissed-at';
const SNOOZE_DAYS = 7;

/**
 * Convite visível para o aluno ATIVAR os lembretes/avisos por push.
 * Aparece logo abaixo do cabeçalho na primeira visita e some quando:
 *  - já está inscrito neste aparelho;
 *  - o aluno dispensa (X) — fica guardado no localStorage;
 *  - o navegador não suporta push.
 * No iPhone fora do app instalado, mostra a dica de adicionar à Tela de Início.
 */
export function EnableNotificationsBanner({ patientId, isOwner }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  const iosNeedsInstall = pushService.isIOS() && !pushService.isStandalone();

  useEffect(() => {
    if (!patientId) return;
    if (!pushService.isSupported() && !iosNeedsInstall) return;
    // Soneca de 7 dias: se dispensou há menos que isso, não mostra ainda.
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < SNOOZE_DAYS * 24 * 60 * 60 * 1000) return;
    // Só mostra se ainda não estiver inscrito neste aparelho.
    pushService.isSubscribed().then((sub) => setVisible(!sub));
  }, [patientId, iosNeedsInstall]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleEnable = async () => {
    setBusy(true);
    try {
      const res = await pushService.subscribe(patientId);
      if (res.ok) {
        toast({ title: 'Lembretes ativados! 🔔', description: 'Você será avisado das novidades e do seu check-in.' });
        setVisible(false);
      } else if (res.reason === 'ios-needs-install') {
        toast({
          title: 'Instale o app primeiro',
          description: 'No iPhone: Compartilhar → "Adicionar à Tela de Início" e abra por lá.',
          variant: 'destructive',
        });
      } else if (res.reason === 'denied') {
        toast({
          title: 'Permissão negada',
          description: 'Você bloqueou as notificações. Habilite nas configurações do navegador.',
          variant: 'destructive',
        });
        dismiss();
      } else {
        toast({ title: 'Não foi possível ativar', description: 'Tente novamente.', variant: 'destructive' });
      }
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="hide-in-pdf mx-auto mb-4 flex max-w-3xl items-center gap-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
        <BellRing className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">Ative seus lembretes</p>
        <p className="text-xs text-slate-600">
          {iosNeedsInstall
            ? 'No iPhone, instale o app na Tela de Início para receber as respostas do Fabricio e seus avisos.'
            : 'Receba as respostas do Fabricio, avisos da sua dieta e o lembrete do check-in.'}
        </p>
      </div>
      {iosNeedsInstall ? (
        <button
          onClick={() => (isOwner ? navigate('/instalar') : setShowInstall(true))}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Como instalar
        </button>
      ) : (
        <button
          onClick={handleEnable}
          disabled={busy}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ativar'}
        </button>
      )}
      <button onClick={dismiss} aria-label="Dispensar" className="shrink-0 text-slate-400 hover:text-slate-600">
        <X className="h-4 w-4" />
      </button>

      {/* Modal de instruções de instalação (alunos de outros treinadores). */}
      <InstallPWAButton triggerless open={showInstall} onOpenChange={setShowInstall} />
    </div>
  );
}

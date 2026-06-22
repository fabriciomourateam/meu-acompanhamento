import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, Download, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pushService } from '@/lib/push-service';
import { InstallPWAButton } from '@/components/InstallPWAButton';

interface Props {
  patientId: string;
  /** Aluno do dono (Fabricio) → "Como instalar" abre a página /instalar; os demais
   *  treinadores veem o modal genérico de instruções. */
  isOwner?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Quando o aluno dispensa (X), guarda o TIMESTAMP. O banner volta a aparecer
// depois de SNOOZE_DAYS dias se ele ainda não instalou/ativou (em vez de sumir
// pra sempre). Cada novo X reinicia a contagem. Chave nova: ignora o valor '1'
// legado (faz reaparecer 1x pra quem já tinha dispensado o banner antigo).
const DISMISS_KEY = 'notif-banner-dismissed-at';
const SNOOZE_DAYS = 7;
// Folga pra deixar o Chrome disparar o beforeinstallprompt antes de decidirmos o
// texto, evitando o banner trocar de "Ativar" pra "Instalar" na cara do aluno.
const SETTLE_MS = 1000;

/**
 * Convite progressivo logo abaixo do cabeçalho:
 *  1) se o app ainda NÃO está instalado e dá pra instalar neste aparelho
 *     (iPhone via "Tela de Início"; Android/desktop via prompt nativo do Chrome/Edge),
 *     empurra a INSTALAÇÃO;
 *  2) se já está instalado mas as notificações estão desligadas, empurra ATIVAR push.
 *
 * Some quando: já está inscrito; o aluno dispensa (X) — volta depois de 7 dias;
 * ou não há nada a oferecer (sem suporte a push e sem como instalar).
 */
export function EnableNotificationsBanner({ patientId, isOwner }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ready, setReady] = useState(false);

  const isStandalone = pushService.isStandalone();
  const iosNeedsInstall = pushService.isIOS() && !isStandalone;
  // Android/desktop só contam como "instalável" quando o navegador oferece o
  // prompt nativo (beforeinstallprompt). Assim não enchemos o saco de quem usa
  // um navegador sem suporte a instalação (ex.: Firefox desktop).
  const canPromptInstall = !isStandalone && !!deferredPrompt;
  const needsInstall = iosNeedsInstall || canPromptInstall;

  // Captura o evento de instalação do Chrome/Edge (Android e desktop).
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Espera a folga pra só então decidir/mostrar (ver SETTLE_MS).
  useEffect(() => {
    const t = setTimeout(() => setReady(true), SETTLE_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!patientId || !ready) return;
    // Nada a oferecer: nem dá pra instalar, nem dá pra ativar push.
    if (!needsInstall && !pushService.isSupported()) return;
    // Soneca de 7 dias: se dispensou há menos que isso, não mostra ainda.
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < SNOOZE_DAYS * 24 * 60 * 60 * 1000) return;
    // Quem já recebe avisos neste aparelho não é incomodado — nem pra ativar,
    // nem pra instalar. Caso contrário, mostra (modo instalar tem prioridade).
    pushService.isSubscribed().then((sub) => setVisible(!sub));
  }, [patientId, needsInstall, ready]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleInstall = async () => {
    // Android/desktop: dispara o prompt nativo do navegador.
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        toast({ title: 'App instalado! 🎉', description: 'Abra pelo ícone na tela inicial pra ativar os lembretes.' });
        setVisible(false);
      }
      return;
    }
    // iPhone/iPad (e fallback): mostra as instruções de "Adicionar à Tela de Início".
    if (isOwner) navigate('/instalar');
    else setShowInstall(true);
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
    <div className="hide-in-pdf mx-auto mb-4 flex max-w-3xl items-center gap-3 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-gradient-to-r from-indigo-50 dark:from-indigo-500/10 to-blue-50 dark:to-slate-800 px-4 py-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
        {needsInstall ? <Download className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {needsInstall ? 'Instale o app' : 'Ative seus lembretes'}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {needsInstall
            ? 'Tenha o app na tela inicial pra abrir rápido e receber as respostas do Fabricio e seus avisos.'
            : 'Receba as respostas do Fabricio, avisos da sua dieta e o lembrete do check-in.'}
        </p>
      </div>
      {needsInstall ? (
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          {deferredPrompt ? 'Instalar' : 'Como instalar'}
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
      <button onClick={dismiss} aria-label="Dispensar" className="shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600">
        <X className="h-4 w-4" />
      </button>

      {/* Modal de instruções de instalação (alunos de outros treinadores). */}
      <InstallPWAButton triggerless open={showInstall} onOpenChange={setShowInstall} />
    </div>
  );
}

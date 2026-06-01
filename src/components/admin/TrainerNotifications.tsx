import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing, Check, Loader2, Smartphone, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { pushService, type PortalNotification } from '@/lib/push-service';

interface TrainerNotificationsProps {
  trainerId: string;
}

// Destaque por tipo (barra lateral) — diferencia avisos do treinador.
function typeAccent(type: string): string {
  switch (type) {
    case 'workout_finished':
      return 'border-l-2 border-emerald-400';
    case 'inactive':
      return 'border-l-2 border-amber-400';
    case 'community':
      return 'border-l-2 border-violet-400';
    default:
      return '';
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function TrainerNotifications({ trainerId }: TrainerNotificationsProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number; width: number }>({ top: 64, right: 16, width: 320 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    if (!trainerId) return;
    setUnread(await pushService.getUnreadCountTrainer(trainerId));
  }, [trainerId]);

  const loadList = useCallback(async () => {
    if (!trainerId) return;
    setItems(await pushService.getNotificationsTrainer(trainerId, 30));
  }, [trainerId]);

  useEffect(() => {
    if (!trainerId) return;
    refreshCount();
    pushService.isSubscribed().then(setSubscribed);
    const t = setInterval(refreshCount, 60000);
    return () => clearInterval(t);
  }, [trainerId, refreshCount]);

  // Calcula a posição do painel a partir do botão (portal -> fixed).
  const reposition = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(320, window.innerWidth - 16);
    const maxRight = Math.max(8, window.innerWidth - width - 8);
    const right = Math.min(Math.max(window.innerWidth - r.right, 8), maxRight);
    setPos({ top: r.bottom + 8, right, width });
  }, []);

  const toggleOpen = () => {
    if (!open) {
      reposition();
      loadList();
    }
    setOpen((o) => !o);
  };

  // Fecha ao clicar fora / reposiciona no scroll/resize.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onMove = () => reposition();
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, reposition]);

  const handleToggleSubscribe = async (next: boolean) => {
    setBusy(true);
    try {
      if (next) {
        const res = await pushService.subscribeTrainer(trainerId);
        if (res.ok) {
          setSubscribed(true);
          toast({ title: 'Notificações ativadas! 🔔', description: 'Você será avisado neste aparelho.' });
        } else if (res.reason === 'ios-needs-install') {
          toast({
            title: 'Instale o app primeiro',
            description: 'No iPhone: toque em Compartilhar → "Adicionar à Tela de Início" e abra por lá para ativar as notificações.',
            variant: 'destructive',
          });
        } else if (res.reason === 'denied') {
          toast({
            title: 'Permissão negada',
            description: 'Você bloqueou as notificações. Habilite nas configurações do navegador.',
            variant: 'destructive',
          });
        } else if (res.reason === 'unsupported') {
          toast({ title: 'Navegador sem suporte', description: 'Este navegador não suporta notificações.', variant: 'destructive' });
        } else {
          toast({ title: 'Não foi possível ativar', description: 'Tente novamente.', variant: 'destructive' });
        }
      } else {
        await pushService.unsubscribe();
        setSubscribed(false);
        toast({ title: 'Notificações desativadas neste aparelho' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleClickItem = async (n: PortalNotification) => {
    if (!n.read) {
      await pushService.markReadTrainer(trainerId, n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
      refreshCount();
    }
    if (n.url && n.url !== '/') window.location.href = n.url;
  };

  const handleMarkAll = async () => {
    await pushService.markReadTrainer(trainerId);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnread(0);
  };

  const iosNeedsInstall = pushService.isIOS() && !pushService.isStandalone();

  const panel = (
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: pos.top, right: pos.right, width: pos.width, zIndex: 2147483000 }}
      className="max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold text-slate-900">Notificações</span>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button onClick={handleMarkAll} className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900">
              <Check className="h-3 w-3" /> Marcar lidas
            </button>
          )}
          <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ativar push neste aparelho */}
      <div className="flex items-center justify-between gap-2 border-b bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Smartphone className="h-4 w-4 text-slate-400" />
          <span>Avisos neste aparelho</span>
        </div>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <button
            disabled={iosNeedsInstall}
            onClick={() => handleToggleSubscribe(!subscribed)}
            className={`h-7 rounded-lg px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              subscribed
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {subscribed ? 'Ativado' : 'Ativar'}
          </button>
        )}
      </div>
      {iosNeedsInstall && (
        <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-700">
          No iPhone, adicione o app à Tela de Início (Compartilhar → "Adicionar à Tela de Início") e abra por lá para receber notificações.
        </div>
      )}

      <div className="max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">Nenhuma notificação ainda.</div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => handleClickItem(n)}
                  className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-slate-50 ${typeAccent(n.type)} ${
                    n.read ? '' : 'bg-emerald-50/60'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className={`text-sm text-slate-900 ${n.read ? 'font-normal' : 'font-semibold'}`}>{n.title}</span>
                    <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body && <span className="text-xs text-slate-500">{n.body}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        aria-label="Notificações"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        {unread > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unread > 0 && (
          <Badge
            className="absolute -right-1.5 -top-1.5 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
            variant="destructive"
          >
            {unread > 9 ? '9+' : unread}
          </Badge>
        )}
      </button>
      {open && typeof document !== 'undefined' && createPortal(panel, document.body)}
    </>
  );
}

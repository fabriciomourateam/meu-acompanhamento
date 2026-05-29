import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellRing, Check, Loader2, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { pushService, type PortalNotification } from '@/lib/push-service';

interface PatientNotificationsProps {
  patientId: string;
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

export function PatientNotifications({ patientId }: PatientNotificationsProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    if (!patientId) return;
    setUnread(await pushService.getUnreadCount(patientId));
  }, [patientId]);

  const loadList = useCallback(async () => {
    if (!patientId) return;
    setItems(await pushService.getNotifications(patientId, 30));
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    refreshCount();
    pushService.isSubscribed().then(setSubscribed);
    const t = setInterval(refreshCount, 60000);
    return () => clearInterval(t);
  }, [patientId, refreshCount]);

  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleToggleSubscribe = async (next: boolean) => {
    setBusy(true);
    try {
      if (next) {
        const res = await pushService.subscribe(patientId);
        if (res.ok) {
          setSubscribed(true);
          toast({ title: 'Notificações ativadas! 🔔', description: 'Você será avisado por aqui.' });
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
      await pushService.markRead(patientId, n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
      refreshCount();
    }
    if (n.url && n.url !== '/') window.location.href = n.url;
  };

  const handleMarkAll = async () => {
    await pushService.markRead(patientId);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnread(0);
  };

  const iosNeedsInstall = pushService.isIOS() && !pushService.isStandalone();

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Notificações"
        onClick={() => setOpen((o) => !o)}
      >
        {unread > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unread > 0 && (
          <Badge
            className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
            variant="destructive"
          >
            {unread > 9 ? '9+' : unread}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold text-slate-900">Notificações</span>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button onClick={handleMarkAll} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900">
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
              <Button
                size="sm"
                variant={subscribed ? 'default' : 'outline'}
                disabled={iosNeedsInstall}
                onClick={() => handleToggleSubscribe(!subscribed)}
                className="h-7 px-3 text-xs"
              >
                {subscribed ? 'Ativado' : 'Ativar'}
              </Button>
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
                      className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-slate-50 ${
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
      )}
    </div>
  );
}

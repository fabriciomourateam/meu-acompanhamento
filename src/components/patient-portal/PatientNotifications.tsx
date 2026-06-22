import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing, Check, Loader2, Settings, Smartphone, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { pushService, type PortalNotification } from '@/lib/push-service';
import {
  notificationPrefsService,
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from '@/lib/notification-prefs-service';

interface PatientNotificationsProps {
  patientId: string;
}

// Destaque por tipo (barra lateral). Periodização/PR vêm espelhadas da
// tabela patient_notifications; ganham cor pra diferenciar de avisos comuns.
function typeAccent(type: string): string {
  switch (type) {
    case 'periodization_advance':
      return 'border-l-2 border-emerald-400';
    case 'periodization_skipped':
      return 'border-l-2 border-amber-400';
    case 'periodization_completed':
      return 'border-l-2 border-violet-400';
    case 'pr_achieved':
      return 'border-l-2 border-yellow-400';
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

export function PatientNotifications({ patientId }: PatientNotificationsProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [muted, setMuted] = useState<NotificationCategory[]>([]);
  const [prefsBusy, setPrefsBusy] = useState<NotificationCategory | null>(null);
  const [pos, setPos] = useState<{ top: number; right: number; width: number }>({ top: 64, right: 16, width: 320 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    if (!patientId) return;
    setUnread(await pushService.getUnreadCount(patientId));
  }, [patientId]);

  const loadList = useCallback(async () => {
    if (!patientId) return;
    setItems(await pushService.getNotifications(patientId, 30));
  }, [patientId]);

  const loadMuted = useCallback(async () => {
    if (!patientId) return;
    setMuted(await notificationPrefsService.getMuted(patientId));
  }, [patientId]);

  const handleTogglePref = async (key: NotificationCategory, enabled: boolean) => {
    // enabled = aluno QUER receber → muted = !enabled
    setPrefsBusy(key);
    try {
      const next = await notificationPrefsService.set(patientId, key, !enabled);
      setMuted(next);
      // reflete na hora no sino e no contador
      await Promise.all([loadList(), refreshCount()]);
    } finally {
      setPrefsBusy(null);
    }
  };

  useEffect(() => {
    if (!patientId) return;
    refreshCount();
    pushService.isSubscribed().then(setSubscribed);
    const t = setInterval(refreshCount, 60000);
    return () => clearInterval(t);
  }, [patientId, refreshCount]);

  // Calcula a posição do painel a partir do botão (portal -> fixed).
  const reposition = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(320, window.innerWidth - 16);
    // Garante que o painel nunca saia da tela (esquerda nem direita), com margem de 8px.
    const maxRight = Math.max(8, window.innerWidth - width - 8);
    const right = Math.min(Math.max(window.innerWidth - r.right, 8), maxRight);
    setPos({ top: r.bottom + 8, right, width });
  }, []);

  const toggleOpen = () => {
    if (!open) {
      reposition();
      loadList();
      loadMuted();
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

  const panel = (
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: pos.top, right: pos.right, width: pos.width, zIndex: 2147483000 }}
      className="max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold text-slate-900 dark:text-slate-100">Notificações</span>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button onClick={handleMarkAll} className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900">
              <Check className="h-3 w-3" /> Marcar lidas
            </button>
          )}
          <button
            onClick={() => setShowPrefs((s) => !s)}
            aria-label="Preferências de notificação"
            className={`transition-colors ${showPrefs ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'}`}
          >
            <Settings className="h-4 w-4" />
          </button>
          <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-slate-400 dark:text-slate-500 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preferências: o que aparece aqui no sino. Não afeta o chat. */}
      {showPrefs && (
        <div className="border-b bg-white dark:bg-slate-900 px-4 py-3">
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            Escolha o que aparece aqui. As mensagens do Fabricio (chat) sempre chegam.
          </p>
          <ul className="space-y-2.5">
            {NOTIFICATION_CATEGORIES.map((cat) => {
              const enabled = !muted.includes(cat.key);
              const isBusy = prefsBusy === cat.key;
              return (
                <li key={cat.key} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{cat.label}</p>
                    <p className="text-[11px] leading-tight text-slate-400 dark:text-slate-500">{cat.description}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`${enabled ? 'Desativar' : 'Ativar'} ${cat.label}`}
                    disabled={isBusy}
                    onClick={() => handleTogglePref(cat.key, !enabled)}
                    className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors disabled:opacity-50 ${
                      enabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-900 shadow transition-transform ${
                        enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Ativar push neste aparelho */}
      <div className="flex items-center justify-between gap-2 border-b bg-slate-50 dark:bg-slate-900 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <Smartphone className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <span>Avisos neste aparelho</span>
        </div>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400 dark:text-slate-500" />
        ) : (
          <button
            disabled={iosNeedsInstall}
            onClick={() => handleToggleSubscribe(!subscribed)}
            className={`h-7 rounded-lg px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              subscribed
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-emerald-300 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50'
            }`}
          >
            {subscribed ? 'Ativado' : 'Ativar'}
          </button>
        )}
      </div>
      {iosNeedsInstall && (
        <div className="border-b bg-amber-50 dark:bg-amber-950/40 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
          No iPhone, adicione o app à Tela de Início (Compartilhar → "Adicionar à Tela de Início") e abra por lá para receber notificações.
        </div>
      )}

      <div className="max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">Nenhuma notificação ainda.</div>
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
                    <span className={`text-sm text-slate-900 dark:text-slate-100 ${n.read ? 'font-normal' : 'font-semibold'}`}>{n.title}</span>
                    <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body && <span className="text-xs text-slate-500 dark:text-slate-400">{n.body}</span>}
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
        className="relative inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-100"
      >
        {unread > 0 ? <BellRing className="h-4 w-4 sm:h-5 sm:w-5" /> : <Bell className="h-4 w-4 sm:h-5 sm:w-5" />}
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

// Sino de notificações do aluno (auto-avanço de periodização — Pilar 5).
// Token-driven: lista via list_patient_notifications_by_token, marca lidas via
// mark_notification_read_by_token. Badge de não-lidas + popover com banners
// coloridos por tipo.
import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { workoutExtrasService, type PatientNotification } from '@/lib/workout/workout-extras-service';

interface Props {
  token: string;
  /** Callback ao tocar numa notificação (ex.: navegar pro hub de treino). */
  onNavigate?: (notification: PatientNotification) => void;
}

// Cor do banner por tipo (doc seção 5): advance=positivo, skipped=atenção,
// completed=celebração, pr_achieved=conquista (dourado). Fallback neutro.
function typeStyles(type: string): string {
  switch (type) {
    case 'periodization_advance':
      return 'border-emerald-200 bg-emerald-50';
    case 'periodization_skipped':
      return 'border-amber-200 bg-amber-50';
    case 'periodization_completed':
      return 'border-violet-200 bg-violet-50';
    case 'pr_achieved':
      return 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50';
    default:
      return 'border-slate-200 bg-slate-50';
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

export function NotificationsBell({ token, onNavigate }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<PatientNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Guarda o maior created_at já visto, pra detectar nova notificação (toast).
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);

  const unread = items.filter((n) => !n.read_at).length;

  const load = useCallback(async (announce: boolean) => {
    if (!token) return;
    try {
      const data = await workoutExtrasService.listNotifications(token, 20);
      setItems(data);
      if (announce && data.length > 0) {
        const newest = data[0];
        if (lastSeenAt && newest.created_at > lastSeenAt && !newest.read_at) {
          toast({ title: newest.title, description: newest.body });
        }
      }
      if (data.length > 0) setLastSeenAt((prev) => (prev && prev > data[0].created_at ? prev : data[0].created_at));
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  }, [token, lastSeenAt, toast]);

  // Carga inicial + polling leve (60s) pra pegar notificações do cron.
  useEffect(() => {
    void load(false);
    const id = setInterval(() => void load(true), 60_000);
    return () => clearInterval(id);
  }, [load]);

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (next && unread > 0) {
      // Marca todas as não-lidas como lidas ao abrir.
      setLoading(true);
      const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id);
      try {
        await Promise.all(unreadIds.map((id) => workoutExtrasService.markNotificationRead(token, id)));
        const now = new Date().toISOString();
        setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
      } catch (err) {
        console.error('Erro ao marcar notificações como lidas:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTap = (n: PatientNotification) => {
    setOpen(false);
    onNavigate?.(n);
  };

  return (
    <>
      <button
        onClick={() => void handleOpenChange(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm transition hover:bg-slate-50"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="border-b border-slate-100 px-4 py-3">
            <DialogTitle className="text-base">Notificações</DialogTitle>
          </DialogHeader>
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm italic text-slate-400">
              {loading ? 'Carregando…' : 'Nenhuma notificação ainda.'}
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-2 overflow-y-auto p-3">
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleTap(n)}
                  className={`block w-full rounded-lg border p-2.5 text-left transition hover:brightness-[0.98] ${typeStyles(n.type)} ${n.read_at ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">{n.title}</span>
                    <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{n.body}</p>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

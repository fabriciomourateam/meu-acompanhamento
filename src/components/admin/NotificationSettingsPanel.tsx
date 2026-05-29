import { useEffect, useState } from 'react';
import { Bell, Loader2, Plus, Trash2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  notificationSettingsService,
  type NotificationSettings,
  type ReminderItem,
} from '@/lib/notification-settings-service';
import { pushService, type PortalNotification } from '@/lib/push-service';

interface Props {
  trainerUserId: string;
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
      <Button
        type="button"
        size="sm"
        variant={checked ? 'default' : 'outline'}
        onClick={() => onChange(!checked)}
        className="h-7 w-20 text-xs"
      >
        {checked ? 'Ativado' : 'Desativado'}
      </Button>
    </div>
  );
}

export function NotificationSettingsPanel({ trainerUserId }: Props) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busyPush, setBusyPush] = useState(false);
  const [recent, setRecent] = useState<PortalNotification[]>([]);

  useEffect(() => {
    if (!trainerUserId) return;
    notificationSettingsService.get(trainerUserId).then(setSettings);
    pushService.isSubscribed().then(setSubscribed);
    pushService.getNotificationsTrainer(trainerUserId, 15).then(setRecent);
  }, [trainerUserId]);

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const patch = (p: Partial<NotificationSettings>) => setSettings((s) => (s ? { ...s, ...p } : s));

  const updateReminder = (i: number, field: keyof ReminderItem, value: string) => {
    const next = settings.reminders.map((r, idx) => (idx === i ? { ...r, [field]: value } : r));
    patch({ reminders: next });
  };
  const addReminder = () =>
    patch({ reminders: [...settings.reminders, { time: '08:00', title: 'Bom dia! ☀️', body: 'Não esqueça de registrar seu peso e fazer o check-in de hoje.' }] });
  const removeReminder = (i: number) => patch({ reminders: settings.reminders.filter((_, idx) => idx !== i) });

  const handleSave = async () => {
    setSaving(true);
    const res = await notificationSettingsService.update(trainerUserId, settings);
    setSaving(false);
    if (res) {
      setSettings(res);
      toast({ title: 'Configurações salvas! ✅' });
    } else {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
  };

  const handleEnablePush = async () => {
    setBusyPush(true);
    try {
      if (!subscribed) {
        const res = await pushService.subscribeTrainer(trainerUserId);
        if (res.ok) {
          setSubscribed(true);
          toast({ title: 'Notificações ativadas neste aparelho! 🔔' });
        } else if (res.reason === 'ios-needs-install') {
          toast({ title: 'Instale o app primeiro', description: 'No iPhone, adicione à Tela de Início e abra por lá.', variant: 'destructive' });
        } else {
          toast({ title: 'Não foi possível ativar', description: res.reason, variant: 'destructive' });
        }
      } else {
        await pushService.unsubscribe();
        setSubscribed(false);
        toast({ title: 'Notificações desativadas neste aparelho' });
      }
    } finally {
      setBusyPush(false);
    }
  };

  const inputCls = 'rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none';

  return (
    <div className="space-y-6">
      {/* Push deste aparelho */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Receber avisos neste aparelho</p>
              <p className="text-xs text-slate-500">Novos posts e alunos inativos chegam como notificação aqui.</p>
            </div>
          </div>
          <Button size="sm" variant={subscribed ? 'default' : 'outline'} onClick={handleEnablePush} disabled={busyPush}>
            {busyPush ? <Loader2 className="h-4 w-4 animate-spin" /> : subscribed ? 'Ativado' : 'Ativar'}
          </Button>
        </div>
      </div>

      {/* Toggles de gatilhos */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Quando notificar</h3>
        <Toggle label="Nova dieta liberada" hint="Avisa o aluno quando você libera a dieta." checked={settings.diet_enabled} onChange={(v) => patch({ diet_enabled: v })} />
        <Toggle label="Atividade na comunidade" hint="Novos posts (pra você) e respostas (pro autor)." checked={settings.community_enabled} onChange={(v) => patch({ community_enabled: v })} />
      </div>

      {/* Lembretes diários */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <Toggle label="Lembretes diários" hint="Push automático para todos os seus alunos nos horários abaixo." checked={settings.reminders_enabled} onChange={(v) => patch({ reminders_enabled: v })} />
        {settings.reminders_enabled && (
          <div className="mt-3 space-y-3">
            {settings.reminders.map((r, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <input type="time" step={900} value={r.time} onChange={(e) => updateReminder(i, 'time', e.target.value)} className={inputCls} />
                  <button onClick={() => removeReminder(i)} className="ml-auto text-slate-400 hover:text-red-500" aria-label="Remover">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input value={r.title} onChange={(e) => updateReminder(i, 'title', e.target.value)} placeholder="Título" className={`${inputCls} mb-2 w-full`} />
                <textarea value={r.body} onChange={(e) => updateReminder(i, 'body', e.target.value)} placeholder="Mensagem" rows={2} className={`${inputCls} w-full`} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addReminder} className="gap-1">
              <Plus className="h-4 w-4" /> Adicionar horário
            </Button>
            <p className="text-xs text-slate-400">Fuso: {settings.timezone}. Horários em múltiplos de 15 minutos.</p>
          </div>
        )}
      </div>

      {/* Aluno inativo */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <Toggle label="Aluno inativo" hint="Cutuca o aluno (e te avisa) após X dias sem check-in." checked={settings.inactive_enabled} onChange={(v) => patch({ inactive_enabled: v })} />
        {settings.inactive_enabled && (
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Dias sem check-in:
              <input type="number" min={1} max={365} value={settings.inactive_days} onChange={(e) => patch({ inactive_days: parseInt(e.target.value || '45', 10) })} className={`${inputCls} w-20`} />
            </label>
            <input value={settings.inactive_patient_title} onChange={(e) => patch({ inactive_patient_title: e.target.value })} placeholder="Título para o aluno" className={`${inputCls} w-full`} />
            <textarea value={settings.inactive_patient_body} onChange={(e) => patch({ inactive_patient_body: e.target.value })} placeholder="Mensagem para o aluno" rows={2} className={`${inputCls} w-full`} />
            <Toggle label="Me avisar também" checked={settings.notify_trainer_on_inactive} onChange={(v) => patch({ notify_trainer_on_inactive: v })} />
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Salvar configurações
      </Button>

      {/* Notificações recentes do treinador */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Bell className="h-4 w-4" /> Suas notificações recentes
        </h3>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-400">Nada por aqui ainda.</p>
        ) : (
          <ul className="divide-y">
            {recent.map((n) => (
              <li key={n.id} className="py-2">
                <p className="text-sm font-medium text-slate-800">{n.title}</p>
                {n.body && <p className="text-xs text-slate-500">{n.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

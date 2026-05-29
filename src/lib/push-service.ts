import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Web Push + sino in-app (lado do aluno).
// Segue o mesmo modelo das RPCs da Comunidade: o cliente passa o patientId e
// o servidor (SECURITY DEFINER) opera em nome dele.
// ---------------------------------------------------------------------------

export interface PortalNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export const pushService = {
  /** Push é suportado neste navegador? (No iOS exige PWA instalado.) */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  /** iOS só permite push quando o app foi adicionado à tela de início (standalone). */
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  isStandalone(): boolean {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // @ts-expect-error propriedade não-padrão do Safari iOS
      window.navigator.standalone === true
    );
  },

  permission(): NotificationPermission {
    return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
  },

  /** Já existe uma inscrição ativa neste dispositivo? */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  },

  /** Pede permissão, inscreve no Web Push e salva no Supabase. */
  async subscribe(patientId: string): Promise<{ ok: boolean; reason?: string }> {
    if (!this.isSupported()) return { ok: false, reason: 'unsupported' };
    if (this.isIOS() && !this.isStandalone()) return { ok: false, reason: 'ios-needs-install' };

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'denied' };

    const { data: publicKey, error: keyErr } = await supabase.rpc('get_push_public_key');
    if (keyErr || !publicKey) return { ok: false, reason: 'no-key' };

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey as string),
      });
    }

    const json = sub.toJSON();
    const p256dh = json.keys?.p256dh ?? arrayBufferToBase64(sub.getKey('p256dh'));
    const auth = json.keys?.auth ?? arrayBufferToBase64(sub.getKey('auth'));

    const { error } = await supabase.rpc('push_save_subscription', {
      p_patient_id: patientId,
      p_endpoint: sub.endpoint,
      p_p256dh: p256dh,
      p_auth: auth,
      p_user_agent: navigator.userAgent,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  },

  /** Cancela a inscrição neste dispositivo. */
  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await supabase.rpc('push_delete_subscription', { p_endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
  },

  // ----- Sino in-app -----
  async getNotifications(patientId: string, limit = 30): Promise<PortalNotification[]> {
    const { data, error } = await supabase.rpc('notifications_get', {
      p_patient_id: patientId,
      p_limit: limit,
    });
    if (error) return [];
    return (data ?? []) as PortalNotification[];
  },

  async getUnreadCount(patientId: string): Promise<number> {
    const { data, error } = await supabase.rpc('notifications_unread_count', {
      p_patient_id: patientId,
    });
    if (error) return 0;
    return (data as number) ?? 0;
  },

  async markRead(patientId: string, id?: string): Promise<void> {
    await supabase.rpc('notifications_mark_read', {
      p_patient_id: patientId,
      p_id: id ?? null,
    });
  },

  // ----- Lado do TREINADOR (admin via ?uid=) -----
  async subscribeTrainer(trainerId: string): Promise<{ ok: boolean; reason?: string }> {
    if (!this.isSupported()) return { ok: false, reason: 'unsupported' };
    if (this.isIOS() && !this.isStandalone()) return { ok: false, reason: 'ios-needs-install' };

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'denied' };

    const { data: publicKey, error: keyErr } = await supabase.rpc('get_push_public_key');
    if (keyErr || !publicKey) return { ok: false, reason: 'no-key' };

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey as string),
      });
    }
    const json = sub.toJSON();
    const p256dh = json.keys?.p256dh ?? arrayBufferToBase64(sub.getKey('p256dh'));
    const auth = json.keys?.auth ?? arrayBufferToBase64(sub.getKey('auth'));

    const { error } = await supabase.rpc('push_save_subscription_trainer', {
      p_trainer_id: trainerId,
      p_endpoint: sub.endpoint,
      p_p256dh: p256dh,
      p_auth: auth,
      p_user_agent: navigator.userAgent,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  },

  async getNotificationsTrainer(trainerId: string, limit = 30): Promise<PortalNotification[]> {
    const { data, error } = await supabase.rpc('notifications_get_trainer', {
      p_trainer_id: trainerId,
      p_limit: limit,
    });
    if (error) return [];
    return (data ?? []) as PortalNotification[];
  },

  async getUnreadCountTrainer(trainerId: string): Promise<number> {
    const { data, error } = await supabase.rpc('notifications_unread_count_trainer', {
      p_trainer_id: trainerId,
    });
    if (error) return 0;
    return (data as number) ?? 0;
  },

  async markReadTrainer(trainerId: string, id?: string): Promise<void> {
    await supabase.rpc('notifications_mark_read_trainer', {
      p_trainer_id: trainerId,
      p_id: id ?? null,
    });
  },
};

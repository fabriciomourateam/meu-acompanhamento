import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import type { PluginListenerHandle } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Push NATIVO (app da App Store / futuramente Google Play via Capacitor).
//
// Complementa — NÃO substitui — o Web Push de `push-service.ts`:
//   - Web/PWA/Android-TWA continuam usando Web Push (VAPID).
//   - Dentro do app NATIVO (WKWebView no iOS, que NÃO suporta Web Push), o push
//     real vem do FCM via `@capacitor-firebase/messaging`.
//
// Cada aparelho tem UM canal só: app nativo → token FCM; navegador/PWA/TWA →
// Web Push. Por isso não há dupla entrega no mesmo device (decisão de dedup em
// docs/ios-app-store-capacitor.md).
//
// O token FCM é salvo em `native_push_tokens` via RPC `native_push_save_token`
// (SECURITY DEFINER, espelha o padrão de `push_save_subscription`).
// ---------------------------------------------------------------------------

export const nativePush = {
  /** Estamos rodando dentro do app nativo (Capacitor), não no navegador? */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  /** 'ios' | 'android' | 'web' */
  platform(): string {
    return Capacitor.getPlatform();
  },

  /** A permissão de notificação já foi concedida neste device? */
  async permissionGranted(): Promise<boolean> {
    if (!this.isNative()) return false;
    try {
      const { receive } = await FirebaseMessaging.checkPermissions();
      return receive === 'granted';
    } catch {
      return false;
    }
  },

  /** Já existe um token FCM ativo (permissão concedida + token disponível)? */
  async isRegistered(): Promise<boolean> {
    if (!this.isNative()) return false;
    if (!(await this.permissionGranted())) return false;
    try {
      const { token } = await FirebaseMessaging.getToken();
      return !!token;
    } catch {
      return false;
    }
  },

  /**
   * Pede permissão (prompt nativo do iOS), pega o token FCM e salva no Supabase.
   * Chamar a partir de um gesto do usuário (botão "Ativar").
   */
  async register(patientId: string): Promise<{ ok: boolean; reason?: string }> {
    if (!this.isNative()) return { ok: false, reason: 'not-native' };

    let permission;
    try {
      permission = await FirebaseMessaging.requestPermissions();
    } catch (err: any) {
      return { ok: false, reason: err?.message ?? 'permission-error' };
    }
    if (permission.receive !== 'granted') return { ok: false, reason: 'denied' };

    return this.refreshToken(patientId);
  },

  /**
   * Pega o token FCM atual e salva (idempotente). Usado no register e no
   * refresh silencioso quando o portal abre com permissão já concedida.
   */
  async refreshToken(patientId: string): Promise<{ ok: boolean; reason?: string }> {
    if (!this.isNative()) return { ok: false, reason: 'not-native' };
    let token: string;
    try {
      ({ token } = await FirebaseMessaging.getToken());
    } catch (err: any) {
      return { ok: false, reason: err?.message ?? 'no-token' };
    }
    if (!token) return { ok: false, reason: 'no-token' };
    return this.saveToken(patientId, token);
  },

  /** Persiste o token nativo via RPC (SECURITY DEFINER). */
  async saveToken(patientId: string, token: string): Promise<{ ok: boolean; reason?: string }> {
    const { error } = await supabase.rpc('native_push_save_token', {
      p_patient_id: patientId,
      p_token: token,
      p_platform: this.platform(),
      p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  },

  /** Remove o token deste device (parar de receber push nativo). */
  async unregister(): Promise<void> {
    if (!this.isNative()) return;
    try {
      const { token } = await FirebaseMessaging.getToken();
      if (token) await supabase.rpc('native_push_delete_token', { p_token: token });
      await FirebaseMessaging.deleteToken();
    } catch {
      // best-effort
    }
  },

  /**
   * Re-salva o token quando o FCM o rotaciona (evento tokenReceived). Mantém o
   * registro vivo sem o aluno fazer nada. Retorna o handle pra remover no unmount.
   */
  async onTokenRefresh(patientId: string): Promise<PluginListenerHandle | null> {
    if (!this.isNative()) return null;
    return FirebaseMessaging.addListener('tokenReceived', (event) => {
      if (event?.token) void this.saveToken(patientId, event.token);
    });
  },

  /**
   * Deep-link: ao TOCAR na notificação, navega pra rota do payload.
   * Reusa o mesmo campo `url` que o Web Push já manda pro `notificationclick`
   * do sw.js — um payload só serve web e nativo.
   */
  async onNotificationTap(navigate: (url: string) => void): Promise<PluginListenerHandle | null> {
    if (!this.isNative()) return null;
    return FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      const data = (event?.notification?.data ?? {}) as Record<string, unknown>;
      const url = typeof data.url === 'string' ? data.url : undefined;
      if (url) navigate(url);
    });
  },
};

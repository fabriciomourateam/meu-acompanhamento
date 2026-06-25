import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nativePush } from '@/lib/native-push-service';
import type { PluginListenerHandle } from '@capacitor/core';

/**
 * Liga o toque na notificação NATIVA (push do app Capacitor) à navegação do
 * portal (deep-link). Fica montado no topo da árvore, dentro do Router, pra o
 * listener existir durante toda a sessão — independente de qual tela está aberta.
 *
 * No navegador/PWA isso é no-op (o deep-link do Web Push já é tratado pelo
 * `notificationclick` do sw.js). Só age dentro do app nativo.
 */
export function NativePushBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!nativePush.isNative()) return;
    let handle: PluginListenerHandle | null = null;
    void nativePush
      .onNotificationTap((url) => {
        if (/^https?:\/\//i.test(url)) {
          // URL absoluta do próprio domínio: navega só pelo path pra não recarregar.
          try {
            const u = new URL(url);
            navigate(u.pathname + u.search + u.hash);
          } catch {
            window.location.href = url;
          }
        } else {
          navigate(url);
        }
      })
      .then((h) => {
        handle = h;
      });
    return () => {
      void handle?.remove();
    };
  }, [navigate]);

  return null;
}

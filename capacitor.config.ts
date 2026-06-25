import type { CapacitorConfig } from '@capacitor/core';

/**
 * Config do app nativo (Capacitor) — projeto iOS para a App Store.
 *
 * ADITIVO: não toca em nada do fluxo web/PWA/Android (TWA) que já está em produção.
 * O app NATIVO carrega o SITE AO VIVO (`server.url`), igual ao Android TWA → a
 * experiência do aluno é idêntica à do navegador/PWA. A pasta `dist` (webDir) é só
 * fallback exigido pelo Capacitor; em runtime o conteúdo vem de `server.url`.
 *
 * Bundle ID = mesmo package do Android (`com.fmteam.meuacompanhamento`) por consistência.
 * Decisões em `docs/ios-app-store-capacitor.md` ("Decisões FECHADAS").
 */
const config: CapacitorConfig = {
  appId: 'com.fmteam.meuacompanhamento',
  appName: 'My Shape',
  webDir: 'dist',
  server: {
    // Portal do aluno em produção (mesmo host do VITE_CHECKIN_BASE_URL).
    url: 'https://my-shape.app',
    cleartext: false,
  },
  ios: {
    // Sem conteúdo branco atrás do webview durante a carga inicial.
    backgroundColor: '#0f172a',
    contentInset: 'always',
  },
  plugins: {
    PushNotifications: {
      // Notificação aparece (banner + som + badge) mesmo com o app em primeiro plano.
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;

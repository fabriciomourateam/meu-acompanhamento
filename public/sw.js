// Service Worker para PWA - Compatível com Vercel
// IMPORTANTE: ao deployar uma versão nova, suba estes números (v29 -> v30 ...).
// O `activate` apaga caches com nome diferente, então o bump força a limpeza do
// bundle antigo (CSS/JS) em todos os aparelhos. Combinado com o auto-update do
// registro no index.html, a versão nova chega sem o aluno reinstalar.
const CACHE_NAME = 'meu-acompanhamento-v29';
const STATIC_CACHE_NAME = 'meu-acompanhamento-static-v29';

// Recursos estáticos para cachear na instalação
const urlsToCache = [
  '/',
  '/index.html',
  '/portal',
  '/portal-fmteam',
  '/manifest.json',
  '/fmteam-icon.png',
  '/notification-badge.png',
  '/vite.svg'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando recursos estáticos');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('[SW] Erro ao cachear recursos:', error);
      })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estratégia: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de API externas (Supabase, etc)
  if (event.request.url.includes('supabase.co') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta é válida, cachear e retornar
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tentar buscar do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se não estiver no cache, retornar página offline
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------------------------------------------------------------------------
// Web Push: exibe a notificação recebida.
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: 'Meu Acompanhamento', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Meu Acompanhamento';
  const options = {
    body: payload.body || '',
    icon: '/fmteam-icon.png',
    // badge = ícone pequeno monocromático (Android usa só o alpha). Tem que ser
    // uma silhueta branca em fundo transparente, senão vira um quadrado estranho.
    badge: '/notification-badge.png',
    tag: payload.type || 'geral',
    renotify: true,
    data: { url: payload.url || '/', type: payload.type || 'geral', ...(payload.data || {}) }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Ao clicar na notificação: foca uma aba existente do app ou abre uma nova.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = data.url || '/';
  const isChat = data.type === 'chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          // Chat: o app já está aberto e logado — pede pra abrir a aba Suporte
          // por mensagem (sem trocar a URL, pra não perder a sessão por token).
          if (isChat) {
            client.postMessage({ type: 'open-support-tab' });
          } else if ('navigate' in client && targetUrl && targetUrl !== '/') {
            client.navigate(targetUrl).catch(() => {});
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});


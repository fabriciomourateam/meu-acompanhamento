// Service Worker para PWA
const CACHE_NAME = 'meu-acompanhamento-v1';
const STATIC_CACHE_NAME = 'meu-acompanhamento-static-v1';

// Recursos estáticos para cachear na instalação
const urlsToCache = [
  '/',
  '/portal',
  '/index.html',
  '/manifest.json',
  '/icone (192 x 192 px).png',
  '/icone (512 x 512 px).png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Ativar imediatamente
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache estático aberto');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.log('[SW] Erro ao fazer cache inicial:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== CACHE_NAME) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Tomar controle de todas as páginas
      self.clients.claim()
    ])
  );
});

// Estratégia: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições do Chrome extension
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Só cachear respostas válidas
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clonar a resposta
        const responseToCache = response.clone();
        
        // Adicionar ao cache dinâmico
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Se a rede falhar, tentar buscar do cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se não houver no cache, retornar página offline básica
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Mensagens do Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


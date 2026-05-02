// Mundi TKR Sports — Service Worker
const CACHE = 'mundi-shell-v7';

// Pré-cacheia index.html na instalação
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c) { return c.add(new Request('/index.html', {cache:'reload'})); })
      .then(function() { return self.skipWaiting(); })
  );
});

// Limpa caches antigos e assume controle imediato
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })
      );
    })
    .then(function() { return self.clients.claim(); })
    .then(function() {
      return self.clients.matchAll({type:'window'}).then(function(clients) {
        clients.forEach(function(c) { c.postMessage({type:'SW_UPDATED'}); });
      });
    })
  );
});

// Network-first: sempre busca a versão mais recente da rede.
// Se a rede falhar (offline), serve do cache como fallback.
self.addEventListener('fetch', function(e) {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        if (res && res.ok) {
          // Atualiza o cache com a versão nova
          caches.open(CACHE).then(function(cache) { cache.put('/index.html', res.clone()); });
        }
        return res;
      })
      .catch(function() {
        // Sem rede — serve do cache (modo offline)
        return caches.match('/index.html').then(function(cached) {
          return cached || new Response('Sem conexão. Abra o app online primeiro.', {
            status: 503,
            headers: {'Content-Type': 'text/plain;charset=utf-8'}
          });
        });
      })
  );
});

// OneSignal SDK — push notifications
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

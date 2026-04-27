// Mundi TKR Sports — Service Worker
const CACHE = 'mundi-shell-v1';
// Tempo máximo para esperar o servidor (Render free tier pode dormir)
const NETWORK_TIMEOUT_MS = 3000;

// Cache index.html na instalação
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c) { return c.add(new Request('/index.html', {cache:'reload'})); })
      .then(function() { return self.skipWaiting(); })
  );
});

// Limpa caches antigos na ativação
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// Network-first com timeout:
// - Servidor responde em <3s → entrega HTML atualizado (deploys chegam imediatamente)
// - Servidor demora >3s (Render adormecido) → fallback para cache (app abre na hora)
self.addEventListener('fetch', function(e) {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      var networkPromise = fetch(e.request).then(function(res) {
        if (res && res.ok) cache.put('/index.html', res.clone());
        return res;
      });
      var timeoutPromise = new Promise(function(_, reject) {
        setTimeout(reject, NETWORK_TIMEOUT_MS, 'timeout');
      });
      return Promise.race([networkPromise, timeoutPromise])
        .catch(function() {
          return cache.match('/index.html');
        });
    })
  );
});

// OneSignal SDK — push notifications
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

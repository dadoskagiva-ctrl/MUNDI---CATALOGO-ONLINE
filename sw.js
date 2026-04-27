// Mundi TKR Sports — Service Worker
const CACHE = 'mundi-shell-v1';

// Cache index.html na instalação para carregamento instantâneo offline/cold-start
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

// Cache-first para navegação: serve do cache imediatamente, atualiza em background
self.addEventListener('fetch', function(e) {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match('/index.html').then(function(cached) {
        var networkFetch = fetch(e.request).then(function(res) {
          if (res && res.ok) cache.put('/index.html', res.clone());
          return res;
        }).catch(function() { return cached; });
        // Serve cache imediatamente; se não tiver cache, espera a rede
        return cached || networkFetch;
      });
    })
  );
});

// OneSignal SDK — push notifications
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

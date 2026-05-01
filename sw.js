// Mundi TKR Sports — Service Worker
const CACHE = 'mundi-shell-v6';
const NETWORK_TIMEOUT_MS = 5000;

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
      .then(function() {
        return self.clients.matchAll({type:'window'}).then(function(clients) {
          clients.forEach(function(c) { c.postMessage({type:'SW_UPDATED'}); });
        });
      })
  );
});

// Cache-first para visitas seguintes (app abre instantaneamente),
// atualiza cache em background quando a rede responde.
// Primeira visita (sem cache): vai direto para a rede.
self.addEventListener('fetch', function(e) {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match('/index.html').then(function(cached) {
        // Busca versão fresca na rede em background
        var networkFetch = fetch(e.request).then(function(res) {
          if (res && res.ok) cache.put('/index.html', res.clone());
          return res;
        }).catch(function() { return null; });

        if (cached) {
          // Tem cache: entrega imediatamente, atualiza em background
          networkFetch.then(function(fresh) {
            if (fresh) {
              // SW vai notificar o cliente ao ativar nova versão
            }
          });
          return cached;
        }
        // Sem cache: aguarda a rede (primeira visita)
        return networkFetch.then(function(res) {
          return res || new Response('Sem conexão. Abra o app online primeiro.', {
            status: 503,
            headers: {'Content-Type': 'text/plain;charset=utf-8'}
          });
        });
      });
    })
  );
});

// OneSignal SDK — push notifications
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

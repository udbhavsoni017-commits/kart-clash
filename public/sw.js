const CACHE_NAME = 'kart-clash-v1';
const APP_FILES = [
  '/', '/index.html', '/style.css', '/game.js', '/manifest.webmanifest', '/icon.svg',
  '/icon-192.png', '/icon-512.png', '/socket.io/socket.io.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/socket.io/')) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

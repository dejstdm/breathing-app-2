const CACHE_NAME = 'breathing-app-v1';
const STATIC_CACHE_NAME = 'breathing-app-static-v1';
const DYNAMIC_CACHE_NAME = 'breathing-app-dynamic-v1';
const AUDIO_CACHE_NAME = 'breathing-app-audio-v1';

// Core app shell files that must be cached for offline functionality
const STATIC_FILES = [
  '/',
  '/breath',
  '/settings',
  '/about',
  '/manifest.json',
  '/offline.html',
  // Add other critical static assets
];

// Audio files for offline breathing guidance
const AUDIO_FILES = [
  // Default audio files
  '/audio/breathe-in.wav',
  '/audio/hold.wav',
  '/audio/breathe-out.wav',
  '/audio/hold-out.wav',
  '/audio/transition.wav',
  '/audio/session-start.wav',
  '/audio/session-end.wav',
  
  // Chime voice type
  '/audio/chime/breathe-in.wav',
  '/audio/chime/hold.wav',
  '/audio/chime/breathe-out.wav',
  '/audio/chime/hold-out.wav',
  '/audio/chime/transition.wav',
  
  // Bell voice type
  '/audio/bell/breathe-in.wav',
  '/audio/bell/hold.wav',
  '/audio/bell/breathe-out.wav',
  '/audio/bell/hold-out.wav',
  '/audio/bell/transition.wav',
  
  // Voice type
  '/audio/voice/breathe-in.wav',
  '/audio/voice/hold.wav',
  '/audio/voice/breathe-out.wav',
  '/audio/voice/hold-out.wav',
  '/audio/voice/transition.wav',
  
  // Tone type
  '/audio/tone/breathe-in.wav',
  '/audio/tone/hold.wav',
  '/audio/tone/breathe-out.wav',
  '/audio/tone/hold-out.wav',
  '/audio/tone/transition.wav'
];

// API routes and dynamic content
const DYNAMIC_CACHE_ROUTES = [
  '/api/techniques',
  '/api/techniques/'
];

// Install event - cache static assets and audio files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static app shell
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(STATIC_FILES);
      }),
      // Cache audio files for offline breathing guidance
      caches.open(AUDIO_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching audio files for offline use');
        // Use Promise.allSettled to handle missing audio files gracefully
        return Promise.allSettled(
          AUDIO_FILES.map(audioFile => 
            fetch(audioFile)
              .then(response => {
                if (response.ok) {
                  return cache.put(audioFile, response);
                }
                console.warn(`[SW] Audio file not found: ${audioFile}`);
                return null;
              })
              .catch(err => {
                console.warn(`[SW] Failed to cache audio file ${audioFile}:`, err);
                return null;
              })
          )
        ).then(results => {
          const successful = results.filter(r => r.status === 'fulfilled').length;
          console.log(`[SW] Cached ${successful}/${AUDIO_FILES.length} audio files`);
        });
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Message event - handle skip waiting requests
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== AUDIO_CACHE_NAME &&
              cacheName.startsWith('breathing-app-')
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (request.method === 'GET') {
    event.respondWith(handleGetRequest(request));
  }
});

// Handle GET requests with appropriate caching strategy
async function handleGetRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Strategy 1: Cache First for static assets and app shell
    if (isStaticAsset(pathname) || isAppShell(pathname)) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }
    
    // Strategy 2: Cache First for audio files (essential for offline breathing guidance)
    if (isAudioFile(pathname)) {
      return await cacheFirst(request, AUDIO_CACHE_NAME);
    }

    // Strategy 3: Network First for API routes and dynamic content
    if (isApiRoute(pathname) || isDynamicContent(pathname)) {
      return await networkFirst(request, DYNAMIC_CACHE_NAME);
    }

    // Strategy 4: Stale While Revalidate for everything else
    return await staleWhileRevalidate(request, DYNAMIC_CACHE_NAME);

  } catch (error) {
    console.error('[SW] Fetch error:', error);
    
    // Fallback to cache or offline page
    const cachedResponse = await getCachedResponse(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return await getOfflineFallback();
    }

    // For other requests, return a basic error response
    return new Response('Offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network First Strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, but we might have cached version
    return null;
  });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Otherwise wait for network
  const networkResponse = await networkResponsePromise;
  if (networkResponse) {
    return networkResponse;
  }

  throw new Error('No cached version available and network failed');
}

// Helper functions
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/screenshots/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  );
}

function isAudioFile(pathname) {
  return (
    pathname.startsWith('/audio/') &&
    (pathname.endsWith('.wav') ||
     pathname.endsWith('.mp3') ||
     pathname.endsWith('.ogg') ||
     pathname.endsWith('.m4a'))
  );
}

function isAppShell(pathname) {
  return STATIC_FILES.includes(pathname);
}

function isApiRoute(pathname) {
  return pathname.startsWith('/api/');
}

function isDynamicContent(pathname) {
  return (
    pathname.startsWith('/breath') ||
    pathname.includes('?') ||
    DYNAMIC_CACHE_ROUTES.some(route => pathname.startsWith(route))
  );
}

async function getCachedResponse(request) {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const response = await cache.match(request);
    if (response) {
      return response;
    }
  }
  
  return null;
}

async function getOfflineFallback() {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const fallback = await cache.match('/');
  
  if (fallback) {
    return fallback;
  }

  // Basic offline page if main page not cached
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Breathing App - Offline</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            text-align: center; 
            padding: 2rem; 
            background: #f8fafc;
          }
          .container { 
            max-width: 400px; 
            margin: 0 auto; 
            background: white; 
            padding: 2rem; 
            border-radius: 1rem; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          h1 { color: #1e293b; margin-bottom: 1rem; }
          p { color: #64748b; margin-bottom: 1.5rem; }
          button { 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 0.75rem 1.5rem; 
            border-radius: 0.5rem; 
            cursor: pointer; 
            font-size: 1rem;
          }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🫁 Breathing App</h1>
          <p>You're offline, but you can still access cached breathing techniques.</p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Handle background sync for analytics or future features
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  // Implementation for syncing cached analytics data when back online
  console.log('[SW] Syncing analytics data...');
}

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'New breathing reminder',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'breathe',
        title: 'Start Breathing',
        icon: '/icons/action-breathe.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Breathing App', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'breathe') {
    event.waitUntil(
      clients.openWindow('/breath')
    );
  }
});

// Update available notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service worker loaded successfully');
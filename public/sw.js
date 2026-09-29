// Service worker responsável por mostrar as notificações push do TAFEL,
// mesmo com o dashboard fechado (desde que o browser esteja aberto).

self.addEventListener('push', (event) => {
  let data = { title: 'TAFEL', body: 'Tens uma novidade no painel.' }
  try {
    if (event.data) data = event.data.json()
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title || 'TAFEL', {
      body: data.body || '',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: 'tafel-notification',
      renotify: true
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/dashboard')
      }
    })
  )
})

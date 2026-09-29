'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export default function PushNotificationSetup({ restaurantId }: { restaurantId: string }) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [busy, setBusy] = useState(false)

  const supported =
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

  useEffect(() => {
    if (!supported) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)

    // Se já foi autorizado anteriormente, garante que a subscrição está ativa
    // (por exemplo depois de limpar dados do browser ou trocar de computador).
    if (Notification.permission === 'granted') {
      subscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function subscribe() {
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) return

      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      let sub = await registration.pushManager.getSubscription()
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        })
      }

      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          subscription: { endpoint: json.endpoint, keys: json.keys }
        })
      })
    } catch (e) {
      console.error('Não foi possível ativar as notificações push:', e)
    }
  }

  async function handleEnable() {
    setBusy(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') await subscribe()
    } finally {
      setBusy(false)
    }
  }

  if (!supported || permission === 'granted' || permission === 'denied') return null

  return (
    <button
      onClick={handleEnable}
      disabled={busy}
      className="w-full text-left px-3 py-2 rounded-card text-sm bg-paprika/10 text-paprika hover:bg-paprika/15 mb-2"
    >
      🔔 {busy ? 'A ativar...' : 'Ativar notificações neste dispositivo'}
    </button>
  )
}

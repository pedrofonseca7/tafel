'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { NotificationRow } from '@/lib/types'

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'agora mesmo'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

export default function NotificationsBoard({ restaurantId }: { restaurantId: string }) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) setNotifications(data as NotificationRow[])
  }, [restaurantId, supabase])

  useEffect(() => {
    load()

    const channel = supabase
      .channel(`notifications-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `restaurant_id=eq.${restaurantId}` },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, load, supabase])

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <span className="inline-flex items-center gap-2 text-sm bg-paprika/10 text-paprika px-3 py-1.5 rounded-card">
          <span className="w-2 h-2 rounded-full bg-paprika animate-pulse" />
          {unreadCount} não lida{unreadCount === 1 ? '' : 's'}
        </span>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-ink/50 hover:text-ink">
            Marcar tudo como lido
          </button>
        )}
      </div>

      {notifications.length === 0 && (
        <p className="text-ink/50 text-sm">Ainda não há notificações. Quando chegar um pedido ou encomenda, aparece aqui.</p>
      )}

      <div className="space-y-2">
        {notifications.map((n) => {
          const href = n.type === 'order' ? '/dashboard' : '/dashboard/encomendas'
          return (
            <Link
              key={n.id}
              href={href}
              onClick={() => !n.read && markRead(n.id)}
              className={`card p-4 flex items-start justify-between gap-3 block transition ${
                !n.read ? 'ring-2 ring-paprika' : ''
              }`}
            >
              <div>
                <p className="font-medium text-sm">
                  {n.type === 'order' ? '🍽️' : '🛵'} {n.title}
                </p>
                <p className="text-sm text-ink/60 mt-0.5">{n.body}</p>
              </div>
              <span className="text-xs text-ink/40 whitespace-nowrap">{timeAgo(n.created_at)}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

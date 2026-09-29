'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NotificationsNavBadge({ restaurantId }: { restaurantId: string }) {
  const supabase = createClient()
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    const { count: unread } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('read', false)

    setCount(unread ?? 0)
  }, [restaurantId, supabase])

  useEffect(() => {
    load()

    const channel = supabase
      .channel(`notifications-badge-${restaurantId}`)
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

  if (count === 0) return null

  return (
    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-paprika text-paper text-xs font-medium">
      {count > 9 ? '9+' : count}
    </span>
  )
}

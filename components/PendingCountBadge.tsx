'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Mostra a quantidade de pedidos/encomendas ainda por aceitar (status = 'pending'),
// ao lado do nome da aba no menu do dashboard. Atualiza em tempo real.
export default function PendingCountBadge({
  restaurantId,
  table
}: {
  restaurantId: string
  table: 'orders' | 'delivery_orders'
}) {
  const supabase = createClient()
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    const { count: pending } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')

    setCount(pending ?? 0)
  }, [restaurantId, table, supabase])

  useEffect(() => {
    load()

    const channel = supabase
      .channel(`pending-badge-${table}-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `restaurant_id=eq.${restaurantId}` },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, table, load, supabase])

  if (count === 0) return null

  return (
    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-paprika text-paper text-xs font-medium">
      +{count > 9 ? '9+' : count}
    </span>
  )
}

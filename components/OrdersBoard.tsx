'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderItem, OrderStatus } from '@/lib/types'

type FullOrder = Order & { order_items: (OrderItem & { order_item_options: any[] })[]; table_label?: string }

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
  delivered: null,
  rejected: null
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Novo pedido',
  accepted: 'Aceite',
  preparing: 'Em preparação',
  ready: 'Pronto',
  delivered: 'Entregue',
  rejected: 'Rejeitado'
}

export default function OrdersBoard({ restaurantId }: { restaurantId: string }) {
  const supabase = createClient()
  const [orders, setOrders] = useState<FullOrder[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, order_item_options(*)), tables(label)')
      .eq('restaurant_id', restaurantId)
      .neq('status', 'delivered')
      .order('created_at', { ascending: true })

    if (data) {
      setOrders(
        data.map((o: any) => ({ ...o, table_label: o.tables?.label ?? '—' }))
      )
    }
  }, [restaurantId, supabase])

  useEffect(() => {
    loadOrders()

    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            audioRef.current?.play().catch(() => {})
          }
          loadOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, loadOrders, supabase])

  async function updateStatus(orderId: string, status: OrderStatus) {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
    loadOrders()
  }

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <div>
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==" />

      <div className="flex items-center gap-2 mb-6">
        <span className="inline-flex items-center gap-2 text-sm bg-paprika/10 text-paprika px-3 py-1.5 rounded-card">
          <span className="w-2 h-2 rounded-full bg-paprika animate-pulse" />
          {pendingCount} pedido{pendingCount === 1 ? '' : 's'} pendente{pendingCount === 1 ? '' : 's'}
        </span>
      </div>

      {orders.length === 0 && (
        <p className="text-ink/50 text-sm">Ainda não há pedidos ativos. Quando um cliente pedir, aparece aqui na hora.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`card p-4 ${order.status === 'pending' ? 'ring-2 ring-paprika' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Mesa {order.table_label}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-ink/5 text-ink/70">
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <ul className="text-sm text-ink/80 space-y-1 mb-3">
              {order.order_items.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">{item.quantity}x</span> {item.product_name}
                  {item.order_item_options?.length > 0 && (
                    <ul className="pl-4 text-ink/50 text-xs">
                      {item.order_item_options.map((o: any) => (
                        <li key={o.id}>+ {o.value_name}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium mb-3">Total: €{order.total.toFixed(2)}</p>

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <>
                  <button onClick={() => updateStatus(order.id, 'accepted')} className="btn-primary text-sm py-2 flex-1">
                    Aceitar
                  </button>
                  <button onClick={() => updateStatus(order.id, 'rejected')} className="btn-secondary text-sm py-2 flex-1">
                    Rejeitar
                  </button>
                </>
              )}
              {order.status !== 'pending' && STATUS_FLOW[order.status] && (
                <button
                  onClick={() => updateStatus(order.id, STATUS_FLOW[order.status]!)}
                  className="btn-primary text-sm py-2 w-full"
                >
                  Marcar como {STATUS_LABEL[STATUS_FLOW[order.status]!]}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

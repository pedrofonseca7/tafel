'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DeliveryOrder, DeliveryOrderItem, DeliveryOrderStatus } from '@/lib/types'

type FullDeliveryOrder = DeliveryOrder & {
  delivery_order_items: (DeliveryOrderItem & { delivery_order_item_options: any[] })[]
}

const STATUS_FLOW: Record<DeliveryOrderStatus, DeliveryOrderStatus | null> = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: null,
  rejected: null
}

const STATUS_LABEL: Record<DeliveryOrderStatus, string> = {
  pending: 'Nova encomenda',
  accepted: 'Aceite',
  preparing: 'Em preparação',
  ready: 'Pronto',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  rejected: 'Rejeitada'
}

export default function DeliveryOrdersBoard({
  restaurantId,
  restaurantSlug
}: {
  restaurantId: string
  restaurantSlug: string
}) {
  const supabase = createClient()
  const [orders, setOrders] = useState<FullDeliveryOrder[]>([])
  const [siteUrl, setSiteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setSiteUrl(window.location.origin)
  }, [])

  const publicLink = `${siteUrl}/encomendas/${restaurantSlug}`

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('delivery_orders')
      .select('*, delivery_order_items(*, delivery_order_item_options(*))')
      .eq('restaurant_id', restaurantId)
      .neq('status', 'delivered')
      .order('created_at', { ascending: true })

    if (data) setOrders(data as any)
  }, [restaurantId, supabase])

  useEffect(() => {
    loadOrders()

    const channel = supabase
      .channel(`delivery-orders-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_orders', filter: `restaurant_id=eq.${restaurantId}` },
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

  async function updateStatus(orderId: string, status: DeliveryOrderStatus) {
    await supabase.from('delivery_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
    loadOrders()
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <div>
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==" />

      <div className="card p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium mb-0.5">Link público de encomendas</p>
          <p className="text-xs text-ink/50 truncate max-w-xs sm:max-w-none">{publicLink || '...'}</p>
        </div>
        <button onClick={copyLink} className="btn-secondary text-sm py-2 whitespace-nowrap">
          {copied ? 'Copiado!' : 'Copiar link'}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="inline-flex items-center gap-2 text-sm bg-paprika/10 text-paprika px-3 py-1.5 rounded-card">
          <span className="w-2 h-2 rounded-full bg-paprika animate-pulse" />
          {pendingCount} nova{pendingCount === 1 ? '' : 's'} encomenda{pendingCount === 1 ? '' : 's'}
        </span>
      </div>

      {orders.length === 0 && (
        <p className="text-ink/50 text-sm">
          Ainda não há encomendas ativas. Partilha o link acima com os teus clientes para começarem a chegar.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <div key={order.id} className={`card p-4 ${order.status === 'pending' ? 'ring-2 ring-paprika' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{order.customer_name}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-ink/5 text-ink/70">
                {STATUS_LABEL[order.status]}
              </span>
            </div>

            <div className="text-xs text-ink/60 mb-3 space-y-0.5">
              <p>{order.customer_phone}</p>
              <p>{order.address}, {order.postal_code} {order.city}</p>
              <p className="text-ink/40">Pagamento: MB WAY ou dinheiro na entrega</p>
            </div>

            <ul className="text-sm text-ink/80 space-y-1 mb-3">
              {order.delivery_order_items.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">{item.quantity}x</span> {item.product_name}
                  {item.delivery_order_item_options?.length > 0 && (
                    <ul className="pl-4 text-ink/50 text-xs">
                      {item.delivery_order_item_options.map((o: any) => (
                        <li key={o.id}>+ {o.value_name}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium mb-3">Total: €{Number(order.total).toFixed(2)}</p>

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

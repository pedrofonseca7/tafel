'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RestaurantTable } from '@/lib/types'

export default function TableBillModal({
  table,
  restaurantId,
  onClose,
  onClosedTab
}: {
  table: RestaurantTable
  restaurantId: string
  onClose: () => void
  onClosedTab: () => void
}) {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, order_item_options(*))')
        .eq('restaurant_id', restaurantId)
        .eq('table_id', table.id)
        .neq('status', 'rejected')
        .gte('created_at', table.tab_started_at)
        .order('created_at')
      setOrders(data ?? [])
      setLoading(false)
    }
    load()
  }, [restaurantId, table.id, table.tab_started_at, supabase])

  const total = orders.reduce((sum, o) => sum + Number(o.total), 0)

  async function closeTab() {
    if (!confirm(`Fechar a conta da Mesa ${table.label}? O total de €${total.toFixed(2)} fica registado e a mesa fica pronta para o próximo cliente.`)) {
      return
    }
    setClosing(true)
    await supabase.from('tables').update({ tab_started_at: new Date().toISOString() }).eq('id', table.id)
    setClosing(false)
    onClosedTab()
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6">
      <div className="bg-paper w-full sm:max-w-md sm:rounded-card rounded-t-card max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">Mesa {table.label}</h2>
          <button onClick={onClose} className="text-ink/40">✕</button>
        </div>

        {loading && <p className="text-sm text-ink/50">A carregar...</p>}

        {!loading && orders.length === 0 && (
          <p className="text-sm text-ink/50 py-6 text-center">Ainda não há pedidos nesta conta.</p>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-5 mb-6">
            {orders.map((order) => (
              <div key={order.id}>
                <p className="text-xs text-ink/40 mb-1">
                  Pedido {new Date(order.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <ul className="text-sm space-y-1">
                  {order.order_items.map((item: any) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.product_name}
                        {item.order_item_options?.length > 0 && (
                          <span className="text-ink/40">
                            {' '}({item.order_item_options.map((o: any) => o.value_name).join(', ')})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center border-t border-line pt-4 mb-6">
          <span className="font-medium">Total da conta</span>
          <span className="font-display text-2xl">€{total.toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Fechar</button>
          <button onClick={closeTab} disabled={closing || orders.length === 0} className="btn-primary flex-1">
            {closing ? 'A fechar...' : 'Fechar conta'}
          </button>
        </div>
      </div>
    </div>
  )
}

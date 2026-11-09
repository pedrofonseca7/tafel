'use client'

import { useEffect, useState, useCallback } from 'react'
import type { OrderStatus } from '@/lib/types'

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Pedido recebido' },
  { status: 'accepted', label: 'Restaurante aceitou' },
  { status: 'preparing', label: 'Em preparação' },
  { status: 'ready', label: 'Pronto' },
  { status: 'delivered', label: 'Entregue' }
]

export default function OrderTracker({ orderId, sessionToken, slug }: { orderId: string; sessionToken: string; slug: string }) {
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}?session_token=${sessionToken}`)
    if (!res.ok) {
      setError(true)
      return
    }
    const data = await res.json()
    setOrder(data.order)
  }, [orderId, sessionToken])

  // O cliente não está autenticado, por isso não pode subscrever o realtime
  // diretamente (RLS só permite à equipa do restaurante). Em vez disso,
  // consulta-se o estado a cada poucos segundos através da API, que valida
  // o session_token do lado do servidor.
  useEffect(() => {
    load()
    const interval = setInterval(load, 4000)
    return () => clearInterval(interval)
  }, [load])

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center text-center px-6">
        <p className="text-ink/60">Não foi possível encontrar este pedido.</p>
      </main>
    )
  }

  if (!order) {
    return <main className="min-h-screen flex items-center justify-center text-ink/40">A carregar...</main>
  }

  if (order.status === 'rejected') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="font-display text-2xl mb-2">O pedido foi rejeitado</p>
        <p className="text-ink/60 mb-6">Fala com a equipa do restaurante na mesa.</p>
        <a href={`/r/${slug}/t/${order.tables?.qr_token}`} className="btn-secondary">Voltar ao menu</a>
      </main>
    )
  }

  const currentIndex = STEPS.findIndex((s) => s.status === order.status)

  return (
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto">
      <p className="text-sm text-ink/50 mb-1">{order.restaurants?.name}</p>
      <h1 className="font-display text-3xl mb-1">Pedido #{order.id.slice(0, 8)}</h1>
      <p className="text-ink/60 mb-10">Mesa {order.tables?.label}</p>

      <div className="space-y-6 mb-10">
        {STEPS.map((step, i) => {
          const done = i <= currentIndex
          const active = i === currentIndex
          return (
            <div key={step.status} className="flex items-center gap-3">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  done ? 'bg-paprika text-paper' : 'bg-ink/10 text-ink/30'
                } ${active ? 'ring-4 ring-paprika/20' : ''}`}
              >
                {done ? '✓' : ''}
              </span>
              <span className={done ? 'text-ink' : 'text-ink/40'}>{step.label}</span>
            </div>
          )
        })}
      </div>

      <div className="card p-4">
        <ul className="text-sm space-y-1 mb-3">
          {order.order_items?.map((item: any) => (
            <li key={item.id}>
              {item.quantity}x {item.product_name}
            </li>
          ))}
        </ul>
        <p className="font-medium border-t border-line pt-3">Total: €{Number(order.total).toFixed(2)}</p>
      </div>

      <a href={`/r/${slug}/t/${order.tables?.qr_token}`} className="btn-secondary w-full mt-6 block text-center">
        Fazer novo pedido
      </a>
    </main>
  )
}

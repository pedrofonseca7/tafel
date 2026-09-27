'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import type { Restaurant, RestaurantTable } from '@/lib/types'

export default function CartSheet({
  restaurant,
  table,
  onClose
}: {
  restaurant: Restaurant
  table: RestaurantTable
  onClose: () => void
}) {
  const { items, updateQty, removeItem, total, clear } = useCart()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitOrder() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          table_id: table.id,
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            options: i.options.map((o) => ({ value_id: o.value_id }))
          }))
        })
      })
      if (!res.ok) throw new Error('Falha ao enviar pedido')
      const data = await res.json()
      clear()
      router.push(`/r/${restaurant.slug}/order/${data.order_id}?token=${data.session_token}`)
    } catch (e) {
      setError('Não foi possível enviar o pedido. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-paper w-full sm:max-w-md sm:rounded-card rounded-t-card max-h-[85vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">O teu pedido</h2>
          <button onClick={onClose} className="text-ink/40">✕</button>
        </div>

        {items.length === 0 && <p className="text-ink/50 text-sm py-8 text-center">O carrinho está vazio.</p>}

        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div key={item.key} className="flex justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                {item.options.map((o, i) => (
                  <p key={i} className="text-xs text-ink/50">+ {o.value_name}</p>
                ))}
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => updateQty(item.key, item.quantity - 1)} className="w-6 h-6 rounded-full border border-line text-xs">−</button>
                  <span className="text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.key, item.quantity + 1)} className="w-6 h-6 rounded-full border border-line text-xs">+</button>
                  <button onClick={() => removeItem(item.key)} className="text-xs text-ink/40 hover:text-red-600 ml-2">Remover</button>
                </div>
              </div>
              <p className="text-sm font-medium whitespace-nowrap">
                €{((item.unit_price + item.options.reduce((s, o) => s + o.price_delta, 0)) * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <>
            <div className="flex justify-between font-medium border-t border-line pt-4 mb-4">
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            {!confirming ? (
              <button onClick={() => setConfirming(true)} className="btn-primary w-full">
                Fazer pedido
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center text-ink/70">Confirmar pedido para a Mesa {table.label}?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirming(false)} className="btn-secondary flex-1">Voltar</button>
                  <button onClick={submitOrder} disabled={loading} className="btn-primary flex-1">
                    {loading ? 'A enviar...' : 'Sim, enviar'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

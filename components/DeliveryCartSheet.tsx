'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import type { Restaurant } from '@/lib/types'
import PhoneInput from './PhoneInput'

export default function DeliveryCartSheet({
  restaurant,
  onClose
}: {
  restaurant: Restaurant
  onClose: () => void
}) {
  const { items, updateQty, removeItem, total, clear } = useCart()
  const router = useRouter()
  const [step, setStep] = useState<'cart' | 'details'>('cart')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    address: '',
    postal_code: '',
    city: ''
  })

  const detailsComplete =
    form.customer_name.trim() && form.customer_phone.trim() && form.address.trim() && form.postal_code.trim() && form.city.trim()

  async function submitOrder() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/delivery-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            options: i.options.map((o) => ({ value_id: o.value_id }))
          })),
          ...form
        })
      })
      if (!res.ok) throw new Error('Falha ao enviar encomenda')
      const data = await res.json()
      clear()
      router.push(`/encomendas/${restaurant.slug}/order/${data.order_id}?token=${data.session_token}`)
    } catch (e) {
      setError('Não foi possível enviar a encomenda. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-paper w-full sm:max-w-md sm:rounded-card rounded-t-card max-h-[85vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">{step === 'cart' ? 'A tua encomenda' : 'Dados de entrega'}</h2>
          <button onClick={onClose} className="text-ink/40">✕</button>
        </div>

        {step === 'cart' && (
          <>
            {items.length === 0 && <p className="text-ink/50 text-sm py-8 text-center">O carrinho está vazio.</p>}

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.key} className="flex justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.options.map((o, i) => (
                      <p key={i} className="text-xs text-ink/50">+ {o.value_name}</p>
                    ))}
                    {item.notes && <p className="text-xs text-ink/50 italic">"{item.notes}"</p>}
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
                  <span>Subtotal</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                <button onClick={() => setStep('details')} className="btn-primary w-full">
                  Continuar para entrega
                </button>
              </>
            )}
          </>
        )}

        {step === 'details' && (
          <>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-sm text-ink/70 mb-1 block">Nome</label>
                <input className="input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <PhoneInput
                value={form.customer_phone}
                onChange={(fullPhone) => setForm({ ...form, customer_phone: fullPhone })}
              />
              <div>
                <label className="text-sm text-ink/70 mb-1 block">Morada de entrega</label>
                <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, andar" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-ink/70 mb-1 block">Código postal</label>
                  <input className="input" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} placeholder="0000-000" />
                </div>
                <div>
                  <label className="text-sm text-ink/70 mb-1 block">Localidade</label>
                  <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="border-t border-line pt-4 mb-4">
              <p className="text-sm font-medium mb-2">Resumo da encomenda</p>
              <ul className="text-sm text-ink/70 space-y-1 mb-3">
                {items.map((item) => (
                  <li key={item.key} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>€{((item.unit_price + item.options.reduce((s, o) => s + o.price_delta, 0)) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-sage/10 text-sage text-sm rounded-card p-3 mb-4">
              Pagamento no ato da entrega — MB WAY ou dinheiro.
            </div>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="flex gap-2">
              <button onClick={() => setStep('cart')} className="btn-secondary flex-1">Voltar</button>
              <button onClick={submitOrder} disabled={!detailsComplete || loading} className="btn-primary flex-1">
                {loading ? 'A enviar...' : 'Confirmar encomenda'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

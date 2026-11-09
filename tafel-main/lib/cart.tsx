'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CartItem } from './types'

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'key'>) => void
  removeItem: (key: string) => void
  updateQty: (key: string, qty: number) => void
  clear: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({
  storageKey,
  children
}: {
  storageKey: string
  children: React.ReactNode
}) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey)
    if (raw) {
      try {
        setItems(JSON.parse(raw))
      } catch {}
    }
  }, [storageKey])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items))
  }, [items, storageKey])

  function addItem(item: Omit<CartItem, 'key'>) {
    const key = `${item.product_id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setItems((prev) => [...prev, { ...item, key }])
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }

  function updateQty(key: string, qty: number) {
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, quantity: qty } : i))
    )
  }

  function clear() {
    setItems([])
  }

  const total = useMemo(
    () =>
      items.reduce((sum, i) => {
        const optionsTotal = i.options.reduce((s, o) => s + o.price_delta, 0)
        return sum + (i.unit_price + optionsTotal) * i.quantity
      }, 0),
    [items]
  )

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de <CartProvider>')
  return ctx
}

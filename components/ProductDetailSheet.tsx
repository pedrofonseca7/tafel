'use client'

import { useMemo, useState } from 'react'
import { useCart } from '@/lib/cart'
import type { Product } from '@/lib/types'

export default function ProductDetailSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem } = useCart()
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [quantity, setQuantity] = useState(1)

  const groups = product.product_options ?? []

  function toggleValue(groupId: string, valueId: string, multiple: boolean) {
    setSelected((prev) => {
      const current = prev[groupId] ?? []
      if (multiple) {
        return {
          ...prev,
          [groupId]: current.includes(valueId) ? current.filter((v) => v !== valueId) : [...current, valueId]
        }
      }
      return { ...prev, [groupId]: current.includes(valueId) ? [] : [valueId] }
    })
  }

  const missingRequired = groups.some((g) => g.required && !(selected[g.id]?.length > 0))

  const optionsTotal = useMemo(() => {
    let sum = 0
    for (const g of groups) {
      for (const valueId of selected[g.id] ?? []) {
        const v = g.product_option_values.find((v) => v.id === valueId)
        if (v) sum += Number(v.price_delta)
      }
    }
    return sum
  }, [selected, groups])

  function handleAdd() {
    const options = groups.flatMap((g) =>
      (selected[g.id] ?? []).map((valueId) => {
        const v = g.product_option_values.find((v) => v.id === valueId)!
        return { value_id: v.id, option_name: g.name, value_name: v.name, price_delta: Number(v.price_delta) }
      })
    )
    addItem({
      product_id: product.id,
      name: product.name,
      unit_price: Number(product.price),
      quantity,
      options
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-paper w-full sm:max-w-md sm:rounded-card rounded-t-card max-h-[85vh] overflow-y-auto">
        {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />}
        <div className="p-5">
          <h2 className="font-display text-2xl mb-1">{product.name}</h2>
          {product.description && <p className="text-ink/60 text-sm mb-3">{product.description}</p>}
          <p className="font-medium mb-4">€{Number(product.price).toFixed(2)}</p>

          {groups.map((group) => (
            <div key={group.id} className="mb-5">
              <p className="font-medium text-sm mb-2">
                {group.name} {group.required && <span className="text-paprika text-xs">· obrigatório</span>}
              </p>
              <div className="space-y-2">
                {group.product_option_values.map((v) => {
                  const isSelected = (selected[group.id] ?? []).includes(v.id)
                  return (
                    <label
                      key={v.id}
                      className={`flex items-center justify-between border rounded-card px-3 py-2.5 text-sm cursor-pointer ${
                        isSelected ? 'border-paprika bg-paprika/5' : 'border-line'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type={group.multiple_choice ? 'checkbox' : 'radio'}
                          checked={isSelected}
                          onChange={() => toggleValue(group.id, v.id, group.multiple_choice)}
                        />
                        {v.name}
                      </span>
                      {Number(v.price_delta) > 0 && <span className="text-ink/50">+€{Number(v.price_delta).toFixed(2)}</span>}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-4 mb-5">
            <span className="text-sm text-ink/60">Quantidade</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-full border border-line">−</button>
              <span className="w-6 text-center">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="w-8 h-8 rounded-full border border-line">+</button>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleAdd} disabled={missingRequired} className="btn-primary flex-1">
              Adicionar · €{((Number(product.price) + optionsTotal) * quantity).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

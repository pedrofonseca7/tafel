'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types'
import ImageUpload from './ImageUpload'

type OptionGroupDraft = {
  id?: string
  name: string
  required: boolean
  values: { id?: string; name: string; price_delta: number }[]
}

export default function ProductFormModal({
  restaurantId,
  categoryId,
  product,
  onClose,
  onSaved
}: {
  restaurantId: string
  categoryId: string
  product: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [groups, setGroups] = useState<OptionGroupDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [loadedOptions, setLoadedOptions] = useState(!product)

  // carregar grupos de opções existentes ao editar
  useEffect(() => {
    if (product) {
      supabase
        .from('product_options')
        .select('*, product_option_values(*)')
        .eq('product_id', product.id)
        .order('sort_order')
        .then(({ data }) => {
          if (data) {
            setGroups(
              data.map((g: any) => ({
                id: g.id,
                name: g.name,
                required: g.required,
                values: g.product_option_values.map((v: any) => ({ id: v.id, name: v.name, price_delta: v.price_delta }))
              }))
            )
          }
          setLoadedOptions(true)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addGroup() {
    setGroups((g) => [...g, { name: '', required: false, values: [{ name: '', price_delta: 0 }] }])
  }

  function updateGroup(i: number, patch: Partial<OptionGroupDraft>) {
    setGroups((g) => g.map((grp, idx) => (idx === i ? { ...grp, ...patch } : grp)))
  }

  function addValue(gi: number) {
    setGroups((g) => g.map((grp, idx) => (idx === gi ? { ...grp, values: [...grp.values, { name: '', price_delta: 0 }] } : grp)))
  }

  function updateValue(gi: number, vi: number, patch: Partial<{ name: string; price_delta: number }>) {
    setGroups((g) =>
      g.map((grp, idx) =>
        idx === gi ? { ...grp, values: grp.values.map((v, vidx) => (vidx === vi ? { ...v, ...patch } : v)) } : grp
      )
    )
  }

  function removeGroup(i: number) {
    setGroups((g) => g.filter((_, idx) => idx !== i))
  }

  function removeValue(gi: number, vi: number) {
    setGroups((g) => g.map((grp, idx) => (idx === gi ? { ...grp, values: grp.values.filter((_, vidx) => vidx !== vi) } : grp)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    let productId = product?.id

    if (product) {
      await supabase
        .from('products')
        .update({ name, description, price: Number(price), image_url: imageUrl || null })
        .eq('id', product.id)
    } else {
      const { data } = await supabase
        .from('products')
        .insert({
          restaurant_id: restaurantId,
          category_id: categoryId,
          name,
          description,
          price: Number(price),
          image_url: imageUrl || null
        })
        .select()
        .single()
      productId = data?.id
    }

    if (productId) {
      // Simplicidade: apagar grupos de opções antigos e recriar (MVP)
      await supabase.from('product_options').delete().eq('product_id', productId)
      for (const [i, group] of groups.entries()) {
        if (!group.name.trim()) continue
        const { data: newGroup } = await supabase
          .from('product_options')
          .insert({ product_id: productId, name: group.name, required: group.required, sort_order: i })
          .select()
          .single()
        if (newGroup) {
          const validValues = group.values.filter((v) => v.name.trim())
          if (validValues.length > 0) {
            await supabase.from('product_option_values').insert(
              validValues.map((v, vi) => ({
                product_option_id: newGroup.id,
                name: v.name,
                price_delta: Number(v.price_delta) || 0,
                sort_order: vi
              }))
            )
          }
        }
      }
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6">
      <div className="bg-paper w-full sm:max-w-lg sm:rounded-card rounded-t-card max-h-[90vh] overflow-y-auto p-6">
        <h2 className="font-display text-2xl mb-4">{product ? 'Editar produto' : 'Novo produto'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-ink/70 mb-1 block">Nome</label>
            <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-ink/70 mb-1 block">Descrição</label>
            <textarea className="input" rows={2} value={description ?? ''} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-ink/70 mb-1 block">Preço (€)</label>
              <input required type="number" step="0.01" min="0" className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <ImageUpload label="Fotografia" value={imageUrl} aspect="aspect-square" onChange={setImageUrl} />
          </div>

          <div className="pt-2 border-t border-line">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-ink/70">Extras / opções (ex: Extras, Ponto da carne)</label>
              <button type="button" onClick={addGroup} className="text-sm text-paprika">+ Grupo</button>
            </div>
            {groups.map((group, gi) => (
              <div key={gi} className="border border-line rounded-card p-3 mb-3">
                <div className="flex gap-2 mb-2">
                  <input
                    className="input"
                    placeholder="Nome do grupo (ex: Extras)"
                    value={group.name}
                    onChange={(e) => updateGroup(gi, { name: e.target.value })}
                  />
                  <button type="button" onClick={() => removeGroup(gi)} className="text-ink/40 hover:text-red-600 px-2">✕</button>
                </div>
                <label className="flex items-center gap-2 text-xs text-ink/60 mb-2">
                  <input type="checkbox" checked={group.required} onChange={(e) => updateGroup(gi, { required: e.target.checked })} />
                  Obrigatório escolher
                </label>
                {group.values.map((v, vi) => (
                  <div key={vi} className="flex gap-2 mb-1">
                    <input
                      className="input py-2 text-sm"
                      placeholder="Nome (ex: Queijo)"
                      value={v.name}
                      onChange={(e) => updateValue(gi, vi, { name: e.target.value })}
                    />
                    <input
                      className="input py-2 text-sm w-24"
                      type="number"
                      step="0.01"
                      placeholder="€"
                      value={v.price_delta}
                      onChange={(e) => updateValue(gi, vi, { price_delta: Number(e.target.value) })}
                    />
                    <button type="button" onClick={() => removeValue(gi, vi)} className="text-ink/40 hover:text-red-600 px-2">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => addValue(gi)} className="text-xs text-paprika mt-1">+ opção</button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button disabled={loading || !loadedOptions} className="btn-primary flex-1">
              {loading ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, Product } from '@/lib/types'
import ProductFormModal from './ProductFormModal'

export default function MenuManager({ restaurantId }: { restaurantId: string }) {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [editingProduct, setEditingProduct] = useState<{ product: Product | null; categoryId: string } | null>(null)

  const load = useCallback(async () => {
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order')
    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order')
    setCategories(cats ?? [])
    setProducts(prods ?? [])
  }, [restaurantId, supabase])

  useEffect(() => {
    load()
  }, [load])

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategory.trim()) return
    await supabase.from('categories').insert({
      restaurant_id: restaurantId,
      name: newCategory.trim(),
      sort_order: categories.length
    })
    setNewCategory('')
    load()
  }

  async function deleteCategory(id: string) {
    if (!confirm('Apagar esta categoria e todos os produtos dentro dela?')) return
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  async function toggleAvailable(product: Product) {
    await supabase.from('products').update({ available: !product.available }).eq('id', product.id)
    load()
  }

  async function deleteProduct(id: string) {
    if (!confirm('Apagar este produto?')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <form onSubmit={addCategory} className="flex gap-2 mb-8 max-w-md">
        <input
          className="input"
          placeholder="Nova categoria (ex: Sobremesas)"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button className="btn-primary whitespace-nowrap">Adicionar</button>
      </form>

      {categories.length === 0 && (
        <p className="text-ink/50 text-sm">Cria a tua primeira categoria para começares a adicionar produtos.</p>
      )}

      <div className="space-y-10">
        {categories.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl">{cat.name}</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingProduct({ product: null, categoryId: cat.id })}
                  className="text-sm text-paprika"
                >
                  + Produto
                </button>
                <button onClick={() => deleteCategory(cat.id)} className="text-sm text-ink/40 hover:text-red-600">
                  Apagar categoria
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {products
                .filter((p) => p.category_id === cat.id)
                .map((p) => (
                  <div key={p.id} className={`card p-4 flex justify-between gap-3 ${!p.available ? 'opacity-50' : ''}`}>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-ink/50 line-clamp-2">{p.description}</p>
                      <p className="text-sm mt-1">€{Number(p.price).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end text-xs shrink-0">
                      <button onClick={() => toggleAvailable(p)} className="text-ink/60 hover:text-ink">
                        {p.available ? 'Disponível' : 'Indisponível'}
                      </button>
                      <button onClick={() => setEditingProduct({ product: p, categoryId: cat.id })} className="text-paprika">
                        Editar
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="text-ink/40 hover:text-red-600">
                        Apagar
                      </button>
                    </div>
                  </div>
                ))}
              {products.filter((p) => p.category_id === cat.id).length === 0 && (
                <p className="text-sm text-ink/40">Sem produtos nesta categoria ainda.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingProduct && (
        <ProductFormModal
          restaurantId={restaurantId}
          categoryId={editingProduct.categoryId}
          product={editingProduct.product}
          onClose={() => setEditingProduct(null)}
          onSaved={() => {
            setEditingProduct(null)
            load()
          }}
        />
      )}
    </div>
  )
}

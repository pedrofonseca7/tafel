'use client'

import { useMemo, useState } from 'react'
import { useCart } from '@/lib/cart'
import type { Category, Product, Restaurant } from '@/lib/types'
import ProductDetailSheet from './ProductDetailSheet'
import DeliveryCartSheet from './DeliveryCartSheet'

export default function DeliveryMenuClient({
  restaurant,
  categories,
  products
}: {
  restaurant: Restaurant
  categories: Category[]
  products: Product[]
}) {
  const { count, total } = useCart()
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? '')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  const grouped = useMemo(
    () => categories.map((cat) => ({ category: cat, items: products.filter((p) => p.category_id === cat.id) })),
    [categories, products]
  )

  return (
    <main className="min-h-screen pb-28">
      <div
        className="h-36 flex items-end px-5 pb-4"
        style={{
          background: `linear-gradient(135deg, ${restaurant.brand_color}22, ${restaurant.brand_color}05)`
        }}
      >
        <div>
          {restaurant.logo_url && (
            <img src={restaurant.logo_url} alt={restaurant.name} className="w-12 h-12 rounded-full object-cover mb-2 border-2 border-white shadow" />
          )}
          <h1 className="font-display text-2xl">{restaurant.name}</h1>
          <p className="text-sm text-ink/60">Encomenda para entrega</p>
        </div>
      </div>

      <div className="sticky top-0 bg-paper/90 backdrop-blur z-10 border-b border-line px-5 py-3 flex gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`#cat-${cat.id}`}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
              activeCategory === cat.id ? 'bg-paprika text-paper' : 'bg-ink/5 text-ink/70'
            }`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      <div className="px-5">
        {grouped.map(({ category, items }) => (
          <section key={category.id} id={`cat-${category.id}`} className="pt-8">
            <h2 className="font-display text-xl mb-3">{category.name}</h2>
            <div className="space-y-3">
              {items.map((product) => (
                <button
                  key={product.id}
                  onClick={() => product.available && setSelectedProduct(product)}
                  disabled={!product.available}
                  className={`card w-full p-3 flex gap-3 text-left ${!product.available ? 'opacity-40' : 'active:scale-[0.99]'} transition`}
                >
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-20 h-20 rounded-card object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-ink/50 line-clamp-2 mt-0.5">{product.description}</p>
                    )}
                    <p className="text-sm mt-1 font-medium">
                      {product.available ? `€${Number(product.price).toFixed(2)}` : 'Indisponível'}
                    </p>
                  </div>
                  {product.available && (
                    <span className="self-center w-8 h-8 rounded-full bg-paprika text-paper flex items-center justify-center text-lg shrink-0">
                      +
                    </span>
                  )}
                </button>
              ))}
              {items.length === 0 && <p className="text-sm text-ink/40">Sem produtos nesta categoria.</p>}
            </div>
          </section>
        ))}
        {categories.length === 0 && (
          <p className="text-center text-ink/50 py-20">Este restaurante ainda não adicionou o menu.</p>
        )}
      </div>

      {selectedProduct && (
        <ProductDetailSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {count > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-4 right-4 btn-primary flex items-center justify-between shadow-lg"
        >
          <span>{count} item{count > 1 ? 's' : ''}</span>
          <span>Ver carrinho · €{total.toFixed(2)}</span>
        </button>
      )}

      {cartOpen && (
        <DeliveryCartSheet restaurant={restaurant} onClose={() => setCartOpen(false)} />
      )}
    </main>
  )
}

import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { CartProvider } from '@/lib/cart'
import MenuClient from '@/components/MenuClient'

export default async function ClientMenuPage({ params }: { params: { slug: string; token: string } }) {
  const supabase = createServerSupabase()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single()

  if (!restaurant) notFound()

  const { data: table } = await supabase
    .from('tables')
    .select('*')
    .eq('qr_token', params.token)
    .eq('restaurant_id', restaurant.id)
    .eq('active', true)
    .single()

  if (!table) notFound()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('active', true)
    .order('sort_order')

  const { data: products } = await supabase
    .from('products')
    .select('*, product_options(*, product_option_values(*))')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order')

  return (
    <CartProvider storageKey={`cart-${restaurant.id}-${table.id}`}>
      <MenuClient
        restaurant={restaurant}
        table={table}
        categories={categories ?? []}
        products={products ?? []}
      />
    </CartProvider>
  )
}

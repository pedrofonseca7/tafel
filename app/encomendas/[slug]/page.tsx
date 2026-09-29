import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { CartProvider } from '@/lib/cart'
import DeliveryMenuClient from '@/components/DeliveryMenuClient'

export default async function DeliveryMenuPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabase()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single()

  if (!restaurant) notFound()

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
    <CartProvider storageKey={`delivery-cart-${restaurant.id}`}>
      <DeliveryMenuClient restaurant={restaurant} categories={categories ?? []} products={products ?? []} />
    </CartProvider>
  )
}

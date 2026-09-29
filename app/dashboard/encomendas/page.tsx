import { getCurrentRestaurant } from '@/lib/getCurrentRestaurant'
import DeliveryOrdersBoard from '@/components/DeliveryOrdersBoard'

export default async function DashboardEncomendasPage() {
  const { restaurant } = await getCurrentRestaurant()
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Encomendas</h1>
      <DeliveryOrdersBoard restaurantId={restaurant.id} restaurantSlug={restaurant.slug} />
    </div>
  )
}

import { getCurrentRestaurant } from '@/lib/getCurrentRestaurant'
import OrdersBoard from '@/components/OrdersBoard'

export default async function DashboardOrdersPage() {
  const { restaurant } = await getCurrentRestaurant()
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Pedidos</h1>
      <OrdersBoard restaurantId={restaurant.id} />
    </div>
  )
}

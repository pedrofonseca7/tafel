import { getCurrentRestaurant } from '@/lib/getCurrentRestaurant'
import NotificationsBoard from '@/components/NotificationsBoard'

export default async function NotificationsPage() {
  const { restaurant } = await getCurrentRestaurant()

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Notificações</h1>
      <NotificationsBoard restaurantId={restaurant.id} />
    </div>
  )
}

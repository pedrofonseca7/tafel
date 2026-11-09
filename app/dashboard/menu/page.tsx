import { getCurrentRestaurant } from '@/lib/getCurrentRestaurant'
import MenuManager from '@/components/MenuManager'

export default async function MenuPage() {
  const { restaurant } = await getCurrentRestaurant()
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Menu</h1>
      <MenuManager restaurantId={restaurant.id} />
    </div>
  )
}

import { getCurrentRestaurant } from '@/lib/getCurrentRestaurant'
import TablesManager from '@/components/TablesManager'

export default async function TablesPage() {
  const { restaurant } = await getCurrentRestaurant()
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Mesas & QR Codes</h1>
      <TablesManager restaurantId={restaurant.id} restaurantSlug={restaurant.slug} />
    </div>
  )
}

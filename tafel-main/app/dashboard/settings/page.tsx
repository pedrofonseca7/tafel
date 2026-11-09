import { getCurrentRestaurant } from '@/lib/getCurrentRestaurant'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const { restaurant } = await getCurrentRestaurant()
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Definições</h1>
      <SettingsForm restaurant={restaurant} />
    </div>
  )
}

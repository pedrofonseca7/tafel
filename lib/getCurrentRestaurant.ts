import { createServerSupabase } from './supabase/server'
import { redirect } from 'next/navigation'

export async function getCurrentRestaurant() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: staffRow } = await supabase
    .from('restaurant_staff')
    .select('restaurant_id, role, restaurants(*)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!staffRow) redirect('/onboarding')

  return {
    user,
    role: staffRow.role as string,
    restaurant: staffRow.restaurants as any
  }
}

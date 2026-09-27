import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import AdminPanel from '@/components/AdminPanel'

export default async function AdminPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isAdmin } = await supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!isAdmin) redirect('/dashboard')

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*, orders(count)')
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl mb-8">Administração da plataforma</h1>
      <AdminPanel restaurants={restaurants ?? []} />
    </main>
  )
}

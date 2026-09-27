import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

// Rota temporária só para diagnóstico. Podes apagar este ficheiro depois de resolvido o problema.
export async function GET() {
  const supabase = createServerSupabase()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ loggedIn: false, userError: userError?.message ?? null })
  }

  const { data: adminRow, error: adminError } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: staffRows, error: staffError } = await supabase
    .from('restaurant_staff')
    .select('restaurant_id, role')
    .eq('user_id', user.id)

  return NextResponse.json({
    loggedIn: true,
    user_id: user.id,
    email: user.email,
    isAdminAccordingToApp: !!adminRow,
    adminQueryError: adminError?.message ?? null,
    staffRows,
    staffQueryError: staffError?.message ?? null
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { endpoint } = (await req.json()) as { endpoint: string }
  if (!endpoint) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)

  return NextResponse.json({ ok: true })
}

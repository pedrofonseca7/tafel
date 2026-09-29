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

  const body = await req.json()
  const { restaurant_id, subscription } = body as {
    restaurant_id: string
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  }

  if (!restaurant_id || !subscription?.endpoint || !subscription?.keys) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  // A policy RLS "staff manage own push subscriptions" garante que só um membro
  // da equipa deste restaurante consegue escrever aqui.
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      restaurant_id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    },
    { onConflict: 'endpoint' }
  )

  if (error) {
    return NextResponse.json({ error: 'Não foi possível guardar a subscrição.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

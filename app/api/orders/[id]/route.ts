import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const sessionToken = req.nextUrl.searchParams.get('session_token')
  if (!sessionToken) {
    return NextResponse.json({ error: 'Token em falta.' }, { status: 400 })
  }

  const supabase = createAdminSupabase()
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*, order_item_options(*)), tables(label, qr_token), restaurants(name, logo_url, brand_color)')
    .eq('id', params.id)
    .eq('session_token', sessionToken)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ order })
}

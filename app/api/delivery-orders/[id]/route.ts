import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const sessionToken = req.nextUrl.searchParams.get('session_token')
  if (!sessionToken) {
    return NextResponse.json({ error: 'Token em falta.' }, { status: 400 })
  }

  const supabase = createAdminSupabase()
  const { data: order, error } = await supabase
    .from('delivery_orders')
    .select('*, delivery_order_items(*, delivery_order_item_options(*)), restaurants(name, logo_url, brand_color)')
    .eq('id', params.id)
    .eq('session_token', sessionToken)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ order })
}

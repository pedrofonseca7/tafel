import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { notifyRestaurant } from '@/lib/push'

type IncomingItem = {
  product_id: string
  quantity: number
  notes?: string
  options: { value_id: string }[]
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { restaurant_id, table_id, items, notes } = body as {
    restaurant_id: string
    table_id: string | null
    items: IncomingItem[]
    notes?: string
  }

  if (!restaurant_id || !items?.length) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  const supabase = createAdminSupabase()

  // Confirma que o restaurante está ativo
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, status')
    .eq('id', restaurant_id)
    .single()

  if (!restaurant || restaurant.status !== 'active') {
    return NextResponse.json({ error: 'Restaurante indisponível.' }, { status: 400 })
  }

  // Recalcula os preços a partir da base de dados — nunca confiar no preço enviado pelo cliente
  let total = 0
  const resolvedItems: {
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    notes?: string
    options: { option_name: string; value_name: string; price_delta: number }[]
  }[] = []

  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('id, name, price, available, restaurant_id')
      .eq('id', item.product_id)
      .single()

    if (!product || product.restaurant_id !== restaurant_id || !product.available) {
      return NextResponse.json({ error: `Produto indisponível.` }, { status: 400 })
    }

    let lineOptions: { option_name: string; value_name: string; price_delta: number }[] = []
    if (item.options?.length) {
      const valueIds = item.options.map((o) => o.value_id)
      const { data: values } = await supabase
        .from('product_option_values')
        .select('id, name, price_delta, product_options(name, product_id)')
        .in('id', valueIds)

      lineOptions = (values ?? [])
        .filter((v: any) => v.product_options?.product_id === item.product_id)
        .map((v: any) => ({ option_name: v.product_options.name, value_name: v.name, price_delta: Number(v.price_delta) }))
    }

    const optionsTotal = lineOptions.reduce((s, o) => s + o.price_delta, 0)
    const unitPrice = Number(product.price)
    total += (unitPrice + optionsTotal) * item.quantity

    resolvedItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: unitPrice,
      notes: item.notes,
      options: lineOptions
    })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ restaurant_id, table_id, total, notes, status: 'pending' })
    .select()
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Não foi possível criar o pedido.' }, { status: 500 })
  }

  for (const item of resolvedItems) {
    const { data: orderItem } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes
      })
      .select()
      .single()

    if (orderItem && item.options.length > 0) {
      await supabase.from('order_item_options').insert(
        item.options.map((o) => ({
          order_item_id: orderItem.id,
          option_name: o.option_name,
          value_name: o.value_name,
          price_delta: o.price_delta
        }))
      )
    }
  }

  // Aguarda-se o envio (mesmo que falhe) para garantir que corre até ao fim
  // antes da função serverless terminar — ver lib/push.ts para o porquê.
  await notifyRestaurant({
    restaurantId: restaurant_id,
    type: 'order',
    orderId: order.id,
    title: 'Novo pedido',
    body: `${resolvedItems.length} item${resolvedItems.length > 1 ? 's' : ''} · €${total.toFixed(2)}`
  })

  return NextResponse.json({ order_id: order.id, session_token: order.session_token, total })
}

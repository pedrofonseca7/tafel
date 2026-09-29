import webPush from 'web-push'
import { createAdminSupabase } from './supabase/server'

let configured = false

function ensureConfigured() {
  if (configured) return
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:suporte@tafel.pt'

  if (!publicKey || !privateKey) {
    // Chaves não configuradas — as notificações push ficam simplesmente desativadas,
    // mas o resto da app (incluindo a aba Notificações) continua a funcionar.
    return
  }

  webPush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

// Regista uma notificação no histórico (aba "Notificações") e tenta enviá-la
// por push para todos os dispositivos do restaurante que a autorizaram.
// Nunca lança erro — uma falha aqui não deve impedir a criação do pedido.
export async function notifyRestaurant(params: {
  restaurantId: string
  type: 'order' | 'delivery_order'
  orderId?: string
  deliveryOrderId?: string
  title: string
  body: string
}) {
  const { restaurantId, type, orderId, deliveryOrderId, title, body } = params
  const supabase = createAdminSupabase()

  try {
    await supabase.from('notifications').insert({
      restaurant_id: restaurantId,
      type,
      order_id: orderId ?? null,
      delivery_order_id: deliveryOrderId ?? null,
      title,
      body
    })
  } catch (e) {
    console.error('Falha ao registar notificação:', e)
  }

  try {
    ensureConfigured()
    if (!configured) return

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('restaurant_id', restaurantId)

    if (!subs?.length) return

    const payload = JSON.stringify({ title, body })

    await Promise.all(
      subs.map(async (sub: any) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
        } catch (err: any) {
          // Subscrição expirada/inválida (browser desligado da conta, permissão revogada, etc.) — remove-a
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          } else {
            console.error('Falha ao enviar push:', err?.message || err)
          }
        }
      })
    )
  } catch (e) {
    console.error('Falha no envio de notificações push:', e)
  }
}

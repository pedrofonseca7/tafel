import OrderTracker from '@/components/OrderTracker'

export default function OrderStatusPage({
  params,
  searchParams
}: {
  params: { slug: string; orderId: string }
  searchParams: { token?: string }
}) {
  return <OrderTracker orderId={params.orderId} sessionToken={searchParams.token ?? ''} slug={params.slug} />
}

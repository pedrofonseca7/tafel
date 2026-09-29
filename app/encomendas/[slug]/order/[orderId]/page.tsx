import DeliveryOrderTracker from '@/components/DeliveryOrderTracker'

export default function DeliveryOrderStatusPage({
  params,
  searchParams
}: {
  params: { slug: string; orderId: string }
  searchParams: { token?: string }
}) {
  return <DeliveryOrderTracker orderId={params.orderId} sessionToken={searchParams.token ?? ''} slug={params.slug} />
}

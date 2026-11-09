import Link from 'next/link'
import { getCurrentRestaurant } from '@/lib/getCurrentRestaurant'
import SignOutButton from '@/components/SignOutButton'
import PendingCountBadge from '@/components/PendingCountBadge'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { restaurant } = await getCurrentRestaurant()

  const links = [
    { href: '/dashboard', label: 'Pedidos', pendingTable: 'orders' as const },
    { href: '/dashboard/encomendas', label: 'Encomendas', pendingTable: 'delivery_orders' as const },
    { href: '/dashboard/menu', label: 'Menu' },
    { href: '/dashboard/tables', label: 'Mesas & QR Codes' },
    { href: '/dashboard/settings', label: 'Definições' }
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-60 border-b md:border-b-0 md:border-r border-line px-4 py-4 md:py-6 flex md:flex-col gap-1 md:gap-2 overflow-x-auto">
        <div className="hidden md:block px-2 mb-6">
          <p className="font-display text-lg truncate">{restaurant.name}</p>
          <p className="text-xs text-ink/50">/r/{restaurant.slug}</p>
        </div>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="px-3 py-2 rounded-card text-sm text-ink/70 hover:bg-ink/5 hover:text-ink whitespace-nowrap flex items-center justify-between gap-2"
          >
            {l.label}
            {l.pendingTable && <PendingCountBadge restaurantId={restaurant.id} table={l.pendingTable} />}
          </Link>
        ))}
        <div className="hidden md:block mt-auto pt-6">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 px-6 py-8 max-w-5xl">{children}</main>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Row = {
  id: string
  name: string
  slug: string
  plan: string
  status: 'active' | 'blocked'
  created_at: string
  orders: { count: number }[]
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function AdminPanel({ restaurants }: { restaurants: Row[] }) {
  const supabase = createClient()
  const [rows, setRows] = useState(restaurants)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ restaurantName: '', email: '', password: generatePassword() })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; slug: string; email: string; password: string } | null>(null)

  async function toggleStatus(row: Row) {
    const newStatus = row.status === 'active' ? 'blocked' : 'active'
    await supabase.from('restaurants').update({ status: newStatus }).eq('id', row.id)
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: newStatus } : r)))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)

    const res = await fetch('/api/admin/create-restaurant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Não foi possível criar o restaurante.')
      setCreating(false)
      return
    }

    setRows((prev) => [
      { id: data.restaurant.id, name: data.restaurant.name, slug: data.restaurant.slug, plan: 'free', status: 'active', created_at: new Date().toISOString(), orders: [{ count: 0 }] },
      ...prev
    ])
    setCreatedCredentials({ name: data.restaurant.name, slug: data.restaurant.slug, email: data.credentials.email, password: data.credentials.password })
    setForm({ restaurantName: '', email: '', password: generatePassword() })
    setShowForm(false)
    setCreating(false)
  }

  const totalRestaurants = rows.length
  const activeCount = rows.filter((r) => r.status === 'active').length
  const totalOrders = rows.reduce((sum, r) => sum + (r.orders?.[0]?.count ?? 0), 0)

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-ink/50 mb-1">Restaurantes</p>
          <p className="font-display text-2xl">{totalRestaurants}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink/50 mb-1">Ativos</p>
          <p className="font-display text-2xl">{activeCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink/50 mb-1">Pedidos totais</p>
          <p className="font-display text-2xl">{totalOrders}</p>
        </div>
      </div>

      {createdCredentials && (
        <div className="card p-5 mb-8 border-sage bg-sage/5">
          <p className="font-medium mb-2">Restaurante "{createdCredentials.name}" criado.</p>
          <p className="text-sm text-ink/70 mb-3">
            Guarda ou envia estas credenciais ao cliente agora — a palavra-passe não volta a ser mostrada.
          </p>
          <div className="bg-white rounded-card border border-line p-3 text-sm space-y-1 font-mono">
            <p>Login: <span className="font-sans">tafel.app/login</span></p>
            <p>Email: {createdCredentials.email}</p>
            <p>Palavra-passe: {createdCredentials.password}</p>
          </div>
          <button onClick={() => setCreatedCredentials(null)} className="text-sm text-paprika mt-3">
            Fechar
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl">Restaurantes</h2>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm py-2">
          {showForm ? 'Cancelar' : '+ Novo restaurante'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 mb-6 space-y-4 max-w-md">
          <div>
            <label className="text-sm text-ink/70 mb-1 block">Nome do restaurante</label>
            <input required className="input" value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} placeholder="Ex: Taberna do Zé" />
          </div>
          <div>
            <label className="text-sm text-ink/70 mb-1 block">Email de acesso do cliente</label>
            <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-ink/70 mb-1 block">Palavra-passe</label>
            <div className="flex gap-2">
              <input required minLength={6} className="input font-mono" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setForm({ ...form, password: generatePassword() })} className="btn-secondary whitespace-nowrap text-sm">
                Gerar nova
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={creating} className="btn-primary w-full">
            {creating ? 'A criar...' : 'Criar restaurante e conta'}
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/50 border-b border-line">
              <th className="px-4 py-3 font-normal">Restaurante</th>
              <th className="px-4 py-3 font-normal">Plano</th>
              <th className="px-4 py-3 font-normal">Pedidos</th>
              <th className="px-4 py-3 font-normal">Estado</th>
              <th className="px-4 py-3 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-ink/40">/r/{r.slug}</p>
                </td>
                <td className="px-4 py-3 capitalize">{r.plan}</td>
                <td className="px-4 py-3">{r.orders?.[0]?.count ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'active' ? 'bg-sage/10 text-sage' : 'bg-red-100 text-red-700'}`}>
                    {r.status === 'active' ? 'Ativo' : 'Bloqueado'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleStatus(r)} className="text-xs text-paprika">
                    {r.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/40">Sem restaurantes ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

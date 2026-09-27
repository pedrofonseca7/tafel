'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Restaurant } from '@/lib/types'

export default function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    name: restaurant.name,
    description: restaurant.description ?? '',
    address: restaurant.address ?? '',
    phone: restaurant.phone ?? ''
  })
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('restaurants').update(form).eq('id', restaurant.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="text-sm text-ink/70 mb-1 block">Nome</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="text-sm text-ink/70 mb-1 block">Descrição</label>
        <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div>
        <label className="text-sm text-ink/70 mb-1 block">Morada</label>
        <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div>
        <label className="text-sm text-ink/70 mb-1 block">Telefone</label>
        <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <button className="btn-primary">Guardar alterações</button>
      {saved && <p className="text-sm text-sage">Guardado.</p>}
    </form>
  )
}

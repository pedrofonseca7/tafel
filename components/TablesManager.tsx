'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RestaurantTable } from '@/lib/types'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import TableBillModal from './TableBillModal'

export default function TablesManager({ restaurantId, restaurantSlug }: { restaurantId: string; restaurantSlug: string }) {
  const supabase = createClient()
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [bulkCount, setBulkCount] = useState(10)
  const [label, setLabel] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [billTable, setBillTable] = useState<RestaurantTable | null>(null)

  useEffect(() => {
    setSiteUrl(window.location.origin)
  }, [])

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at')
    setTables(data ?? [])
  }, [restaurantId, supabase])

  useEffect(() => {
    load()
  }, [load])

  function tableUrl(t: RestaurantTable) {
    return `${siteUrl}/r/${restaurantSlug}/t/${t.qr_token}`
  }

  async function addTable(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    await supabase.from('tables').insert({ restaurant_id: restaurantId, label: label.trim() })
    setLabel('')
    load()
  }

  async function generateBulk() {
    const existing = tables.length
    const rows = Array.from({ length: bulkCount }, (_, i) => ({
      restaurant_id: restaurantId,
      label: String(existing + i + 1)
    }))
    await supabase.from('tables').insert(rows)
    load()
  }

  async function deleteTable(id: string) {
    if (!confirm('Apagar esta mesa?')) return
    await supabase.from('tables').delete().eq('id', id)
    load()
  }

  async function downloadAllQr() {
    const zip = new JSZip()
    for (const t of tables) {
      const dataUrl = await QRCode.toDataURL(tableUrl(t), { width: 600, margin: 2 })
      const base64 = dataUrl.split(',')[1]
      zip.file(`mesa-${t.label}.png`, base64, { base64: true })
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `qrcodes-${restaurantSlug}.zip`)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-6 mb-8">
        <form onSubmit={addTable} className="flex gap-2">
          <input className="input" placeholder="Nome da mesa (ex: Mesa 7)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <button className="btn-secondary whitespace-nowrap">Adicionar 1</button>
        </form>

        <div className="flex gap-2 items-center">
          <input
            type="number"
            min={1}
            className="input w-24"
            value={bulkCount}
            onChange={(e) => setBulkCount(Number(e.target.value))}
          />
          <button onClick={generateBulk} className="btn-secondary whitespace-nowrap">Criar em lote</button>
        </div>

        {tables.length > 0 && (
          <button onClick={downloadAllQr} className="btn-primary whitespace-nowrap ml-auto">
            Descarregar todos os QR Codes (.zip)
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {tables.map((t) => (
          <TableCard key={t.id} table={t} url={tableUrl(t)} onDelete={() => deleteTable(t.id)} onViewBill={() => setBillTable(t)} />
        ))}
      </div>

      {tables.length === 0 && (
        <p className="text-ink/50 text-sm">Ainda não tens mesas. Cria uma ou gera várias de uma vez.</p>
      )}

      {billTable && (
        <TableBillModal
          table={billTable}
          restaurantId={restaurantId}
          onClose={() => setBillTable(null)}
          onClosedTab={() => {
            setBillTable(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function TableCard({
  table,
  url,
  onDelete,
  onViewBill
}: {
  table: RestaurantTable
  url: string
  onDelete: () => void
  onViewBill: () => void
}) {
  const [qr, setQr] = useState('')

  useEffect(() => {
    QRCode.toDataURL(url, { width: 300, margin: 1 }).then(setQr)
  }, [url])

  return (
    <div className="card p-4 text-center">
      {qr && <img src={qr} alt={`QR Mesa ${table.label}`} className="mx-auto mb-2 rounded" />}
      <p className="font-medium mb-2">Mesa {table.label}</p>
      <div className="flex justify-center gap-3 text-xs">
        <button onClick={onViewBill} className="text-paprika font-medium">Ver conta</button>
        <button onClick={onDelete} className="text-ink/40 hover:text-red-600">Apagar</button>
      </div>
    </div>
  )
}

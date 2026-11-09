'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const BUCKET = 'public-images'

export default function ImageUpload({
  value,
  onChange,
  label,
  aspect = 'aspect-video'
}: {
  value: string | null
  onChange: (url: string) => void
  label: string
  aspect?: string
}) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Escolhe um ficheiro de imagem.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem não pode passar 5MB.')
      return
    }

    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

    if (uploadError) {
      setError('Não foi possível enviar a imagem. Tenta novamente.')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <label className="text-sm text-ink/70 mb-1 block">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {value ? (
        <div className={`relative ${aspect} rounded-card overflow-hidden border border-line group`}>
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs bg-white px-3 py-1.5 rounded-card"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs bg-white px-3 py-1.5 rounded-card"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`w-full ${aspect} rounded-card border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 text-ink/50 hover:border-paprika hover:text-paprika transition`}
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-xs">{uploading ? 'A enviar...' : 'Carregar fotografia'}</span>
        </button>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

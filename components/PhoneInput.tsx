'use client'

import { useState } from 'react'
import { COUNTRY_CODES, DEFAULT_COUNTRY, type CountryCode } from '@/lib/countryCodes'

export default function PhoneInput({
  value,
  onChange
}: {
  value: string
  onChange: (fullPhone: string) => void
}) {
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY)
  const [digits, setDigits] = useState('')

  function emit(nextCountry: CountryCode, nextDigits: string) {
    onChange(nextDigits ? `${nextCountry.dial} ${nextDigits}` : '')
  }

  function handleCountryChange(dial: string) {
    const nextCountry = COUNTRY_CODES.find((c) => c.dial === dial) ?? DEFAULT_COUNTRY
    // se já houver dígitos a mais para o novo indicativo, corta
    const trimmed = digits.slice(0, nextCountry.digits)
    setCountry(nextCountry)
    setDigits(trimmed)
    emit(nextCountry, trimmed)
  }

  function handleDigitsChange(raw: string) {
    const onlyDigits = raw.replace(/\D/g, '').slice(0, country.digits)
    setDigits(onlyDigits)
    emit(country, onlyDigits)
  }

  return (
    <div>
      <label className="text-sm text-ink/70 mb-1 block">Número de telemóvel</label>

      {/* Uma única moldura (não duas caixas "input" a competir por largura) */}
      <div className="flex items-stretch rounded-card border border-ink/15 bg-paper focus-within:border-paprika transition overflow-hidden">
        <select
          value={country.dial}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="shrink-0 bg-transparent pl-3 pr-1 py-3 text-ink border-r border-ink/15 focus:outline-none appearance-none"
          style={{ width: '5.5rem' }}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.dial}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
        <input
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-ink placeholder:text-ink/40 focus:outline-none"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={digits}
          maxLength={country.digits}
          placeholder={'9'.repeat(country.digits)}
          onChange={(e) => handleDigitsChange(e.target.value)}
        />
      </div>

      <p className="text-xs text-ink/40 mt-1">
        {digits.length}/{country.digits} dígitos
      </p>
    </div>
  )
}

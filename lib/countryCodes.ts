export type CountryCode = {
  code: string // ISO, para key
  name: string
  dial: string // ex: "+351"
  flag: string
  digits: number // nº de dígitos esperado depois do indicativo
}

// Lista pragmática: Portugal em primeiro (mercado principal), mais os países mais comuns.
export const COUNTRY_CODES: CountryCode[] = [
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹', digits: 9 },
  { code: 'ES', name: 'Espanha', dial: '+34', flag: '🇪🇸', digits: 9 },
  { code: 'FR', name: 'França', dial: '+33', flag: '🇫🇷', digits: 9 },
  { code: 'GB', name: 'Reino Unido', dial: '+44', flag: '🇬🇧', digits: 10 },
  { code: 'DE', name: 'Alemanha', dial: '+49', flag: '🇩🇪', digits: 11 },
  { code: 'IT', name: 'Itália', dial: '+39', flag: '🇮🇹', digits: 10 },
  { code: 'NL', name: 'Países Baixos', dial: '+31', flag: '🇳🇱', digits: 9 },
  { code: 'BE', name: 'Bélgica', dial: '+32', flag: '🇧🇪', digits: 9 },
  { code: 'IE', name: 'Irlanda', dial: '+353', flag: '🇮🇪', digits: 9 },
  { code: 'CH', name: 'Suíça', dial: '+41', flag: '🇨🇭', digits: 9 },
  { code: 'BR', name: 'Brasil', dial: '+55', flag: '🇧🇷', digits: 11 },
  { code: 'US', name: 'Estados Unidos', dial: '+1', flag: '🇺🇸', digits: 10 },
  { code: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴', digits: 9 },
  { code: 'CV', name: 'Cabo Verde', dial: '+238', flag: '🇨🇻', digits: 7 },
  { code: 'MZ', name: 'Moçambique', dial: '+258', flag: '🇲🇿', digits: 9 }
]

export const DEFAULT_COUNTRY = COUNTRY_CODES[0]

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente com o contexto de autenticação do utilizador (respeita RLS)
export function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // chamado de um Server Component sem permissão de escrita — ignorar
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        }
      }
    }
  )
}

// Cliente com a service_role key — ignora RLS.
// Usar APENAS em API routes, e sempre filtrando manualmente por restaurant_id/session_token.
export function createAdminSupabase() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut()
        router.push('/login')
      }}
      className="text-sm text-ink/50 hover:text-ink px-3"
    >
      Sair
    </button>
  )
}

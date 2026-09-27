'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MenuManager from '@/components/MenuManager'
import TablesManager from '@/components/TablesManager'
import SettingsForm from '@/components/SettingsForm'
import type { Restaurant } from '@/lib/types'

const STEPS = ['Perfil', 'Categorias & produtos', 'Mesas', 'Pronto']

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: staffRow } = await supabase
        .from('restaurant_staff')
        .select('restaurants(*)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (staffRow?.restaurants) {
        setRestaurant(staffRow.restaurants as any)
        setLoading(false)
        return
      }

      // Não tem restaurante associado — verifica se é admin da plataforma, para dar uma mensagem útil
      const { data: adminRow } = await supabase
        .from('platform_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      setIsAdmin(!!adminRow)
      setLoading(false)
    }
    load()
  }, [supabase, router])

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-ink/50">A carregar...</main>
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-2xl mb-3">
            {isAdmin ? 'Esta conta é de administração' : 'Nenhum restaurante associado'}
          </h1>
          <p className="text-ink/60 mb-6 text-sm">
            {isAdmin
              ? 'A tua conta gere a plataforma, mas não é dona de nenhum restaurante. Cria um em /admin.'
              : 'Esta conta ainda não está associada a nenhum restaurante. Contacta a administração da plataforma.'}
          </p>
          <a href={isAdmin ? '/admin' : '/login'} className="btn-primary inline-block">
            {isAdmin ? 'Ir para a administração' : 'Voltar ao login'}
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-paprika' : 'bg-line'}`} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <h1 className="font-display text-3xl mb-1">Vamos configurar o {restaurant.name}</h1>
            <p className="text-ink/60 mb-8">Preenche os dados essenciais do teu restaurante.</p>
            <SettingsForm restaurant={restaurant} />
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="font-display text-3xl mb-1">Adiciona o teu menu</h1>
            <p className="text-ink/60 mb-8">Cria categorias e os primeiros produtos. Podes adicionar mais depois.</p>
            <MenuManager restaurantId={restaurant.id} />
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-display text-3xl mb-1">Cria as tuas mesas</h1>
            <p className="text-ink/60 mb-8">Gera os QR Codes que vais colocar em cada mesa.</p>
            <TablesManager restaurantId={restaurant.id} restaurantSlug={restaurant.slug} />
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-16">
            <h1 className="font-display text-4xl mb-3">Está tudo pronto.</h1>
            <p className="text-ink/60 mb-8">O teu restaurante já pode receber pedidos.</p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary">Ir para o painel</button>
          </div>
        )}

        <div className="flex justify-between mt-10">
          <button
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            className="btn-secondary disabled:opacity-0"
          >
            Voltar
          </button>
          {step < STEPS.length - 1 && (
            <button onClick={() => setStep((s) => s + 1)} className="btn-primary">
              Continuar
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

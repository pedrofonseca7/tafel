import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server'

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function POST(req: NextRequest) {
  // 1. Confirma que quem está a chamar esta API é mesmo um admin da plataforma
  const sessionSupabase = createServerSupabase()
  const { data: { user } } = await sessionSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }
  const { data: isAdmin } = await sessionSupabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Sem permissões de administrador.' }, { status: 403 })
  }

  // 2. Lê os dados do novo restaurante
  const { restaurantName, email, password } = await req.json()
  if (!restaurantName?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: 'Dados em falta ou palavra-passe demasiado curta (mín. 6 caracteres).' }, { status: 400 })
  }

  const admin = createAdminSupabase()

  // 3. Cria a conta do dono do restaurante (já confirmada, sem precisar de email)
  const { data: newUser, error: createUserError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true
  })

  if (createUserError || !newUser.user) {
    return NextResponse.json({ error: createUserError?.message ?? 'Não foi possível criar a conta.' }, { status: 400 })
  }

  // 4. Cria o restaurante, com slug único
  let slug = slugify(restaurantName)
  let { data: restaurant, error: restaurantError } = await admin
    .from('restaurants')
    .insert({ slug, name: restaurantName.trim() })
    .select()
    .single()

  if (restaurantError) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
    const retry = await admin.from('restaurants').insert({ slug, name: restaurantName.trim() }).select().single()
    if (retry.error) {
      return NextResponse.json({ error: 'Não foi possível criar o restaurante.' }, { status: 500 })
    }
    restaurant = retry.data
  }

  // 5. Liga o novo utilizador ao restaurante como owner
  await admin.from('restaurant_staff').insert({
    restaurant_id: restaurant!.id,
    user_id: newUser.user.id,
    role: 'owner'
  })

  return NextResponse.json({
    restaurant: { id: restaurant!.id, name: restaurant!.name, slug: restaurant!.slug },
    credentials: { email: email.trim(), password }
  })
}

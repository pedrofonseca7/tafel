-- ============================================================
-- MIGRAÇÃO: Notificações push + histórico de notificações
-- Corre isto no SQL Editor do teu projeto Supabase em produção.
-- Não apaga nem altera nada do que já existe.
-- ============================================================

-- Subscrições de notificações push (uma por browser/dispositivo autorizado)
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Histórico de notificações (para a aba "Notificações" no dashboard)
create table notifications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  type text not null check (type in ('order', 'delivery_order')),
  order_id uuid references orders(id) on delete cascade,
  delivery_order_id uuid references delivery_orders(id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
alter table notifications enable row level security;

create policy "staff manage own push subscriptions" on push_subscriptions for all
  using (is_staff_of(restaurant_id)) with check (is_staff_of(restaurant_id));

create policy "staff read own notifications" on notifications for select using (is_staff_of(restaurant_id) or is_platform_admin());
create policy "staff update own notifications" on notifications for update using (is_staff_of(restaurant_id));

alter publication supabase_realtime add table notifications;

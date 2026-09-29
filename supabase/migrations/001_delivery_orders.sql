-- ============================================================
-- MIGRAÇÃO: Sistema de Encomendas para Entrega
-- Corre isto no SQL Editor do teu projeto Supabase em produção.
-- Não apaga nem altera nada do sistema de Pedidos (mesas/QR Codes) existente.
-- ============================================================

create table delivery_orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  session_token text not null default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending'
    check (status in ('pending','accepted','rejected','preparing','ready','out_for_delivery','delivered')),
  total numeric(10,2) not null default 0,
  customer_name text not null,
  customer_phone text not null,
  address text not null,
  postal_code text not null,
  city text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table delivery_order_items (
  id uuid primary key default gen_random_uuid(),
  delivery_order_id uuid not null references delivery_orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  notes text
);

create table delivery_order_item_options (
  id uuid primary key default gen_random_uuid(),
  delivery_order_item_id uuid not null references delivery_order_items(id) on delete cascade,
  option_name text not null,
  value_name text not null,
  price_delta numeric(10,2) not null default 0
);

alter table delivery_orders enable row level security;
alter table delivery_order_items enable row level security;
alter table delivery_order_item_options enable row level security;

create policy "staff read own delivery orders" on delivery_orders for select using (is_staff_of(restaurant_id) or is_platform_admin());
create policy "staff update own delivery orders" on delivery_orders for update using (is_staff_of(restaurant_id));
create policy "anyone create delivery order" on delivery_orders for insert with check (true);

create policy "staff read delivery order items" on delivery_order_items for select using (
  is_staff_of((select restaurant_id from delivery_orders where id = delivery_order_id))
);
create policy "anyone insert delivery order items" on delivery_order_items for insert with check (true);

create policy "staff read delivery order item options" on delivery_order_item_options for select using (
  is_staff_of((select restaurant_id from delivery_orders o
    join delivery_order_items oi on oi.delivery_order_id = o.id where oi.id = delivery_order_item_id))
);
create policy "anyone insert delivery order item options" on delivery_order_item_options for insert with check (true);

alter publication supabase_realtime add table delivery_orders;
alter publication supabase_realtime add table delivery_order_items;

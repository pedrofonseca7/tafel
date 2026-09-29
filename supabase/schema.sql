-- ============================================================
-- QRMENU — SCHEMA MULTI-TENANT
-- Corre este ficheiro no SQL Editor do teu projeto Supabase.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- RESTAURANTES ----------
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_url text,
  cover_url text,
  description text,
  address text,
  phone text,
  brand_color text default '#C4501C',
  opening_hours jsonb default '{}'::jsonb,
  plan text not null default 'free' check (plan in ('free','pro','premium')),
  status text not null default 'active' check (status in ('active','blocked')),
  created_at timestamptz not null default now()
);

-- ---------- STAFF (donos/funcionários) ----------
create table restaurant_staff (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','staff')),
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

-- ---------- ADMIN DA PLATAFORMA ----------
create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
-- ---------- CATEGORIAS ----------
create table categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- PRODUTOS ----------
create table products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- GRUPOS DE OPÇÕES (ex: "Extras", "Ponto da carne") ----------
create table product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  required boolean not null default false,
  multiple_choice boolean not null default true,
  sort_order int not null default 0
);

create table product_option_values (
  id uuid primary key default gen_random_uuid(),
  product_option_id uuid not null references product_options(id) on delete cascade,
  name text not null,
  price_delta numeric(10,2) not null default 0,
  sort_order int not null default 0
);

-- ---------- MESAS ----------
create table tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  label text not null,
  qr_token text unique not null default encode(gen_random_bytes(12), 'hex'),
  active boolean not null default true,
  tab_started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------- PEDIDOS ----------
create table orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid references tables(id) on delete set null,
  session_token text not null default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending'
    check (status in ('pending','accepted','rejected','preparing','ready','delivered')),
  total numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  notes text
);

create table order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  option_name text not null,
  value_name text not null,
  price_delta numeric(10,2) not null default 0
);

-- ---------- ENCOMENDAS PARA ENTREGA (separadas dos pedidos de mesa) ----------
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

-- ---------- SUBSCRIÇÕES DE NOTIFICAÇÕES PUSH (por dispositivo/browser) ----------
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ---------- HISTÓRICO DE NOTIFICAÇÕES (aba "Notificações" do dashboard) ----------
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

-- ---------- SUBSCRIÇÕES (preparado para o futuro) ----------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  renews_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- HELPER: o utilizador atual é staff deste restaurante?
-- ============================================================
create or replace function is_staff_of(rest_id uuid)
returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from restaurant_staff
    where restaurant_id = rest_id and user_id = auth.uid()
  );
$$;

create or replace function is_platform_admin()
returns boolean
language sql security definer stable as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

-- ============================================================
-- RLS — ISOLAMENTO ENTRE RESTAURANTES
-- ============================================================
alter table restaurants enable row level security;
alter table restaurant_staff enable row level security;
alter table platform_admins enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_options enable row level security;
alter table product_option_values enable row level security;
alter table tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_options enable row level security;
alter table delivery_orders enable row level security;
alter table delivery_order_items enable row level security;
alter table delivery_order_item_options enable row level security;
alter table push_subscriptions enable row level security;
alter table notifications enable row level security;
alter table subscriptions enable row level security;

-- Restaurants: leitura pública (para a página do cliente), escrita só staff/admin
create policy "public read active restaurants" on restaurants
  for select using (status = 'active' or is_staff_of(id) or is_platform_admin());
create policy "staff manage own restaurant" on restaurants
  for update using (is_staff_of(id) or is_platform_admin());
create policy "authenticated create restaurant" on restaurants
  for insert with check (auth.uid() is not null);

create policy "staff read own staff rows" on restaurant_staff
  for select using (is_staff_of(restaurant_id) or is_platform_admin());
create policy "owner manage staff" on restaurant_staff
  for all using (is_staff_of(restaurant_id) or is_platform_admin());

-- Cada utilizador só pode ler a sua própria linha, para a app saber se é admin
create policy "self read admin row" on platform_admins
  for select using (user_id = auth.uid());

-- Categorias/produtos/opções: leitura pública, escrita só staff do restaurante
create policy "public read categories" on categories for select using (true);
create policy "staff write categories" on categories for all
  using (is_staff_of(restaurant_id)) with check (is_staff_of(restaurant_id));

create policy "public read products" on products for select using (true);
create policy "staff write products" on products for all
  using (is_staff_of(restaurant_id)) with check (is_staff_of(restaurant_id));

create policy "public read options" on product_options for select using (true);
create policy "staff write options" on product_options for all
  using (is_staff_of((select restaurant_id from products where id = product_id)))
  with check (is_staff_of((select restaurant_id from products where id = product_id)));

create policy "public read option values" on product_option_values for select using (true);
create policy "staff write option values" on product_option_values for all
  using (is_staff_of((select restaurant_id from products p
          join product_options po on po.product_id = p.id where po.id = product_option_id)));

-- Mesas: leitura pública (para resolver QR), escrita só staff
create policy "public read tables" on tables for select using (true);
create policy "staff write tables" on tables for all
  using (is_staff_of(restaurant_id)) with check (is_staff_of(restaurant_id));

-- Pedidos: staff vê tudo do seu restaurante; cliente só vê o seu (via session_token, tratado na app layer com service key)
create policy "staff read own orders" on orders for select using (is_staff_of(restaurant_id) or is_platform_admin());
create policy "staff update own orders" on orders for update using (is_staff_of(restaurant_id));
create policy "anyone create order" on orders for insert with check (true);

create policy "staff read order items" on order_items for select using (
  is_staff_of((select restaurant_id from orders where id = order_id))
);
create policy "anyone insert order items" on order_items for insert with check (true);

create policy "staff read order item options" on order_item_options for select using (
  is_staff_of((select restaurant_id from orders o
    join order_items oi on oi.order_id = o.id where oi.id = order_item_id))
);
create policy "anyone insert order item options" on order_item_options for insert with check (true);

-- Encomendas para entrega: mesmo padrão dos pedidos de mesa
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

-- Subscrições push: staff gere as do seu restaurante; o servidor (service role) lê todas para enviar
create policy "staff manage own push subscriptions" on push_subscriptions for all
  using (is_staff_of(restaurant_id)) with check (is_staff_of(restaurant_id));

-- Notificações: staff vê e marca como lidas as do seu restaurante; inserção feita pelo servidor (service role)
create policy "staff read own notifications" on notifications for select using (is_staff_of(restaurant_id) or is_platform_admin());
create policy "staff update own notifications" on notifications for update using (is_staff_of(restaurant_id));

create policy "staff manage subscriptions" on subscriptions for all using (is_staff_of(restaurant_id) or is_platform_admin());

-- ============================================================
-- REALTIME: publicar mudanças de pedidos
-- ============================================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table delivery_orders;
alter publication supabase_realtime add table delivery_order_items;
alter publication supabase_realtime add table notifications;

-- ============================================================
-- STORAGE: bucket público para fotos (logos, capas, produtos)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('public-images', 'public-images', true)
on conflict (id) do nothing;

-- Qualquer pessoa pode ver as imagens (são públicas, aparecem no menu do cliente)
create policy "public read images" on storage.objects
  for select using (bucket_id = 'public-images');

-- Só utilizadores autenticados (donos/staff de restaurantes) podem enviar imagens
create policy "authenticated upload images" on storage.objects
  for insert with check (bucket_id = 'public-images' and auth.uid() is not null);

create policy "authenticated update own images" on storage.objects
  for update using (bucket_id = 'public-images' and auth.uid() is not null);

create policy "authenticated delete own images" on storage.objects
  for delete using (bucket_id = 'public-images' and auth.uid() is not null);

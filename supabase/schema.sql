-- ========================================================
-- Techora Pakistan: Full Supabase Schema & Permissions Fix
-- Run this in Supabase Dashboard > SQL Editor > Click RUN
-- ========================================================

create extension if not exists "pgcrypto";

-- 1. Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text default '',
  price numeric(12,2) not null check (price >= 0),
  discount numeric(5,2) not null default 0 check (discount between 0 and 100),
  stock integer not null default 0 check (stock >= 0),
  image_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  phone text not null,
  address text not null,
  payment_method text not null check (payment_method in ('easypaisa','jazzcash','cod','bank_transfer')),
  status text not null default 'pending_payment' check (status in ('pending_payment','approved','processing','completed','cancelled')),
  total numeric(12,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null default 1 check (quantity > 0)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_name text default 'Customer',
  rating integer not null default 5 check (rating between 1 and 5),
  message text not null check (char_length(message) between 2 and 1000),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Ensure nullable user_id & customer_name exist if table was previously created
alter table public.reviews alter column user_id drop not null;
alter table public.reviews add column if not exists customer_name text default 'Customer';

-- 2. Functions & Triggers
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, email, full_name)
  values(new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.set_admin_role(target_email text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can grant admin access';
  end if;
  update public.profiles set role = 'admin' where lower(email) = lower(target_email);
  if not found then
    raise exception 'This email has not signed in yet';
  end if;
end;
$$;

-- 3. Grants (CRITICAL: prevents "permission denied for function is_admin" error)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.handle_new_user() to anon, authenticated, service_role;

-- 4. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

-- Profiles Policies
drop policy if exists "profiles own or admin" on public.profiles;
create policy "profiles own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (id = auth.uid());

-- Products Policies
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (is_active = true or public.is_admin());

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- Orders Policies
drop policy if exists "orders own or admin read" on public.orders;
create policy "orders own or admin read" on public.orders for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders customer create" on public.orders;
create policy "orders customer create" on public.orders for insert with check (user_id = auth.uid());

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());

-- Order Items Policies
drop policy if exists "items own or admin read" on public.order_items;
create policy "items own or admin read" on public.order_items for select using (exists(select 1 from public.orders where orders.id = order_items.order_id and (orders.user_id = auth.uid() or public.is_admin())));

drop policy if exists "items customer create" on public.order_items;
create policy "items customer create" on public.order_items for insert with check (exists(select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));

-- Reviews Policies (Public can read active reviews, Anyone can submit)
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (is_visible = true or public.is_admin());

drop policy if exists "reviews customer create" on public.reviews;
create policy "reviews customer create" on public.reviews for insert with check (true);

drop policy if exists "reviews admin delete" on public.reviews;
create policy "reviews admin delete" on public.reviews for delete using (public.is_admin());

-- 5. Set Admin Account
update public.profiles set role = 'admin' where email = 'techorapakistan@gmail.com';

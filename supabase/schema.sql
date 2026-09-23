-- Run this file in Supabase Dashboard > SQL Editor.
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null, category text not null, description text default '',
  price numeric(12,2) not null check (price >= 0),
  discount numeric(5,2) not null default 0 check (discount between 0 and 100),
  stock integer not null default 0 check (stock >= 0),
  image_url text not null,
  gallery jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null, phone text not null, address text not null,
  payment_method text not null check (payment_method in ('easypaisa','jazzcash','cod')),
  status text not null default 'pending_payment' check (status in ('pending_payment','approved','processing','completed','cancelled')),
  total numeric(12,2) not null check (total >= 0), created_at timestamptz not null default now()
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null, unit_price numeric(12,2) not null,
  quantity integer not null default 1 check (quantity > 0)
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null default 5 check (rating between 1 and 5),
  message text not null check (char_length(message) between 5 and 1000),
  is_visible boolean not null default true, created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,email,full_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name')); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
create or replace function public.set_admin_role(target_email text) returns void language plpgsql security definer set search_path=public as $$
begin if not public.is_admin() then raise exception 'Only an admin can grant admin access'; end if; update public.profiles set role='admin' where lower(email)=lower(target_email); if not found then raise exception 'This email has not signed in yet'; end if; end; $$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "profiles own or admin" on public.profiles;
create policy "profiles own or admin" on public.profiles for select using (id=auth.uid() or public.is_admin());

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (is_active=true or public.is_admin());

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders own or admin read" on public.orders;
create policy "orders own or admin read" on public.orders for select using (user_id=auth.uid() or public.is_admin());

drop policy if exists "orders customer create" on public.orders;
create policy "orders customer create" on public.orders for insert with check (user_id=auth.uid());

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "items own or admin read" on public.order_items;
create policy "items own or admin read" on public.order_items for select using (exists(select 1 from public.orders where orders.id=order_items.order_id and (orders.user_id=auth.uid() or public.is_admin())));

drop policy if exists "items customer create" on public.order_items;
create policy "items customer create" on public.order_items for insert with check (exists(select 1 from public.orders where orders.id=order_items.order_id and orders.user_id=auth.uid()));

drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (is_visible=true or user_id=auth.uid() or public.is_admin());

drop policy if exists "reviews customer create" on public.reviews;
create policy "reviews customer create" on public.reviews for insert with check (user_id=auth.uid());

drop policy if exists "reviews admin delete" on public.reviews;
create policy "reviews admin delete" on public.reviews for delete using (public.is_admin());

-- After your own first Google login, run once with your own email:
-- update public.profiles set role='admin' where email='YOUR_ADMIN_EMAIL@gmail.com';

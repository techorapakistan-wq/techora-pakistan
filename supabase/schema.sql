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
create table if not exists public.store_settings (
  id boolean primary key default true check (id = true),
  easypaisa_number text not null default '03234724373',
  easypaisa_name text not null default 'Muhammad Usama',
  jazzcash_number text not null default '03234724373',
  jazzcash_name text not null default 'Muhammad Usama',
  bank_name text not null default 'HBL',
  bank_account text not null default '06147900940851',
  bank_account_name text not null default 'Muhammad Usama',
  website_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (true) on conflict (id) do nothing;
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null, phone text not null, address text not null,
  payment_method text not null check (payment_method in ('easypaisa','jazzcash','bank_transfer','cod')),
  status text not null default 'pending_payment' check (status in ('pending_payment','approved','processing','completed','cancelled')),
  total numeric(12,2) not null check (total >= 0), created_at timestamptz not null default now(), confirmed_at timestamptz,
  stock_deducted_at timestamptz,
  payment_proof_required boolean not null default false
);
alter table public.orders add column if not exists stock_deducted_at timestamptz;
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
    product_name text not null, product_image_url text, unit_price numeric(12,2) not null,
    quantity integer not null default 1 check (quantity > 0)
  );

create or replace function public.apply_order_stock_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  expected_products integer;
  updated_products integer;
begin
  if new.status in ('approved', 'processing', 'completed')
     and new.stock_deducted_at is null then
    select count(*)
      into expected_products
      from (
        select item.product_id
        from public.order_items as item
        where item.order_id = new.id
          and item.product_id is not null
        group by item.product_id
      ) as order_products;

    if expected_products = 0 then
      raise exception 'Cannot adjust stock: this order has no items linked to products.';
    end if;

    perform product.id
      from public.products as product
      join (
        select item.product_id, sum(item.quantity)::integer as quantity
        from public.order_items as item
        where item.order_id = new.id
          and item.product_id is not null
        group by item.product_id
      ) as quantities on quantities.product_id = product.id
     order by product.id
       for update of product;

    update public.products as product
       set stock = product.stock - quantities.quantity
      from (
        select item.product_id, sum(item.quantity)::integer as quantity
        from public.order_items as item
        where item.order_id = new.id
          and item.product_id is not null
        group by item.product_id
      ) as quantities
     where product.id = quantities.product_id
       and product.stock >= quantities.quantity;

    get diagnostics updated_products = row_count;
    if updated_products <> expected_products then
      raise exception 'Cannot confirm this order: one or more products do not have enough stock.';
    end if;

    new.stock_deducted_at := now();
  elsif new.status not in ('approved', 'processing', 'completed')
        and old.stock_deducted_at is not null then
    perform product.id
      from public.products as product
      join (
        select item.product_id, sum(item.quantity)::integer as quantity
        from public.order_items as item
        where item.order_id = new.id
          and item.product_id is not null
        group by item.product_id
      ) as quantities on quantities.product_id = product.id
     order by product.id
       for update of product;

    update public.products as product
       set stock = product.stock + quantities.quantity
      from (
        select item.product_id, sum(item.quantity)::integer as quantity
        from public.order_items as item
        where item.order_id = new.id
          and item.product_id is not null
        group by item.product_id
      ) as quantities
     where product.id = quantities.product_id;

    new.stock_deducted_at := null;
  end if;

  return new;
end;
$$;

revoke all on function public.apply_order_stock_transition() from public, anon, authenticated;

drop trigger if exists apply_order_stock_transition on public.orders;
create trigger apply_order_stock_transition
  before update of status on public.orders
  for each row
  execute function public.apply_order_stock_transition();

alter table public.order_items add column if not exists product_image_url text;
create table if not exists public.order_payment_proofs (
  order_id uuid primary key references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_name text,
  rating integer not null default 5 check (rating between 1 and 5),
  message text not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Migration helpers if table already exists
alter table public.reviews add column if not exists customer_name text;
alter table public.reviews alter column user_id drop not null;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,email,full_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name')); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
grant execute on function public.is_admin() to anon, authenticated, service_role;

create or replace function public.set_admin_role(target_email text) returns void language plpgsql security definer set search_path=public as $$
begin if not public.is_admin() then raise exception 'Only an admin can grant admin access'; end if; update public.profiles set role='admin' where lower(email)=lower(target_email); if not found then raise exception 'This email has not signed in yet'; end if; end; $$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_payment_proofs enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "profiles own or admin" on public.profiles;
create policy "profiles own or admin" on public.profiles for select using (id=auth.uid() or public.is_admin());

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (is_active=true or public.is_admin());

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "store settings public read" on public.store_settings;
create policy "store settings public read" on public.store_settings for select to anon, authenticated using (true);
drop policy if exists "store settings admin update" on public.store_settings;
create policy "store settings admin update" on public.store_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;

drop policy if exists "orders own or admin read" on public.orders;
create policy "orders own or admin read" on public.orders for select using (user_id=auth.uid() or public.is_admin());

drop policy if exists "orders customer create" on public.orders;
create policy "orders customer create" on public.orders for insert with check (true);

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders admin delete" on public.orders;
create policy "orders admin delete" on public.orders for delete using (public.is_admin());

drop policy if exists "items own or admin read" on public.order_items;
create policy "items own or admin read" on public.order_items for select using (exists(select 1 from public.orders where orders.id=order_items.order_id and (orders.user_id=auth.uid() or public.is_admin())));

drop policy if exists "items customer create" on public.order_items;
create policy "items customer create" on public.order_items for insert with check (true);

drop policy if exists "items admin delete" on public.order_items;
create policy "items admin delete" on public.order_items for delete using (public.is_admin());

drop policy if exists "order proof owner or admin read" on public.order_payment_proofs;
create policy "order proof owner or admin read" on public.order_payment_proofs for select to authenticated using (user_id=auth.uid() or public.is_admin());
drop policy if exists "order owner add payment proof" on public.order_payment_proofs;
create policy "order owner add payment proof" on public.order_payment_proofs for insert to authenticated with check (user_id=auth.uid() and exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
drop policy if exists "order owner replace payment proof" on public.order_payment_proofs;
create policy "order owner replace payment proof" on public.order_payment_proofs for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid() and exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
grant select, insert, update on public.order_payment_proofs to authenticated;

insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false) on conflict (id) do update set public=false;
drop policy if exists "order owners upload payment proof files" on storage.objects;
create policy "order owners upload payment proof files" on storage.objects for insert to authenticated with check (bucket_id='payment-proofs' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.orders o where o.id=((storage.foldername(name))[2])::uuid and o.user_id=auth.uid()));
drop policy if exists "order owners and admins view payment proof files" on storage.objects;
create policy "order owners and admins view payment proof files" on storage.objects for select to authenticated using (bucket_id='payment-proofs' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
drop policy if exists "order owners and admins remove payment proof files" on storage.objects;
create policy "order owners and admins remove payment proof files" on storage.objects for delete to authenticated using (bucket_id='payment-proofs' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));

drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (true);

drop policy if exists "reviews customer create" on public.reviews;
create policy "reviews customer create" on public.reviews for insert with check (true);

drop policy if exists "reviews admin delete" on public.reviews;
create policy "reviews admin delete" on public.reviews for delete using (public.is_admin());

-- After your own first Google login, run once with your own email:
-- update public.profiles set role='admin' where email='YOUR_ADMIN_EMAIL@gmail.com';

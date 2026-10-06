-- Checkout totals, configurable advance payment, promo codes, and secure admin media uploads.
alter table public.orders
  add column if not exists items_subtotal numeric(12,2) not null default 0 check (items_subtotal >= 0),
  add column if not exists delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  add column if not exists promo_code text,
  add column if not exists promo_discount numeric(12,2) not null default 0 check (promo_discount >= 0),
  add column if not exists amount_due_now numeric(12,2) not null default 0 check (amount_due_now >= 0),
  add column if not exists remaining_balance numeric(12,2) not null default 0 check (remaining_balance >= 0),
  add column if not exists payment_method_label text,
  add column if not exists payment_policy text not null default 'full' check (payment_policy in ('full', 'products', 'delivery'));

update public.orders
set items_subtotal = total,
    amount_due_now = total,
    remaining_balance = 0
where items_subtotal = 0 and total > 0;

do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%payment_method%'
  loop
    execute format('alter table public.orders drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.orders
  add constraint orders_payment_method_nonempty
  check (length(trim(payment_method)) between 1 and 80);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-media',
  'store-media',
  true,
  104857600,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/ogg','video/quicktime']
)
on conflict (id) do update
set public = true,
    file_size_limit = 104857600,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "store media public read" on storage.objects;
create policy "store media public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'store-media');

drop policy if exists "store media admin manage" on storage.objects;
create policy "store media admin manage"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'store-media' and public.is_admin())
  with check (bucket_id = 'store-media' and public.is_admin());

grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;

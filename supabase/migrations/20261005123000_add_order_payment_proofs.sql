alter table public.order_items
  add column if not exists product_image_url text;

alter table public.orders
  add column if not exists confirmed_at timestamptz;

alter table public.orders
  add column if not exists payment_proof_required boolean not null default false;

update public.orders
set confirmed_at = created_at
where status in ('approved', 'processing', 'completed')
  and confirmed_at is null;

create table if not exists public.order_payment_proofs (
  order_id uuid primary key references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.order_payment_proofs enable row level security;

drop policy if exists "order proof owner or admin read" on public.order_payment_proofs;
create policy "order proof owner or admin read"
  on public.order_payment_proofs for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "order owner add payment proof" on public.order_payment_proofs;
create policy "order owner add payment proof"
  on public.order_payment_proofs for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "order owner replace payment proof" on public.order_payment_proofs;
create policy "order owner replace payment proof"
  on public.order_payment_proofs for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;

drop policy if exists "order owners upload payment proof files" on storage.objects;
create policy "order owners upload payment proof files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.orders o
      where o.id = ((storage.foldername(name))[2])::uuid
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "order owners and admins view payment proof files" on storage.objects;
create policy "order owners and admins view payment proof files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "order owners and admins remove payment proof files" on storage.objects;
create policy "order owners and admins remove payment proof files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

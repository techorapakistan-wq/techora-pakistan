alter table public.reviews
  add column if not exists photo_url text,
  add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-photos',
  'review-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product review photos public insert" on storage.objects;
create policy "product review photos public insert"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = 'product-reviews'
    and storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp')
  );

drop policy if exists "product review photos admin delete" on storage.objects;
create policy "product review photos admin delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'review-photos' and public.is_admin());

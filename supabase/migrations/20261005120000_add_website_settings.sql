create table if not exists public.store_settings (
  id boolean primary key default true check (id = true),
  easypaisa_number text not null default '03234724373',
  easypaisa_name text not null default 'Muhammad Usama',
  jazzcash_number text not null default '03234724373',
  jazzcash_name text not null default 'Muhammad Usama',
  bank_name text not null default 'HBL',
  bank_account text not null default '06147900940851',
  bank_account_name text not null default 'Muhammad Usama',
  updated_at timestamptz not null default now()
);

alter table public.store_settings
  add column if not exists website_config jsonb not null default '{
    "announcement": "Free shipping on orders over PKR 5,000",
    "whatsapp": "923229701332",
    "videos": [
      {
        "enabled": true,
        "title": "Wireless audio, up close",
        "description": "A closer look at the sound and design behind everyday listening.",
        "url": "https://videos.pexels.com/video-files/8005699/8005699-uhd_2160_3840_25fps.mp4",
        "poster": "https://images.pexels.com/videos/8005699/pexels-photo-8005699.jpeg?auto=compress&cs=tinysrgb&w=1000",
        "sourceLabel": "Pexels",
        "sourceUrl": "https://www.pexels.com/video/headphones-with-a-stand-8005699/"
      },
      {
        "enabled": true,
        "title": "Smart tech in everyday life",
        "description": "Modern wearables designed to keep up with your day.",
        "url": "https://videos.pexels.com/video-files/36124120/15319560_1080_1920_30fps.mp4",
        "poster": "https://images.pexels.com/videos/36124120/pexels-photo-36124120.jpeg?auto=compress&cs=tinysrgb&w=1000",
        "sourceLabel": "Pexels",
        "sourceUrl": "https://www.pexels.com/video/modern-smartwatch-on-wrist-for-fitness-tracking-36124120/"
      }
    ]
  }'::jsonb;

insert into public.store_settings (id) values (true) on conflict (id) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "store settings public read" on public.store_settings;
create policy "store settings public read"
  on public.store_settings for select to anon, authenticated
  using (true);

drop policy if exists "store settings admin update" on public.store_settings;
create policy "store settings admin update"
  on public.store_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;

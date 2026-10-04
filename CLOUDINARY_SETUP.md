# Cloudinary product photo uploads

The product editor uses the existing Supabase Storage bucket until Cloudinary is configured. Existing product records and image URLs are left as they are. Once enabled, newly uploaded product photos go to the `techora/products` Cloudinary folder. Upload signatures are issued by an authenticated Supabase Edge Function, and the Cloudinary API Secret stays server-side.

## One-time setup

1. In the Cloudinary console, use `y3ixrnz9` as the **Cloud Name** (Cloudinary calls the product environment identifier the cloud name). Find the account's **API Key** and **API Secret** under **Settings → API Keys**.
2. In the Supabase project used by the Techora site, add these Edge Function secrets:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. From this repository folder, deploy the function to that same Supabase project: `supabase functions deploy cloudinary-signature --project-ref <Techora-Supabase-project-ref>`. The function checks the signed-in user's `profiles.role` and only signs uploads for admins (including the store's existing root-admin account).
4. In the Render frontend service's **Environment** settings, add the build variable `VITE_CLOUDINARY_ENABLED=true`, keeping the existing Supabase URL and anon/publishable key. Trigger a new deployment so the Vite frontend picks up the setting.

Do not put the Cloudinary API Secret in Render's frontend variables, `.env`, source code, or any `VITE_` variable. If Cloudinary is not ready, leave `VITE_CLOUDINARY_ENABLED=false` and the current Supabase Storage upload remains active.

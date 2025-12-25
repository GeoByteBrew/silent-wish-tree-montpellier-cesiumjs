# Montpellier – Silent Wish Tree (2026)

A small public, anonymous-ish New Year experience:

- Pick an ornament
- Write a short wish (max 140 chars)
- Hang it on the (3D) tree (text is **never** shown)
- On **Jan 6, 2026**, wishes are revealed only as an **aggregate word map**

## Repo structure

- `frontend/`: Vite + CesiumJS
- `supabase/`: SQL schema + Edge Functions

## What you need (keys/assets)

### Cesium

- `VITE_CESIUM_ION_TOKEN`
- `VITE_ION_PHOTOREALISTIC_ASSET_ID` (Google Photorealistic 3D Tiles, via ion)
- If you don't have the 3D Tiles asset id, you can use imagery instead:
  - `VITE_ION_IMAGERY_ASSET_ID`

### Supabase

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Edge Functions secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### Turnstile

- `VITE_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## Supabase setup

1. Create a Supabase project
2. Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor
3. Deploy Edge Functions:

```bash
supabase functions deploy wish
supabase functions deploy stats
supabase functions deploy reveal
```

4. Set function secrets:

```bash
supabase secrets set SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." TURNSTILE_SECRET_KEY="..." REVEAL_AT_ISO="2026-01-06T00:00:00+01:00"
```

For pre-deploy testing you can temporarily set `DEMO_KEY` and put the same value into `VITE_DEMO_KEY` (then remove it before publishing).

## Frontend setup

1. Copy `frontend/env.example` to `frontend/.env.local` and fill values.
2. Add your models:
   - `frontend/public/models/tree.glb`
   - `frontend/public/models/ornaments/star.glb`
   - `frontend/public/models/ornaments/ball_red.glb`
   - `frontend/public/models/ornaments/ball_gold.glb`
   - `frontend/public/models/ornaments/bell.glb`
   - `frontend/public/models/ornaments/candy.glb`

Run locally:

```bash
cd frontend
npm install
npm run dev
```

Reveal page:

- `/reveal.html` (backend gates it until Jan 6, 2026; or demoKey while testing)

## Deploy (recommended: Vercel)

Deploy `frontend/` as a Vercel project:

- Framework preset: Vite
- Root directory: `frontend`
- Add the `VITE_*` env vars in Vercel project settings

Supabase Edge Functions stay hosted on Supabase.

### Keep the repo private (recommended)

Do **not** commit real tokens/keys. Keep the GitHub repo private and set secrets in:

- Vercel project env vars: `VITE_*`
- Supabase Edge Function secrets: `SUPABASE_*`, `TURNSTILE_SECRET_KEY`, `REVEAL_AT_ISO`

## Notes on “anonymity”

No account, no email. We store wish text in the database (not publicly readable) and only publish aggregated word frequencies on the reveal date.



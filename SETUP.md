# BrickBase — Local Setup

Implements the v1 scope from `README.md`: multi-role property listings (plot/land, residential, commercial),
search/filter/compare, enquiries, favorites, and an admin moderation dashboard.

## 1. Supabase project

1. Create a project at supabase.com.
2. Open the SQL editor and run `database/schema.sql` in full — tables, enums, RLS, the `handle_new_user` trigger,
   the `property-images` storage policies, and seed amenities.
3. In Storage, create a public bucket named `property-images` (5MB limit, jpeg/png/webp) — the SQL above only adds
   the RLS *policies* for it; the bucket itself must be created via Dashboard → Storage → New bucket, or the
   Storage API. Without both the bucket and the policies, uploads fail with a 400/RLS error.
4. Grab from Project Settings → API: `Project URL` and the `service_role` key (backend), and the `anon public` key
   (frontend). Auth is verified via `supabaseAdmin.auth.getUser()` server-side — no JWT secret needed.

## 2. Backend (`/backend`)

```bash
cd backend
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev             # http://localhost:4000 — logs "[supabase] Connected successfully" on boot
```

Layered architecture: `routes → controllers → services → repositories → Supabase` (service-role key only, never
exposed to the client). See `README.md` §6–§10 for the full API surface and security model.

## 3. Frontend (`/frontend`)

```bash
cd frontend
cp .env.example .env   # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm install
npm run dev              # http://localhost:5173
```

Vite + React + TypeScript, TanStack Query for server state, Zustand for the comparison tray, React Hook Form + Zod
for forms, React Router with role-gated routes. Theme is dark navy + white with linear/radial gradients
(`src/index.css`, Tailwind v4 `@theme`).

## 4. Creating the first admin

There is no public admin signup (by design). After signing up a normal user, promote them manually:

```sql
update profiles set role = 'admin', status = 'active' where id = '<user-uuid>';
```

## What's implemented

- Auth: signup (buyer/owner/agent) + Supabase-session login, role-gated routing
- Property CRUD across 3 types, image upload to Supabase Storage, draft → pending_review → active lifecycle
- Search/filter/sort with keyset pagination, full-text search, comparison (up to 4), similar listings
- Enquiry form (guest or logged-in, rate-limited) + owner/agent enquiry inbox
- Favorites, EMI calculator, agent reviews
- Admin dashboard: analytics, listing moderation queue, user management, reports queue, audit log

## Deferred (see README §13)

Payments for featured listings, in-app chat, PostGIS radius search, saved-search email alerts, SSR/SEO.

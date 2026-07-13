# BrickBase — System Design Document

**Version:** 1.0
**Date:** July 13, 2026
**Stack:** React (Vite + TypeScript) · Node.js (Express + TypeScript) · Supabase (Postgres, Auth, Storage, Realtime)
**Target Scale (v1):** ~5,000 users, ~10,000–20,000 listings, designed to extend to 50k+ users without re-architecture

---

## Table of Contents

1. [Overview](#1-overview)
2. [High-Level Design (HLD)](#2-high-level-design-hld)
3. [User Roles & Access Model](#3-user-roles--access-model)
4. [Feature Breakdown (LLD)](#4-feature-breakdown-lld)
5. [Database Schema](#5-database-schema)
6. [API Design](#6-api-design)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Backend Architecture](#8-backend-architecture)
9. [Scaling & Performance (5k → 50k users)](#9-scaling--performance-5k--50k-users)
10. [Security](#10-security)
11. [Testing Strategy](#11-testing-strategy)
12. [Delivery Roadmap](#12-delivery-roadmap)
13. [Future Extensibility](#13-future-extensibility)

---

## 1. Overview

### 1.1 Purpose

A property listing platform (NoBroker-style) where **owners** and **agents** list properties across three categories — **plot/land, residential, commercial** — and **buyers** search, filter, compare, save, and enquire about them. An **admin** moderates users and listings from a dedicated dashboard.

### 1.2 Goals (v1)

- Multi-role signup: Buyer, Owner, Agent (Admin created manually/seeded, not self-signup)
- Property CRUD across 3 categories with category-specific attributes
- Search with price/location/type/area filters + side-by-side comparison
- Enquiry form → routed to owner/agent, visible to admin
- Admin dashboard: user management, listing moderation, reports
- Maintainable/testable/extensible codebase for a small team (1–3 devs)

### 1.3 Non-Goals (v1 — deferred to Future Extensibility)

- In-app chat/messaging
- Online payments for premium/featured listings
- Native mobile app (API is designed to support one later)
- RERA/government registry auto-verification
- Map radius search using PostGIS (v1 uses lat/lng bounding box; PostGIS is a drop-in upgrade later)

### 1.4 Non-Functional Requirements

| Requirement | Target for v1 |
|---|---|
| Concurrent users | ~200–300 peak concurrent (5k registered) |
| API p95 latency | < 400ms for search, < 200ms for reads |
| Availability | 99.5% (single-region managed services) |
| Maintainability | Layered backend, typed contracts front-to-back, one feature = one vertical slice |
| Testability | Services unit-testable independent of HTTP/DB via dependency injection |
| Extensibility | New property type or role addable without touching unrelated modules |

---

## 2. High-Level Design (HLD)

### 2.1 Architecture Diagram

```
                         ┌─────────────────────────┐
                         │        Browser           │
                         │  React + Vite + TS SPA   │
                         └───────────┬──────────────┘
                                     │ HTTPS (REST/JSON)
                                     ▼
                         ┌─────────────────────────┐
                         │   Node.js API Layer      │
                         │  Express + TypeScript    │
                         │  (business logic, auth   │
                         │   re-validation, RBAC,   │
                         │   rate limiting, email)  │
                         └───────┬─────────┬────────┘
                                 │         │
                    Supabase JS  │         │  SMTP / Resend API
                    (service key)│         ▼
                                 │   ┌──────────────┐
                                 │   │ Email Service │ (Resend/SendGrid)
                                 │   └──────────────┘
                                 ▼
                    ┌─────────────────────────────┐
                    │           Supabase           │
                    │  ┌───────────┐ ┌───────────┐ │
                    │  │ Postgres  │ │   Auth    │ │
                    │  │ (+ RLS)   │ │  (JWT)    │ │
                    │  └───────────┘ └───────────┘ │
                    │  ┌───────────┐ ┌───────────┐ │
                    │  │  Storage  │ │ Realtime  │ │
                    │  │ (images)  │ │(notifs opt)│ │
                    │  └───────────┘ └───────────┘ │
                    └─────────────────────────────┘
```

### 2.2 Component Responsibilities

| Component | Responsibility |
|---|---|
| **React SPA** | UI rendering, client-side routing, form validation (mirrors backend schema), calling the Node API only — never Supabase directly for writes |
| **Node API** | Single source of truth for business rules (role checks, listing approval workflow, enquiry rate-limits, search query building), talks to Supabase using the **service role key** (server-side only) |
| **Supabase Postgres** | System of record, enforces RLS as a second line of defense, hosts full-text search indexes |
| **Supabase Auth** | Issues JWTs, handles signup/login/password reset/email verification |
| **Supabase Storage** | Property images, served via CDN URLs |
| **Email Service** | Enquiry notifications, listing approval/rejection emails, welcome emails |

### 2.3 Why a Node API layer in front of Supabase (not client-calling-Supabase-directly)

This is a deliberate architectural choice, worth stating explicitly since Supabase alone can serve as a backend:

- **Business logic centralization** — listing approval workflows, enquiry throttling, and cross-role rules are easier to test and change in one Express service than spread across RLS policies and client code.
- **Defense in depth** — RLS is enforced at the DB, but role checks are *also* enforced in the API layer. A client-side bug or a leaked anon key cannot escalate privileges.
- **Third-party orchestration** — email sending, future payment webhooks, and image processing are natural fits for a server layer, not the browser.
- **Extensibility** — when a native mobile app is added later, it reuses the same Node API; it does not need to re-implement business rules against Supabase directly.

The tradeoff: an extra hop and a service to deploy/monitor. At 5k users this is a single small Node instance — the cost is low relative to the long-term maintainability gain.

### 2.4 Deployment Topology (v1)

| Layer | Suggested host | Notes |
|---|---|---|
| React SPA | Vercel / Netlify | Static build, CDN-served |
| Node API | Railway / Render / Fly.io | Single instance to start, horizontally scalable (stateless) |
| Postgres/Auth/Storage | Supabase (Pro tier recommended at this scale) | Managed, includes connection pooler (PgBouncer/Supavisor) |
| Images | Supabase Storage + built-in image transformation CDN | No separate CDN needed initially |
| Email | Resend or SendGrid | Transactional email only |
| Error tracking | Sentry (free tier sufficient at 5k users) | Wired into both frontend and Node API |

### 2.5 Third-Party Services

| Service | Purpose | v1 or Later |
|---|---|---|
| Maps (Google Maps / Mapbox) | Address autocomplete, static map on property detail page | v1 (basic pin display) |
| Resend/SendGrid | Enquiry & auth transactional emails | v1 |
| Sentry | Error monitoring | v1 |
| Razorpay/Stripe | Featured listing payments | Future |
| Meilisearch/Algolia | Advanced fuzzy search if Postgres FTS becomes insufficient | Future (>20k listings) |

---

## 3. User Roles & Access Model

### 3.1 Roles

- **Buyer** — browses, filters, compares, favorites, submits enquiries
- **Owner** — everything a Buyer can do, plus creates/manages their own listings
- **Agent** — like Owner, plus an agent profile (license no., agency name), can manage listings on behalf of multiple properties, appears with an "Agent" badge
- **Admin** — not self-registered; seeded/created by an existing admin. Manages users, moderates listings, handles reports

A single user has exactly one role at a time (v1 simplification — an "Owner" who wants to act as an "Agent" registers a second account, or role-upgrade is handled manually by admin). This keeps RLS policies and UI role-guards simple.

### 3.2 Role Access Matrix

| Capability | Buyer | Owner | Agent | Admin |
|---|:---:|:---:|:---:|:---:|
| Browse/search/filter listings | ✅ | ✅ | ✅ | ✅ |
| Compare properties | ✅ | ✅ | ✅ | ✅ |
| Favorite/save properties | ✅ | ✅ | ✅ | ❌ (not applicable) |
| Submit enquiry | ✅ | ✅ | ✅ | ❌ |
| Create/edit own listing | ❌ | ✅ | ✅ | ✅ (any listing) |
| Upload listing images | ❌ | ✅ (own) | ✅ (own) | ✅ (any) |
| View enquiries on own listings | ❌ | ✅ (own) | ✅ (own) | ✅ (all) |
| Approve/reject listings | ❌ | ❌ | ❌ | ✅ |
| Suspend/activate users | ❌ | ❌ | ❌ | ✅ |
| View reported listings | ❌ | ❌ | ❌ | ✅ |
| View platform analytics | ❌ | ❌ | ❌ | ✅ |

### 3.3 Auth Flow

1. User signs up via Supabase Auth (email/password or Google OAuth) selecting a role (`buyer` / `owner` / `agent`) in the signup form.
2. On successful signup, a Postgres trigger (`handle_new_user`) inserts a corresponding row into `profiles` with the chosen role and `status = 'pending'` for agents (manual verification of license) or `'active'` for buyers/owners.
3. Supabase issues a JWT containing `sub` (user id). **Role is never trusted from the JWT claim alone on sensitive writes** — the Node API re-fetches the `profiles.role` from the DB on every privileged request.
4. Frontend stores the session via `supabase-js` client; the Node API verifies the JWT on each request using Supabase's JWT secret.
5. Admin accounts are created directly in the DB / via a protected seed script — there is no public admin signup route.

---

## 4. Feature Breakdown (LLD)

### 4.1 Property Listings

Three property types share a common set of fields, with type-specific attributes layered on top.

**Common fields (all types):** title, description, price, price type (fixed/negotiable), listing type (sale/rent), address, city, state, pincode, latitude/longitude, area (value + unit), images, amenities, status (draft → pending_review → active/rejected → sold/rented/inactive), verified badge, featured flag, view count.

**Type-specific attributes (stored in a JSONB `attributes` column — see schema rationale in §5):**

| Type | Key attributes |
|---|---|
| **Plot/Land** | plot dimensions (L×W), boundary wall (Y/N), corner plot (Y/N), road width, zoning (residential/commercial/agricultural/industrial), approving authority (e.g., DTCP/RERA) |
| **Residential** | subtype (apartment/villa/independent house/builder floor), BHK, bathrooms, balconies, furnishing status, floor/total floors, age of property, facing direction, parking, possession status |
| **Commercial** | subtype (office/shop/warehouse/showroom/co-working), carpet area, washrooms, floor, parking, power backup, cabins/workstations count, lease or sale |

**Listing lifecycle:**

```
draft ──(owner submits)──▶ pending_review ──(admin approves)──▶ active ──▶ sold/rented/inactive
                                  │
                                  └──(admin rejects, reason required)──▶ draft (owner can edit & resubmit)
```

### 4.2 Search & Filters

- Filters: property type, listing type (sale/rent), city, price range, area range, BHK (residential), amenities (multi-select)
- Sort: newest first, price low→high, price high→low, area
- Pagination: cursor-based (`created_at, id` keyset pagination) to stay performant as listings grow — avoids `OFFSET` slowdowns
- Search bar: matches title/description/city using Postgres full-text search (`tsvector` + GIN index)
- Location filter v1: city + optional lat/lng bounding box (map viewport search); precise radius search via PostGIS is a documented future upgrade (§13)

### 4.3 Comparison

- Buyer selects up to 4 properties (client-side selection, persisted in local component state, not server-side)
- `GET /api/properties/compare?ids=1,2,3,4` returns normalized fields side-by-side for a comparison table (price, area, price/sqft, type-specific attributes, amenities diff)

### 4.4 Enquiry System

- Enquiry form on property detail page (name, email, phone, message) — buyer can be logged in or a guest (guest enquiries store contact details directly, no account required, to reduce friction — matches NoBroker's low-friction lead capture)
- On submission: enquiry row inserted, email sent to the property's owner/agent, and (if logged-in) a `notifications` row created
- Rate-limited per IP + per property to prevent spam (§10)
- Owner/agent sees enquiries for their own listings in a dashboard tab; can mark as `contacted`/`closed`/`spam`
- Admin sees all enquiries platform-wide, primarily for abuse monitoring

### 4.5 Registration & Profiles

- Buyer/Owner: name, phone, email, password
- Agent: above + agency name, license number (optional at signup, admin can verify later), profile goes to `pending` until admin verifies
- Profile page: editable name/phone/avatar; agents additionally show a public agent card with their active listings and average rating (see §4.7)

### 4.6 Admin Dashboard

- **User management:** list/search/filter users by role/status, suspend/reactivate accounts, verify agent licenses
- **Listing moderation:** queue of `pending_review` listings, approve/reject with a reason, bulk actions
- **Reports queue:** listings flagged by users (spam, fraudulent, duplicate) — review and dismiss/remove
- **Analytics (v1, lightweight):** total users by role, total listings by status/type, enquiries per week, top cities by listing count
- **Audit log:** every admin action (suspend user, approve/reject listing, remove report) is logged for accountability

### 4.7 Additional NoBroker-Inspired Features (v1 scope, kept lightweight)

| Feature | v1 implementation |
|---|---|
| Favorites/saved properties | Simple join table, one tap to save |
| Verified badge | Manually toggled by admin after basic document/ownership check |
| Similar properties | Query: same city + property type + price within ±20%, excluding current listing |
| EMI calculator | Pure frontend calculation widget on property detail page (no backend needed) |
| Agent ratings | Buyers who've enquired can leave a 1–5 rating + comment on an agent |
| Saved search alerts | Table exists in schema (`saved_searches`) but email-alert cron is a Phase 6 stretch item |
| Featured listings | Boolean flag settable by admin (monetization/payment flow deferred to Future Extensibility) |

---

## 5. Database Schema

### 5.1 Design Rationale

Common, frequently-filtered fields (price, area, city, BHK, lat/lng) are modeled as **first-class typed columns** for indexable, fast filtering. Type-specific, rarely-filtered attributes are modeled as a single **JSONB `attributes` column** rather than three separate detail tables. This is a deliberate hybrid:

- Avoids a 3-way join on every listing read (simpler, faster for the common case)
- New attributes for a type (e.g., adding "furnished kitchen" to residential) require no migration
- Filtering v1 doesn't need to query inside `attributes` — if that changes later, a GIN index on the JSONB column or promoting a field to a real column is a low-cost migration

### 5.2 Schema (PostgreSQL DDL)

```sql
-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('buyer', 'owner', 'agent', 'admin');
create type user_status as enum ('active', 'pending', 'suspended');
create type property_type as enum ('land', 'residential', 'commercial');
create type listing_type as enum ('sale', 'rent');
create type furnishing_status as enum ('unfurnished', 'semi_furnished', 'furnished');
create type possession_status as enum ('ready_to_move', 'under_construction');
create type area_unit as enum ('sqft', 'sqyd', 'acre', 'sqm');
create type property_status as enum ('draft', 'pending_review', 'active', 'rejected', 'sold', 'rented', 'inactive');
create type enquiry_status as enum ('new', 'contacted', 'closed', 'spam');
create type report_status as enum ('pending', 'reviewed', 'dismissed');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'buyer',
  status user_status not null default 'active',
  avatar_url text,
  agency_name text,            -- agents only
  license_number text,         -- agents only
  is_license_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_role on profiles(role);

-- ============================================================
-- PROPERTIES
-- ============================================================
create table properties (
  id bigint generated always as identity primary key,
  owner_id uuid not null references profiles(id) on delete cascade,
  property_type property_type not null,
  listing_type listing_type not null,
  title text not null,
  description text not null,
  price numeric(14,2) not null,
  price_negotiable boolean not null default false,

  area_value numeric(10,2) not null,
  area_unit area_unit not null,

  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  latitude double precision,
  longitude double precision,

  -- common, frequently-filtered fields (nullable where type-irrelevant)
  bhk smallint,
  bathrooms smallint,
  furnishing_status furnishing_status,
  possession_status possession_status,
  age_of_property_years smallint,

  -- type-specific, low-filter-frequency data
  attributes jsonb not null default '{}',

  status property_status not null default 'draft',
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  rejection_reason text,
  views_count bigint not null default 0,

  approved_by uuid references profiles(id),
  approved_at timestamptz,

  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(city,''))
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_properties_city on properties(city);
create index idx_properties_type on properties(property_type);
create index idx_properties_listing_type on properties(listing_type);
create index idx_properties_price on properties(price);
create index idx_properties_status on properties(status);
create index idx_properties_owner on properties(owner_id);
create index idx_properties_search on properties using gin(search_vector);
create index idx_properties_created_at on properties(created_at desc, id desc); -- keyset pagination
create index idx_properties_geo on properties(latitude, longitude);

-- ============================================================
-- PROPERTY IMAGES
-- ============================================================
create table property_images (
  id bigint generated always as identity primary key,
  property_id bigint not null references properties(id) on delete cascade,
  image_url text not null,
  is_cover boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);
create index idx_property_images_property on property_images(property_id);

-- ============================================================
-- AMENITIES (lookup + join table)
-- ============================================================
create table amenities (
  id serial primary key,
  name text not null unique,
  icon text,
  category text -- e.g. 'safety', 'convenience', 'recreation'
);

create table property_amenities (
  property_id bigint not null references properties(id) on delete cascade,
  amenity_id int not null references amenities(id) on delete cascade,
  primary key (property_id, amenity_id)
);

-- ============================================================
-- ENQUIRIES
-- ============================================================
create table enquiries (
  id bigint generated always as identity primary key,
  property_id bigint not null references properties(id) on delete cascade,
  buyer_id uuid references profiles(id), -- nullable: guest enquiries allowed
  name text not null,
  email text not null,
  phone text not null,
  message text not null,
  status enquiry_status not null default 'new',
  created_at timestamptz not null default now()
);
create index idx_enquiries_property on enquiries(property_id);
create index idx_enquiries_buyer on enquiries(buyer_id);

-- ============================================================
-- FAVORITES
-- ============================================================
create table favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  property_id bigint not null references properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

-- ============================================================
-- REVIEWS (buyer -> agent/owner)
-- ============================================================
create table reviews (
  id bigint generated always as identity primary key,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  reviewee_id uuid not null references profiles(id) on delete cascade,
  property_id bigint references properties(id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (reviewer_id, reviewee_id, property_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null, -- 'enquiry_received', 'listing_approved', 'listing_rejected', etc.
  title text not null,
  body text,
  related_property_id bigint references properties(id),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications(user_id, is_read);

-- ============================================================
-- REPORTED LISTINGS
-- ============================================================
create table reported_listings (
  id bigint generated always as identity primary key,
  property_id bigint not null references properties(id) on delete cascade,
  reported_by uuid not null references profiles(id),
  reason text not null,
  status report_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============================================================
-- ADMIN AUDIT LOG
-- ============================================================
create table admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null references profiles(id),
  action text not null, -- 'approve_listing', 'suspend_user', etc.
  target_table text not null,
  target_id text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SAVED SEARCHES (schema present for Phase 6 alert feature)
-- ============================================================
create table saved_searches (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  filters jsonb not null,
  alert_enabled boolean not null default false,
  created_at timestamptz not null default now()
);
```

### 5.3 Row-Level Security (RLS) Summary

RLS is the **second line of defense** behind the Node API's own role checks.

| Table | Policy summary |
|---|---|
| `profiles` | User can `select`/`update` own row. Admin can `select`/`update` all. |
| `properties` | Public (`anon`) can `select` where `status = 'active'`. Owner/agent can `select`/`insert`/`update`/`delete` their own rows. Admin: full access. |
| `property_images`, `property_amenities` | Follow parent `properties` ownership. |
| `enquiries` | Anyone (incl. guest via anon key through Node service role) can `insert`. Only the related property's owner/agent can `select` their own; admin sees all. |
| `favorites`, `notifications` | User manages only their own rows. |
| `reviews` | Anyone can `select`; only the original reviewer can `update`/`delete` their own review. |
| `reported_listings`, `admin_audit_log` | Admin-only `select`. `insert` on `reported_listings` open to authenticated users. |

> Note: since all writes flow through the Node API using the **service role key**, RLS on writes is mostly a safety net against key leakage or future direct-client-access changes — the Node layer is the primary enforcement point.

---

## 6. API Design

Base URL: `/api/v1`. All authenticated routes require `Authorization: Bearer <supabase_jwt>`. Responses follow a consistent envelope:

```json
{ "data": { ... }, "error": null }
{ "data": null, "error": { "code": "FORBIDDEN", "message": "..." } }
```

### 6.1 Auth & Profile

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Create Supabase user + profile row with chosen role |
| POST | `/auth/login` | Public | Proxies Supabase login (or handled client-side directly) |
| GET | `/auth/me` | Authenticated | Returns current profile |
| PATCH | `/users/me` | Authenticated | Update own profile |
| GET | `/users/:id` | Public | Public agent/owner card (name, agency, rating) |

### 6.2 Properties

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/properties` | Public | Search/filter/sort/paginate active listings |
| GET | `/properties/:id` | Public | Property detail (increments `views_count`) |
| GET | `/properties/compare?ids=1,2,3` | Public | Side-by-side comparison payload |
| GET | `/properties/:id/similar` | Public | Similar listings |
| POST | `/properties` | Owner, Agent | Create listing (status starts `draft`) |
| PATCH | `/properties/:id` | Owner, Agent (own), Admin | Update listing |
| POST | `/properties/:id/submit` | Owner, Agent (own) | Move `draft` → `pending_review` |
| DELETE | `/properties/:id` | Owner, Agent (own), Admin | Soft-delete (`status = 'inactive'`) |
| POST | `/properties/:id/images` | Owner, Agent (own) | Upload image (multipart → Supabase Storage) |
| DELETE | `/properties/:id/images/:imageId` | Owner, Agent (own) | Remove image |

**Example — search request:**
```
GET /api/v1/properties?property_type=residential&city=Gurugram&min_price=5000000&max_price=15000000&bhk=3&sort=price_asc&cursor=eyJpZCI6MTIzfQ==
```

**Example — search response:**
```json
{
  "data": {
    "items": [
      {
        "id": 4521,
        "title": "3BHK Apartment in Sector 57",
        "property_type": "residential",
        "listing_type": "sale",
        "price": 9800000,
        "area_value": 1650,
        "area_unit": "sqft",
        "city": "Gurugram",
        "bhk": 3,
        "cover_image_url": "https://.../cover.jpg",
        "is_verified": true
      }
    ],
    "next_cursor": "eyJpZCI6NDUyMX0="
  },
  "error": null
}
```

### 6.3 Enquiries

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/properties/:id/enquiries` | Public (rate-limited) | Submit enquiry (guest or logged-in) |
| GET | `/enquiries` | Owner, Agent, Admin | List enquiries (own listings, or all for admin) |
| PATCH | `/enquiries/:id` | Owner, Agent (own), Admin | Update status |

### 6.4 Favorites & Reviews

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/favorites` | Buyer/Owner/Agent | List own favorites |
| POST | `/favorites/:propertyId` | Buyer/Owner/Agent | Add favorite |
| DELETE | `/favorites/:propertyId` | Buyer/Owner/Agent | Remove favorite |
| POST | `/users/:id/reviews` | Authenticated | Leave a review for an agent/owner |
| GET | `/users/:id/reviews` | Public | List reviews for a user |

### 6.5 Admin

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/admin/users` | Admin | List/filter/search users |
| PATCH | `/admin/users/:id/status` | Admin | Suspend/reactivate |
| PATCH | `/admin/users/:id/verify-agent` | Admin | Verify agent license |
| GET | `/admin/properties/pending` | Admin | Moderation queue |
| PATCH | `/admin/properties/:id/approve` | Admin | Approve → `active` |
| PATCH | `/admin/properties/:id/reject` | Admin | Reject with reason |
| GET | `/admin/reports` | Admin | Reported listings queue |
| PATCH | `/admin/reports/:id` | Admin | Resolve report |
| GET | `/admin/analytics/summary` | Admin | Dashboard counters |

### 6.6 Meta

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/meta/amenities` | Public | Amenity list for filter UI |
| GET | `/meta/cities` | Public | Distinct cities with active listings (for autocomplete) |

---

## 7. Frontend Architecture

### 7.1 Stack Choices

- **Vite + React + TypeScript** — fast dev loop, no SSR needed for v1 (SEO can be revisited via Next.js migration later if organic search becomes a priority — see §13)
- **TanStack Query** — server state (listings, profile, enquiries) with caching/invalidation
- **Zustand** — small amount of client-only UI state (comparison tray, filter drawer open/close)
- **React Hook Form + Zod** — forms with schema validation shared in spirit with backend Zod schemas
- **React Router v6** — routing with a `ProtectedRoute` wrapper for role-gating
- **Tailwind CSS + shadcn/ui** — component styling

### 7.2 Folder Structure

```
src/
├── api/                  # thin fetch wrappers per resource (properties.ts, enquiries.ts, auth.ts)
├── components/           # shared, dumb UI components (Button, Card, Modal)
├── features/
│   ├── properties/       # PropertyCard, PropertyForm, PropertyDetail, filters
│   ├── comparison/
│   ├── enquiries/
│   ├── auth/
│   └── admin/
├── hooks/                # useAuth, useDebounce, useInfiniteProperties
├── layouts/              # PublicLayout, DashboardLayout, AdminLayout
├── pages/                # route-level components, composed from features/
├── routes/               # route config + ProtectedRoute
├── store/                # zustand stores
├── types/                # shared TS types (mirrors backend DTOs)
└── utils/
```

### 7.3 Role-Based Routing

```tsx
<ProtectedRoute allowedRoles={['owner', 'agent']}>
  <MyListingsPage />
</ProtectedRoute>

<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboardLayout />
</ProtectedRoute>
```
`ProtectedRoute` checks the cached profile from `useAuth()`; the Node API is still the real enforcement point for data access.

---

## 8. Backend Architecture

### 8.1 Layered Pattern

```
Route → Controller → Service → Repository → Supabase
```

- **Routes** — declare endpoint + middleware chain only
- **Controllers** — parse/validate request, call service, shape response
- **Services** — business logic (e.g., "can this user submit this listing for review?"), fully unit-testable with a mocked repository
- **Repositories** — the only layer that talks to Supabase; swappable/mockable in tests

### 8.2 Folder Structure

```
src/
├── routes/
│   ├── properties.routes.ts
│   ├── enquiries.routes.ts
│   ├── admin.routes.ts
│   └── auth.routes.ts
├── controllers/
├── services/
│   ├── property.service.ts
│   ├── enquiry.service.ts
│   ├── moderation.service.ts
│   └── notification.service.ts
├── repositories/
│   ├── property.repository.ts
│   └── ...
├── middleware/
│   ├── auth.middleware.ts       # verifies Supabase JWT
│   ├── roleGuard.middleware.ts  # checks profiles.role
│   ├── validate.middleware.ts   # Zod schema validation
│   ├── rateLimit.middleware.ts
│   └── errorHandler.middleware.ts
├── validators/            # Zod schemas per resource
├── types/
└── config/                # env, supabase client init
```

### 8.3 Middleware Chain Example

```ts
router.post(
  '/properties/:id/enquiries',
  rateLimitEnquiry,                 // per-IP + per-property throttle
  validate(createEnquirySchema),
  enquiryController.create
);

router.patch(
  '/admin/properties/:id/approve',
  authMiddleware,
  roleGuard('admin'),
  moderationController.approve
);
```

---

## 9. Scaling & Performance (5k → 50k users)

| Concern | v1 approach (5k users) | Upgrade path (50k+) |
|---|---|---|
| DB connections | Supabase's built-in pooler (Supavisor) | Same, tune pool size |
| Search | Postgres FTS + btree indexes | Meilisearch/Algolia if fuzzy/typo-tolerant search needed |
| Pagination | Keyset (cursor) pagination | Unchanged — already scalable |
| Images | Supabase Storage + built-in CDN/transform | Same, or move to Cloudflare Images if volume spikes |
| Caching | In-memory cache for `/meta/amenities`, `/meta/cities` | Redis for shared cache across multiple Node instances |
| Background jobs | Synchronous email send (acceptable at this volume) | Queue (BullMQ + Redis) for email/notifications if latency matters |
| Node API | Single instance | Horizontal scale — stateless design already supports this |
| Geo search | lat/lng bounding box query | PostGIS `geography` column + GIST index for true radius search |

---

## 10. Security

- **RLS as defense-in-depth** behind Node-layer role checks (§5.3, §8)
- **JWT verification** on every authenticated request; role is re-fetched from `profiles`, never trusted from a stale client claim
- **Input validation** via Zod on every write endpoint, mirrored (not shared, to avoid coupling) on the frontend for UX
- **File upload validation** — mime-type allowlist (jpeg/png/webp), max size (e.g. 5MB), max images per listing
- **Rate limiting** — auth endpoints and the public enquiry endpoint are the two most abuse-prone; both throttled per-IP
- **CORS** — restricted to the deployed frontend origin(s)
- **Admin audit log** — every moderation/user-management action recorded with actor, action, target, timestamp
- **Secrets** — Supabase service role key lives only in the Node API's environment, never shipped to the client

---

## 11. Testing Strategy

| Layer | Tool | What's covered |
|---|---|---|
| Backend unit tests | Vitest/Jest | Services (business rules) with mocked repositories — e.g. "owner cannot approve their own listing" |
| Backend integration tests | Supertest + a test Supabase project (or local Postgres in Docker) | Full request → DB round trip for key endpoints |
| Frontend component tests | React Testing Library | Forms (validation errors), PropertyCard rendering, filter UI |
| E2E tests | Playwright | Critical flows: signup → create listing → admin approve → appears in search → enquiry submitted → owner sees it |
| CI | GitHub Actions | Lint + typecheck + unit + integration tests on every PR |

---

## 12. Delivery Roadmap

| Phase | Duration | Scope |
|---|---|---|
| **Phase 1 — Foundations** | Week 1–2 | Supabase project setup, full schema + RLS, Node API skeleton (auth middleware, error handling), React app shell, signup/login with role selection |
| **Phase 2 — Property CRUD** | Week 3–4 | Create/edit/delete listings across all 3 types, image upload, draft → pending_review flow, "My Listings" page |
| **Phase 3 — Discovery** | Week 5–6 | Search + filters + sort + keyset pagination, property detail page, comparison feature |
| **Phase 4 — Engagement** | Week 7–8 | Enquiry form + owner/agent enquiry inbox, favorites, similar properties, notifications |
| **Phase 5 — Admin Dashboard** | Week 9–10 | User management, listing moderation queue, reports queue, audit log, basic analytics |
| **Phase 6 — Polish & Hardening** | Week 11–12 | Rate limiting, caching, Sentry integration, E2E test suite, EMI calculator, agent ratings, deployment hardening |

---

## 13. Future Extensibility

The v1 architecture is deliberately structured so the following can be added without touching unrelated modules:

- **Payments for featured listings** — add a `payments` table + webhook route in the Node layer; `is_featured` already exists on `properties`
- **In-app chat** — new `conversations`/`messages` tables + Supabase Realtime channel; existing enquiry flow becomes the entry point into a conversation
- **PostGIS radius search** — promote `latitude`/`longitude` to a `geography` column, add GIST index, swap the bounding-box query for `ST_DWithin`
- **Native mobile app** — reuses the existing Node API untouched; only a new client is added
- **Advanced search (typo-tolerant, faceted)** — swap the Postgres FTS query in `property.repository.ts` for a Meilisearch/Algolia call; controller/service layers unchanged
- **Multi-role users** — `profiles.role` becomes a join table `user_roles` if a user needs to be both Owner and Agent; RLS policies would need a helper function update but the API surface stays stable
- **SEO/SSR** — migrate the React SPA to Next.js for server-rendered property pages if organic search traffic becomes a growth channel
- **Saved-search email alerts** — `saved_searches` table already exists; add a scheduled job (Supabase Edge Function cron or Node cron) that diffs new matching listings and emails subscribers

---

*End of document.*

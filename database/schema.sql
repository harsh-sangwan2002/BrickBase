-- ============================================================
-- BrickBase database schema
-- Run this in the Supabase SQL editor (or psql) on a fresh project.
-- ============================================================

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
  agency_name text,
  license_number text,
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

  bhk smallint,
  bathrooms smallint,
  furnishing_status furnishing_status,
  possession_status possession_status,
  age_of_property_years smallint,

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
create index idx_properties_created_at on properties(created_at desc, id desc);
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
-- AMENITIES
-- ============================================================
create table amenities (
  id serial primary key,
  name text not null unique,
  icon text,
  category text
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
  buyer_id uuid references profiles(id),
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
-- REVIEWS
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
  type text not null,
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
  action text not null,
  target_table text not null,
  target_id text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SAVED SEARCHES
-- ============================================================
create table saved_searches (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  filters jsonb not null,
  alert_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TRIGGER: auto-create profile row on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer'),
    case when (new.raw_user_meta_data->>'role') = 'agent' then 'pending'::user_status else 'active'::user_status end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table properties enable row level security;
alter table property_images enable row level security;
alter table property_amenities enable row level security;
alter table enquiries enable row level security;
alter table favorites enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table reported_listings enable row level security;
alter table admin_audit_log enable row level security;
alter table saved_searches enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Public can view active properties" on properties for select using (status = 'active');
create policy "Owners manage own properties" on properties for all using (auth.uid() = owner_id);
create policy "Anyone can insert enquiries" on enquiries for insert with check (true);
create policy "Users manage own favorites" on favorites for all using (auth.uid() = user_id);
create policy "Anyone can view reviews" on reviews for select using (true);
create policy "Users manage own notifications" on notifications for all using (auth.uid() = user_id);

-- Seed amenities
insert into amenities (name, icon, category) values
  ('Parking', 'car', 'convenience'),
  ('Lift', 'arrow-up', 'convenience'),
  ('Power Backup', 'zap', 'convenience'),
  ('Security', 'shield', 'safety'),
  ('CCTV', 'camera', 'safety'),
  ('Gym', 'dumbbell', 'recreation'),
  ('Swimming Pool', 'waves', 'recreation'),
  ('Garden', 'tree', 'recreation'),
  ('Clubhouse', 'home', 'recreation'),
  ('Children Play Area', 'baby', 'recreation'),
  ('Water Supply', 'droplet', 'convenience'),
  ('Gated Community', 'lock', 'safety');

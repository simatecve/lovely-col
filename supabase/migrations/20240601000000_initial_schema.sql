-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Users)
-- Links to auth.users. Managed via triggers ideally, but we'll insert manually for now.
create type user_role as enum ('admin', 'manager', 'model');

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text,
  role user_role not null default 'model',
  created_at timestamptz default now()
);

-- 2. ROOMS (ModelRoom)
create table public.rooms (
  id serial primary key, -- Keeping number ID to match current logic if possible, or use UUID
  name text not null,
  platforms text[] default '{}',
  commission_rate numeric default 60, -- Percentage
  daily_target_hours numeric default 0,
  weekly_target_hours numeric default 0,
  is_monitor_room boolean default false,
  is_cleaning_room boolean default false,
  created_at timestamptz default now()
);

-- Link profile to room (A model belongs to a room)
alter table public.profiles 
add column room_id integer references public.rooms(id) on delete set null;

-- 3. GLOBAL SETTINGS (StudioRules)
create table public.studio_settings (
  id serial primary key,
  usd_exchange_rate numeric default 4000,
  daily_target_hours numeric default 7,
  weekly_target_hours numeric default 42,
  platforms text[] default '{}',
  updated_at timestamptz default now()
);

-- Insert default settings
insert into public.studio_settings (id, usd_exchange_rate) values (1, 4000);

-- 4. PRODUCTS (Catalog for Snacks and SexShop)
create type product_category as enum ('snack', 'sex_shop');

create table public.products (
  id uuid default uuid_generate_v4() primary key,
  code text,
  name text not null,
  unit_price numeric not null default 0,
  category product_category not null,
  initial_stock integer default 0,
  current_stock integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- 5. DAILY LOGS
create type attendance_status as enum ('present', 'late', 'absent', 'excused', 'day_off');

create table public.daily_logs (
  id uuid default uuid_generate_v4() primary key,
  room_id integer references public.rooms(id) on delete cascade not null,
  date date not null,
  status attendance_status default 'present',
  start_time time,
  end_time time,
  total_hours numeric default 0,
  notes text,
  created_at timestamptz default now(),
  unique(room_id, date)
);

-- 6. PLATFORM TOKENS
create table public.platform_tokens (
  id uuid default uuid_generate_v4() primary key,
  daily_log_id uuid references public.daily_logs(id) on delete cascade not null,
  platform text not null,
  tokens numeric default 0
);

-- 7. CONSUMPTIONS & SALES
-- Snacks
create table public.snack_consumptions (
  id uuid default uuid_generate_v4() primary key,
  room_id integer references public.rooms(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete restrict not null,
  date date not null default current_date,
  quantity integer not null default 1,
  created_at timestamptz default now()
);

-- Sex Shop Sales
create table public.sex_shop_sales (
  id uuid default uuid_generate_v4() primary key,
  room_id integer references public.rooms(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete restrict not null,
  date date not null default current_date,
  quantity integer not null default 1,
  unit_price numeric not null, -- Price at the moment of sale
  created_at timestamptz default now()
);

-- Sex Shop Abonos (Payments)
create table public.sex_shop_abonos (
  id uuid default uuid_generate_v4() primary key,
  room_id integer references public.rooms(id) on delete cascade not null,
  date date not null default current_date,
  amount numeric not null,
  created_at timestamptz default now()
);

-- 8. FINANCIALS
-- Advances
create table public.advances (
  id uuid default uuid_generate_v4() primary key,
  room_id integer references public.rooms(id) on delete cascade not null,
  date date not null default current_date,
  concept text not null,
  amount numeric not null,
  created_at timestamptz default now()
);

-- Expenses
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  date date not null default current_date,
  description text not null,
  amount numeric not null,
  category text,
  created_at timestamptz default now()
);

-- Income Records
create table public.income_records (
  id uuid default uuid_generate_v4() primary key,
  date date not null default current_date,
  platform text not null,
  amount_usd_paid numeric default 0,
  amount_usd_received numeric default 0,
  exchange_rate numeric default 0,
  total_cop numeric default 0,
  created_at timestamptz default now()
);

-- 9. MONITOR SHIFTS
create table public.monitor_shifts (
  id uuid default uuid_generate_v4() primary key,
  room_id integer references public.rooms(id) on delete cascade,
  day text not null, -- 'Lunes', 'Martes', etc.
  shift_type text not null,
  monitor_name text, -- Could reference a profile if monitors have accounts
  created_at timestamptz default now()
);

create table public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Security Policies (RLS) - Basic setup allowing read/write for now
-- In production, you'd want stricter policies.
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.studio_settings enable row level security;
alter table public.products enable row level security;
alter table public.daily_logs enable row level security;
alter table public.platform_tokens enable row level security;
alter table public.snack_consumptions enable row level security;
alter table public.sex_shop_sales enable row level security;
alter table public.sex_shop_abonos enable row level security;
alter table public.advances enable row level security;
alter table public.expenses enable row level security;
alter table public.income_records enable row level security;
alter table public.monitor_shifts enable row level security;
alter table public.app_state enable row level security;

create policy "Enable all for authenticated users" on public.profiles for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.rooms for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.studio_settings for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.products for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.daily_logs for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.platform_tokens for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.snack_consumptions for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.sex_shop_sales for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.sex_shop_abonos for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.advances for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.expenses for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.income_records for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.monitor_shifts for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Enable all for authenticated users" on public.app_state for all using (auth.uid() is not null) with check (auth.uid() is not null);


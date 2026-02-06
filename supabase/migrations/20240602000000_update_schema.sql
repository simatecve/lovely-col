create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.app_state enable row level security;

drop policy if exists "Enable all for users" on public.profiles;
drop policy if exists "Enable all for users" on public.rooms;
drop policy if exists "Enable all for users" on public.studio_settings;
drop policy if exists "Enable all for users" on public.products;
drop policy if exists "Enable all for users" on public.daily_logs;
drop policy if exists "Enable all for users" on public.platform_tokens;
drop policy if exists "Enable all for users" on public.snack_consumptions;
drop policy if exists "Enable all for users" on public.sex_shop_sales;
drop policy if exists "Enable all for users" on public.sex_shop_abonos;
drop policy if exists "Enable all for users" on public.advances;
drop policy if exists "Enable all for users" on public.expenses;
drop policy if exists "Enable all for users" on public.income_records;
drop policy if exists "Enable all for users" on public.monitor_shifts;
drop policy if exists "Enable all for users" on public.app_state;

drop policy if exists "Enable all for authenticated users" on public.profiles;
drop policy if exists "Enable all for authenticated users" on public.rooms;
drop policy if exists "Enable all for authenticated users" on public.studio_settings;
drop policy if exists "Enable all for authenticated users" on public.products;
drop policy if exists "Enable all for authenticated users" on public.daily_logs;
drop policy if exists "Enable all for authenticated users" on public.platform_tokens;
drop policy if exists "Enable all for authenticated users" on public.snack_consumptions;
drop policy if exists "Enable all for authenticated users" on public.sex_shop_sales;
drop policy if exists "Enable all for authenticated users" on public.sex_shop_abonos;
drop policy if exists "Enable all for authenticated users" on public.advances;
drop policy if exists "Enable all for authenticated users" on public.expenses;
drop policy if exists "Enable all for authenticated users" on public.income_records;
drop policy if exists "Enable all for authenticated users" on public.monitor_shifts;
drop policy if exists "Enable all for authenticated users" on public.app_state;

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

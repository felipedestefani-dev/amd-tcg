-- Rode este SQL no editor do Supabase (SQL Editor).
-- Depois crie um usuário em Authentication > Users.
-- A chave usada no site é a anon/public, nunca a service_role.

create table if not exists public.sets (
  id text primary key,
  name text not null,
  code text not null,
  sort integer not null default 0
);

create table if not exists public.products (
  id text primary key,
  kind text not null check (kind in ('single', 'sealed')),
  name text not null,
  set_id text not null references public.sets (id) on delete restrict,
  number text not null default '',
  rarity text not null default '',
  condition text not null default 'NM',
  lang text not null default 'PT',
  finish text not null default 'Normal',
  qty integer not null default 1,
  price numeric(12, 2) not null default 0,
  image text not null default ''
);

alter table public.products add column if not exists image text not null default '';

alter table public.sets enable row level security;
alter table public.products enable row level security;

drop policy if exists "leitura publica sets" on public.sets;
drop policy if exists "escrita autenticada sets" on public.sets;
drop policy if exists "leitura publica products" on public.products;
drop policy if exists "escrita autenticada products" on public.products;

create policy "leitura publica sets"
  on public.sets for select
  using (true);

create policy "escrita autenticada sets"
  on public.sets for all
  to authenticated
  using (true)
  with check (true);

create policy "leitura publica products"
  on public.products for select
  using (true);

create policy "escrita autenticada products"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

create table if not exists public.visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null default '/',
  visitor text not null default '',
  city text not null default ''
);

alter table public.visits enable row level security;

drop policy if exists "registrar visita" on public.visits;
drop policy if exists "ler visitas" on public.visits;

create policy "registrar visita"
  on public.visits for insert
  to anon, authenticated
  with check (true);

create policy "ler visitas"
  on public.visits for select
  to authenticated
  using (true);

create table if not exists public.customers (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null default '',
  email text not null unique check (char_length(email) <= 120 and email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
  phone text not null default '' check (char_length(phone) <= 20),
  constraint customers_name_len check (char_length(name) <= 80)
);

alter table public.customers enable row level security;

drop policy if exists "registrar cliente" on public.customers;
drop policy if exists "ler clientes" on public.customers;

create policy "registrar cliente"
  on public.customers for insert
  to anon, authenticated
  with check (true);

create policy "ler clientes"
  on public.customers for select
  to authenticated
  using (true);

alter table public.customers drop constraint if exists customers_name_len;
alter table public.customers add constraint customers_name_len check (char_length(name) <= 80);
alter table public.customers drop constraint if exists customers_phone_len;
alter table public.customers add constraint customers_phone_len check (char_length(phone) <= 20);
alter table public.customers drop constraint if exists customers_email_len;
alter table public.customers add constraint customers_email_len check (char_length(email) <= 120);
alter table public.visits drop constraint if exists visits_path_len;
alter table public.visits add constraint visits_path_len check (char_length(path) <= 120 and char_length(visitor) <= 64 and char_length(city) <= 80);

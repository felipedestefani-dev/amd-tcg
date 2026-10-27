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

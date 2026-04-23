-- Base inicial para futura migração do localStorage para Neon/Postgres
-- Compatível com Neon

create extension if not exists pgcrypto;

create table if not exists representatives (
  id text primary key,
  name text not null,
  cpf text not null unique,
  username text,
  password text,
  role text not null default 'rep',
  brands text,
  status text not null default 'ativo',
  created_at timestamptz not null default now()
);

create table if not exists videos (
  id text primary key,
  title text not null,
  url text not null,
  brand text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists access_logs (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  rep_id text references representatives(id) on delete set null,
  product_id text,
  product_name text,
  brand text,
  created_at timestamptz not null default now()
);

create table if not exists drive_links (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  ref_key text not null unique,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_drive_links_updated_at on drive_links;
create trigger trg_drive_links_updated_at
before update on drive_links
for each row execute function set_updated_at();

-- seed do admin atual
insert into representatives (id, name, cpf, username, password, role, brands, status)
values ('admin-001', 'Administrador', 'admin', 'admin', 'Admin@2026', 'admin', 'todas', 'ativo')
on conflict (id) do update set
  name = excluded.name,
  cpf = excluded.cpf,
  username = excluded.username,
  password = excluded.password,
  role = excluded.role,
  brands = excluded.brands,
  status = excluded.status;

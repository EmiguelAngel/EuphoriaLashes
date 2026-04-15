-- PostgreSQL schema (ejecuta esto en tu DB)
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null,
  stock integer not null,
  image_url text,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists products_name_idx on public.products (name);

-- Un único administrador (email + contraseña con hash bcrypt)
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_users_email_lower_idx on public.admin_users (lower(email));


import 'dotenv/config'
import bcrypt from 'bcrypt'
import { pool } from '../server/db.mjs'

const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD ?? ''

if (!email || !password) {
  console.error('Configura ADMIN_EMAIL y ADMIN_PASSWORD en .env y vuelve a ejecutar: npm run seed:admin')
  process.exit(1)
}

await pool.query(`
  create extension if not exists pgcrypto;
  create table if not exists public.admin_users (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    password_hash text not null,
    created_at timestamptz not null default now()
  );
  create index if not exists admin_users_email_lower_idx on public.admin_users (lower(email));
`)

const hash = await bcrypt.hash(password, 12)

await pool.query(
  `insert into public.admin_users (email, password_hash)
   values ($1, $2)
   on conflict (email) do update set password_hash = excluded.password_hash`,
  [email, hash],
)

console.log('Administrador guardado en la base de datos:', email)

await pool.end()

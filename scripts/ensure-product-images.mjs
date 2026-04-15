import 'dotenv/config'
import { pool } from '../server/db.mjs'

await pool.query(`
  alter table public.products add column if not exists images jsonb not null default '[]'::jsonb;
`)

await pool.query(`
  update public.products
  set images = to_jsonb(array[image_url]::text[])
  where coalesce(trim(image_url), '') <> ''
    and jsonb_array_length(images) = 0;
`)

console.log('Columna images lista y datos antiguos migrados desde image_url cuando aplica.')

await pool.end()

/* Street Bazar — Supabase (Postgres) bridge.
   Works fully offline on localStorage; connect Supabase in Settings to sync. */

import { toast } from './ui.js'
import { state, save } from './store.js'

export const TABLES = ['users', 'stores', 'products', 'reviews', 'orders', 'follows', 'threads']

export const SQL_SCHEMA = `-- Street Bazar · Supabase schema (SQL Editor me paste karein)
create extension if not exists "pgcrypto";

create table if not exists users (
  id text primary key, name text, email text unique, role text default 'customer',
  avatar text, created_at timestamptz default now()
);
create table if not exists stores (
  id text primary key, owner_id text references users(id), name text, slug text unique,
  tagline text, type text, description text, logo text, banner text, theme jsonb,
  categories text[], socials jsonb, address text, city text, sale jsonb,
  status text default 'pending', rating numeric default 0, created_at timestamptz default now()
);
create table if not exists products (
  id text primary key, store_id text references stores(id), title text, description text,
  price numeric, compare_at numeric, media jsonb, categories text[], tags text[],
  stock int default 0, sku text, customizable jsonb, wholesale jsonb,
  sales int default 0, status text default 'active', created_at timestamptz default now()
);
create table if not exists reviews (
  id text primary key, product_id text, store_id text, user_id text,
  rating int, text text, created_at timestamptz default now()
);
create table if not exists orders (
  id text primary key, user_id text, items jsonb, total numeric, status text,
  timeline jsonb, eta text, address jsonb, store_ids text[], created_at timestamptz default now()
);
create table if not exists follows (
  id text primary key, user_id text, store_id text, created_at timestamptz default now()
);
create table if not exists threads (
  id text primary key, product_id text, store_id text, customer_id text,
  messages jsonb, updated_at timestamptz default now()
);

alter table users enable row level security;
alter table stores enable row level security;
alter table products enable row level security;
alter table reviews enable row level security;
alter table orders enable row level security;
alter table follows enable row level security;
alter table threads enable row level security;

-- Demo policy (app uses anon key). Tighten for production.
drop policy if exists anon_all on stores;
create policy anon_all on stores for all using (true) with check (true);
drop policy if exists anon_all_products on products;
create policy anon_all_products on products for all using (true) with check (true);
`

export const isConnected = () => Boolean(state.settings.supabase?.url && state.settings.supabase?.key)
export const getAIKey = () => {
  if (state.settings.ai?.key) return state.settings.ai.key;
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_AI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
    }
  } catch (e) {}
  return '';
}
export const isAIConnected = () => Boolean(getAIKey())

function headers() {
  return {
    apikey: state.settings.supabase.key,
    Authorization: 'Bearer ' + state.settings.supabase.key,
    'Content-Type': 'application/json',
  }
}

async function sb(path, opts = {}) {
  const base = state.settings.supabase.url.replace(/\/$/, '') + '/rest/v1/' + path
  const res = await fetch(base, { headers: headers(), ...opts })
  if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + (await res.text()).slice(0, 180))
  const ct = res.headers.get('content-type') || ''
  return ct.includes('json') ? res.json() : null
}

function collection(name) {
  if (name === 'users') return state.users
  if (name === 'stores') return state.stores
  if (name === 'products') return state.products
  if (name === 'reviews') return state.reviews
  if (name === 'orders') return state.orders
  if (name === 'follows') return state.follows.map((f) => ({ id: f.id, user_id: f.user, store_id: f.store, created_at: f.at }))
  if (name === 'threads') return state.threads
  return []
}

export async function syncPush() {
  if (!isConnected()) throw new Error('Connect Supabase first (Settings).')
  for (const t of TABLES) {
    const rows = collection(t)
    if (!rows.length) continue
    await sb(t + '?on_conflict=id', { method: 'POST', body: JSON.stringify(rows), headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=minimal' } })
  }
  state.settings.lastSync = Date.now()
  save()
}

export async function syncPull() {
  if (!isConnected()) throw new Error('Connect Supabase first (Settings).')
  for (const t of TABLES) {
    const rows = await sb(t + '?select=*&limit=1000')
    if (!rows) continue
    if (t === 'follows') state.follows = rows.map((r) => ({ id: r.id, user: r.user_id, store: r.store_id, at: r.created_at }))
    else state[t] = rows
  }
  save()
}

export async function testConnection() {
  if (!isConnected()) return false
  try { await sb('stores?select=id&limit=1'); return true } catch { return false }
}

export async function syncBoth() {
  try {
    if (state.isDemo) {
      // Clear demo data before pulling
      TABLES.forEach(t => { if(state[t]) state[t] = [] })
      state.isDemo = false
    } else {
      await syncPush()
    }
    await syncPull()
    toast('Supabase sync complete — database live hai', 'ok')
    return true
  } catch (e) {
    toast('Sync failed: ' + e.message, 'err')
    return false
  }
}

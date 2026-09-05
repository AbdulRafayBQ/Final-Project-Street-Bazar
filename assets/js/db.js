/* Street Bazar — server-backed integrations.
   Secrets stay in Vercel environment variables; the browser only calls /api. */

import { toast } from './ui.js'
import { state, save } from './store.js'

export const TABLES = ['users', 'profiles', 'stores', 'products', 'reviews', 'orders', 'follows', 'threads', 'cart_items', 'saved_products', 'warehouse_items']

export const SQL_SCHEMA = `-- Street Bazar · Supabase schema (SQL Editor me paste karein)
create extension if not exists "pgcrypto";

create table if not exists users (
id uuid primary key, name text, email text unique, role text default 'customer',
  avatar text, created_at timestamptz default now()
);
create table if not exists stores (
  id text primary key, owner_id uuid references users(id), name text, slug text unique,
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
create table if not exists warehouse_items (
 id text primary key, owner_id uuid, name text not null, sku text,
 qty int default 0, cost numeric default 0, location text, image_url text,
 updated_at timestamptz default now()
);
alter table warehouse_items add column if not exists image_url text;
create table if not exists app_state (
  key text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

alter table users enable row level security;
alter table stores enable row level security;
alter table products enable row level security;
alter table reviews enable row level security;
alter table orders enable row level security;
alter table follows enable row level security;
alter table threads enable row level security;
alter table warehouse_items enable row level security;
alter table app_state enable row level security;

-- No public write policies: all writes go through the Vercel service role.
drop policy if exists anon_all on stores;
drop policy if exists anon_all_products on products;
drop policy if exists anon_state_read on app_state;
`

export const isConnected = () => true
export const isAIConnected = () => true
export const getAIKey = () => 'server-managed'
let syncing = false

async function api(path, options = {}) {
const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
const data = await res.json().catch(() => ({}))
if (!res.ok) throw new Error(data.error || `API ${res.status}`)
return data
}

export async function authRequest(action, payload) {
return api('/api/auth', { method: 'POST', body: JSON.stringify({ action, ...payload }) })
}

export async function syncPush() {
if (syncing) return
syncing = true
try {
  const userId = state.session
  const payload = {
    ...state,
    users: state.users.map(({ pass, ...user }) => user),
    settings: { ...state.settings, supabase: {}, ai: {} },
  }

  payload.user_id = userId
  delete payload.session
  await api('/api/data', { method: 'POST', body: JSON.stringify(payload) })
  state.settings.lastSync = Date.now()
  save()
} finally {
  syncing = false
}
}

export async function deleteRemote(table, id) {
  await api('/api/data', { method: 'DELETE', body: JSON.stringify({ table, id }) })
}

export async function syncPull() {
const remote = await api('/api/data')
if (!remote) return
const session = state.session
Object.assign(state, remote, { session })
save()
}

export const testConnection = async () => { try { await api('/api/data'); return true } catch { return false } }

export async function syncBoth() {
  try {
    await syncPush()
    await syncPull()
    toast('Supabase sync complete — database live hai', 'ok')
    return true
  } catch (e) {
    toast('Sync failed: ' + e.message, 'err')
    return false
  }
}

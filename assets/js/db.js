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
  owner_phone text, cnic text, personal_address text,
  status text default 'pending', rating numeric default 0, created_at timestamptz default now()
);
alter table stores add column if not exists owner_phone text;
alter table stores add column if not exists cnic text;
alter table stores add column if not exists personal_address text;
alter table stores add column if not exists cnic_front text;
alter table stores add column if not exists cnic_back text;
create table if not exists products (
  id text primary key, store_id text references stores(id), title text, description text,
  price numeric, compare_at numeric, media jsonb, categories text[], tags text[],
  stock int default 0, sku text, customizable jsonb, wholesale jsonb,
  delivery_charge numeric default 0, home_delivery_charge numeric default 0, outside_delivery_charge numeric default 0,
  sales int default 0, status text default 'active', created_at timestamptz default now()
);
alter table products add column if not exists delivery_charge numeric default 0;
alter table products add column if not exists home_delivery_charge numeric default 0;
alter table products add column if not exists outside_delivery_charge numeric default 0;
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
create table if not exists deletion_logs (
  id uuid primary key default gen_random_uuid(), item_type text not null, item_id text not null,
  item_name text not null, owner_id uuid, reason text not null, deleted_by uuid,
  deleted_at timestamptz default now()
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
let syncingPromise = null

async function api(path, options = {}) {
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 30000)
let res
try {
  const token = sessionStorage.getItem('street-bazar-access-token') || localStorage.getItem('street-bazar-access-token')
  res = await fetch(path, { ...options, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } })
} catch (error) {
  if (error.name === 'AbortError') throw new Error('Server response timed out. Please try again.')
  throw error
} finally {
  clearTimeout(timeout)
}
const data = await res.json().catch(() => ({}))
if (!res.ok) {
  if (res.status === 401) {
    sessionStorage.removeItem('street-bazar-access-token')
    localStorage.removeItem('street-bazar-access-token')
    state.session = null
    save()
    throw new Error('Session expire ho gayi. Dobara login karein.')
  }
  throw new Error(data.error || `API ${res.status}`)
}
return data
}

export async function authRequest(action, payload) {
const result = await api('/api/auth', { method: 'POST', body: JSON.stringify({ action, ...payload }) })
if (result.access_token) {
  sessionStorage.setItem('street-bazar-access-token', result.access_token)
  localStorage.setItem('street-bazar-access-token', result.access_token)
}
return result
}

export async function syncPush() {
if (syncingPromise) return syncingPromise
syncing = true
syncingPromise = (async () => {
 try {
  const userId = state.session
  const isDemo = (item) => item?.demo === true
  const stores = state.stores.filter((store) => !isDemo(store))
  const storeIds = new Set(stores.map((store) => store.id))
  const products = state.products.filter((product) => !isDemo(product) && storeIds.has(product.store))
  const payload = {
    ...state,
    users: state.users.filter((user) => !isDemo(user)).map(({ pass, ...user }) => user),
    // Media is persisted through targeted store/product writes. Keeping large
    // data URLs out of the aggregate state endpoint prevents Vercel 413s.
    stores: stores.map(({ logo, banner, cnicFront, cnicBack, ...store }) => ({
      ...store,
      ...(logo && !String(logo).startsWith('data:') ? { logo } : {}),
      ...(banner && !String(banner).startsWith('data:') ? { banner } : {}),
    })),
    products: products.map((product) => ({
      ...product,
      media: (product.media || []).map(({ url, ...media }) => ({
        ...media,
        ...(url && !String(url).startsWith('data:') ? { url } : {}),
      })),
    })),
    isDemo: false,
    settings: { ...state.settings, supabase: {}, ai: {} },
  }

  payload.user_id = userId
  delete payload.session
  const body = JSON.stringify(payload)
  if (body.length > 1_500_000) {
    console.warn('Skipping aggregate sync because payload is too large; targeted sync remains active.')
    return
  }
  await api('/api/data', { method: 'POST', body })
  state.settings.lastSync = Date.now()
  save()
 } finally {
   syncing = false
 }
})()
try {
  return await syncingPromise
} finally {
  syncingPromise = null
}
}

export async function syncProduct(product) {
  await api('/api/data', { method: 'POST', body: JSON.stringify({ action: 'product', product }) })
  state.settings.lastSync = Date.now()
  save()
}

export async function syncOrder(order) {
  return api('/api/data', { method: 'POST', body: JSON.stringify({ action: 'order', order }) })
}

export async function syncStore(store) {
  await api('/api/data', { method: 'POST', body: JSON.stringify({ action: 'store', store }) })
  state.settings.lastSync = Date.now()
  save()
}

export async function syncThread(thread) {
  await api('/api/data', { method: 'POST', body: JSON.stringify({ action: 'thread', thread }) })
}

export async function syncFollow(follow, following) {
  await api('/api/data', { method: 'POST', body: JSON.stringify({ action: 'follow', follow, following }) })
}

export async function syncNotification(notification) {
  await api('/api/data', { method: 'POST', body: JSON.stringify({ action: 'notification', notification }) })
}

export async function deleteRemote(table, id) {
  await api('/api/data', { method: 'DELETE', body: JSON.stringify({ table, id }) })
}

export async function adminStatus(itemType, id, status) {
  return api('/api/data', { method: 'POST', body: JSON.stringify({ action: 'admin-status', itemType, id, status }) })
}

export async function adminDelete(itemType, id, reason) {
  return api('/api/data', { method: 'POST', body: JSON.stringify({ action: 'admin-delete', itemType, id, reason }) })
}

export async function ownerDelete(itemType, id) {
  return api('/api/data', { method: 'POST', body: JSON.stringify({ action: 'owner-delete', itemType, id }) })
}

export async function syncPull() {
const remote = await api('/api/data')
if (!remote) return
const session = state.session
const mergeById = (remoteItems, localItems) => {
  const incoming = Array.isArray(remoteItems) ? remoteItems : []
  const localOnly = (Array.isArray(localItems) ? localItems : []).filter((item) => !incoming.some((row) => row.id === item.id))
  return [...incoming, ...localOnly]
}
const mergeNotifications = (remoteItems, localItems) => {
  const local = new Map((Array.isArray(localItems) ? localItems : []).map((item) => [item.id, item]))
  return (Array.isArray(remoteItems) ? remoteItems : []).map((item) => {
    const previous = local.get(item.id)
    return previous?.read ? { ...item, read: true } : item
  }).concat((Array.isArray(localItems) ? localItems : []).filter((item) => !remoteItems?.some((row) => row.id === item.id)))
}
Object.assign(state, remote, {
  users: mergeById(remote.users, state.users),
  stores: Array.isArray(remote.stores) ? remote.stores : state.stores,
  products: Array.isArray(remote.products) ? remote.products : state.products,
  threads: mergeById(remote.threads, state.threads),
  follows: mergeById(remote.follows, state.follows),
  notifications: mergeNotifications(remote.notifications, state.notifications),
  session,
})
save()
}

export const testConnection = async () => { try { await api('/api/data'); return true } catch { return false } }

export async function syncBoth() {
  try {
    await syncPush()
    await syncPull()
    toast('Changes successfully saved', 'ok')
    return true
  } catch (e) {
    toast('Sync failed: ' + e.message, 'err')
    return false
  }
}

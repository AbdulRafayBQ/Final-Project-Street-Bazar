const json = (res, status, body) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body))
}

const request = async (path, options = {}) => {
  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) throw new Error('Supabase environment variables are not configured')
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || `Supabase ${response.status}`)
  return data
}

const upsert = async (table, rows) => {
  if (!Array.isArray(rows) || !rows.length) return
  await request(`/rest/v1/${table}?on_conflict=id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  })
}

const safeUpsert = async (table, rows) => {
  try {
    await upsert(table, rows)
  } catch (error) {
    console.error(`Supabase ${table} sync failed:`, error.message)
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await request('/rest/v1/app_state?select=payload&key=eq.global&limit=1')
      return json(res, 200, rows[0]?.payload || null)
    }
    if (req.method === 'DELETE') {
      const { table, id } = req.body || {}
      const allowed = ['products', 'orders', 'reviews', 'threads', 'follows', 'cart_items', 'saved_products', 'warehouse_items']
      if (!allowed.includes(table) || !id) return json(res, 400, { error: 'Invalid delete request' })
      await request(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (table === 'products') {
        await Promise.all([
          request(`/rest/v1/reviews?product_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }),
          request(`/rest/v1/threads?product_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }),
          request(`/rest/v1/cart_items?product_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }),
          request(`/rest/v1/saved_products?product_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }),
        ])
      }
      return json(res, 200, { ok: true })
    }
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
    const payload = req.body || {}
    await request('/rest/v1/app_state?on_conflict=key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ key: 'global', payload }),
    })
    await safeUpsert('users', (payload.users || []).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, created_at: u.createdAt || u.created_at })))
    await safeUpsert('profiles', (payload.users || []).map((u) => ({ id: u.id, full_name: u.name, email: u.email, role: u.role, avatar_url: u.avatar, created_at: u.createdAt || u.created_at })))
    await safeUpsert('stores', (payload.stores || []).map((s) => ({ id: s.id, owner_id: s.owner || s.owner_id, name: s.name, slug: s.slug, tagline: s.tagline, type: s.type, description: s.description, logo: s.logo, banner: s.banner, theme: s.theme, categories: s.categories, socials: s.socials, address: s.address, city: s.city, sale: s.sale, status: s.status, rating: s.rating, created_at: s.createdAt || s.created_at })))
    await safeUpsert('products', (payload.products || []).map((p) => ({ id: p.id, store_id: p.store || p.store_id, title: p.title, description: p.description, price: p.price, compare_at: p.compareAt || p.compare_at, media: p.media, categories: p.categories, tags: p.tags, stock: p.stock, sku: p.sku, customizable: p.customizable, wholesale: p.wholesale, sales: p.sales, status: p.status, created_at: p.createdAt || p.created_at })))
    await safeUpsert('reviews', (payload.reviews || []).map((r) => ({ id: r.id, product_id: r.product || r.product_id, store_id: r.store || r.store_id, user_id: r.user || r.user_id, rating: r.rating, text: r.text, created_at: r.at || r.created_at })))
    await safeUpsert('orders', (payload.orders || []).map((o) => ({ id: o.id, user_id: o.user || o.user_id, items: o.items, total: o.total, status: o.status, timeline: o.timeline, eta: o.eta, address: o.address, store_ids: o.storeIds || o.store_ids, created_at: o.createdAt || o.created_at })))
    await safeUpsert('follows', (payload.follows || []).map((f) => ({ id: f.id, user_id: f.user || f.user_id, store_id: f.store || f.store_id, created_at: f.createdAt || f.created_at })))
    await safeUpsert('threads', (payload.threads || []).map((t) => ({ id: t.id, product_id: t.product || t.product_id, store_id: t.store || t.store_id, customer_id: t.customer || t.customer_id, messages: t.messages, updated_at: t.updatedAt || t.updated_at })))
    await safeUpsert('cart_items', (payload.cart || []).map((item) => ({ id: item.key || item.id, user_id: payload.user_id, product_id: item.product, store_id: item.store, title: item.title, image: item.image, qty: item.qty, options: item.options, unit_price: item.unitPrice, updated_at: new Date().toISOString() })))
    await safeUpsert('saved_products', (payload.likes || []).map((like) => ({ id: like.id, user_id: like.user, product_id: like.product, created_at: like.createdAt || like.created_at })))
    await safeUpsert('warehouse_items', (payload.warehouse || []).map((item) => ({ id: item.id, owner_id: item.owner || item.owner_id, name: item.name, sku: item.sku, qty: item.qty ?? item.quantity ?? 0, cost: item.cost || 0, location: item.location, image_url: item.image || item.image_url, updated_at: item.updatedAt || item.updated_at })))
    return json(res, 200, { ok: true })
  } catch (error) {
    return json(res, 400, { error: error.message })
  }
}

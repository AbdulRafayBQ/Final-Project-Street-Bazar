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

const timestamp = (value) => {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value : String(value))
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const storeRow = (store) => ({
  id: store.id, owner_id: store.owner || store.owner_id, name: store.name, slug: store.slug,
  tagline: store.tagline, type: store.type, description: store.description, logo: store.logo,
  banner: store.banner, theme: store.theme, categories: store.categories, socials: store.socials,
  address: store.address, city: store.city, sale: store.sale, status: store.status,
  rating: store.rating || 0, owner_phone: store.ownerPhone || store.owner_phone,
  cnic: store.cnic, cnic_front: store.cnicFront || store.cnic_front,
  cnic_back: store.cnicBack || store.cnic_back, personal_address: store.personalAddress || store.personal_address,
  created_at: timestamp(store.createdAt || store.created_at),
})

const saveStore = async (store) => {
  try {
    await upsert('stores', [storeRow(store)])
  } catch (error) {
    if (!/cnic|schema cache|column/i.test(error.message)) throw error
    const row = storeRow(store)
    delete row.cnic
    delete row.cnic_front
    delete row.cnic_back
    await upsert('stores', [row])
  }
}

const isDemo = (item) => item?.demo === true
const cleanPayload = (payload) => {
  const stores = (payload.stores || []).filter((s) => !isDemo(s))
  const storeIds = new Set(stores.map((s) => s.id))
  const products = (payload.products || []).filter((p) => !isDemo(p) && storeIds.has(p.store || p.store_id))
  const productIds = new Set(products.map((p) => p.id))
  const demoUsers = new Set(['u-admin', 'u-hassan', 'u-sana', 'u-bilal', 'u-mariam', 'u-ali', 'u-zoya'])
  const keepRelated = (item) => !isDemo(item) && (!item.store || storeIds.has(item.store || item.store_id)) && (!item.product || productIds.has(item.product || item.product_id))
  return {
    ...payload,
    isDemo: false,
    users: (payload.users || []).filter((u) => !isDemo(u) && !String(u.email || '').endsWith('@demo.pk') && !demoUsers.has(u.id)),
    stores,
    products,
    reviews: (payload.reviews || []).filter(keepRelated),
    orders: (payload.orders || []).filter((o) => !demoUsers.has(o.user || o.user_id) && (o.items || []).every((item) => productIds.has(item.product))),
    follows: (payload.follows || []).filter((f) => !demoUsers.has(f.user || f.user_id) && storeIds.has(f.store || f.store_id)),
    threads: (payload.threads || []).filter((t) => !demoUsers.has(t.customer || t.customer_id) && keepRelated(t)),
    likes: (payload.likes || []).filter((l) => !demoUsers.has(l.user || l.user_id) && productIds.has(l.product || l.product_id)),
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const [stateRows, storeRows, productRows] = await Promise.all([
        request('/rest/v1/app_state?select=payload&key=eq.global&limit=1'),
        request('/rest/v1/stores?select=*'),
        request('/rest/v1/products?select=*'),
      ])
      const payload = cleanPayload(stateRows[0]?.payload || {})
      const stores = (storeRows || []).map((s) => ({
        id: s.id, owner: s.owner_id, name: s.name, slug: s.slug, tagline: s.tagline,
        type: s.type, description: s.description, logo: s.logo, banner: s.banner,
        theme: s.theme, categories: s.categories || [], socials: s.socials || {},
        address: s.address, city: s.city, sale: s.sale, status: s.status,
        rating: s.rating, ownerPhone: s.owner_phone, cnic: s.cnic,
        cnicFront: s.cnic_front, cnicBack: s.cnic_back, personalAddress: s.personal_address,
        createdAt: s.created_at,
      }))
      const products = (productRows || []).map((p) => ({
        id: p.id, store: p.store_id, title: p.title, description: p.description,
        price: p.price, compareAt: p.compare_at, media: p.media || [], categories: p.categories || [],
        tags: p.tags || [], stock: p.stock, sku: p.sku, customizable: p.customizable,
        wholesale: p.wholesale, deliveryCharge: p.delivery_charge,
        homeDeliveryCharge: p.home_delivery_charge, outsideDeliveryCharge: p.outside_delivery_charge,
        sales: p.sales, status: p.status, createdAt: p.created_at,
      }))
      const merge = (local, remote) => [...remote, ...(local || []).filter((item) => !remote.some((row) => row.id === item.id))]
      return json(res, 200, { ...payload, stores: merge(payload.stores, stores), products: merge(payload.products, products) })
    }
    if (req.method === 'DELETE') {
      const { table, id } = req.body || {}
      const allowed = ['products', 'orders', 'reviews', 'threads', 'follows', 'cart_items', 'saved_products', 'warehouse_items']
      if (!allowed.includes(table) || !id) return json(res, 400, { error: 'Invalid delete request' })
      if (table === 'orders' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        const rows = await request('/rest/v1/app_state?select=payload&key=eq.global&limit=1')
        const payload = rows[0]?.payload
        if (!payload) return json(res, 404, { error: 'Shared state not found' })
        payload.orders = (payload.orders || []).filter((order) => order.id !== id)
        await request('/rest/v1/app_state?on_conflict=key', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ key: 'global', payload }),
        })
        return json(res, 200, { ok: true })
      }
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
    const payload = cleanPayload(req.body || {})
    if (payload.action === 'store') {
      const store = payload.store
      if (!store?.id || !store.name) return json(res, 400, { error: 'Store data is required' })
      await saveStore(store)
      return json(res, 200, { ok: true })
    }
    if (payload.action === 'product') {
      const product = payload.product
      if (!product?.id) return json(res, 400, { error: 'Product data is required' })
      await upsert('products', [{ id: product.id, store_id: product.store || product.store_id, title: product.title, description: product.description, price: product.price, compare_at: product.compareAt || product.compare_at, media: product.media, categories: product.categories, tags: product.tags, stock: product.stock, sku: product.sku, customizable: product.customizable, wholesale: product.wholesale, delivery_charge: product.deliveryCharge || 0, home_delivery_charge: product.homeDeliveryCharge ?? product.deliveryCharge ?? 0, outside_delivery_charge: product.outsideDeliveryCharge ?? product.deliveryCharge ?? 0, sales: product.sales, status: product.status, created_at: timestamp(product.createdAt || product.created_at) }])
      return json(res, 200, { ok: true })
    }
    await request('/rest/v1/app_state?on_conflict=key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ key: 'global', payload }),
    })
    await safeUpsert('users', (payload.users || []).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, created_at: u.createdAt || u.created_at })))
    await safeUpsert('profiles', (payload.users || []).map((u) => ({ id: u.id, full_name: u.name, email: u.email, role: u.role, avatar_url: u.avatar, created_at: u.createdAt || u.created_at })))
    await safeUpsert('stores', (payload.stores || []).map((s) => ({ id: s.id, owner_id: s.owner || s.owner_id, name: s.name, slug: s.slug, tagline: s.tagline, type: s.type, description: s.description, logo: s.logo, banner: s.banner, theme: s.theme, categories: s.categories, socials: s.socials, address: s.address, city: s.city, sale: s.sale, status: s.status, rating: s.rating, owner_phone: s.ownerPhone, cnic: s.cnic, cnic_front: s.cnicFront, cnic_back: s.cnicBack, personal_address: s.personalAddress, created_at: s.createdAt || s.created_at })))
    await safeUpsert('products', (payload.products || []).map((p) => ({ id: p.id, store_id: p.store || p.store_id, title: p.title, description: p.description, price: p.price, compare_at: p.compareAt || p.compare_at, media: p.media, categories: p.categories, tags: p.tags, stock: p.stock, sku: p.sku, customizable: p.customizable, wholesale: p.wholesale, delivery_charge: p.deliveryCharge || 0, home_delivery_charge: p.homeDeliveryCharge ?? p.deliveryCharge ?? 0, outside_delivery_charge: p.outsideDeliveryCharge ?? p.deliveryCharge ?? 0, sales: p.sales, status: p.status, created_at: p.createdAt || p.created_at })))
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

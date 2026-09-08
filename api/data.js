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

const bearerToken = (req) => {
  const value = req.headers.authorization || ''
  return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
}

const authenticate = async (req) => {
  const token = bearerToken(req)
  if (!token) return null
  let userRows
  try {
    userRows = await request('/auth/v1/user', { headers: { Authorization: `Bearer ${token}` } })
  } catch {
    return null
  }
  if (!userRows?.id || !userRows.email) return null
  const profiles = await request(`/rest/v1/users?select=id,name,email,role,avatar&id=eq.${encodeURIComponent(userRows.id)}&limit=1`)
  const profile = profiles[0] || { id: userRows.id, name: userRows.user_metadata?.name || userRows.email.split('@')[0], email: userRows.email, role: 'customer' }
  return { id: userRows.id, email: userRows.email, role: profile.role === 'admin' ? 'admin' : profile.role === 'owner' ? 'owner' : 'customer', profile }
}

const requireAuth = async (req, res) => {
  const actor = await authenticate(req)
  if (!actor) {
    json(res, 401, { error: 'Authentication required' })
    return null
  }
  return actor
}

const isAdmin = (actor) => actor?.role === 'admin'
const storeOwner = async (id) => {
  const rows = await request(`/rest/v1/stores?select=id,owner_id&id=eq.${encodeURIComponent(id)}&limit=1`)
  return rows[0]?.owner_id || null
}
const productStore = async (id) => {
  const rows = await request(`/rest/v1/products?select=store_id&id=eq.${encodeURIComponent(id)}&limit=1`)
  return rows[0]?.store_id || null
}
const canOwnStore = async (actor, id) => isAdmin(actor) || (await storeOwner(id)) === actor.id
const canOwnProduct = async (actor, id) => isAdmin(actor) || (await canOwnStore(actor, await productStore(id)))
const mergeById = (existing, incoming, allowed = () => true) => {
  const next = new Map((existing || []).map((item) => [item.id, item]))
  ;(incoming || []).filter(allowed).forEach((item) => next.set(item.id, item))
  return [...next.values()]
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
  const withoutDeleted = (items, deletedIds) => (items || []).filter((item) => !deletedIds.has(item.id))
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const actor = await authenticate(req)
      const [stateRows, storeRows, productRows, threadRows, followRows, deletionRows] = await Promise.all([
        request('/rest/v1/app_state?select=payload&key=eq.global&limit=1'),
        request('/rest/v1/stores?select=*'),
        request('/rest/v1/products?select=*'),
        request('/rest/v1/threads?select=*'),
        request('/rest/v1/follows?select=*'),
        request('/rest/v1/deletion_logs?select=item_type,item_id'),
      ])
      const deletedStoreIds = new Set((deletionRows || []).filter((row) => row.item_type === 'store').map((row) => row.item_id))
      const deletedProductIds = new Set((deletionRows || []).filter((row) => row.item_type === 'product').map((row) => row.item_id))
      const payload = cleanPayload(stateRows[0]?.payload || {})
      const stores = (storeRows || []).filter((s) => s.status !== 'deleted' && !deletedStoreIds.has(s.id)).map((s) => ({
        id: s.id, owner: s.owner_id, name: s.name, slug: s.slug, tagline: s.tagline,
        type: s.type, description: s.description, logo: s.logo, banner: s.banner,
        theme: s.theme, categories: s.categories || [], socials: s.socials || {},
        address: s.address, city: s.city, sale: s.sale, status: s.status,
        rating: s.rating,
        createdAt: s.created_at,
        ...(actor && (isAdmin(actor) || s.owner_id === actor.id) ? {
          ownerPhone: s.owner_phone, cnic: s.cnic, cnicFront: s.cnic_front,
          cnicBack: s.cnic_back, personalAddress: s.personal_address,
        } : {}),
      }))
      const products = (productRows || []).filter((p) => p.status !== 'deleted' && !deletedProductIds.has(p.id) && !deletedStoreIds.has(p.store_id)).map((p) => ({
        id: p.id, store: p.store_id, title: p.title, description: p.description,
        price: p.price, compareAt: p.compare_at, media: p.media || [], categories: p.categories || [],
        tags: p.tags || [], stock: p.stock, sku: p.sku, customizable: p.customizable,
        wholesale: p.wholesale, deliveryCharge: p.delivery_charge,
        homeDeliveryCharge: p.home_delivery_charge, outsideDeliveryCharge: p.outside_delivery_charge,
        sales: p.sales, status: p.status, createdAt: p.created_at,
      }))
      const visibleThreads = actor ? (threadRows || []).filter((t) => t.customer_id === actor.id || isAdmin(actor) || stores.some((s) => s.id === t.store_id && s.owner === actor.id)) : []
      const threads = visibleThreads.map((t) => ({
        id: t.id, product: t.product_id, store: t.store_id, customer: t.customer_id,
        messages: t.messages || [], read: t.read ?? false, readByOwner: t.read_by_owner ?? false, readByCustomer: t.read_by_customer ?? false, updatedAt: t.updated_at,
      }))
      const follows = (followRows || []).map((f) => ({
        id: f.id, user: f.user_id, store: f.store_id, at: f.created_at,
      }))
      const followerCounts = follows.reduce((counts, follow) => counts.set(follow.store, (counts.get(follow.store) || 0) + 1), new Map())
      stores.forEach((store) => { store.followers = followerCounts.get(store.id) || 0 })
      const merge = (local, remote) => [...remote, ...(local || []).filter((item) => !remote.some((row) => row.id === item.id))]
      const publicStores = stores.filter((store) => store.status === 'live')
      const publicProducts = products.filter((product) => publicStores.some((store) => store.id === product.store) && product.status === 'active')
      if (!actor) return json(res, 200, { stores: publicStores, products: publicProducts, follows: [], threads: [], users: [] })
      const visibleStores = isAdmin(actor) ? stores : stores.filter((store) => store.status === 'live' || store.owner === actor.id)
      const visibleProducts = products.filter((product) => visibleStores.some((store) => store.id === product.store) && (product.status === 'active' || isAdmin(actor) || visibleStores.some((store) => store.id === product.store && store.owner === actor.id)))
      const visibleNotifications = (payload.notifications || []).filter((notification) => notification.to === actor.id)
      if (isAdmin(actor)) return json(res, 200, { ...payload, stores: visibleStores, products: visibleProducts, threads, follows })
      return json(res, 200, {
        version: payload.version, isDemo: false,
        users: [actor.profile], notifications: visibleNotifications,
        stores: visibleStores, products: visibleProducts, threads, follows,
        reviews: (payload.reviews || []).filter((review) => visibleProducts.some((product) => product.id === (review.product || review.product_id))),
        orders: (payload.orders || []).filter((order) => order.user === actor.id || order.user_id === actor.id),
        cart: (payload.cart || []).filter((item) => item.user === actor.id || item.user_id === actor.id),
        likes: (payload.likes || []).filter((like) => like.user === actor.id || like.user_id === actor.id),
        warehouse: (payload.warehouse || []).filter((item) => item.owner === actor.id || item.owner_id === actor.id),
      })
    }
    if (req.method === 'DELETE') {
      const actor = await requireAuth(req, res)
      if (!actor) return
      const { table, id } = req.body || {}
      const allowed = ['products', 'orders', 'reviews', 'threads', 'follows', 'cart_items', 'saved_products', 'warehouse_items']
      if (!allowed.includes(table) || !id) return json(res, 400, { error: 'Invalid delete request' })
      if (table === 'products' && !(await canOwnProduct(actor, id))) return json(res, 403, { error: 'You cannot delete this product' })
      if (table === 'warehouse_items') {
        const rows = await request(`/rest/v1/warehouse_items?select=owner_id&id=eq.${encodeURIComponent(id)}&limit=1`)
        if (!isAdmin(actor) && rows[0]?.owner_id !== actor.id) return json(res, 403, { error: 'You cannot delete this warehouse item' })
      }
      if (table === 'follows') {
        const rows = await request(`/rest/v1/follows?select=user_id&id=eq.${encodeURIComponent(id)}&limit=1`)
        if (!isAdmin(actor) && rows[0]?.user_id !== actor.id) return json(res, 403, { error: 'You cannot delete this follow' })
      }
      if (table === 'threads') {
        const rows = await request(`/rest/v1/threads?select=customer_id,store_id&id=eq.${encodeURIComponent(id)}&limit=1`)
        if (!isAdmin(actor) && rows[0]?.customer_id !== actor.id && (await storeOwner(rows[0]?.store_id)) !== actor.id) return json(res, 403, { error: 'You cannot delete this conversation' })
      }
      if (!isAdmin(actor) && table === 'orders') {
        const rows = await request(`/rest/v1/orders?select=user_id&id=eq.${encodeURIComponent(id)}&limit=1`)
        if (rows[0]?.user_id !== actor.id) return json(res, 403, { error: 'You cannot delete this order' })
      }
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
    const actor = await requireAuth(req, res)
    if (!actor) return
    const payload = cleanPayload(req.body || {})
    if (payload.action === 'admin-status') {
      if (!isAdmin(actor)) return json(res, 403, { error: 'Admin access required' })
      const table = payload.itemType === 'store' ? 'stores' : payload.itemType === 'product' ? 'products' : null
      const validStatuses = payload.itemType === 'store' ? ['live', 'pending', 'hidden', 'rejected'] : ['active', 'pending', 'hidden', 'rejected']
      if (!table || !payload.id || !validStatuses.includes(payload.status)) return json(res, 400, { error: 'Invalid status update' })
      await request(`/rest/v1/${table}?id=eq.${encodeURIComponent(payload.id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: payload.status }),
      })
      return json(res, 200, { ok: true, status: payload.status })
    }
    if (payload.action === 'admin-delete' || payload.action === 'owner-delete') {
      const ownerDelete = payload.action === 'owner-delete'
      if (!ownerDelete && !isAdmin(actor)) return json(res, 403, { error: 'Admin access required' })
      const itemType = payload.itemType
      const id = String(payload.id || '')
      const reason = ownerDelete ? 'Deleted by store owner' : String(payload.reason || '').trim()
      if (!['store', 'product'].includes(itemType) || !id || reason.length < 3 || reason.length > 1000) return json(res, 400, { error: 'A valid delete reason is required' })
      const existingLogs = await request(`/rest/v1/deletion_logs?select=id,item_type,item_id&item_type=eq.${encodeURIComponent(itemType)}&item_id=eq.${encodeURIComponent(id)}&limit=1`)
      if (existingLogs[0]) {
        const table = itemType === 'store' ? 'stores' : 'products'
        await request(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ status: 'deleted' }),
        })
        if (itemType === 'store') {
          await request(`/rest/v1/products?store_id=eq.${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ status: 'deleted' }),
          })
        }
        const stateRows = await request('/rest/v1/app_state?select=payload&key=eq.global&limit=1')
        const appPayload = stateRows[0]?.payload || {}
        appPayload.stores = (appPayload.stores || []).filter((store) => store.id !== id)
        appPayload.products = (appPayload.products || []).filter((product) => (
          itemType === 'store' ? product.store !== id && product.store_id !== id : product.id !== id
        ))
        await request('/rest/v1/app_state?on_conflict=key', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ key: 'global', payload: appPayload }),
        })
        return json(res, 200, { ok: true, alreadyDeleted: true })
      }
      let ownerId = null
      let itemName = ''
      if (itemType === 'store') {
        const stores = await request(`/rest/v1/stores?select=id,name,owner_id&id=eq.${encodeURIComponent(id)}&limit=1`)
        if (!stores[0]) return json(res, 404, { error: 'Store not found' })
        ownerId = stores[0].owner_id
        if (ownerDelete && ownerId !== actor.id) return json(res, 403, { error: 'You can only delete your own store' })
        itemName = stores[0].name || id
        await request(`/rest/v1/stores?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ status: 'deleted' }),
        })
        const products = await request(`/rest/v1/products?select=id&store_id=eq.${encodeURIComponent(id)}`)
        const productIds = products.map((product) => product.id)
        await request(`/rest/v1/follows?store_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
        await request(`/rest/v1/threads?store_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
        await request(`/rest/v1/reviews?store_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
        await Promise.all(productIds.flatMap((productId) => [
          request(`/rest/v1/threads?product_id=eq.${encodeURIComponent(productId)}`, { method: 'DELETE' }),
          request(`/rest/v1/reviews?product_id=eq.${encodeURIComponent(productId)}`, { method: 'DELETE' }),
          request(`/rest/v1/cart_items?product_id=eq.${encodeURIComponent(productId)}`, { method: 'DELETE' }),
          request(`/rest/v1/saved_products?product_id=eq.${encodeURIComponent(productId)}`, { method: 'DELETE' }),
        ]))
        await request(`/rest/v1/products?store_id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ status: 'deleted' }),
        })
      } else {
        const products = await request(`/rest/v1/products?select=id,title,store_id&id=eq.${encodeURIComponent(id)}&limit=1`)
        if (!products[0]) return json(res, 404, { error: 'Product not found' })
        itemName = products[0].title || id
        ownerId = await storeOwner(products[0].store_id)
        if (ownerDelete && ownerId !== actor.id) return json(res, 403, { error: 'You can only delete products from your own store' })
        await request(`/rest/v1/products?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ status: 'deleted' }),
        })
        await Promise.all([
          request(`/rest/v1/reviews?product_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }),
          request(`/rest/v1/threads?product_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }),
          request(`/rest/v1/cart_items?product_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }),
          request(`/rest/v1/saved_products?product_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }),
        ])
        // Keep a deleted tombstone so stale clients cannot recreate the product.
      }
      await request('/rest/v1/deletion_logs', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ item_type: itemType, item_id: id, item_name: itemName, owner_id: ownerId, reason, deleted_by: actor.id }),
      })
      const stateRows = await request('/rest/v1/app_state?select=payload&key=eq.global&limit=1')
      const appPayload = stateRows[0]?.payload || {}
      appPayload.stores = (appPayload.stores || []).filter((store) => store.id !== id)
      appPayload.products = (appPayload.products || []).filter((product) => (
        itemType === 'store'
          ? product.store !== id && product.store_id !== id
          : product.id !== id
      ))
      const notification = {
        id: `n-delete-${itemType}-${id}-${Date.now()}`,
        to: ownerId,
        title: `${itemType === 'store' ? 'Store' : 'Product'} removed by admin`,
        body: `Your ${itemType} "${itemName}" was removed by Admin. Reason: ${reason}`,
        link: '#/dashboard',
        at: Date.now(),
        read: false,
        meta: { type: 'admin-deletion', itemType, itemId: id, reason },
      }
      if (!ownerDelete) {
        appPayload.notifications = [notification, ...(appPayload.notifications || [])]
        await request('/rest/v1/app_state?on_conflict=key', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ key: 'global', payload: appPayload }),
        })
      }
      return json(res, 200, { ok: true, notification: ownerDelete ? null : notification })
    }
    if (payload.action === 'store') {
      const store = payload.store
      if (!store?.id || !store.name) return json(res, 400, { error: 'Store data is required' })
      if (!isAdmin(actor) && store.owner !== actor.id && store.owner_id !== actor.id) return json(res, 403, { error: 'You can only submit your own store' })
      if (!store.owner && !store.owner_id) store.owner = actor.id
      await saveStore(store)
      return json(res, 200, { ok: true })
    }
    if (payload.action === 'product') {
      const product = payload.product
      if (!product?.id) return json(res, 400, { error: 'Product data is required' })
      if (!await canOwnStore(actor, product.store || product.store_id)) return json(res, 403, { error: 'You can only submit products for your own store' })
      await upsert('products', [{ id: product.id, store_id: product.store || product.store_id, title: product.title, description: product.description, price: product.price, compare_at: product.compareAt || product.compare_at, media: product.media, categories: product.categories, tags: product.tags, stock: product.stock, sku: product.sku, customizable: product.customizable, wholesale: product.wholesale, delivery_charge: product.deliveryCharge || 0, home_delivery_charge: product.homeDeliveryCharge ?? product.deliveryCharge ?? 0, outside_delivery_charge: product.outsideDeliveryCharge ?? product.deliveryCharge ?? 0, sales: product.sales, status: product.status, created_at: timestamp(product.createdAt || product.created_at) }])
      return json(res, 200, { ok: true })
    }
    if (payload.action === 'thread') {
      const thread = payload.thread
      if (!thread?.id) return json(res, 400, { error: 'Thread data is required' })
      const owner = await storeOwner(thread.store || thread.store_id)
      if (!isAdmin(actor) && actor.id !== thread.customer && actor.id !== owner) return json(res, 403, { error: 'You cannot modify this conversation' })
      if (actor.id !== owner) thread.customer = actor.id
      await upsert('threads', [{
        id: thread.id,
        product_id: thread.product || thread.product_id || null,
        store_id: thread.store || thread.store_id,
        customer_id: thread.customer || thread.customer_id,
        messages: thread.messages || [],
        read: thread.read ?? false,
        read_by_owner: thread.readByOwner ?? false,
        read_by_customer: thread.readByCustomer ?? false,
        updated_at: timestamp(thread.updatedAt || thread.updated_at || Date.now()),
      }])
      return json(res, 200, { ok: true })
    }
    if (payload.action === 'follow') {
      const follow = payload.follow
      if (!follow?.id || !follow.user || !follow.store) return json(res, 400, { error: 'Follow data is required' })
      if (!isAdmin(actor) && follow.user !== actor.id) return json(res, 403, { error: 'You can only change your own follows' })
      if (payload.following === false) {
        await request(`/rest/v1/follows?id=eq.${encodeURIComponent(follow.id)}`, { method: 'DELETE' })
      } else {
        await upsert('follows', [{ id: follow.id, user_id: follow.user, store_id: follow.store, created_at: timestamp(follow.at || follow.created_at || Date.now()) }])
      }
      return json(res, 200, { ok: true })
    }
    if (payload.action === 'notification') {
      const notification = payload.notification
      if (!notification?.id || !notification.to) return json(res, 400, { error: 'Notification data is required' })
      if (!isAdmin(actor) && notification.to !== actor.id) {
        if (!notification.storeId) return json(res, 403, { error: 'Invalid notification target' })
        const targetStores = await request(`/rest/v1/stores?select=id,owner_id&id=eq.${encodeURIComponent(notification.storeId)}&limit=1`)
        if (!targetStores.length || targetStores[0].owner_id !== notification.to) return json(res, 403, { error: 'Invalid notification target' })
        if (notification.title === 'New follower 🎉') {
          const follows = await request(`/rest/v1/follows?select=id&user_id=eq.${encodeURIComponent(actor.id)}&store_id=eq.${encodeURIComponent(notification.storeId)}&limit=1`)
          if (!follows.length) return json(res, 403, { error: 'Invalid follow notification' })
        }
      }
      const rows = await request('/rest/v1/app_state?select=payload&key=eq.global&limit=1')
      const shared = rows[0]?.payload || {}
      shared.notifications = [notification, ...(shared.notifications || []).filter((item) => item.id !== notification.id)].slice(0, 300)
      await request('/rest/v1/app_state?on_conflict=key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ key: 'global', payload: shared }) })
      return json(res, 200, { ok: true })
    }
    const currentRows = await request('/rest/v1/app_state?select=payload&key=eq.global&limit=1')
    const currentPayload = cleanPayload(currentRows[0]?.payload || {})
    const deletionRows = await request('/rest/v1/deletion_logs?select=item_type,item_id')
    const deletedStoreIds = new Set((deletionRows || []).filter((row) => row.item_type === 'store').map((row) => row.item_id))
    const deletedProductIds = new Set((deletionRows || []).filter((row) => row.item_type === 'product').map((row) => row.item_id))
    payload.stores = withoutDeleted(payload.stores, deletedStoreIds)
    payload.products = withoutDeleted(payload.products, new Set([...deletedProductIds, ...deletedStoreIds]))
    payload.products = payload.products.filter((product) => !deletedStoreIds.has(product.store || product.store_id))
    if (!isAdmin(actor)) {
      const ownedStores = (await request(`/rest/v1/stores?select=id&owner_id=eq.${encodeURIComponent(actor.id)}`)).map((store) => store.id)
      const ownedStoreIds = new Set(ownedStores)
      const ownedProducts = (await request(`/rest/v1/products?select=id,store_id&store_id=in.(${ownedStores.map(encodeURIComponent).join(',') || 'null'})`)).map((product) => product.id)
      const ownedProductIds = new Set(ownedProducts)
      payload.users = mergeById(currentPayload.users, payload.users, (user) => user.id === actor.id)
      payload.stores = mergeById(currentPayload.stores, payload.stores, (store) => store.owner === actor.id || store.owner_id === actor.id)
      payload.products = mergeById(currentPayload.products, payload.products, (product) => ownedStoreIds.has(product.store || product.store_id))
      payload.orders = mergeById(currentPayload.orders, payload.orders, (order) => order.user === actor.id || order.user_id === actor.id || (order.items || []).some((item) => ownedProductIds.has(item.product)))
      payload.reviews = mergeById(currentPayload.reviews, payload.reviews, (review) => review.user === actor.id || review.user_id === actor.id || ownedProductIds.has(review.product || review.product_id))
      payload.follows = mergeById(currentPayload.follows, payload.follows, (follow) => follow.user === actor.id || follow.user_id === actor.id)
      payload.threads = mergeById(currentPayload.threads, payload.threads, (thread) => thread.customer === actor.id || thread.customer_id === actor.id || ownedStoreIds.has(thread.store || thread.store_id))
      payload.warehouse = mergeById(currentPayload.warehouse, payload.warehouse, (item) => (item.owner || item.owner_id) === actor.id)
      payload.notifications = mergeById(currentPayload.notifications, payload.notifications, (notification) => notification.to === actor.id)
    }
    await request('/rest/v1/app_state?on_conflict=key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ key: 'global', payload }),
    })
    const usersToSync = isAdmin(actor) ? (payload.users || []) : (payload.users || []).filter((user) => user.id === actor.id).map((user) => ({ ...user, role: actor.role }))
    await safeUpsert('users', usersToSync.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, created_at: u.createdAt || u.created_at })))
    await safeUpsert('profiles', usersToSync.map((u) => ({ id: u.id, full_name: u.name, email: u.email, role: u.role, avatar_url: u.avatar, created_at: u.createdAt || u.created_at })))
    await safeUpsert('stores', (payload.stores || []).filter((store) => !deletedStoreIds.has(store.id)).map((s) => ({ id: s.id, owner_id: s.owner || s.owner_id, name: s.name, slug: s.slug, tagline: s.tagline, type: s.type, description: s.description, logo: s.logo, banner: s.banner, theme: s.theme, categories: s.categories, socials: s.socials, address: s.address, city: s.city, sale: s.sale, status: s.status, rating: s.rating, owner_phone: s.ownerPhone, cnic: s.cnic, cnic_front: s.cnicFront, cnic_back: s.cnicBack, personal_address: s.personalAddress, created_at: s.createdAt || s.created_at })))
    await safeUpsert('products', (payload.products || []).map((p) => ({ id: p.id, store_id: p.store || p.store_id, title: p.title, description: p.description, price: p.price, compare_at: p.compareAt || p.compare_at, media: p.media, categories: p.categories, tags: p.tags, stock: p.stock, sku: p.sku, customizable: p.customizable, wholesale: p.wholesale, delivery_charge: p.deliveryCharge || 0, home_delivery_charge: p.homeDeliveryCharge ?? p.deliveryCharge ?? 0, outside_delivery_charge: p.outsideDeliveryCharge ?? p.deliveryCharge ?? 0, sales: p.sales, status: p.status, created_at: p.createdAt || p.created_at })))
    await safeUpsert('reviews', (payload.reviews || []).map((r) => ({ id: r.id, product_id: r.product || r.product_id, store_id: r.store || r.store_id, user_id: r.user || r.user_id, rating: r.rating, text: r.text, created_at: r.at || r.created_at })))
    await safeUpsert('orders', (payload.orders || []).map((o) => ({ id: o.id, user_id: o.user || o.user_id, items: o.items, total: o.total, status: o.status, timeline: o.timeline, eta: o.eta, address: o.address, store_ids: o.storeIds || o.store_ids, created_at: o.createdAt || o.created_at })))
    await safeUpsert('follows', (payload.follows || []).map((f) => ({ id: f.id, user_id: f.user || f.user_id, store_id: f.store || f.store_id, created_at: f.createdAt || f.created_at })))
    await safeUpsert('threads', (payload.threads || []).map((t) => ({ id: t.id, product_id: t.product || t.product_id, store_id: t.store || t.store_id, customer_id: t.customer || t.customer_id, messages: t.messages, read: t.read ?? false, read_by_owner: t.readByOwner ?? false, read_by_customer: t.readByCustomer ?? false, updated_at: t.updatedAt || t.updated_at })))
    await safeUpsert('cart_items', (payload.cart || []).map((item) => ({ id: item.key || item.id, user_id: payload.user_id, product_id: item.product, store_id: item.store, title: item.title, image: item.image, qty: item.qty, options: item.options, unit_price: item.unitPrice, updated_at: new Date().toISOString() })))
    await safeUpsert('saved_products', (payload.likes || []).map((like) => ({ id: like.id, user_id: like.user, product_id: like.product, created_at: like.createdAt || like.created_at })))
    await safeUpsert('warehouse_items', (payload.warehouse || []).map((item) => ({ id: item.id, owner_id: item.owner || item.owner_id, name: item.name, sku: item.sku, qty: item.qty ?? item.quantity ?? 0, cost: item.cost || 0, location: item.location, image_url: item.image || item.image_url, updated_at: item.updatedAt || item.updated_at })))
    return json(res, 200, { ok: true })
  } catch (error) {
    console.error('Data API request failed:', error.message)
    return json(res, 500, { error: 'Request could not be completed' })
  }
}

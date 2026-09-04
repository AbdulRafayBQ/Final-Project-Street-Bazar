/* Street Bazar — Admin panel */

import { icon, esc, money, num, timeAgo, toast, confirmBox, modal, closeModal } from '../ui.js'
import { statCard } from '../components.js'
import { state, currentUser, setRole, storeById, storeProducts, productById, userById, updateStore, updateProduct, notify, liveStores, pendingStores, lowStock } from '../store.js'
import { isAIConnected, isConnected } from '../db.js'
import { navigate } from '../router.js'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'requests', label: 'Store requests', icon: 'bell' },
  { id: 'stores', label: 'Stores', icon: 'store' },
  { id: 'products', label: 'Products', icon: 'box' },
  { id: 'users', label: 'Users', icon: 'user' },
  { id: 'orders', label: 'Orders', icon: 'truck' },
  { id: 'ai', label: 'AI activity', icon: 'sparkles' },
]

export async function adminPage(params, query) {
  const u = currentUser()
  if (!u || u.role !== 'admin') {
    return `<section class="sec"><div class="wrap"><div class="panel" style="max-width:520px;margin:0 auto;text-align:center">
      <span style="width:70px;height:70px;border-radius:22px;background:rgba(229,72,77,.12);color:var(--red);display:grid;place-items:center;margin:0 auto 16px">${icon('shield', '', 30)}</span>
      <h2 class="h3">Admin area restricted</h2>
      <p class="muted small" style="margin-top:10px">Sirf authorized admin account is jagah par ja sakta hai.</p>
      <div class="wrap-flex" style="justify-content:center;margin-top:20px">
        <a class="btn btn-grad" href="#/auth">${icon('shield', '', 16)} <span>Admin sign in</span></a>
      </div>
    </div></div></section>`
  }

  const tab = query.tab || 'overview'
  const pending = pendingStores()

  return `
  <div class="wrap" style="padding-top:28px">
    <div class="row-between" style="flex-wrap:wrap;gap:14px">
      <div>
        <span class="kicker">Admin panel</span>
        <h1 class="h1" style="margin-top:12px">Bazaar ka <span class="grad-text">control room</span></h1>
      </div>
      <div class="wrap-flex">
        ${pending.length ? `<a class="btn btn-grad" href="#/admin?tab=requests">${icon('bell', '', 16)} <span>${pending.length} pending requests</span></a>` : ''}
        <a class="btn btn-ghost" href="#/">${icon('globe', '', 16)} View site</a>
      </div>
    </div>

    <div class="admin-shell" style="margin-top:26px">
      <aside class="admin-side">
        ${TABS.map((t) => `<button class="${t.id === tab ? 'active' : ''}" data-at="${t.id}">${icon(t.icon, '', 16)} ${t.label}${t.id === 'requests' && pending.length ? `<span class="cnt">${pending.length}</span>` : ''}</button>`).join('')}
        <div class="divider"></div>
        <a class="btn btn-ghost btn-sm" href="#/settings" style="width:100%">${icon('settings', '', 15)} Settings</a>
      </aside>
      <div data-admin-body>${views[tab] ? views[tab](pending) : views.overview(pending)}</div>
    </div>
  </div>`
}

const views = {
  overview: () => {
    const users = state.users.length
    const live = liveStores().length
    const products = state.products.length
    const orders = state.orders.length
    const revenue = state.orders.reduce((a, o) => a + o.total, 0)
    const low = lowStock()
    return `
      <div class="grid grid-4">
        ${statCard({ n: users, label: 'Total users', icon: 'user', color: 'rgba(122,92,255,.14)' })}
        ${statCard({ n: live, label: 'Live stores', icon: 'store', color: 'rgba(255,138,30,.16)' })}
        ${statCard({ n: products, label: 'Products', icon: 'box', color: 'rgba(15,167,155,.14)' })}
        ${statCard({ n: Math.round(revenue / 1000), label: "GMV ('000 Rs)", icon: 'coins', color: 'rgba(255,46,110,.14)' })}
      </div>
      <div class="grid grid-2" style="margin-top:22px;align-items:start">
        <div class="panel">
          <h3 class="h4">Recent activity</h3>
          <div class="stack" style="margin-top:14px">
            ${[
              ...state.stores.slice(0, 3).map((s) => ({ t: `${s.name} store ${s.status === 'live' ? 'went live' : s.status}`, at: s.createdAt, ic: 'store' })),
              ...state.orders.slice(0, 3).map((o) => ({ t: `Order ${o.id} · ${money(o.total)}`, at: o.createdAt, ic: 'truck' })),
              ...state.aiLog.slice(0, 3).map((l) => ({ t: `AI ${l.kind} · ${(l.label || '').slice(0, 30)}`, at: l.at, ic: 'sparkles' })),
            ].sort((a, b) => b.at - a.at).slice(0, 8).map((x) => `<div class="row" style="align-items:flex-start">
              <span style="width:34px;height:34px;border-radius:11px;background:var(--paper-2);display:grid;place-items:center;flex:none">${icon(x.ic, '', 15)}</span>
              <div><b class="small">${esc(x.t)}</b><div class="tiny muted">${timeAgo(x.at)}</div></div>
            </div>`).join('')}
          </div>
        </div>
        <div class="stack">
          <div class="panel">
            <div class="row-between"><h3 class="h4">System status</h3><span class="badge badge-live">Operational</span></div>
            <div class="stack small" style="margin-top:12px">
              <div class="row-between"><span class="muted">Database</span><b>${isConnected() ? 'Supabase connected' : 'Unavailable'}</b></div>
              <div class="row-between"><span class="muted">AI engine</span><b>${isAIConnected() ? 'Live API' : 'Bazar Brain'}</b></div>
              <div class="row-between"><span class="muted">AI runs logged</span><b>${num(state.aiLog.length)}</b></div>
              <div class="row-between"><span class="muted">Last sync</span><b>${state.settings.lastSync ? timeAgo(state.settings.lastSync) : '—'}</b></div>
            </div>
          </div>
          ${low.length ? `<div class="panel" style="border-color:rgba(229,72,77,.35)">
            <div class="row-between"><h3 class="h4" style="color:var(--red)">Low stock watch</h3><span class="badge badge-rejected">${low.length}</span></div>
            <div class="stack tiny" style="margin-top:10px">${low.slice(0, 5).map((p) => `<div class="row-between"><span>${esc(p.title)}</span><b class="low">${p.stock}</b></div>`).join('')}</div>
          </div>` : ''}
        </div>
      </div>`
  },

  requests: (pending) => `
    <h3 class="h3">Store requests</h3>
    <p class="muted small" style="margin:8px 0 20px">Naye stores yahan review ke liye aate hain. Approve karte hi wo live ho jata hai aur owner ko notification chala jata hai.</p>
    ${pending.length ? `<div class="grid grid-2">
      ${pending.map((s) => `
        <div class="card" style="padding:0">
          <div style="height:84px"><img src="${esc(s.banner || './images/banner-fashion.png')}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.src='./images/banner-fashion.png'"></div>
          <div style="padding:16px">
            <div class="row-between"><b class="h4">${esc(s.name)}</b><span class="badge badge-pending">pending</span></div>
            <p class="tiny muted" style="margin-top:6px">${esc(s.tagline || '')}</p>
            <div class="row" style="gap:10px;margin-top:10px;flex-wrap:wrap">
              <span class="tiny muted">Owner: ${esc(userById(s.owner)?.name || '—')}</span>
              <span class="tiny muted">· ${esc(s.type)} · ${esc(s.city || '—')}</span>
              <span class="tiny muted">· ${(s.categories || []).join(', ') || 'no categories'}</span>
            </div>
            <div class="wrap-flex" style="margin-top:14px">
              <a class="btn btn-sm btn-ghost" href="#/store/${s.slug}">${icon('eye', '', 14)} Preview</a>
              <button class="btn btn-sm btn-teal" data-approve="${s.id}">${icon('check', '', 14)} Approve</button>
              <button class="btn btn-sm btn-danger" data-reject="${s.id}">${icon('x', '', 14)} Reject</button>
            </div>
          </div>
        </div>`).join('')}
    </div>` : `<div class="empty"><div class="ic">${icon('check', '', 28)}</div><h3 class="h3">Sab requests clear hain 🎉</h3><p class="muted">Koi naya store request aate hi yahan dikhega.</p></div>`}
  `,

  stores: () => `
    <h3 class="h3">All stores</h3>
    <p class="muted small" style="margin:8px 0 18px">${state.stores.length} stores — live, pending aur rejected.</p>
    <div class="table-wrap"><table>
      <thead><tr><th>Store</th><th>Owner</th><th>Type</th><th>Products</th><th>Followers</th><th>Status</th><th></th></tr></thead>
      <tbody>${state.stores.map((s) => `
        <tr>
          <td><a href="#/store/${s.slug}"><b>${esc(s.name)}</b></a><div class="tiny muted">${esc(s.city || '')}</div></td>
          <td class="muted">${esc(userById(s.owner)?.name || '—')}</td>
          <td class="muted">${esc(s.type)}</td>
          <td>${storeProducts(s.id).length}</td>
          <td>${num(s.followers)}</td>
          <td><span class="badge ${s.status === 'live' ? 'badge-live' : s.status === 'pending' ? 'badge-pending' : 'badge-rejected'}">${s.status}</span></td>
          <td><div class="row" style="gap:6px">
            <button class="btn btn-sm btn-ghost" data-toggle-store="${s.id}">${s.status === 'live' ? 'Unpublish' : 'Publish'}</button>
            <button class="btn btn-sm btn-danger" data-del-store="${s.id}">Delete</button>
          </div></td>
        </tr>`).join('')}</tbody>
    </table></div>`,

  products: () => `
    <h3 class="h3">All products</h3>
    <p class="muted small" style="margin:8px 0 18px">${state.products.length} listings across ${liveStores().length} live stores.</p>
    <div class="table-wrap"><table>
      <thead><tr><th>Product</th><th>Store</th><th>Price</th><th>Stock</th><th>Sales</th><th>Rating</th><th></th></tr></thead>
      <tbody>${state.products.map((p) => `
        <tr>
          <td><div class="row"><img src="${esc(p.media[0].url)}" alt="" style="width:38px;height:38px;border-radius:11px;object-fit:cover"><div><a href="#/product/${p.id}"><b>${esc(p.title)}</b></a><div class="tiny muted">${esc((p.categories || []).join(', '))}</div></div></div></td>
          <td class="muted">${esc(storeById(p.store)?.name || '—')}</td>
          <td><b>${money(p.price)}</b></td>
          <td class="${p.stock <= 8 ? 'low' : ''}">${p.stock}</td>
          <td>${p.sales}</td>
          <td>${p.rating ? '★ ' + Number(p.rating).toFixed(1) : '—'}</td>
          <td><button class="btn btn-sm btn-ghost" data-toggle-prod="${p.id}">${p.status === 'hidden' ? 'Show' : 'Hide'}</button></td>
        </tr>`).join('')}</tbody>
    </table></div>`,

  users: () => `
    <h3 class="h3">Users</h3>
    <p class="muted small" style="margin:8px 0 18px">Role badal kar kisi ko bhi owner ya admin bana sakte hain.</p>
    <div class="table-wrap"><table>
      <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
      <tbody>${state.users.map((x) => `
        <tr>
          <td><div class="row"><span class="avatar sm">${esc(x.name.slice(0, 2).toUpperCase())}</span><b>${esc(x.name)}</b></div></td>
          <td class="muted">${esc(x.email)}</td>
          <td><span class="badge ${x.role === 'admin' ? 'badge-violet' : x.role === 'owner' ? 'badge-teal' : 'badge-soft'}">${x.role}</span></td>
          <td class="muted tiny">${x.createdAt ? timeAgo(x.createdAt) : 'seed'}</td>
          <td><select class="select" data-role-of="${x.id}" style="padding:7px 32px 7px 12px;max-width:150px">
            ${['customer', 'owner', 'admin'].map((r) => `<option ${x.role === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select></td>
        </tr>`).join('')}</tbody>
    </table></div>`,

  orders: () => `
    <h3 class="h3">Platform orders</h3>
    <p class="muted small" style="margin:8px 0 18px">Har store ke orders, status ke sath.</p>
    ${state.orders.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Order</th><th>Customer</th><th>Stores</th><th>Items</th><th>Total</th><th>Status</th><th>Placed</th></tr></thead>
      <tbody>${state.orders.map((o) => `
        <tr>
          <td><a href="#/track/${o.id}"><b>${o.id}</b></a></td>
          <td class="muted">${esc(userById(o.user)?.name || '—')}</td>
          <td class="muted tiny">${(o.stores || []).map((sid) => esc(storeById(sid)?.name || '')).join(', ')}</td>
          <td>${o.items.reduce((a, i) => a + i.qty, 0)}</td>
          <td><b>${money(o.total)}</b></td>
          <td><span class="badge ${o.status === 4 ? 'badge-live' : 'badge-pending'}">${['Placed', 'Packed', 'Shipped', 'Out', 'Delivered'][o.status]}</span></td>
          <td class="muted tiny">${timeAgo(o.createdAt)}</td>
        </tr>`).join('')}</tbody>
    </table></div>` : '<div class="empty"><p class="muted">Abhi koi order nahi.</p></div>'}
  `,

  ai: () => {
    const byKind = state.aiLog.reduce((acc, l) => { acc[l.kind] = (acc[l.kind] || 0) + 1; return acc }, {})
    return `
    <h3 class="h3">AI activity</h3>
    <p class="muted small" style="margin:8px 0 18px">Kitni baar AI ne listing, stock aur chat handle ki.</p>
    <div class="grid grid-4">
      ${statCard({ n: state.aiLog.length, label: 'Total AI runs', icon: 'sparkles', color: 'rgba(122,92,255,.14)' })}
      ${statCard({ n: byKind['product-copy'] || 0, label: 'Copy generations', icon: 'wand', color: 'rgba(255,138,30,.16)' })}
      ${statCard({ n: byKind['stock-plan'] || 0, label: 'Stock imports', icon: 'box', color: 'rgba(15,167,155,.14)' })}
      ${statCard({ n: byKind['assistant'] || 0, label: 'Assistant chats', icon: 'chat', color: 'rgba(255,46,110,.14)' })}
    </div>
    <div class="panel" style="margin-top:22px;padding:0;overflow:hidden">
      <div style="padding:16px 18px" class="row-between"><b class="h4">Recent runs</b><span class="badge ${isAIConnected() ? 'badge-live' : 'badge-soft'}">${isAIConnected() ? 'Live API' : 'Bazar Brain'}</span></div>
      <div class="table-wrap" style="border:0;border-radius:0"><table>
        <thead><tr><th>Kind</th><th>Label</th><th>User</th><th>When</th></tr></thead>
        <tbody>${state.aiLog.slice(0, 20).map((l) => `<tr><td><span class="badge badge-violet">${esc(l.kind)}</span></td><td>${esc((l.label || '').slice(0, 48))}</td><td class="muted">${esc(userById(l.user)?.name || 'guest')}</td><td class="muted tiny">${timeAgo(l.at)}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>`
  },
}

adminPage.mount = (params, query, root) => {
  root.querySelector('[data-as-admin]')?.addEventListener('click', () => {
    import('../store.js').then(({ login }) => {
      try { login('admin@streetbazar.pk', 'admin1234'); toast('Admin mode on', 'ok'); navigate('#/admin') } catch (e) { toast(e.message, 'err') }
    })
  })

  root.querySelectorAll('[data-at]').forEach((b) => b.addEventListener('click', () => navigate('#/admin?tab=' + b.dataset.at)))

  root.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => {
    const s = storeById(b.dataset.approve)
    updateStore(s.id, { status: 'live' })
    notify(s.owner, 'Store approved! 🎉', 'Aapka store "' + s.name + '" ab live hai.', '#/store/' + s.slug)
    toast(s.name + ' approved — store live hai', 'ok')
    navigate('#/admin?tab=requests')
  }))

  root.querySelectorAll('[data-reject]').forEach((b) => b.addEventListener('click', () => {
    const s = storeById(b.dataset.reject)
    confirmBox('Reject ' + s.name + '?', 'Owner ko rejection ka notify chala jayega.', () => {
      updateStore(s.id, { status: 'rejected', rejectReason: 'Rejected by admin review' })
      notify(s.owner, 'Store request rejected', 'Reason: policy guideline mismatch.', '#/')
      toast('Request rejected')
      navigate('#/admin?tab=requests')
    }, 'Reject store')
  }))

  root.querySelectorAll('[data-toggle-store]').forEach((b) => b.addEventListener('click', () => {
    const s = storeById(b.dataset.toggleStore)
    updateStore(s.id, { status: s.status === 'live' ? 'pending' : 'live' })
    toast(s.name + ' is now ' + (s.status === 'live' ? 'pending' : 'live'))
    navigate('#/admin?tab=stores')
  }))

  root.querySelectorAll('[data-del-store]').forEach((b) => b.addEventListener('click', () => {
    const s = storeById(b.dataset.delStore)
    confirmBox('Delete ' + s.name + '?', 'Store aur uske products hata diye jayenge. Ye action wapas nahi hota.', () => {
      state.stores = state.stores.filter((x) => x.id !== s.id)
      state.products = state.products.filter((p) => p.store !== s.id)
      import('../store.js').then(({ save }) => save())
      toast('Store delete ho gaya')
      navigate('#/admin?tab=stores')
    }, 'Delete permanently')
  }))

  root.querySelectorAll('[data-toggle-prod]').forEach((b) => b.addEventListener('click', () => {
    const p = productById(b.dataset.toggleProd)
    updateProduct(p.id, { status: p.status === 'hidden' ? 'active' : 'hidden' })
    toast('Product ' + (p.status === 'hidden' ? 'visible' : 'hidden'))
    navigate('#/admin?tab=products')
  }))

  root.querySelectorAll('[data-role-of]').forEach((sel) => sel.addEventListener('change', () => {
    const x = userById(sel.dataset.roleOf)
    x.role = sel.value
    import('../store.js').then(({ save }) => save())
    toast(x.name + ' is now ' + sel.value)
  }))
}

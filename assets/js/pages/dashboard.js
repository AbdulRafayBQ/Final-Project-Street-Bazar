/* Street Bazar — Owner dashboard + Warehouse (inventory) */

import { icon, esc, money, num, toast, modal, closeModal, timeAgo, spinner, confirmBox, storeAvatar, avatar } from '../ui.js'
import { statCard, emptyLogin } from '../components.js'
import { state, myStores, storeById, storeProducts, storeOrders, storeRevenue, storeSales, currentUser, lowStock, productById, updateProduct, updateStore, deleteStore, advanceOrder, cancelOrder, addStock, storeThreads, threadById, markThreadRead, userById, save, ownerWarehouse, addWarehouseItem, updateWarehouseItem, deleteWarehouseItem } from '../store.js'
import { genStockPlan } from '../ai.js'
import { authRequest, syncThread, syncPull, syncNotification, syncOrder } from '../db.js'
import { navigate, renderRoute } from '../router.js'

export async function dashboardPage() {
  const u = currentUser()
  if (!u) return `<section class="sec"><div class="wrap">${emptyLogin('Owner dashboard ke liye login karein.')}</div></section>`
  const stores = myStores()
  if (!stores.length) return `<section class="sec"><div class="wrap"><div class="empty reveal"><div class="ic">${icon('store', '', 30)}</div><h3 class="h3">Aapka pehla store abhi bana hi nahi</h3><p class="muted">5 minute main store bana lein — theme, fonts, logo sab set karke.</p><div style="margin-top:18px"><a class="btn btn-grad" href="#/create-store">${icon('plus', '', 16)} <span>Create store</span></a></div></div></div></section>`

  const totalProducts = stores.reduce((a, s) => a + storeProducts(s.id).length, 0)
  const revenue = stores.reduce((a, s) => a + storeRevenue(s.id), 0)
  const sales = stores.reduce((a, s) => a + storeSales(s.id), 0)
  const orders = stores.flatMap((s) => storeOrders(s.id))
  const threads = stores.flatMap((s) => storeThreads(s.id))
  const pending = stores.filter((s) => s.status === 'pending').length

  return `
  <div class="wrap" style="padding-top:28px">
    <div class="row-between" style="flex-wrap:wrap;gap:14px">
      <div>
        <span class="kicker">Owner dashboard</span>
        <h1 class="h1" style="margin-top:12px">Welcome back, ${esc(u.name.split(' ')[0])}! <span class="grad-text">Here is your business overview</span></h1>
      </div>
      <div class="wrap-flex">
        <a class="btn btn-grad" href="#/add-product/${stores[0].id}">${icon('plus', '', 16)} <span>Add product</span></a>
        <a class="btn btn-ghost" href="#/create-store">${icon('store', '', 16)} New store</a>
      </div>
    </div>

    ${pending ? `<div class="pill-note" style="margin-top:16px;background:rgba(245,179,1.0,#14);border-color:rgba(245,179,1,.5)">${icon('clock', '', 14)} ${pending} store request admin review par hai. Tab tak aap products add kar sakte hain.</div>` : ''}

    <div class="grid grid-4" style="margin-top:24px">
      ${statCard({ n: stores.length, label: 'Your stores', icon: 'store', color: 'rgba(255,138,30,.16)' })}
      ${statCard({ n: totalProducts, label: 'Products listed', icon: 'box', color: 'rgba(122,92,255,.14)' })}
      ${statCard({ n: sales, label: 'Total units sold', icon: 'trend', color: 'rgba(31,169,113,.14)' })}
      ${statCard({ n: Math.round(revenue / 1000), label: "Revenue ('000 Rs)", icon: 'coins', color: 'rgba(255,46,110,.14)' })}
    </div>

    <div class="panel" style="margin-top:26px;padding:0;overflow:hidden">
      <div class="store-tabs" style="position:static" data-tabs>
        <button class="active" data-tab="stores">${icon('store', '', 15)} My stores</button>
        <button data-tab="products">${icon('box', '', 15)} Products</button>
        <button data-tab="orders">${icon('truck', '', 15)} Orders (${num(orders.length)})</button>
        <button data-tab="store-chats">${icon('store', '', 15)} Store chats</button>
        <button data-tab="product-chats">${icon('chat', '', 15)} Product chats ${threads.filter((t) => t.product && !t.read).length ? `<span class="badge badge-sale" style="margin-left:6px">${threads.filter((t) => t.product && !t.read).length}</span>` : ''}</button>
        <button data-tab="warehouse">${icon('layers', '', 15)} Warehouse</button>
      </div>

      <div style="padding:clamp(16px,3vw,24px)">
        <div data-panel="stores">
          <div class="grid grid-2">
            ${stores.map((s) => {
              const ps = storeProducts(s.id)
              return `<div class="card reveal" style="padding:0">
                <div style="height:96px;position:relative"><img src="${esc(s.banner || './images/banner-fashion.png')}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.src='./images/banner-fashion.png'"></div>
                <div style="padding:16px">
                  <div class="row"><span class="avatar sm" style="background:${esc(s.theme?.primary || '#16110D')}">${esc(s.name.slice(0, 2).toUpperCase())}</span><div><b>${esc(s.name)}</b><div class="tiny muted">${esc(s.tagline || 'Store')}</div></div></div>
                  <div class="divider" style="margin:12px 0"></div>
                  <div class="row-between tiny muted"><span>${num(ps.length)} products · ${num(storeOrders(s.id).length)} orders</span><b>${money(storeRevenue(s.id))}</b></div>
                  <div class="row" style="margin-top:12px;gap:8px">
                    <a class="btn btn-sm btn-ghost" href="#/store/${s.slug}">${icon('eye', '', 13)} Visit</a>
                    <a class="btn btn-sm btn-ghost" href="#/add-product/${s.id}">${icon('plus', '', 13)} Add product</a>
                    <a class="btn btn-sm btn-ghost" href="#/edit-store/${s.id}">${icon('edit', '', 13)} Settings</a>
                    <button class="btn btn-sm btn-soft" data-sale="${s.id}">${icon('tag', '', 13)} Sale ad</button>
                    <button class="btn btn-sm btn-danger" data-delete-store="${s.id}">Delete store</button>
                  </div>
                </div>
              </div>`
            }).join('')}
          </div>
        </div>

        <div data-panel="products" hidden>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Store</th><th>Price</th><th>Stock</th><th>Sales</th><th>Status</th><th></th></tr></thead>
              <tbody>
                ${stores.flatMap((s) => storeProducts(s.id).map((p) => `
                  <tr>
                    <td><div class="row"><img src="${esc(p.media[0].url)}" alt="" style="width:40px;height:40px;border-radius:11px;object-fit:cover"><b>${esc(p.title)}</b></div></td>
                    <td class="muted">${esc(s.name)}</td>
                    <td><b>${money(p.price)}</b></td>
                    <td>${p.stock <= 8 ? `<b class="low">${num(p.stock)}</b>` : num(p.stock)}</td>
                    <td>${num(p.sales)}</td>
                    <td><span class="badge ${p.status === 'active' ? 'badge-live' : 'badge-soft'}">${p.status}</span></td>
                    <td><div class="row" style="gap:6px">
                      <a class="icon-btn" href="#/product/${p.id}" title="View">${icon('eye', '', 15)}</a>
                      <a class="icon-btn" href="#/edit-product/${p.id}" title="Edit">${icon('edit', '', 15)}</a>
                      <button class="icon-btn" data-toggle-hide="${p.id}" title="Hide / show">${icon(p.status === 'hidden' ? 'eye' : 'trash', '', 15)}</button>
                    </div></td>
                  </tr>`)).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div data-panel="orders" hidden>
          ${orders.length ? `<div class="table-wrap"><table>
            <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Placed</th><th></th></tr></thead>
            <tbody>${orders.map((o) => `
              <tr>
                <td><a href="#/track/${o.id}"><b>${o.id}</b></a></td>
                <td>${esc(userById(o.user)?.name || 'Customer')}</td>
                <td><div class="row" style="gap:6px">${o.items.map((i) => `<img src="${esc(i.customizedImage || i.image)}" alt="" title="${esc(i.title)}${i.customizedImage ? ' · AI customized' : ''}" style="width:34px;height:34px;border-radius:8px;object-fit:cover">`).join('')}<span>${num(o.items.reduce((a, i) => a + i.qty, 0))}</span></div></td>
                <td><b>${money(o.total)}</b></td>
                <td><span class="badge ${o.status === 4 ? 'badge-live' : o.status === 5 ? 'badge-rejected' : 'badge-pending'}">${o.status === 5 ? 'Cancelled' : ['Placed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'][o.status]}</span></td>
                <td class="muted tiny">${timeAgo(o.createdAt)}</td>
                <td><button class="btn btn-sm btn-ghost" data-advance="${o.id}" ${o.status >= 4 ? 'disabled' : ''}>Advance ${icon('arrow', '', 13)}</button> ${o.status < 2 ? `<button class="btn btn-sm btn-danger" data-cancel-order="${o.id}">Cancel</button>` : ''}</td>
              </tr>`).join('')}</tbody>
          </table></div>` : `<div class="empty"><p class="muted">Abhi koi order nahi. Customers order karte hi yahan dikhega.</p></div>`}
        </div>

        ${ownerChatPanel(threads.filter((thread) => !thread.product), 'store-chats', 'Store conversations', 'Customers ke general store questions yahan manage karein.')}
        ${ownerChatPanel(threads.filter((thread) => thread.product), 'product-chats', 'Product conversations', 'Har product ke questions aur customer replies yahan milengi.')}

        <div data-panel="warehouse" hidden>${warehouseInner(stores[0].id)}</div>

      </div>
    </div>
  </div>`
}

function ownerChatPanel(threads, panel, title, subtitle) {
  const grouped = [...new Map(threads.map((thread) => [thread.customer, threads.filter((item) => item.customer === thread.customer)])).values()]
  const firstThread = grouped[0]?.[0]
  return `<div data-panel="${panel}" hidden><div class="row-between" style="margin-bottom:16px"><div><h3 class="h3">${title}</h3><p class="muted small">${subtitle}</p></div><span class="badge badge-soft">${grouped.length} customer${grouped.length === 1 ? '' : 's'}</span></div>
    ${grouped.length ? `<div class="messenger-shell">
      <aside class="messenger-sidebar"><h3 class="h4">Customers</h3>${grouped.map((contactThreads, idx) => {
        const customer = userById(contactThreads[0].customer)
        const last = contactThreads.flatMap((thread) => thread.messages).sort((a, b) => b.at - a.at)[0]
        const hasUnread = contactThreads.some((t) => !t.readByOwner && !t.read)
        return `<button class="message-contact ${idx === 0 ? 'active' : ''}" data-owner-thread="${contactThreads[0].id}" data-panel-type="${panel}">
          ${avatar(customer || { name: 'Customer' }, 'sm')}
          <span class="preview">
            <b class="row-between"><span>${esc(customer?.name || 'Customer')}</span>${hasUnread ? '<span class="dot" style="background:var(--magenta);width:8px;height:8px;border-radius:50%"></span>' : ''}</b>
            <span class="tiny muted">${esc(last?.text || 'New conversation')}</span>
          </span>
          <span class="tiny muted">${timeAgo(last?.at || Date.now())}</span>
        </button>`
      }).join('')}</aside>
      <main class="messenger-main" data-owner-chat-main="${panel}">
        <div class="empty" style="margin:auto"><p class="muted">Loading conversation…</p></div>
      </main>
    </div>` : `<div class="empty"><p class="muted">Abhi koi ${panel === 'store-chats' ? 'store' : 'product'} chat nahi.</p></div>`}
  </div>`
}

dashboardPage.mount = (params, query, root) => {
  let threadSignature = JSON.stringify(state.threads.map((thread) => `${thread.id}:${thread.messages?.length || 0}:${thread.messages?.at(-1)?.at || 0}`).sort())
  const refreshInbox = async () => {
    try {
      await syncPull()
      const next = JSON.stringify(state.threads.map((thread) => `${thread.id}:${thread.messages?.length || 0}:${thread.messages?.at(-1)?.at || 0}`).sort())
      if (next !== threadSignature) {
        threadSignature = next
        await renderRoute()
      }
    } catch (error) {
      console.error('Owner inbox refresh failed:', error)
    }
  }
  refreshInbox()
  root._dashboardRefreshTimer = setInterval(refreshInbox, 5000)

  const tabs = root.querySelectorAll('[data-tabs] button')
  tabs.forEach((b) => b.addEventListener('click', () => {
    tabs.forEach((x) => x.classList.toggle('active', x === b))
    root.querySelectorAll('[data-panel]').forEach((pnl) => { pnl.hidden = pnl.dataset.panel !== b.dataset.tab })
    if (b.dataset.tab === 'warehouse') bindWarehouse(root, root.querySelector('[data-panel="warehouse"]'), myStores()[0].id)
    if (b.dataset.tab === 'store-chats') initOwnerMessenger(root, 'store-chats')
    if (b.dataset.tab === 'product-chats') initOwnerMessenger(root, 'product-chats')
  }))

  root.querySelectorAll('[data-toggle-hide]').forEach((b) => b.addEventListener('click', () => {
    const prod = productById(b.dataset.toggleHide)
    if (!prod) return
    const next = prod.status === 'hidden' ? 'active' : 'hidden'
    updateProduct(prod.id, { status: next })
    toast(next === 'hidden' ? 'Product hide ho gaya' : 'Product show ho raha hai')
    navigate('#/dashboard')
  }))

  root.querySelectorAll('[data-advance]').forEach((b) => b.addEventListener('click', async (e) => {
    const btn = spinner(e.currentTarget)
    try {
      const id = b.dataset.advance
      advanceOrder(id)
      const order = state.orders.find((o) => o.id === id)
      if (order) await syncOrder(order).catch((err) => console.warn('Order sync note:', err))
      toast('Order status update ho gaya', 'ok')
      navigate('#/dashboard')
    } catch (err) {
      toast(err.message || 'Status update nahi ho saka', 'err')
    } finally {
      btn()
    }
  }))

  root.querySelectorAll('[data-cancel-order]').forEach((b) => b.addEventListener('click', () => {
    modal({
      title: 'Cancel order',
      body: '<textarea class="textarea" id="cancel-reason" placeholder="Customer ko reason batayein"></textarea>',
      foot: '<button class="btn btn-ghost" data-close>Back</button><button class="btn btn-danger" id="cancel-go">Cancel order</button>',
      onOpen: (el) => el.querySelector('#cancel-go').addEventListener('click', async (e) => {
        const reason = el.querySelector('#cancel-reason').value.trim()
        if (!reason) return toast('Reason likhna zaroori hai', 'err')
        const cancelBtn = spinner(e.currentTarget)
        try {
          const order = cancelOrder(b.dataset.cancelOrder, reason)
          if (order) await syncOrder(order).catch((err) => console.warn('Order sync note:', err))
          closeModal()
          toast('Customer ko cancellation notification bhej di', 'ok')
          navigate('#/dashboard')
        } catch (err) {
          toast(err.message || 'Cancel failed', 'err')
        } finally {
          cancelBtn()
        }
      })
    })
  }))

  root.querySelectorAll('[data-sale]').forEach((b) => b.addEventListener('click', () => openSaleEditor(b.dataset.sale)))
  root.querySelectorAll('[data-delete-store]').forEach((b) => b.addEventListener('click', () => {
    const store = storeById(b.dataset.deleteStore)
    const user = currentUser()
    modal({
      title: `Delete ${store?.name || 'store'}?`,
      body: '<p class="small muted">Permanent delete hai. Confirm karne ke liye apna account password enter karein.</p><input class="input" id="delete-store-password" type="password" placeholder="Account password" style="margin-top:12px">',
      foot: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-danger" id="delete-store-confirm">Delete permanently</button>',
      onOpen: (el) => el.querySelector('#delete-store-confirm').addEventListener('click', async () => {
        const password = el.querySelector('#delete-store-password').value
        if (!password) return toast('Password zaroori hai', 'err')
        const button = spinner(el.querySelector('#delete-store-confirm'))
        try {
          if (user?.pass) {
            if (user.pass !== password) throw new Error('Password match nahi karta')
          } else {
            await authRequest('login', { email: user.email, password })
          }
          deleteStore(store.id)
          button(); closeModal(); toast('Store permanently delete ho gaya', 'ok'); navigate('#/dashboard')
        } catch (error) {
          button(); toast(error.message || 'Password verify nahi ho saka', 'err')
        }
      }),
    })
  }))

  bindWarehouse(root, root.querySelector('[data-panel="warehouse"]'), myStores()[0].id)
  initOwnerMessenger(root, 'store-chats')
  initOwnerMessenger(root, 'product-chats')
}

function initOwnerMessenger(root, panelName) {
  const panel = root.querySelector(`[data-panel="${panelName}"]`)
  if (!panel) return
  const main = panel.querySelector(`[data-owner-chat-main="${panelName}"]`)
  if (!main) return

  const openThread = (threadId) => {
    const th = threadById(threadId)
    if (!th) return
    state.notifications.filter((notification) => notification.to === currentUser()?.id && notification.link === '#/dashboard').forEach((notification) => { notification.read = true })
    localStorage.setItem('street-bazar-v1', JSON.stringify(state))
    window.dispatchEvent(new Event('street-bazar:notifications-changed'))

    const store = storeById(th.store)
    const product = productById(th.product)
    th.readByOwner = true
    th.read = true
    syncThread(th).catch((error) => console.error('Owner read receipt sync failed:', error))
    markThreadRead(threadId)

    panel.querySelectorAll('[data-owner-thread]').forEach((btn) => btn.classList.toggle('active', btn.dataset.ownerThread === threadId))
    const customer = userById(th.customer)
    const who = customer?.name || 'Customer'

    main.innerHTML = `<div class="chatbox" style="height:460px;display:flex;flex-direction:column">
      <div class="chat-head" style="padding:12px 16px;border-bottom:1px solid var(--line)">
        ${avatar(customer || { name: who }, 'sm')}
        <div style="flex:1">
          <b class="small">${esc(who)}</b>
          <div class="sub">${product ? `<a href="#/product/${product.id}" target="_blank" style="color:var(--magenta)">${esc(product.title)}</a>` : esc(store?.name || 'Store Chat')}</div>
        </div>
        ${product ? `<span class="badge badge-soft">${money(product.price)}</span>` : ''}
      </div>
      <div class="chat-body" data-owner-body style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px">
        ${th.messages.map((m) => {
          const mine = m.from === currentUser()?.id
          const ai = m.from === 'ai'
          return `<div class="msg ${mine ? 'me' : ai ? 'ai' : 'them'}">
            <div class="who">${mine ? 'You' : ai ? 'Bazar AI' : esc(who)}</div>
            ${esc(m.text)}
            <div class="time">${timeAgo(m.at)}</div>
          </div>`
        }).join('')}
      </div>
      <div class="chat-foot" style="padding:12px 14px;border-top:1px solid var(--line);display:flex;gap:10px">
        <input class="input" data-owner-in placeholder="Type reply for ${esc(who)}…" style="flex:1">
        <button class="btn btn-primary" data-owner-send>${icon('send', '', 15)} <span>Send</span></button>
      </div>
    </div>`

    const body = main.querySelector('[data-owner-body]')
    const input = main.querySelector('[data-owner-in]')
    const sendBtn = main.querySelector('[data-owner-send]')
    if (body) body.scrollTop = body.scrollHeight

    const send = () => {
      const v = input.value.trim()
      if (!v) return
      input.value = ''
      th.messages.push({ from: currentUser().id, text: v, at: Date.now() })
      th.read = true
      th.readByCustomer = false
      save()
      syncThread(th).catch((error) => console.error('Owner reply sync failed:', error))
      const notification = { id: 'n-' + Date.now(), to: th.customer, title: 'New reply from ' + (storeById(th.store)?.name || 'store'), body: v.slice(0, 80), at: Date.now(), read: false, link: '#/messages', storeId: th.store, threadId: th.id }
      state.notifications.unshift(notification)
      syncNotification(notification).catch((error) => console.error('Reply notification sync failed:', error))

      const div = document.createElement('div')
      div.className = 'msg me'
      div.innerHTML = `<div class="who">You</div>${esc(v)}<div class="time">Just now</div>`
      body.appendChild(div)
      body.scrollTop = body.scrollHeight
    }

    sendBtn?.addEventListener('click', send)
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') send() })
  }

  panel.querySelectorAll('[data-owner-thread]').forEach((btn) => {
    btn.addEventListener('click', () => openThread(btn.dataset.ownerThread))
  })

  const firstBtn = panel.querySelector('[data-owner-thread]')
  if (firstBtn) openThread(firstBtn.dataset.ownerThread)
}
}

function openSaleEditor(storeId) {
  const s = storeById(storeId)
  modal({
    title: 'Sale ad · ' + esc(s.name),
    body: `
      <div class="stack">
        <div class="field"><span class="label">Sale text</span><input class="input" id="sale-text" value="${esc(s.sale?.text || '')}" placeholder="e.g. Eid Sale — 30% OFF"></div>
        <div class="field"><span class="label">Ends on</span><input class="input" type="date" id="sale-until" value="${s.sale?.until ? new Date(s.sale.until).toISOString().slice(0, 10) : ''}"></div>
        <p class="tiny muted">Sale on rakhne par aapka ad homepage aur customers ki For You feed mein dikhega.</p>
        ${s.sale ? `<button class="btn btn-danger btn-sm" id="sale-off">Turn sale off</button>` : ''}
      </div>`,
    foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="sale-save"><span>Save sale</span></button>`,
    onOpen: (el) => {
      el.querySelector('#sale-save').addEventListener('click', () => {
        const text = el.querySelector('#sale-text').value.trim()
        const until = el.querySelector('#sale-until').value
        updateStore(storeId, { sale: text ? { text, until: until ? new Date(until).getTime() : Date.now() + 7 * 86400000 } : null })
        closeModal(); toast('Sale update ho gaya', 'ok'); navigate('#/dashboard')
      })
      el.querySelector('#sale-off')?.addEventListener('click', () => {
        updateStore(storeId, { sale: null })
        closeModal(); toast('Sale band kar di gayi'); navigate('#/dashboard')
      })
    },
  })
}

/* ---------------- warehouse ---------------- */
export async function warehousePage(params) {
  const u = currentUser()
  if (!u) return `<section class="sec"><div class="wrap">${emptyLogin('Warehouse dekhne ke liye login karein.')}</div></section>`
  const stores = myStores()
  if (!stores.length) return `<section class="sec"><div class="wrap"><div class="empty"><h3 class="h3">Pehle store banayein</h3><div style="margin-top:16px"><a class="btn btn-grad" href="#/create-store"><span>Create store</span></a></div></div></div></section>`
  const sid = params.storeId && storeById(params.storeId) ? params.storeId : stores[0].id

  return `
  <div class="wrap" style="padding-top:28px">
    <span class="kicker">Warehouse</span>
    <h1 class="h1" style="margin-top:12px">Stock <span class="grad-text">control room</span></h1>
    <p class="lead" style="margin-top:10px">Inventory update karein, low stock alerts dekhein — ya poora stock AI se bulk add karwayein.</p>
    <div class="row" style="margin-top:20px;gap:10px;flex-wrap:wrap">
      <select class="select" data-store-select style="max-width:280px">
        ${stores.map((s) => `<option value="${s.id}" ${s.id === sid ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
      </select>
      <a class="btn btn-ghost" href="#/add-product/${sid}">${icon('plus', '', 15)} Add new product</a>
    </div>
    <div style="margin-top:22px" data-warehouse></div>
  </div>`
}

warehousePage.mount = (params, query, root) => {
  let sid = params.storeId && storeById(params.storeId) ? params.storeId : myStores()[0].id
  const holder = root.querySelector('[data-warehouse]')
  const paint = () => { holder.innerHTML = warehouseInner(sid); bindWarehouse(root, holder, sid) }
  root.querySelector('[data-store-select]')?.addEventListener('change', (e) => { sid = e.target.value; paint() })
  paint()
}

function warehouseInner(sid) {
  const s = storeById(sid)
  const products = storeProducts(sid)
  const warehouseItems = ownerWarehouse().filter((item) => item.store === sid || item.product && productById(item.product)?.store === sid || !item.store && !item.product && sid === myStores()[0]?.id)
  const storeItems = warehouseItems.filter((item) => item.product || item.inventory === 'store')
  const privateItems = warehouseItems.filter((item) => !item.product && item.inventory !== 'store')
  const low = products.filter((p) => p.stock <= 8)
  const value = products.reduce((a, p) => a + p.stock * p.price, 0)
  const units = products.reduce((a, p) => a + p.stock, 0)

  return `
  <div class="grid grid-4" style="margin-bottom:22px">
    ${statCard({ n: units, label: 'Units in stock', icon: 'box', color: 'rgba(255,138,30,.16)' })}
    ${statCard({ n: Math.round(value / 1000), label: "Stock value ('000 Rs)", icon: 'coins', color: 'rgba(31,169,113,.14)' })}
    ${statCard({ n: low.length, label: 'Low stock alerts', icon: 'warning', color: 'rgba(229,72,77,.14)' })}
    ${statCard({ n: products.reduce((a, p) => a + p.sales, 0), label: 'Units sold', icon: 'trend', color: 'rgba(122,92,255,.14)' })}
  </div>

  <div class="grid wh-grid" style="grid-template-columns:1.4fr .6fr;gap:22px;align-items:start">
    <div class="panel" style="padding:0;overflow:hidden">
      <div class="row-between" style="padding:16px 18px"><h3 class="h4">Inventory · ${esc(s?.name || '')}</h3><span class="badge badge-soft">${products.length} SKUs</span></div>
      <div>
        ${products.length ? products.map((p) => `
          <div class="wh-row">
            <div class="row"><img src="${esc(p.media[0].url)}" alt="" style="width:44px;height:44px;border-radius:12px;object-fit:cover">
              <div style="flex:1"><b class="small">${esc(p.title)}</b>
                <div class="tiny muted">${esc(p.sku || 'No SKU')} · ${money(p.price)}</div>
                <div class="stock-bar"><i style="width:${Math.min(100, (p.stock / 120) * 100)}%;background:${p.stock <= 8 ? 'var(--red)' : 'var(--grad-teal)'}"></i></div>
              </div>
            </div>
            <div class="${p.stock <= 8 ? 'low' : ''}">${num(p.stock)} pcs</div>
            <div class="tiny muted">${num(p.sales)} sold</div>
            <div class="wrap-flex" style="gap:6px">
            <button class="btn btn-sm btn-ghost" data-restock="${p.id}:-10">-10</button>
            <button class="btn btn-sm btn-ghost" data-restock="${p.id}:10">+10</button>
              <button class="btn btn-sm btn-ghost" data-restock="${p.id}:25">+25</button>
            </div>
            <button class="btn btn-sm btn-ghost" data-restock-custom="${p.id}">${icon('edit', '', 14)} Set</button>
          </div>`).join('') : `<div class="empty" style="margin:18px"><p class="muted">Warehouse khaali hai — pehla product add karein.</p></div>`}
      </div>
    </div>

    <div class="panel">
      <div class="row"><span class="ai-orb">${icon('sparkles', '', 20)}</span><div><b class="h4">Warehouse AI assistant</b><div class="tiny muted">Natural language mein stock manage karein</div></div></div>
      <div class="chat-body" id="warehouse-ai-chat" style="margin-top:14px;max-height:220px;overflow:auto;padding:0">
        <div class="msg them"><div class="who">Bazar AI</div>Assalam-o-alaikum! Bata dein kya add karna hai, jaise: <b>100 watches add karo</b>.</div>
      </div>
      <div class="row" style="margin-top:12px;gap:8px">
        <input class="input" id="bulk-in" placeholder="100 watches add karo">
        <button class="btn btn-grad" id="bulk-run" title="Send">${icon('send', '', 15)}</button>
      </div>
      <div id="bulk-out" style="margin-top:12px"></div>
      ${low.length ? `<div class="divider"></div>
        <b class="small" style="color:var(--red)">${icon('warning', '', 14)} Low stock alerts</b>
        <div class="stack" style="margin-top:10px">
          ${low.map((p) => `<div class="row-between tiny"><span>${esc(p.title)}</span><b class="low">${p.stock} left</b></div>`).join('')}
        </div>` : ''}
    </div>
    <div class="panel" style="grid-column:1/-1">
      <div class="row-between"><div><h3 class="h4">Store inventory</h3><div class="tiny muted">Private item ko pehle yahan move karein; phir yahin se product publish karein.</div></div></div>
      <div class="table-wrap warehouse-table" style="margin-top:12px"><table><thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th>Status</th><th></th></tr></thead><tbody>
        ${storeItems.length ? storeItems.map((item) => `<tr><td><div class="row"><img src="${esc(item.image || './images/p-kurta.png')}" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:9px"><b>${esc(item.name)}</b></div></td><td>${esc(item.sku || '—')}</td><td><b>${num(item.qty)}</b></td><td>${item.product ? '<span class="badge badge-soft">Published</span>' : '<span class="badge badge-soft">Ready to publish</span>'}</td><td>${item.product ? '' : `<a class="btn btn-sm btn-ghost" href="#/add-product?warehouseId=${encodeURIComponent(item.id)}">Publish product</a>`} <button class="btn btn-sm btn-ghost" data-warehouse-edit="${item.id}">Edit</button> <button class="btn btn-sm btn-danger" data-warehouse-delete="${item.id}">${icon('trash', '', 13)}</button></td></tr>`).join('') : '<tr><td colspan="5" class="muted">Store inventory empty hai.</td></tr>'}
      </tbody></table></div>
    </div>
    <div class="panel" style="grid-column:1/-1">
      <div class="row-between"><div><h3 class="h4">Private warehouse stock</h3><div class="tiny muted">Ye inventory store par publish nahi hoti — pehle Store inventory mein move karein.</div></div><button class="btn btn-sm btn-ghost" data-warehouse-add>${icon('plus', '', 14)} Add item</button></div>
      <div class="table-wrap warehouse-table" style="margin-top:12px"><table><thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th>Location</th><th></th></tr></thead><tbody>
        ${privateItems.length ? privateItems.map((item) => `<tr><td><div class="row"><img src="${esc(item.image || './images/p-kurta.png')}" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:9px"><b>${esc(item.name)}</b></div></td><td>${esc(item.sku || '—')}</td><td><b>${num(item.qty)}</b></td><td>${esc(item.location || '—')}</td><td><button class="btn btn-sm btn-ghost" data-warehouse-store="${item.id}">Move to Store inventory</button> <button class="btn btn-sm btn-ghost" data-warehouse-edit="${item.id}">Edit</button> <button class="btn btn-sm btn-danger" data-warehouse-delete="${item.id}">${icon('trash', '', 13)}</button></td></tr>`).join('') : '<tr><td colspan="5" class="muted">Private warehouse empty hai.</td></tr>'}
      </tbody></table></div>
    </div>
  </div>`
}

function bindWarehouse(pageRoot, holder, sid) {
  if (!holder) return
  holder.querySelector('[data-warehouse-add]')?.addEventListener('click', () => {
    modal({
      title: 'Add private warehouse item',
      body: '<div class="stack"><input class="input" id="wh-name" placeholder="Item name"><input class="input" id="wh-qty" type="number" min="0" placeholder="Quantity"><label class="label">Product image <b style="color:var(--red)">(required)</b></label><input class="input" id="wh-image" type="file" accept="image/*"><div class="tiny muted">A product image is required before this warehouse item can be saved.</div><input class="input" id="wh-sku" placeholder="SKU (optional)"><input class="input" id="wh-location" placeholder="Location (optional)"></div>',
      foot: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="wh-save">Save</button>',
      onOpen: (el) => el.querySelector('#wh-save').addEventListener('click', () => {
        const name = el.querySelector('#wh-name').value.trim()
        if (!name) return toast('Item name is required.', 'err')
        const file = el.querySelector('#wh-image').files?.[0]
        if (!file) return toast('Product image is required.', 'err')
        const reader = new FileReader()
        reader.onload = () => {
          addWarehouseItem({ owner: currentUser().id, store: sid, name, qty: el.querySelector('#wh-qty').value, image: String(reader.result || ''), sku: el.querySelector('#wh-sku').value.trim(), location: el.querySelector('#wh-location').value.trim() })
          closeModal(); refreshWarehouse(pageRoot, holder, sid)
        }
        reader.readAsDataURL(file)
      }),
    })
  })
  holder.querySelectorAll('[data-warehouse-edit]').forEach((button) => button.addEventListener('click', () => {
    const item = ownerWarehouse().find((entry) => entry.id === button.dataset.warehouseEdit)
    if (!item) return
    modal({
      title: 'Update warehouse quantity',
      body: `<div class="field"><span class="label">${esc(item.name)}</span><input class="input" id="wh-qty" type="number" min="0" value="${item.qty}"></div>`,
      foot: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="wh-save">Update</button>',
      onOpen: (el) => el.querySelector('#wh-save').addEventListener('click', () => { updateWarehouseItem(item.id, { qty: el.querySelector('#wh-qty').value }); closeModal(); refreshWarehouse(pageRoot, holder, sid) }),
    })
  }))
  holder.querySelectorAll('[data-warehouse-store]').forEach((button) => button.addEventListener('click', () => {
    updateWarehouseItem(button.dataset.warehouseStore, { inventory: 'store' })
    toast('Item Store inventory mein move ho gaya', 'ok')
    refreshWarehouse(pageRoot, holder, sid)
  }))
  holder.querySelectorAll('[data-warehouse-delete]').forEach((button) => button.addEventListener('click', () => {
    deleteWarehouseItem(button.dataset.warehouseDelete)
    toast('Warehouse item delete ho gaya', 'ok')
    refreshWarehouse(pageRoot, holder, sid)
  }))
  holder.querySelectorAll('[data-restock]').forEach((b) => b.addEventListener('click', () => {
    const [pid, qty] = b.dataset.restock.split(':')
    addStock(pid, qty)
    toast('Stock + ' + qty, 'ok')
    refreshWarehouse(pageRoot, holder, sid)
  }))
  holder.querySelectorAll('[data-restock-custom]').forEach((b) => b.addEventListener('click', () => {
    const pid = b.dataset.restockCustom
    modal({
      title: 'Set stock',
      body: `<div class="field"><span class="label">New stock quantity</span><input class="input" type="number" id="set-stock" min="0"></div>`,
      foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="set-go"><span>Update</span></button>`,
      onOpen: (el) => el.querySelector('#set-go').addEventListener('click', () => {
        const v = Number(el.querySelector('#set-stock').value)
        if (isNaN(v)) return
        updateProduct(pid, { stock: v })
        closeModal(); toast('Stock updated', 'ok')
        refreshWarehouse(pageRoot, holder, sid)
      }),
    })
  }))

  holder.querySelector('#bulk-run')?.addEventListener('click', async (e) => {
    const raw = holder.querySelector('#bulk-in')?.value.trim()
    if (!raw) return toast('Pehle stock list paste karein', 'err')
    const button = spinner(e.currentTarget)
    const output = holder.querySelector('#bulk-out')
    const chat = holder.querySelector('#warehouse-ai-chat')
    const input = holder.querySelector('#bulk-in')
    chat.insertAdjacentHTML('beforeend', `<div class="msg me"><div class="who">You</div>${esc(raw)}</div>`)
    input.value = ''
    chat.scrollTop = chat.scrollHeight
    try {
      output.innerHTML = '<div class="ai-out"><span class="lbl">AI samajh raha hai...</span></div>'
      const result = await genStockPlan({ rough: raw, storeName: storeById(sid)?.name || 'Store' })
      output.innerHTML = `<div class="ai-out"><span class="lbl">AI ne ${result.rows.length} item samjhe</span>${result.rows.map((row) => `${esc(row.name)} × ${num(row.qty)}`).join('<br>')}<br><br><b>Private inventory ya Store inventory?</b>
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn btn-sm btn-ghost" data-bulk-destination="private">Private inventory</button><button class="btn btn-sm btn-primary" data-bulk-destination="store">Store inventory</button></div></div>`
      output.querySelectorAll('[data-bulk-destination]').forEach((destination) => destination.addEventListener('click', () => {
        const inventory = destination.dataset.bulkDestination
        result.rows.forEach((row) => {
          const requested = row.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
          const existing = storeProducts(sid).find((product) => {
            const title = product.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
            return title === requested || title.includes(requested) || requested.includes(title)
          })
          if (existing && inventory === 'store') addStock(existing.id, row.qty)
          else addWarehouseItem({ owner: currentUser().id, store: sid, name: row.name, qty: row.qty, cost: row.price, sku: row.sku, image: row.image, inventory })
        })
        chat.insertAdjacentHTML('beforeend', `<div class="msg them"><div class="who">Bazar AI</div>${result.rows.length} item ${inventory === 'store' ? 'Store' : 'Private'} inventory mein add ho gaye.</div>`)
        output.innerHTML = ''
        toast(`${result.rows.length} entries update ho gayi`, 'ok')
        refreshWarehouse(pageRoot, holder, sid)
      }))
    } catch (error) {
      output.innerHTML = ''
      toast('AI parsing failed: ' + error.message, 'err')
    } finally {
      button()
    }
  })

}

function refreshWarehouse(pageRoot, holder, sid) {
  holder.innerHTML = warehouseInner(sid)
  bindWarehouse(pageRoot, holder, sid)
}

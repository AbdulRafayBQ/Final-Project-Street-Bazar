/* Street Bazar — My orders & order tracking */

import { icon, esc, money, num, timeAgo, toast, copyText } from '../ui.js'
import { orderTimeline } from '../components.js'
import { myOrders, orderById, currentUser, userById, storeById, advanceOrder, ORDER_STEPS, myStores } from '../store.js'
import { navigate } from '../router.js'

export async function ordersPage() {
  const u = currentUser()
  if (!u) return `<section class="sec"><div class="wrap"><div class="empty reveal"><div class="ic">${icon('truck', '', 30)}</div><h3 class="h3">Login required</h3><p class="muted">Apne orders dekhne ke liye login karein.</p><div style="margin-top:18px"><a class="btn btn-grad" href="#/auth"><span>Login</span></a></div></div></div></section>`
  const orders = myOrders()
  return `
  <div class="wrap" style="padding-top:28px">
    <span class="kicker">My orders</span>
    <h1 class="h1" style="margin-top:12px">Aapke <span class="grad-text">orders</span></h1>
    <p class="lead" style="margin-top:10px">Har order ki ID se live status, courier note aur expected delivery.</p>
    <div class="stack" style="margin-top:26px">
      ${orders.length ? orders.map((o) => `
        <div class="panel reveal" style="padding:18px 22px">
          <div class="row-between" style="flex-wrap:wrap;gap:12px">
            <div class="row">
              <span style="width:44px;height:44px;border-radius:14px;background:var(--grad-soft);display:grid;place-items:center;color:var(--magenta)">${icon('box', '', 20)}</span>
              <div><b class="small" style="letter-spacing:.05em">${o.id}</b>
              <div class="tiny muted">${dateSafe(o.createdAt)} · ${o.items.length} item${o.items.length > 1 ? 's' : ''} · ${money(o.total)}</div></div>
            </div>
            <div class="row" style="gap:10px">
              <span class="badge ${o.status === 4 ? 'badge-live' : o.status === 5 ? 'badge-rejected' : 'badge-pending'}">${o.status === 5 ? 'Cancelled' : ORDER_STEPS[o.status]}</span>
              <a class="btn btn-sm btn-ghost" href="#/track/${o.id}">${icon('truck', '', 14)} Track</a>
            </div>
          </div>
          <div class="progress" style="margin-top:14px"><i style="width:${(o.status / 4) * 100}%"></i></div>
          <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">
            ${o.items.map((i) => `<img src="${esc(i.image)}" alt="" title="${esc(i.title)}" style="width:46px;height:46px;border-radius:13px;object-fit:cover">`).join('')}
            ${o.etaDays ? `<span class="tiny muted" style="margin-left:8px">Expected in ${o.etaDays} day${o.etaDays > 1 ? 's' : ''}</span>` : '<span class="tiny muted" style="margin-left:8px">Delivered</span>'}
          </div>
        </div>`).join('') : `<div class="empty"><div class="ic">${icon('cart', '', 28)}</div><h3 class="h3">Abhi koi order nahi</h3><p class="muted">Jaise hi order karein, yahan track hota rahega.</p><div style="margin-top:16px"><a class="btn btn-grad" href="#/explore"><span>Start shopping</span></a></div></div>`}
    </div>
  </div>`
}

export async function trackPage(params, query) {
  const id = params.id || query.id || ''
  const o = id ? orderById(id) : null
  const u = currentUser()
  const ownerStores = u ? myStores().map((s) => s.id) : []

  const searchBox = `
    <div class="panel" style="max-width:560px;margin:0 auto">
      <div class="row-between"><b class="h4">${icon('qr', '', 18)} Track by Order ID</b></div>
      <p class="small muted" style="margin:8px 0 14px">Order ID e.g. <b>SB-4F2K9X</b> — order confirm hone par mili thi.</p>
      <div class="row" style="gap:9px">
        <input class="input" id="track-in" value="${esc(id)}" placeholder="SB-XXXXXX" style="letter-spacing:.08em;font-weight:700;text-transform:uppercase">
        <button class="btn btn-primary" id="track-go"><span>Track</span></button>
      </div>
    </div>`

  if (!o) {
    return `
    <div class="wrap" style="padding-top:34px;text-align:center">
      <span class="kicker">Order tracking</span>
      <h1 class="h1" style="margin-top:12px">Order <span class="grad-text">kahan pohncha?</span></h1>
      <p class="lead" style="margin:12px auto 26px">Order ID daliye — live status, courier note aur expected delivery turant.</p>
      ${searchBox}
      ${u && myOrders().length ? `<div style="margin-top:34px;max-width:760px;margin-inline:auto;text-align:left">
        <b class="h4">Recent orders</b>
        <div class="wrap-flex" style="margin-top:12px">${myOrders().slice(0, 5).map((x) => `<a class="chip" href="#/track/${x.id}">${x.id} · ${ORDER_STEPS[x.status]}</a>`).join('')}</div>
      </div>` : ''}
    </div>`
  }

  const isOwner = ownerStores.some((sid) => o.stores?.includes(sid))
  const eta = o.status === 4 ? 'Delivered' : `Arriving in ~${o.etaDays} day${o.etaDays === 1 ? '' : 's'}`
  return `
  <div class="wrap" style="padding-top:30px">
    <div class="row-between" style="flex-wrap:wrap;gap:14px">
      <div>
        <span class="kicker">Live tracking</span>
        <h1 class="h1" style="margin-top:12px">Order <span class="grad-text">${o.id}</span></h1>
      </div>
      <a class="btn btn-ghost" href="#/track">${icon('search', '', 15)} Another ID</a>
    </div>

    <div style="display:grid;grid-template-columns:1.2fr .8fr;gap:26px;align-items:start;margin-top:26px" class="cs-grid">
      <div class="panel">
        <div class="row-between" style="flex-wrap:wrap;gap:12px">
          <div>
            <div class="small muted">Current status</div>
            <div class="h3" style="margin-top:4px">${ORDER_STEPS[o.status]}</div>
          </div>
          <div style="text-align:right">
            <div class="small muted">Estimated</div>
            <div class="h4" style="margin-top:4px">${eta}</div>
          </div>
        </div>
        <div class="progress" style="margin:18px 0 26px"><i style="width:${(o.status / 4) * 100}%"></i></div>
        ${orderTimeline(o)}
        ${o.status === 5 ? `<div class="divider"></div><p class="small" style="color:var(--red)"><b>Cancelled:</b> ${esc(o.cancelReason || '')}</p>` : ''}
        ${isOwner && o.status < 2 ? `<div class="divider"></div><div class="row-between"><span class="small muted">Store owner: status update karein</span><button class="btn btn-sm btn-primary" data-owner-advance="${o.id}"><span>Advance status</span> ${icon('arrow', '', 13)}</button></div>` : ''}
      </div>

      <div class="stack">
        <div class="panel">
          <div class="row-between"><b class="h4">Items</b><span class="badge badge-soft">${money(o.total)}</span></div>
          <div style="margin-top:12px">
            ${o.items.map((i) => `<div class="row" style="gap:10px;padding:8px 0;border-bottom:1px dashed var(--line)">
              <img src="${esc(i.image)}" alt="" style="width:50px;height:50px;border-radius:13px;object-fit:cover">
              <div style="flex:1"><a href="#/product/${i.product}"><b class="small">${esc(i.title)}</b></a>
              <div class="tiny muted">${Object.entries(i.options || {}).map(([k, v]) => k + ': ' + esc(v)).join(' · ') || 'Standard'}</div></div>
              <b class="small">×${i.qty}</b>
            </div>`).join('')}
          </div>
          <button class="btn btn-ghost btn-block btn-sm" style="margin-top:12px" data-copy-id="${o.id}">${icon('copy', '', 14)} Copy order ID</button>
        </div>
        <div class="panel">
          <b class="h4">Delivery address</b>
          <p class="small" style="margin-top:10px;line-height:1.8"><b>${esc(o.address.name)}</b><br>${esc(o.address.line)}${o.address.city ? '<br>' + esc(o.address.city) : ''}<br>${esc(o.address.phone || '')}</p>
          <div class="divider"></div>
          <b class="h4">Courier note</b>
          <p class="small muted" style="margin-top:8px">${esc(o.timeline.at(-1)?.note || 'Processing')}</p>
        </div>
      </div>
    </div>
  </div>`
}

trackPage.mount = (params, query, root) => {
  const go = () => {
    const v = root.querySelector('#track-in')?.value.trim().toUpperCase()
    if (!v) return toast('Order ID likhein', 'err')
    navigate('#/track/' + v)
  }
  root.querySelector('#track-go')?.addEventListener('click', go)
  root.querySelector('#track-in')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') go() })
  root.querySelector('[data-copy-id]')?.addEventListener('click', (e) => copyText(e.currentTarget.dataset.copyId, 'Order ID'))
  root.querySelector('[data-owner-advance]')?.addEventListener('click', (e) => {
    advanceOrder(e.currentTarget.dataset.ownerAdvance)
    toast('Status update ho gaya', 'ok')
    navigate('#/track/' + e.currentTarget.dataset.ownerAdvance)
  })
}

const dateSafe = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

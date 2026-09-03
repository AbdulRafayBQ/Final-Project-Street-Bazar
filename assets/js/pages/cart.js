/* Street Bazar — Cart & checkout */

import { icon, esc, money, num, toast, spinner } from '../ui.js'
import { state, setCart, cartTotal, cartCount, productById, storeById, currentUser, placeOrder, addToCart } from '../store.js'
import { navigate, renderRoute } from '../router.js'

const DELIVERY = 250
const FREE_OVER = 5000

export async function cartPage() {
  const items = state.cart
  if (!items.length) {
    return `<section class="sec"><div class="wrap">
      <div class="empty reveal"><div class="ic">${icon('cart', '', 30)}</div><h3 class="h3">Aapka cart abhi khaali hai</h3>
      <p class="muted">Bazaar ghumein, kuch pasand karein — cart mein daal kar order karein.</p>
      <div style="margin-top:18px"><a class="btn btn-grad" href="#/explore"><span>Explore products</span> ${icon('arrow', '', 15)}</a></div></div>
    </div></section>`
  }

  const subtotal = cartTotal()
  const delivery = subtotal >= FREE_OVER ? 0 : DELIVERY
  const total = subtotal + delivery
  const u = currentUser()
  const byStore = items.reduce((acc, i) => { (acc[i.store] = acc[i.store] || []).push(i); return acc }, {})

  return `
  <div class="wrap" style="padding-top:28px">
    <span class="kicker">Your cart</span>
    <h1 class="h1" style="margin-top:12px">Cart mein <span class="grad-text">${num(cartCount())} items</span></h1>

    <div style="display:grid;grid-template-columns:1.35fr .65fr;gap:26px;align-items:start;margin-top:26px" class="cs-grid">
      <div class="stack">
        ${Object.entries(byStore).map(([sid, list]) => {
          const s = storeById(sid)
          return `<div class="panel" style="padding:8px 20px 16px">
            <div class="row" style="padding:12px 0"><span class="avatar sm" style="background:${esc(s?.theme?.primary || '#16110D')}">${esc((s?.name || 'S').slice(0, 2).toUpperCase())}</span><b class="small">${esc(s?.name || 'Store')}</b><span class="badge badge-soft" style="margin-left:auto">${list.length} item${list.length > 1 ? 's' : ''}</span></div>
            ${list.map((i) => `<div class="cart-line">
              <img src="${esc(i.image || './images/p-kurta.png')}" alt="" onerror="this.src='./images/p-kurta.png'">
              <div>
                <a href="#/product/${i.product}"><b class="small">${esc(i.title)}</b></a>
                ${Object.keys(i.options || {}).length ? `<div class="tiny muted" style="margin-top:4px">${Object.entries(i.options).map(([k, v]) => k + ': ' + esc(v)).join(' · ')}</div>` : ''}
                <div class="tiny muted" style="margin-top:4px">${money(i.unitPrice)} each ${i.unitPrice < (productById(i.product)?.price || 0) ? '· wholesale rate applied 🎉' : ''}</div>
                <div class="row" style="margin-top:8px;gap:8px">
                  <div class="qty" data-line="${esc(i.key)}">
                    <button data-dec>-</button><span>${i.qty}</span><button data-inc>+</button>
                  </div>
                  <button class="btn btn-sm btn-danger" data-rm="${esc(i.key)}">${icon('trash', '', 13)} Remove</button>
                </div>
              </div>
              <b>${money(i.unitPrice * i.qty)}</b>
            </div>`).join('')}
          </div>`
        }).join('')}
      </div>

      <div class="panel" style="position:sticky;top:calc(var(--header-h) + 16px)">
        <h3 class="h4">Order summary</h3>
        <div style="margin-top:14px">
          <div class="sum-row"><span class="muted">Subtotal</span><b>${money(subtotal)}</b></div>
          <div class="sum-row"><span class="muted">Delivery</span><b>${delivery ? money(delivery) : 'FREE 🎉'}</b></div>
          <div class="sum-row total"><span>Total</span><span>${money(total)}</span></div>
        </div>
        ${subtotal < FREE_OVER ? `<div class="pill-note" style="margin-top:12px">${icon('truck', '', 14)} ${money(FREE_OVER - subtotal)} aur lein — delivery free ho jayegi.</div>` : ''}

        <div class="divider"></div>
        <h4 class="h4">Delivery details</h4>
        <div class="stack" style="margin-top:12px">
          <input class="input" id="c-name" placeholder="Full name" value="${esc(u?.name || '')}">
          <input class="input" id="c-phone" placeholder="Phone (03xx-xxxxxxx)">
          <input class="input" id="c-city" placeholder="City">
          <textarea class="textarea" id="c-address" placeholder="Full address — house, street, area" style="min-height:80px"></textarea>
          <select class="select" id="c-pay">
            <option>Cash on delivery</option>
            <option>JazzCash / EasyPaisa</option>
            <option>Bank transfer</option>
          </select>
        </div>
        <button class="btn btn-grad btn-lg btn-block" id="c-place" style="margin-top:16px">${icon('check', '', 17)} <span>Place order</span></button>
        <p class="tiny muted center" style="margin-top:10px">Order ke turant baad aapko <b>Order ID</b> milega — usse track kar sakte hain.</p>
        ${!u ? `<p class="tiny center" style="margin-top:8px;color:var(--red)">Note: order place karne se pehle <a href="#/auth" style="text-decoration:underline">login</a> karein.</p>` : ''}
      </div>
    </div>
  </div>`
}

cartPage.mount = (params, query, root) => {
  const repaint = () => { renderRoute() }

  root.querySelectorAll('[data-inc]').forEach((b) => b.addEventListener('click', () => {
    const key = b.closest('[data-line]').dataset.line
    const item = state.cart.find((i) => i.key === key)
    if (item) { item.qty++; setCart([...state.cart]); repaint() }
  }))
  root.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', () => {
    const key = b.closest('[data-line]').dataset.line
    const item = state.cart.find((i) => i.key === key)
    if (!item) return
    item.qty = Math.max(1, item.qty - 1)
    setCart([...state.cart]); repaint()
  }))
  root.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => {
    setCart(state.cart.filter((i) => i.key !== b.dataset.rm))
    toast('Item remove ho gaya')
    repaint()
  }))

  root.querySelector('#c-place')?.addEventListener('click', async (e) => {
    if (!currentUser()) { toast('Order ke liye login zaroori hai', 'err'); return navigate('#/auth') }
    const name = root.querySelector('#c-name').value.trim()
    const phone = root.querySelector('#c-phone').value.trim()
    const city = root.querySelector('#c-city').value.trim()
    const line = root.querySelector('#c-address').value.trim()
    if (!name || !phone || !line) return toast('Name, phone aur address bharein', 'err')
    const btn = spinner(e.currentTarget)
    await new Promise((r) => setTimeout(r, 800))
    const order = placeOrder({ address: { name, phone, city, line }, etaDays: 4 })
    btn()
    toast('Order place ho gaya! ID: ' + order.id, 'ok')
    navigate('#/order-success/' + order.id)
  })
}

export async function orderSuccessPage(params) {
  import('../store.js').then(() => {})
  const { orderById } = await import('../store.js')
  const o = orderById(params.id)
  if (!o) return `<section class="sec"><div class="wrap"><div class="empty"><h3 class="h3">Order nahi mila</h3></div></div></section>`
  return `
  <div class="wrap" style="padding-top:40px;text-align:center">
    <div style="width:84px;height:84px;border-radius:28px;background:var(--grad);display:grid;place-items:center;margin:0 auto 20px;color:#fff;box-shadow:var(--shadow-l);animation:orb 3s ease-in-out infinite">${icon('check', '', 38)}</div>
    <h1 class="h1">Order confirm ho gaya!</h1>
    <p class="lead" style="margin:12px auto 0">Shukriya — store ne order receive kar liya hai. Neeche di gayi <b>Order ID</b> se kabhi bhi status check karein.</p>
    <div class="order-id" style="margin-top:24px">${icon('qr', '', 22)} ${o.id}</div>
    <div class="wrap-flex" style="justify-content:center;margin-top:22px">
      <button class="btn btn-ghost" data-copy-id="${o.id}">${icon('copy', '', 15)} Copy ID</button>
      <a class="btn btn-grad" href="#/track/${o.id}">${icon('truck', '', 16)} <span>Track order</span></a>
      <a class="btn btn-ghost" href="#/explore">Continue shopping</a>
    </div>
    <div class="panel" style="margin-top:34px;text-align:left;max-width:620px;margin-inline:auto">
      <div class="row-between"><b class="h4">Estimated delivery</b><span class="badge badge-pending">${o.etaDays} working days</span></div>
      <p class="small muted" style="margin-top:8px">${esc(o.address.line)}${o.address.city ? ', ' + esc(o.address.city) : ''}</p>
      <div class="divider"></div>
      ${o.items.map((i) => `<div class="row" style="gap:10px;padding:6px 0"><img src="${esc(i.image)}" alt="" style="width:44px;height:44px;border-radius:12px;object-fit:cover"><div style="flex:1"><b class="small">${esc(i.title)}</b><div class="tiny muted">Qty ${i.qty}</div></div><b class="small">${money(i.price * i.qty)}</b></div>`).join('')}
      <div class="sum-row total"><span>Total</span><span>${money(o.total)}</span></div>
    </div>
  </div>`
}

orderSuccessPage.mount = (params, query, root) => {
  root.querySelector('[data-copy-id]')?.addEventListener('click', async () => {
    await navigator.clipboard?.writeText(root.querySelector('[data-copy-id]').dataset.copyId).catch(() => {})
    toast('Order ID copied')
  })
}

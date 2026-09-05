/* Street Bazar — app shell, routing & global interactions (vanilla JS) */

import { $, $$, icon, esc, num, toast, modal, closeModal, avatar, timeAgo } from './ui.js'
import { state, currentUser, cartCount, logout, myNotifications, unreadNotis, toggleLike, toggleFollow, productById, addToCart, save, unreadThreadCount, setRole } from './store.js'
import { route, setNotFound, startRouter, onRender, navigate, renderRoute } from './router.js'
import { authRequest, syncPull, syncPush } from './db.js'

import { home } from './pages/home.js'
import { explore, foryou } from './pages/explore.js'
import { storePage } from './pages/store.js'
import { productPage } from './pages/product.js'
import { createStorePage } from './pages/createStore.js'
import { addProductPage } from './pages/addProduct.js'
import { dashboardPage, warehousePage } from './pages/dashboard.js'
import { storesPage } from './pages/stores.js'
import { cartPage, orderSuccessPage } from './pages/cart.js'
import { ordersPage, trackPage } from './pages/orders.js'
import { authPage } from './pages/auth.js'
import { adminPage } from './pages/admin.js'
import { settingsPage } from './pages/settings.js'
import { termsPage } from './pages/terms.js'
import { assistantReply, aiStatusText } from './ai.js'

/* ---------------- header ---------------- */
function renderHeader() {
  const u = currentUser()
  const head = $('#site-header')
  head.className = 'site-header'
  head.innerHTML = `
    <div class="wrap hd">
      <a class="logo" href="#/" aria-label="Street Bazar home">
        <img src="./images/logo.png" alt="" style="height:48px;width:auto;object-fit:contain">
        <span class="logo-wordmark"><span>Street</span> <b>Bazar</b></span>
      </a>

      <nav class="nav" data-nav>
        <a href="#/" data-path="/">Home</a>
        <a href="#/explore" data-path="/explore">Explore</a>
        <a href="#/dukanien" data-path="/dukanien">Explore Dukanien</a>
        <a href="#/foryou" data-path="/foryou">For You</a>
        ${u && (u.role === 'owner' || u.role === 'admin') ? `<a href="#/dashboard" data-path="/dashboard">Dashboard</a>` : ''}
        ${u && u.role === 'admin' ? `<a href="#/admin" data-path="/admin">Admin</a>` : ''}
      </nav>

      <div class="hd-search">
        ${icon('search', '', 17)}
        <input class="input" id="global-search" placeholder="Search bazaar… (try \"kurta\")">
      </div>

      <div class="hd-actions">
        <button class="icon-btn desktop-only" id="btn-bell" title="Notifications">${icon('bell', '', 18)}${unreadNotis() ? '<span class="dot"></span>' : ''}</button>
        <a class="icon-btn" href="#/cart" title="Cart">${icon('cart', '', 18)}<span class="cart-count" data-cart-count style="display:${cartCount() ? 'grid' : 'none'}">${cartCount()}</span></a>
        ${u ? `
          <button id="btn-user" class="row" style="gap:8px;background:none;border:0;padding:0" title="Account">
            ${avatar(u)}
          </button>` : `
          <a class="btn btn-primary desktop-only" href="#/auth"><span>Sign in</span></a>
          <button class="icon-btn menu-btn" id="btn-menu" aria-label="Menu">${icon('menu', '', 18)}</button>`}
        ${u ? `<button class="icon-btn menu-btn" id="btn-menu" aria-label="Menu">${icon('menu', '', 18)}</button>` : ''}
      </div>
    </div>`

  // search
  const search = $('#global-search')
  search?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && search.value.trim()) navigate('#/explore?q=' + encodeURIComponent(search.value.trim()))
  })

  $('#btn-ai')?.addEventListener('click', () => import('./pages/home.js').then((m) => m.openAIScan()))

  $('#btn-bell')?.addEventListener('click', openNotifications)
  $('#btn-user')?.addEventListener('click', openUserMenu)
  $('#btn-menu')?.addEventListener('click', openMobileMenu)

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#btn-bell') && !e.target.closest('[data-noti-panel]')) $('[data-noti-panel]')?.remove()
    if (!e.target.closest('#btn-user') && !e.target.closest('[data-user-panel]')) $('[data-user-panel]')?.remove()
  }, { once: false })
}

function openNotifications() {
  const existing = $('[data-noti-panel]')
  existing?.remove()
  const u = currentUser()
  if (!u) return navigate('#/auth')
  const list = myNotifications()
  const wrap = document.createElement('div')
  wrap.className = 'dropdown'
  wrap.setAttribute('data-noti-panel', '')
  wrap.innerHTML = `
    <div class="row-between" style="padding:6px 10px"><h4>Notifications</h4>${list.some((n) => !n.read) ? `<button class="tiny" id="read-all" style="color:var(--magenta);font-weight:800">Mark all read</button>` : ''}</div>
    ${list.length ? list.slice(0, 8).map((n) => `
      <a class="dd-item" href="${n.link}" data-noti="${n.id}">
        <span class="ic">${icon(n.link.includes('track') ? 'truck' : n.link.includes('dashboard') ? 'store' : 'bell', '', 15)}</span>
        <div><b class="small">${esc(n.title)}</b><div class="tiny muted">${esc(n.body)}</div><div class="tiny muted" style="opacity:.7">${timeAgo(n.at)}</div></div>
      </a>`).join('') : '<p class="small muted" style="padding:14px">Abhi koi notification nahi.</p>'}`
  $('#btn-bell')?.parentElement.style.setProperty('position', 'relative')
  $('#btn-bell').insertAdjacentElement('afterend', wrap)
  wrap.style.top = '54px'
  wrap.querySelector('#read-all')?.addEventListener('click', () => {
    list.forEach((n) => { n.read = true })
    save(); wrap.remove(); renderHeader(); toast('Notifications cleared')
  })
  wrap.querySelectorAll('[data-noti]').forEach((a) => a.addEventListener('click', () => {
    const n = myNotifications().find((x) => x.id === a.dataset.noti)
    if (n) { n.read = true; save() }
    wrap.remove()
  }))
}

function openUserMenu() {
  const existing = $('[data-user-panel]')
  existing?.remove()
  const u = currentUser()
  if (!u) return navigate('#/auth')
  const wrap = document.createElement('div')
  wrap.className = 'dropdown'
  wrap.setAttribute('data-user-panel', '')
  wrap.style.width = '260px'
  wrap.innerHTML = `
    <div class="row" style="padding:10px;gap:11px">
      ${avatar(u)}
      <div><b class="small">${esc(u.name)}</b><div class="tiny muted">${esc(u.email)}</div><div class="badge badge-soft" style="margin-top:4px">${u.role}</div></div>
    </div>
    <div class="divider" style="margin:6px 0"></div>
    <a class="dd-item" href="#/orders"><span class="ic">${icon('truck', '', 15)}</span><div><b>My orders</b><div class="tiny muted">Track with Order ID</div></div></a>
    ${u.role !== 'customer' ? `<a class="dd-item" href="#/dashboard"><span class="ic">${icon('store', '', 15)}</span><div><b>Owner dashboard</b><div class="tiny muted">Stores, products, inbox</div></div></a>` : `<a class="dd-item" href="#/create-store"><span class="ic">${icon('plus', '', 15)}</span><div><b>Start selling</b><div class="tiny muted">Create your store</div></div></a>`}
    <a class="dd-item" href="#/foryou"><span class="ic">${icon('heart', '', 15)}</span><div><b>For You feed</b><div class="tiny muted">Naye drops from followed stores</div></div></a>
    ${u.role === 'admin' ? `<a class="dd-item" href="#/settings"><span class="ic">${icon('settings', '', 15)}</span><div><b>Settings</b><div class="tiny muted">AI, Supabase and server settings</div></div></a>` : ''}
    ${u.role === 'admin' ? `<a class="dd-item" href="#/admin"><span class="ic">${icon('shield', '', 15)}</span><div><b>Admin panel</b><div class="tiny muted">Requests, users, orders</div></div></a>` : ''}
    <div class="divider" style="margin:6px 0"></div>
    <button class="dd-item" id="do-logout" style="width:100%;color:var(--red)"><span class="ic">${icon('logout', '', 15)}</span><div><b>Log out</b></div></button>`
  $('#btn-user').insertAdjacentElement('afterend', wrap)
  wrap.style.top = '54px'
  wrap.querySelector('#do-logout').addEventListener('click', () => { logout(); toast('Logged out — phir aana!'); navigate('#/'); renderHeader() })
}

function openMobileMenu() {
  const u = currentUser()
  modal({
    title: 'Menu',
    body: `<div class="stack">
      ${[
        ['#/', 'Home', 'home'], ['#/explore', 'Explore bazaar', 'search'], ['#/dukanien', 'Explore Dukanien', 'store'], ['#/foryou', 'For You', 'heart'],
        ['#/cart', 'Cart (' + cartCount() + ')', 'cart'], ['#/orders', 'My orders & tracking', 'truck'],
        ...(u ? [['#/create-store', 'Create a store', 'store'], ['#/dashboard', 'Owner dashboard', 'layers']] : []),
        ...(u?.role === 'admin' ? [['#/settings', 'Settings', 'settings']] : []),
        ...(u?.role === 'admin' ? [['#/admin', 'Admin panel', 'shield']] : []),
        ...(!u ? [['#/auth', 'Sign in / Sign up', 'user']] : []),
      ].map(([href, label, ic]) => `<a class="dd-item" href="${href}" data-close style="align-items:center"><span class="ic">${icon(ic, '', 16)}</span><b>${label}</b></a>`).join('')}
    </div>`,
    foot: u ? `<button class="btn btn-ghost" id="m-logout">Log out</button>` : `<a class="btn btn-primary" href="#/auth" data-close><span>Continue</span></a>`,
    onOpen: (el) => {
      el.querySelector('#m-logout')?.addEventListener('click', () => { logout(); closeModal(); navigate('#/'); renderHeader(); toast('Logged out') })
      el.querySelectorAll('a[data-close]').forEach((a) => a.addEventListener('click', () => closeModal()))
    },
  })
}

/* ---------------- footer ---------------- */
function renderFooter() {
  const u = currentUser()
  $('#site-footer').className = 'footer'
  $('#site-footer').innerHTML = `
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <a class="logo" href="#/">
            <img src="./images/logo.png" alt="Street Bazar" style="height:42px;width:auto;object-fit:contain;background:#fff;padding:4px 12px;border-radius:10px">
          </a>
          <p style="margin-top:16px;font-size:13.5px;max-width:34ch">Ghar baithe store kholein, AI se likhwayein, wholesale bechein aur orders track karein — sab kuch apni language mein.</p>
          <div class="socials">
            <a href="#/explore" title="Explore">${icon('search', '', 16)}</a>
            <a href="#/dukanien" title="Explore Dukanien">${icon('store', '', 16)}</a>
            <a href="#/foryou" title="For You">${icon('heart', '', 16)}</a>
            <a href="#/create-store" title="Sell on Street Bazar">${icon('plus', '', 16)}</a>
          </div>
        </div>
        <div>
          <h4>Marketplace</h4>
          <a href="#/explore">Explore bazaar</a>
          <a href="#/dukanien">Explore Dukanien</a>
          <a href="#/foryou">For You feed</a>
          <a href="#/explore?cat=Fashion">Fashion</a>
          <a href="#/explore?cat=Electronics">Electronics</a>
          <a href="#/track">Track an order</a>
        </div>
        <div>
          <h4>For sellers</h4>
          <a href="#/create-store">Create a store</a>
          <a href="#/dashboard">Owner dashboard</a>
          <a href="#/warehouse">Warehouse</a>
          ${u?.role === 'admin' ? '<a href="#/settings">AI & database setup</a>' : ''}
        </div>
        <div>
          <h4>Company</h4>
          <a href="#/">Home</a>
          <a href="#/auth">Sign in / Sign up</a>
          <a href="#/admin">Admin panel</a>
          ${u?.role === 'admin' ? '<a href="#/settings">Settings</a>' : ''}
        </div>
      </div>
      <div class="footer-bot">
        <span>© ${new Date().getFullYear()} Street Bazar · Made with ❤ in Pakistan</span>
        <span>100% Real API ready · Built for modern e-commerce 🇵🇰</span>
      </div>
    </div>`
}

function renderMobileNav() {
  const u = currentUser()
  $('#mobile-nav').className = 'mobile-nav'
  $('#mobile-nav').innerHTML = `
    <ul>
      <li><a href="#/" data-path="/">${icon('home', '', 20)}<span>Home</span></a></li>
      <li><a href="#/explore" data-path="/explore">${icon('search', '', 20)}<span>Explore</span></a></li>
      <li><a href="#/dukanien" data-path="/dukanien">${icon('store', '', 20)}<span>Dukanien</span></a></li>
      <li><a href="#/foryou" data-path="/foryou">${icon('heart', '', 20)}<span>For You</span></a></li>
      <li><a href="#/cart" data-path="/cart">${icon('cart', '', 20)}<span>Cart</span><span class="cart-count" data-cart-count style="display:${cartCount() ? 'grid' : 'none'}">${cartCount()}</span></a></li>
      <li><a href="${u ? '#/dashboard' : '#/auth'}" data-path="${u ? '/dashboard' : '/auth'}">${icon(u ? 'layers' : 'user', '', 20)}<span>${u ? 'Seller' : 'Account'}</span></a></li>
    </ul>`
}

/* ---------------- customer floating AI assistant ---------------- */
function renderFloatingAIWidget() {
  if ($('#floating-ai-root')) return
  const wrap = document.createElement('div')
  wrap.id = 'floating-ai-root'
  wrap.innerHTML = `
    <button class="floating-ai-btn" id="floating-ai-toggle" aria-label="Open AI Assistant">
      ${icon('sparkles', '', 18)} <span>Bazar AI Assistant</span>
    </button>

    <div class="floating-ai-panel" id="floating-ai-panel" style="display:none">
      <div class="floating-ai-head">
        <div class="row" style="gap:9px">
          ${icon('sparkles', '', 18)}
          <div>
            <b class="small" style="color:#fff">Street Bazar AI</b>
            <div class="tiny" style="color:rgba(255,255,255,0.7);font-size:11px">${aiStatusText()}</div>
          </div>
        </div>
        <button class="icon-btn" id="floating-ai-close" style="width:28px;height:28px;background:rgba(255,255,255,0.1);border:0;color:#fff;border-radius:50%">
          ${icon('x', '', 14)}
        </button>
      </div>

      <div class="floating-ai-body" id="floating-ai-msgs">
        <div class="msg ai">
          <div class="who">Bazar AI</div>
          Salam! main Street Bazar ka assistant hoon. Aap products dhoondne, stores explorer karne, ya order status poochne ke liye mujh se sawal kar sakte hain!
          <div class="time">Just now</div>
        </div>
      </div>

      <div style="padding:8px 12px;background:#fff;border-top:1px solid var(--line);display:flex;gap:6px;overflow-x:auto" id="floating-ai-chips">
        <button class="chip tiny" data-q="Cheap products under Rs 2000">💰 Cheap products</button>
        <button class="chip tiny" data-q="Where is my order?">📦 Track order</button>
        <button class="chip tiny" data-q="Suggest top rated stores">🏪 Popular stores</button>
      </div>

      <div class="floating-ai-foot">
        <input class="input" id="floating-ai-input" placeholder="Poochhein (e.g. kurta, delivery time)..." style="font-size:13px;padding:9px 14px">
        <button class="btn btn-grad" id="floating-ai-send" style="padding:9px 14px">${icon('send', '', 15)}</button>
      </div>
    </div>`

  document.body.appendChild(wrap)

  const toggleBtn = $('#floating-ai-toggle')
  const panel = $('#floating-ai-panel')
  const closeBtn = $('#floating-ai-close')
  const sendBtn = $('#floating-ai-send')
  const input = $('#floating-ai-input')
  const msgs = $('#floating-ai-msgs')

  toggleBtn.addEventListener('click', () => {
    const isVis = panel.style.display !== 'none'
    panel.style.display = isVis ? 'none' : 'flex'
  })
  closeBtn.addEventListener('click', () => { panel.style.display = 'none' })

  const sendQuery = async (q) => {
    const text = q || input.value.trim()
    if (!text) return
    input.value = ''

    // user msg
    const uMsg = document.createElement('div')
    uMsg.className = 'msg me'
    uMsg.innerHTML = `<div class="who">You</div>${esc(text)}<div class="time">Just now</div>`
    msgs.appendChild(uMsg)
    msgs.scrollTop = msgs.scrollHeight

    // typing indicator
    const typing = document.createElement('div')
    typing.className = 'msg ai typing'
    typing.innerHTML = `<div class="who">Bazar AI</div><i></i><i></i><i></i>`
    msgs.appendChild(typing)
    msgs.scrollTop = msgs.scrollHeight

    try {
      const res = await assistantReply({ question: text })
      typing.remove()
      const aiMsg = document.createElement('div')
      aiMsg.className = 'msg ai'
      aiMsg.innerHTML = `<div class="who">Bazar AI ${res.source === 'live' ? '(Live Gemini)' : ''}</div>${esc(res.text)}<div class="time">Just now</div>`
      msgs.appendChild(aiMsg)
    } catch (e) {
      typing.remove()
      const errMsg = document.createElement('div')
      errMsg.className = 'msg ai'
      errMsg.innerHTML = `<div class="who">Bazar AI</div>System error while contacting AI. Try again.<div class="time">Just now</div>`
      msgs.appendChild(errMsg)
    }
    msgs.scrollTop = msgs.scrollHeight
  }

  sendBtn.addEventListener('click', () => sendQuery())
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendQuery() })
  $$('#floating-ai-chips button').forEach((b) => b.addEventListener('click', () => sendQuery(b.dataset.q)))
}

/* ---------------- global interactions ---------------- */
function bindGlobals() {
  document.addEventListener('click', (e) => {
    const like = e.target.closest('[data-like]')
    if (like) {
      if (!currentUser()) { toast('Like karne ke liye login karein', 'err'); return navigate('#/auth') }
      const on = toggleLike(like.dataset.like)
      like.classList.toggle('on', on)
      toast(on ? 'Saved to wishlist 💝' : 'Removed from wishlist')
      return
    }

    const follow = e.target.closest('[data-follow]')
    if (follow) {
      if (!currentUser()) { toast('Follow karne ke liye login karein', 'err'); return navigate('#/auth') }
      const on = toggleFollow(follow.dataset.follow)
      follow.classList.toggle('on', on)
      const label = follow.querySelector('span') || follow
      follow.innerHTML = on ? icon('check', '', 14) + ' Following' : icon('plus', '', 14) + ' <span>Follow</span>'
      follow.classList.toggle('btn-primary', on)
      follow.classList.toggle('btn-ghost', !on)
      toast(on ? 'Store follow ho gaya — naya product For You mein aayega 🎉' : 'Store unfollow ho gaya')
      return
    }

    const add = e.target.closest('[data-add]')
    if (add) {
      const p = productById(add.dataset.add)
      if (!p) return
      if (p.customizable?.on || p.wholesale?.on) {
        toast('Custom options ke liye product page khul raha hai…')
        navigate('#/product/' + p.id)
        return
      }
      addToCart({ product: p.id, qty: 1, options: {}, unitPrice: p.price })
      updateCartBadges()
      toast(p.title + ' cart mein add ho gaya', 'ok')
      return
    }
  })
}

function updateCartBadges() {
  $$('[data-cart-count]').forEach((el) => {
    el.textContent = cartCount()
    el.style.display = cartCount() ? 'grid' : 'none'
  })
}

/* ---------------- routes ---------------- */
route('/', home)
route('/explore', explore)
route('/dukanien', storesPage)
route('/stores', storesPage)
route('/foryou', foryou)
route('/store/:slug', storePage)
route('/product/:id', productPage)
route('/create-store', createStorePage)
route('/edit-store/:id', createStorePage)
route('/add-product', addProductPage)
route('/add-product/:storeId', addProductPage)
route('/edit-product/:pid', addProductPage)
route('/dashboard', dashboardPage)
route('/warehouse', warehousePage)
route('/warehouse/:storeId', warehousePage)
route('/cart', cartPage)
route('/order-success/:id', orderSuccessPage)
route('/orders', ordersPage)
route('/track', trackPage)
route('/track/:id', trackPage)
route('/auth', authPage)
route('/admin', adminPage)
route('/settings', settingsPage)
route('/terms', termsPage)

setNotFound(() => `<section class="sec"><div class="wrap"><div class="empty reveal">
  <div class="ic">${icon('search', '', 30)}</div>
  <h3 class="h3">Ye gali nahi mili (404)</h3>
  <p class="muted">Aap jis page par the wo exist nahi karta. Wapas bazaar mein chalein.</p>
  <div style="margin-top:18px"><a class="btn btn-grad" href="#/"><span>Go home</span> ${icon('arrow', '', 15)}</a></div>
</div></div></section>`)

onRender((current) => {
  renderHeader()
  renderMobileNav()
  updateCartBadges()
  const path = current.path
  $$('[data-path]').forEach((a) => {
    const p = a.dataset.path
    a.classList.toggle('active', p === '/' ? path === '/' : path.startsWith(p))
  })
  document.title = titleFor(path)
})

function titleFor(path) {
  if (path.startsWith('/store/')) return 'Store · Street Bazar'
  if (path.startsWith('/product/')) return 'Product · Street Bazar'
  if (path.startsWith('/explore')) return 'Explore the bazaar · Street Bazar'
  if (path.startsWith('/dukanien') || path.startsWith('/stores')) return 'Explore Dukanien · Street Bazar'
  if (path.startsWith('/foryou')) return 'For You · Street Bazar'
  if (path.startsWith('/cart')) return 'Cart · Street Bazar'
  if (path.startsWith('/track') || path.startsWith('/orders')) return 'Track order · Street Bazar'
  if (path.startsWith('/create-store') || path.startsWith('/edit-store')) return 'Create your store · Street Bazar'
  if (path.startsWith('/add-product') || path.startsWith('/edit-product')) return 'Add product · Street Bazar'
  if (path.startsWith('/dashboard')) return 'Owner dashboard · Street Bazar'
  if (path.startsWith('/warehouse')) return 'Warehouse · Street Bazar'
  if (path.startsWith('/admin')) return 'Admin panel · Street Bazar'
  if (path.startsWith('/auth')) return 'Sign in · Street Bazar'
  if (path.startsWith('/settings')) return 'Settings · Street Bazar'
  return 'Street Bazar — Apna Store Banao, AI Se Badhao'
}

/* ---------------- boot ---------------- */
let syncTimer
window.addEventListener('street-bazar-state-changed', () => {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => syncPush().catch((error) => console.error('Automatic Supabase sync failed:', error)), 700)
})

async function restoreGoogleSession() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''))
  const queryParams = new URLSearchParams(window.location.search)
  const params = new URLSearchParams([...queryParams.entries(), ...hashParams.entries()])
  const oauthError = params.get('error_description') || params.get('error')
  if (oauthError) {
    sessionStorage.setItem('street-bazar-google-error', oauthError)
    window.location.hash = '#/auth'
    return
  }
  const code = params.get('code')
  if (code) {
    const verifier = sessionStorage.getItem('street-bazar-google-verifier')
    if (!verifier) {
      sessionStorage.setItem('street-bazar-google-error', 'Google verification session expire ho gayi. Dobara try karein.')
      window.location.hash = '#/auth'
      return
    }
    try {
      const result = await authRequest('oauth_code', {
        code,
        code_verifier: verifier,
      })
      sessionStorage.removeItem('street-bazar-google-verifier')
      await syncPull()
      state.users.push(result.user)
      state.session = result.user.id
      setRole(result.user.role)
      save()
      window.history.replaceState({}, document.title, `${location.pathname}#/`)
    } catch (error) {
      sessionStorage.removeItem('street-bazar-google-verifier')
      sessionStorage.setItem('street-bazar-google-error', error.message)
      window.location.hash = '#/auth'
    }
    return
  }
  const accessToken = params.get('access_token')
  if (!accessToken) return
  if (params.get('type') === 'recovery') {
    sessionStorage.setItem('street-bazar-recovery-token', accessToken)
    window.location.hash = '#/auth?reset=1'
    return
  }
  try {
    const result = await authRequest('oauth', { access_token: accessToken })
    await syncPull()
    state.users.push(result.user)
    state.session = result.user.id
    setRole(result.user.role)
    save()
    window.history.replaceState({}, document.title, `${location.pathname}#/`)
  } catch (error) {
    console.error('Google session restore failed:', error)
  }
}

async function boot() {
  const isReload = performance.navigation?.type === 1 || performance.getEntriesByType?.('navigation')?.[0]?.type === 'reload'
  if (isReload && window.location.hash !== '#/' && window.location.hash !== '') {
    window.location.hash = '#/'
  }

  try {
    await syncPull()
  } catch (error) {
    console.error('Initial Supabase sync failed:', error)
  }

  renderHeader()
  renderFooter()
  renderMobileNav()
  bindGlobals()
  startRouter()
  renderFloatingAIWidget()
  const googleError = sessionStorage.getItem('street-bazar-google-error')
  if (googleError) {
    sessionStorage.removeItem('street-bazar-google-error')
    toast(`Google login failed: ${googleError.replace(/\+/g, ' ')}`, 'err')
  }

  const loader = $('#loader')
  const app = $('#app')
  const hide = () => {
    loader?.classList.add('done')
    app?.classList.remove('is-booting')
    setTimeout(() => loader?.remove(), 400)
  }
  if (document.readyState === 'complete') setTimeout(hide, 200)
  else window.addEventListener('load', () => setTimeout(hide, 200))
  setTimeout(hide, 800)
}

restoreGoogleSession().finally(() => boot())
/* =========================================================
   STREET BAZAR — GLOBAL SCROLL & MOTION EFFECTS
   ========================================================= */

(() => {

  let ticking = false

  function updateScrollEffects() {

    const scrollTop = window.scrollY
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight

    const progress =
      docHeight > 0
        ? (scrollTop / docHeight) * 100
        : 0

    const progressBar = document.querySelector('#scroll-progress')

    if (progressBar) {
      progressBar.style.width = `${progress}%`
    }

    const header = document.querySelector('#site-header')

    if (header) {
      header.classList.toggle('scrolled', scrollTop > 30)
    }

    ticking = false
  }

  window.addEventListener('scroll', () => {

    if (!ticking) {
      requestAnimationFrame(updateScrollEffects)
      ticking = true
    }

  }, { passive: true })

  updateScrollEffects()


  /* ---------- MOUSE PARALLAX ---------- */

  document.addEventListener('mousemove', (e) => {

    const cards = document.querySelectorAll(
      '.action-card, .cat-card'
    )

    if (window.innerWidth < 800) return

    const x = (e.clientX / window.innerWidth - .5)
    const y = (e.clientY / window.innerHeight - .5)

    cards.forEach((card, index) => {

      if (card.matches(':hover')) {

        const amount = index % 2 === 0 ? 5 : -5

        card.style.transform =
          `translateY(-9px)
           rotateX(${y * amount}deg)
           rotateY(${x * amount}deg)
           scale(1.02)`
      }

    })

  }, { passive: true })


  /* ---------- IMAGE PARALLAX ---------- */

  const parallaxObserver =
    new IntersectionObserver((entries) => {

      entries.forEach(entry => {

        if (!entry.isIntersecting) return

        const element = entry.target

        const image =
          element.querySelector(
            '.pcard-media img, .scard-banner img'
          )

        if (!image) return

        element.addEventListener(
          'mousemove',
          (event) => {

            const rect =
              element.getBoundingClientRect()

            const x =
              ((event.clientX - rect.left) / rect.width - .5) * 8

            const y =
              ((event.clientY - rect.top) / rect.height - .5) * 8

            image.style.transform =
              `scale(1.08) translate(${x}px, ${y}px)`
          }
        )

        element.addEventListener(
          'mouseleave',
          () => {
            image.style.transform = ''
          }
        )

        parallaxObserver.unobserve(element)

      })

    }, { threshold: .1 })


  function observeMotion() {

    document
      .querySelectorAll(
        '.pcard, .scard, .featured-store-card'
      )
      .forEach(el => parallaxObserver.observe(el))

  }

  observeMotion()

  /* Router changes ke baad naye cards ko observe karo */

  const observer =
    new MutationObserver(() => {
      observeMotion()
    })

  const view =
    document.querySelector('#view')

  if (view) {
    observer.observe(view, {
      childList: true,
      subtree: true
    })
  }

})()

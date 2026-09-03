/* Street Bazar — Store page (themed, responsive) */

import { icon, esc, money, num, themeStyle, toast, timeAgo, avatar, modal } from '../ui.js'
import { sectionHead, productCard, reviewItem, typeBadge, emptyLogin } from '../components.js'
import { storeBySlug, storeProducts, storeReviews, currentUser, myStores, isFollowing, toggleFollow, ratingOf, state, sendMessage, updateStore } from '../store.js'
import { chatReply } from '../ai.js'

export async function storePage(params) {
  const s = storeBySlug(params.slug) || null
  if (!s) return `<section class="sec"><div class="wrap"><div class="empty"><h3 class="h3">Store nahi mila</h3><p class="muted">Ye store exist nahi karta ya hata diya gaya hai.</p><div style="margin-top:16px"><a class="btn btn-primary" href="#/explore"><span>Explore stores</span></a></div></div></div></section>`

  const u = currentUser()
  const isOwner = u && s.owner === u.id
  const products = storeProducts(s.id)
  const reviews = storeReviews(s.id)
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : (s.rating || 0)
  const following = isFollowing(s.id)
  const pair = (['pop', 'noor', 'neon', 'luxe', 'studio', 'craft'].includes(s.theme?.fontPair) ? s.theme.fontPair : 'pop')
  const fontCSS = `--st-d:${{ pop: '"Bricolage Grotesque",sans-serif', noor: '"Playfair Display",serif', neon: '"Space Grotesk",sans-serif', luxe: '"Playfair Display",serif', studio: '"Space Grotesk",sans-serif', craft: '"Bricolage Grotesque",sans-serif' }[pair]};--st-b:${{ pop: '"Plus Jakarta Sans",sans-serif', noor: '"Karla",sans-serif', neon: '"DM Sans",sans-serif', luxe: '"Plus Jakarta Sans",sans-serif', studio: '"Plus Jakarta Sans",sans-serif', craft: '"Karla",sans-serif' }[pair]};`

  const socialIcons = { instagram: 'instagram', tiktok: 'tiktok', whatsapp: 'whatsapp', facebook: 'facebook', youtube: 'youtube' }

  return `
  <div class="wrap">
    <div class="store-page ${s.theme?.dark ? 'dark' : ''}" style="${themeStyle(s.theme)}${fontCSS}">
      <div class="store-hero">
        <img class="bg" src="${esc(s.banner || './images/banner-fashion.png')}" alt="${esc(s.name)}" onerror="this.src='./images/banner-fashion.png'">
        <div class="store-hero-in">
          <span class="store-logo">${s.logo ? `<img src="${esc(s.logo)}" alt="">` : esc(s.name.slice(0, 2).toUpperCase())}</span>
          <div style="flex:1;min-width:220px">
            <div class="wrap-flex" style="gap:8px;margin-bottom:8px">
              ${typeBadge(s.type)}
              <span class="badge badge-live">${icon('badge', '', 12)} Live</span>
              ${s.sale && s.sale.until > Date.now() ? `<span class="badge badge-sale">${esc(s.sale.text)}</span>` : ''}
            </div>
            <h1 class="h2">${esc(s.name)}</h1>
            <p class="small" style="color:rgba(255,255,255,.82);margin-top:6px;max-width:60ch">${esc(s.tagline)}</p>
            <div class="row" style="gap:16px;margin-top:12px;flex-wrap:wrap;color:rgba(255,255,255,.75);font-size:12.5px;font-weight:700">
              <span>${icon('store', '', 14)} ${num(products.length)} products</span>
              <span>${icon('user', '', 14)} ${num(s.followers)} followers</span>
              <span class="stars">${avg ? '★ ' + Number(avg).toFixed(1) : 'New store'}</span>
              ${s.city ? `<span>${icon('globe', '', 14)} ${esc(s.city)}</span>` : ''}
            </div>
          </div>
          <div class="row" style="gap:9px;flex-wrap:wrap">
            <button class="btn ${following ? 'btn-ghost' : 'btn-grad'} follow-btn ${following ? 'on' : ''}" data-follow="${s.id}">${following ? icon('check', '', 16) + ' Following' : icon('plus', '', 16) + ' <span>Follow store</span>'}</button>
            ${isOwner ? `
              <a class="btn btn-ghost" href="#/edit-store/${s.id}">${icon('edit', '', 15)} Edit</a>
              <a class="btn btn-ghost" href="#/add-product/${s.id}">${icon('plus', '', 15)} Product</a>
              <a class="btn btn-ghost" href="#/warehouse/${s.id}">${icon('box', '', 15)} Warehouse</a>` : ''}
          </div>
        </div>
      </div>

      <div class="store-tabs" data-tabs>
        <button class="active" data-tab="products">${icon('grid', '', 15)} Products</button>
        <button data-tab="about">${icon('info', '', 15)} About</button>
        <button data-tab="reviews">${icon('star', '', 15)} Reviews (${num(reviews.length)})</button>
        <button data-tab="chat">${icon('chat', '', 15)} Chat with store</button>
      </div>

      <div style="padding:clamp(16px,3vw,26px)">
        <div data-panel="products">
          ${s.categories?.length ? `<div class="chip-row" style="margin-bottom:18px" data-store-cats>
            <button class="chip active" data-scat="">All</button>
            ${s.categories.map((c) => `<button class="chip" data-scat="${esc(c)}">${esc(c)}</button>`).join('')}
          </div>` : ''}
          <div class="grid grid-auto" data-product-grid>
            ${products.length ? products.map(productCard).join('') : `<div class="empty" style="grid-column:1/-1"><div class="ic">${icon('box', '', 28)}</div><h3 class="h3">Abhi koi product nahi</h3><p class="muted">${isOwner ? 'Pehla product add karein — AI se description bhi likhwa sakte hain.' : 'Jaldi hi kuch naya aayega. Follow kar lein!'}</p>${isOwner ? `<div style="margin-top:16px"><a class="btn btn-primary" href="#/add-product/${s.id}"><span>Add product</span></a></div>` : ''}</div>`}
          </div>
        </div>

        <div data-panel="about" hidden>
          <div class="grid grid-2" style="gap:26px">
            <div>
              <h3 class="h3">About ${esc(s.name)}</h3>
              <p class="muted" style="margin-top:12px;line-height:1.85;white-space:pre-line">${esc(s.description)}</p>
              <div class="wrap-flex" style="margin-top:18px">
                ${(s.categories || []).map((c) => `<span class="chip static">${esc(c)}</span>`).join('')}
              </div>
            </div>
            <div class="panel" style="box-shadow:var(--shadow-s)">
              <div class="stack">
                <div class="row-between"><span class="muted small">Store type</span>${typeBadge(s.type)}</div>
                <div class="divider" style="margin:6px 0"></div>
                ${s.address ? `<div class="row" style="align-items:flex-start"><span>${icon('bank', '', 16)}</span><div><b class="small">Address</b><div class="small muted">${esc(s.address)}</div></div></div>` : ''}
                <div class="row"><span>${icon('globe', '', 16)}</span><div><b class="small">City</b><div class="small muted">${esc(s.city || 'Pakistan')}</div></div></div>
                <div class="row"><span>${icon('clock', '', 16)}</span><div><b class="small">Member since</b><div class="small muted">${new Date(s.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</div></div></div>
                <div class="divider" style="margin:6px 0"></div>
                <b class="small">Follow us</b>
                <div class="row" style="gap:9px;flex-wrap:wrap">
                  ${Object.entries(s.socials || {}).filter(([, v]) => v).length
                    ? Object.entries(s.socials).filter(([, v]) => v).map(([k, v]) => `<a class="icon-btn" href="${esc(v)}" target="_blank" rel="noopener" title="${k}">${icon(socialIcons[k] || 'globe', '', 17)}</a>`).join('')
                    : `<span class="small muted">Owner ne abhi social links nahi lagaye.</span>`}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div data-panel="reviews" hidden>
          <div class="grid grid-3" style="gap:26px">
            <div class="panel" style="text-align:center;box-shadow:var(--shadow-s)">
              <div class="h1" style="font-size:56px">${Number(avg || 0).toFixed(1)}</div>
              <div class="stars" style="justify-content:center;margin:6px 0">${[1, 2, 3, 4, 5].map((i) => `<span class="stars" style="gap:2px">${icon('star', i <= Math.round(avg) ? 'fill' : 'off', 18)}</span>`).join('')}</div>
              <div class="small muted">${num(reviews.length)} reviews across products</div>
            </div>
            <div style="grid-column:span 2">
              ${reviews.length ? reviews.map(reviewItem).join('') : `<div class="empty"><p class="muted">Abhi koi review nahi. Pehle order karke feedback dein!</p></div>`}
            </div>
          </div>
        </div>

        <div data-panel="chat" hidden>
          ${u ? `<div class="chatbox" data-chat data-store="${s.id}">
            <div class="chat-head">
              ${avatar(s.name, 'sm')}
              <div style="flex:1"><b class="small">${esc(s.name)}</b><div class="sub">Usually replies within 1 hour · AI jawab bhi deta hai</div></div>
              <span class="badge badge-teal">${icon('sparkles', '', 12)} AI on</span>
            </div>
            <div class="chat-body" data-chat-body>
              <div class="msg them"><div class="who">${esc(s.name)}</div>Assalam-o-alaikum! Bataiye kis product ke bare mein poochna hai? Main aapki madad khusus koshish se karta hoon.<div class="time">${timeAgo(Date.now())}</div></div>
            </div>
            <div class="chat-foot">
              <input class="input" data-chat-input placeholder="Apna sawal likhein… (Enter to send)">
              <button class="btn btn-primary" data-chat-send>${icon('send', '', 16)}</button>
            </div>
          </div>` : emptyLogin('Store se baat karne ke liye login karein.')}
        </div>
      </div>
    </div>
  </div>`
}

storePage.mount = (params, query, root) => {
  const s = storeBySlug(params.slug)
  if (!s) return

  // tabs
  const tabs = root.querySelectorAll('[data-tabs] button')
  tabs.forEach((b) => b.addEventListener('click', () => {
    tabs.forEach((x) => x.classList.toggle('active', x === b))
    root.querySelectorAll('[data-panel]').forEach((pnl) => { pnl.hidden = pnl.dataset.panel !== b.dataset.tab })
    if (b.dataset.tab === 'chat') root.querySelector('[data-chat-input]')?.focus()
  }))
  if (query.tab) root.querySelector(`[data-tab="${query.tab}"]`)?.click()

  // category filter
  const grid = root.querySelector('[data-product-grid]')
  root.querySelectorAll('[data-store-cats] .chip').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('[data-store-cats] .chip').forEach((x) => x.classList.toggle('active', x === b))
    const cat = b.dataset.scat
    const list = storeProducts(s.id).filter((p) => !cat || p.categories.includes(cat))
    grid.innerHTML = list.length ? list.map(productCard).join('') : `<div class="empty" style="grid-column:1/-1"><p class="muted">Is category mein abhi kuch nahi.</p></div>`
  }))

  // chat
  const box = root.querySelector('[data-chat]')
  if (box) {
    const me = currentUser()
    const msgs = state.threads.filter((t) => t.store === s.id && t.customer === me?.id).flatMap((t) => t.messages).slice(-10)
    bindChat(box, { storeId: s.id, productId: '', who: s.name, thread: msgs.length ? { messages: msgs } : null })
  }
}

export function bindChat(box, { storeId, productId = '', who = 'Store', thread = null }) {
  const body = box.querySelector('[data-chat-body]')
  const input = box.querySelector('[data-chat-input]')
  const send = box.querySelector('[data-chat-send]')
  const u = currentUser()
  if (!u) return

  const push = (msg) => {
    const mine = msg.from === u.id
    const ai = msg.from === 'ai'
    const div = document.createElement('div')
    div.className = 'msg ' + (mine ? 'me' : ai ? 'ai' : 'them')
    div.innerHTML = `<div class="who">${mine ? 'You' : ai ? 'Bazar AI · ' + who : who}</div>${esc(msg.text)}<div class="time">${timeAgo(msg.at)}</div>`
    body.appendChild(div)
    body.scrollTop = body.scrollHeight
  }

  // purani conversation continue ho
  if (thread?.messages?.length) thread.messages.slice(-10).forEach(push)

  const submit = async () => {
    const text = input.value.trim()
    if (!text) return
    input.value = ''
    const msg = { from: u.id, text, at: Date.now() }
    push(msg)
    const thread = sendMessage({ productId, storeId, from: u.id, text })
    const typing = document.createElement('div')
    typing.className = 'msg ai'
    typing.innerHTML = `<div class="who">Bazar AI</div><span class="typing"><i></i><i></i><i></i></span>`
    body.appendChild(typing); body.scrollTop = body.scrollHeight
    const reply = chatReply({ question: text, productId, storeId })
    setTimeout(() => {
      typing.remove()
      push({ from: 'ai', text: reply, at: Date.now() })
      // owner ko notify taake wo khud bhi reply kar sake
      const store = storeByIdSafe(storeId)
      if (store) notifyOwner(store, text)
    }, 900)
  }
  send?.addEventListener('click', submit)
  input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit() })
}

function storeByIdSafe(id) { return state.stores.find((s) => s.id === id) || null }
function notifyOwner(store, question) {
  const existing = state.threads.find((t) => t.store === store.id && t.customer === currentUser()?.id)
  if (existing) { existing.read = false; }
  state.notifications.unshift({ id: 'n-' + Date.now(), to: store.owner, title: 'New question in ' + store.name, body: question.slice(0, 80), at: Date.now(), read: false, link: '#/dashboard' })
  try { localStorage.setItem('street-bazar-v1', JSON.stringify(state)) } catch { /* ignore */ }
}

/* Street Bazar — shared UI components */

import { icon, esc, money, num, stars, avatar, timeAgo, dateStr } from './ui.js'
import { storeOf, ratingOf, likedProducts, isFollowing, productReviews, storeProducts, ORDER_STEPS } from './store.js'

export function sectionHead({ kicker = '', title = '', sub = '', href = '', cta = 'View all' }) {
  return `<div class="sec-head reveal">
    <div>
      ${kicker ? `<span class="kicker">${kicker}</span>` : ''}
      <h2 class="h2" style="margin-top:10px">${title}</h2>
      ${sub ? `<p class="muted" style="margin-top:8px">${sub}</p>` : ''}
    </div>
    ${href ? `<a class="link-more" href="${href}">${cta} ${icon('arrow', '', 15)}</a>` : ''}
  </div>`
}

export function productCard(p) {
  const s = storeOf(p) || { name: 'Street Bazar', slug: '' }
  const off = p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0
  const isNew = Date.now() - new Date(p.createdAt).getTime() < 7 * 86400000
  const liked = likedProducts().includes(p.id)
  const r = ratingOf(p)
  const low = p.stock <= 8
  const m = p.media?.[0] || { type: 'image', url: './images/p-kurta.png' }

  return `<article class="pcard reveal">
    <div class="pcard-media">
      <a href="#/product/${p.id}" aria-label="${esc(p.title)}">
        ${m.type === 'video' ? `<video src="${esc(m.url)}" muted autoplay loop playsinline></video>` : `<img src="${esc(m.url)}" alt="${esc(p.title)}" loading="lazy" onerror="this.src='./images/p-kurta.png'">`}
      </a>
      <div class="pcard-badges">
        ${off ? `<span class="badge badge-sale">${off}% OFF</span>` : ''}
        ${isNew ? `<span class="badge badge-new">New</span>` : ''}
        ${low ? `<span class="badge badge-rejected">Only ${num(p.stock)} left</span>` : ''}
      </div>
      <button class="pcard-fav ${liked ? 'on' : ''}" data-like="${p.id}" aria-label="Save">${icon('heart', '', 17)}</button>
      ${p.media?.length > 1 ? `<span class="media-count">${icon('image', '', 12)} ${p.media.length}</span>` : ''}
    </div>
    <div class="pcard-body">
      <a class="pcard-store" href="#/store/${s.slug}"><i class="live-dot"></i> ${esc(s.name)}</a>
      <a class="pcard-title" href="#/product/${p.id}">${esc(p.title)}</a>
      <div class="rate-row">${stars(r)} <span>${r ? r.toFixed(1) : '—'}</span> · ${num(p.sales)} sold</div>
      <div class="pcard-price">
        <span class="price">${money(p.price)}</span>
        ${p.compareAt ? `<span class="price-old">${money(p.compareAt)}</span>` : ''}
        ${off ? `<span class="price-off">save ${money(p.compareAt - p.price)}</span>` : ''}
      </div>
      <div class="pcard-foot">
        <span class="badge badge-soft">${p.customizable?.on ? icon('wand', '', 12) + ' Custom' : 'Ready to ship'}</span>
        <a class="link-more" style="padding:5px 10px;font-size:12px" href="#/product/${p.id}">${icon('chat', '', 13)} Chat</a>
      </div>
      <button class="btn btn-primary btn-sm pcard-add" data-add="${p.id}">${icon('cart', '', 15)} Add to cart</button>
    </div>
  </article>`
}

export function storeCard(s) {
  const count = storeProducts(s.id).length
  const following = isFollowing(s.id)
  const typeLabel = { home: 'Home business', physical: 'Physical shop', online: 'Online brand', hybrid: 'Hybrid' }[s.type] || 'Store'
  return `<article class="scard reveal">
    <a class="scard-banner" href="#/store/${s.slug}">
      <img src="${esc(s.banner || './images/banner-fashion.png')}" alt="${esc(s.name)}" loading="lazy" onerror="this.src='./images/banner-fashion.png'">
    </a>
    <div class="scard-body">
      <div class="row" style="align-items:flex-end;justify-content:space-between">
        <span class="scard-logo" style="background:${esc(s.theme?.primary || '#16110D')}">${s.logo ? `<img src="${esc(s.logo)}" alt="">` : esc(s.name.slice(0, 2).toUpperCase())}</span>
        <button class="btn btn-sm ${following ? 'btn-primary' : 'btn-ghost'} follow-btn ${following ? 'on' : ''}" data-follow="${s.id}">${following ? icon('check', '', 14) + ' Following' : icon('plus', '', 14) + ' Follow'}</button>
      </div>
      <h3 class="h4" style="margin-top:12px"><a href="#/store/${s.slug}">${esc(s.name)}</a></h3>
      <p class="small muted" style="min-height:38px;margin-top:4px">${esc(s.tagline || '')}</p>
      <div class="scard-meta">
        <span class="badge badge-soft">${typeLabel}</span>
        <span>${num(count)} products</span>
        <span>${num(s.followers)} followers</span>
        ${s.rating ? `<span>★ ${Number(s.rating).toFixed(1)}</span>` : ''}
      </div>
    </div>
  </article>`
}

export function featuredStoreCard(s) {
  const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const cat = s.categories?.[0] || 'General'
  const count = storeProducts(s.id).length
  const bgColors = {
    's-urban': '#1E293B',
    's-tech': '#2563EB',
    's-homenest': '#059669',
    's-beautyglow': '#EC4899',
    's-sportsarena': '#EA580C'
  }
  const bg = bgColors[s.id] || s.theme?.primary || '#1E293B'

  return `<article class="fstore-card reveal">
    <div class="fstore-banner">
      <img src="${esc(s.banner || './images/banner-fashion.png')}" alt="${esc(s.name)}" onerror="this.src='./images/banner-fashion.png'">
      <div class="fstore-avatar" style="background:${bg}">${initials}</div>
    </div>
    <div class="fstore-body">
      <h3 class="fstore-title"><a href="#/store/${s.slug}">${esc(s.name)}</a></h3>
      <div class="fstore-cat">${esc(cat)}</div>
      <div class="fstore-meta">
        <span class="fstore-star">★ ${s.rating ? Number(s.rating).toFixed(1) : '4.8'} <span class="muted">(${num(count * 15 + 100)})</span></span>
        <span class="fstore-followers">• ${s.followers ? (s.followers >= 1000 ? (s.followers/1000).toFixed(1) + 'K' : s.followers) : '10K'} Followers</span>
      </div>
      <a class="btn btn-outline-sm btn-block fstore-btn" href="#/store/${s.slug}">Visit Store</a>
    </div>
  </article>`
}

export function reviewItem(r) {
  return `<div class="review">
    <div class="row" style="justify-content:space-between">
      <div class="row">${avatar(r.userName, 'sm')}<div><b class="small">${esc(r.userName)}</b><div class="tiny muted">${dateStr(r.at)}</div></div></div>
      ${stars(r.rating)}
    </div>
    <p class="small" style="margin-top:10px;line-height:1.7">${esc(r.text)}</p>
  </div>`
}

export function orderTimeline(order) {
  const pct = (order.status / (ORDER_STEPS.length - 1)) * 100
  const items = ORDER_STEPS.map((step, i) => {
    const entry = order.timeline.find((t) => t.step === i)
    const cls = i < order.status ? 'done' : i === order.status ? 'done now' : 'pending'
    return `<div class="tl-item ${cls}">
      <span class="tl-dot"></span>
      <div class="tl-title">${step}</div>
      <div class="tiny muted">${entry ? ts(entry.at) + ' · ' + esc(entry.note) : 'Pending'}</div>
    </div>`
  }).join('')
  return `<div class="timeline"><span class="tl-fill" style="height:0" data-fill="${pct}"></span>${items}</div>`
}
const ts = (t) => new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function statCard({ n = 0, label = 'Total', icon: ic = 'trend', color = 'rgba(255,138,30,.16)', suffix = '' }) {
  return `<div class="stat reveal">
    <span class="ic" style="background:${color}">${icon(ic, '', 19)}</span>
    <div class="n" data-count="${n}">0${suffix}</div>
    <div class="l">${label}</div>
  </div>`
}

export function typeBadge(type) {
  const map = { home: 'badge-pending', physical: 'badge-teal', online: 'badge-violet', hybrid: 'badge-live' }
  const label = { home: 'Home business', physical: 'Physical shop', online: 'Online brand', hybrid: 'Hybrid' }[type] || type
  return `<span class="badge ${map[type] || 'badge-soft'}">${label}</span>`
}

export function saleBadge(s) {
  if (!s?.sale || s.sale.until < Date.now()) return ''
  const left = Math.max(0, Math.ceil((s.sale.until - Date.now()) / 86400000))
  return `<span class="badge badge-sale">${icon('tag', '', 12)} Sale · ${left}d left</span>`
}

export function emptyLogin(text = 'Is feature ke liye login karein.') {
  return `<div class="empty reveal"><div class="ic">${icon('user', '', 30)}</div><h3 class="h3">Login required</h3><p class="muted">${text}</p><div style="margin-top:18px"><a class="btn btn-grad" href="#/auth"><span>Continue</span> ${icon('arrow', '', 16)}</a></div></div>`
}

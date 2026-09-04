/* Street Bazar — Product page (gallery, customize, wholesale, chat, reviews) */

import { icon, esc, money, num, toast, timeAgo, closeModal, stars } from '../ui.js'
import { productCard, reviewItem } from '../components.js'
import { productById, storeOf, currentUser, isFollowing, addToCart, addReview, productReviews, ratingOf, storeProducts, likedProducts, toggleLike, state } from '../store.js'
import { navigate } from '../router.js'
import { bindChat } from './store.js'

export async function productPage(params) {
  const p = productById(params.id)
  if (!p) return `<section class="sec"><div class="wrap"><div class="empty"><h3 class="h3">Product nahi mila</h3><p class="muted">Ye product abhi available nahi.</p><div style="margin-top:16px"><a class="btn btn-primary" href="#/explore"><span>Explore</span></a></div></div></div></section>`

  const s = storeOf(p)
  const u = currentUser()
  const reviews = productReviews(p.id)
  const r = ratingOf(p)
  const off = p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0
  const liked = likedProducts().includes(p.id)
  const related = storeProducts(p.store).filter((x) => x.id !== p.id).slice(0, 4)
  const opts = p.customizable?.on ? p.customizable.options : []
  const tiers = p.wholesale?.on ? [...(p.wholesale.tiers || [])].sort((a, b) => a.qty - b.qty) : []

  return `
  <div class="wrap" style="padding-top:22px">
    <div class="small muted" style="margin-bottom:16px">
      <a href="#/">Home</a> ${icon('chev', '', 12)} <a href="#/explore">Explore</a> ${icon('chev', '', 12)}
      <a href="#/store/${s?.slug || ''}">${esc(s?.name || 'Store')}</a> ${icon('chev', '', 12)} <span>${esc(p.title)}</span>
    </div>

    <div class="pdp">
      <div class="reveal">
        <div class="gallery-main" data-gallery-main>
          ${p.media?.[0]?.type === 'video'
            ? `<video src="${esc(p.media[0].url)}" controls autoplay muted loop playsinline></video>`
            : `<img src="${esc(p.media?.[0]?.url || './images/p-kurta.png')}" alt="${esc(p.title)}" onerror="this.src='./images/p-kurta.png'">`}
        </div>
        ${p.media?.length > 1 ? `<div class="gallery-thumbs" data-thumbs>
          ${p.media.map((m, i) => `<button class="${i === 0 ? 'active' : ''}" data-i="${i}">${m.type === 'video' ? `<video src="${esc(m.url)}" muted></video>` : `<img src="${esc(m.url)}" alt="">`}</button>`).join('')}
        </div>` : ''}
        <div class="panel" style="margin-top:22px;box-shadow:var(--shadow-s)">
          <h3 class="h4">Description</h3>
          <p class="small" style="margin-top:10px;line-height:1.9;white-space:pre-line">${esc(p.description)}</p>
          ${p.tags?.length ? `<div class="wrap-flex" style="margin-top:14px">${p.tags.map((t) => `<span class="chip static tiny">#${esc(t)}</span>`).join('')}</div>` : ''}
        </div>
      </div>

      <div class="stack reveal" style="gap:18px">
        ${s ? `<div class="row-between" style="background:#fff;border:1px solid var(--line);border-radius:var(--r-m);padding:10px 14px">
          <a class="row" href="#/store/${s.slug}">
            <span class="avatar sm" style="background:${esc(s.theme?.primary || '#16110D')}">${esc(s.name.slice(0, 2).toUpperCase())}</span>
            <div><b class="small">${esc(s.name)}</b><div class="tiny muted">${num(s.followers)} followers · ${s.rating ? '★ ' + Number(s.rating).toFixed(1) : 'New store'}</div></div>
          </a>
          <button class="btn btn-sm ${isFollowing(s.id) ? 'btn-primary' : 'btn-ghost'} follow-btn ${isFollowing(s.id) ? 'on' : ''}" data-follow="${s.id}">${isFollowing(s.id) ? 'Following' : 'Follow'}</button>
        </div>` : ''}

        <div>
          <div class="wrap-flex" style="gap:8px">
            ${off ? `<span class="badge badge-sale">${off}% OFF</span>` : ''}
            ${p.customizable?.on ? `<span class="badge badge-violet">${icon('wand', '', 12)} Customizable</span>` : ''}
            ${p.wholesale?.on ? `<span class="badge badge-teal">${icon('scale', '', 12)} Wholesale</span>` : ''}
            ${p.stock <= 0 ? '<span class="badge badge-rejected">Out of stock</span>' : `<span class="badge badge-live">${icon('check', '', 12)} In stock</span>`}
          </div>
          <h1 class="h2" style="margin-top:12px">${esc(p.title)}</h1>
          <div class="row" style="gap:12px;margin-top:10px;flex-wrap:wrap">
            <span class="rate-row">${stars(r)} ${r ? r.toFixed(1) : '—'} · ${num(reviews.length)} reviews</span>
            <span class="tiny muted">${num(p.sales)} sold</span>
            ${s?.sale && s.sale.until > Date.now() ? `<span class="badge badge-sale">${esc(s.sale.text)}</span>` : ''}
          </div>
          <div class="row" style="gap:12px;margin-top:16px;align-items:flex-end">
            <span class="price" style="font-size:34px" data-price>${money(p.price)}</span>
            ${p.compareAt ? `<span class="price-old" style="font-size:16px">${money(p.compareAt)}</span>` : ''}
            ${off ? `<span class="price-off">You save ${money(p.compareAt - p.price)}</span>` : ''}
          </div>
          <div data-wholesale-notice style="display:none;margin-top:10px;padding:8px 14px;font-size:13px;border-radius:10px;background:rgba(13,148,136,0.1);color:#0D9488;border:1px solid rgba(13,148,136,0.2)"></div>
        </div>

        <div class="opt-box">
          <h4 class="h4">${icon('wand', '', 16)} Customize this product with AI</h4>
          <p class="tiny muted" style="margin:-4px 0 12px">Original product image par apni design, colour ya print likhein. Generate hone wali image order ke sath owner ko jayegi.</p>
          <div class="custom-preview" style="text-align:center;margin-bottom:12px"><img data-custom-preview src="${esc(p.media?.[0]?.url || './images/p-kurta.png')}" alt="${esc(p.title)}" style="max-height:220px;max-width:100%;border-radius:14px;object-fit:contain"></div>
          <div class="row" style="gap:8px"><input class="input" data-custom-prompt placeholder="e.g. white shirt par blue floral print"><button class="btn btn-primary" data-custom-generate>${icon('sparkles', '', 15)} Generate</button></div>
          <div class="tiny muted" data-custom-status style="margin-top:8px"></div>
        </div>

        ${tiers.length ? `<div class="opt-box" style="border-color:rgba(15,167,155,.4);background:rgba(15,167,155,.05)">
          <h4 class="h4">${icon('scale', '', 16)} Wholesale rates</h4>
          <p class="tiny muted" style="margin:-4px 0 12px">Quantity barhao, rate khud kam ho jaye. Bade order par owner aur bhi deal de sakta hai.</p>
          <div class="opt-choices" data-tiers>
            ${tiers.map((t, i) => `<button class="chip ${i === 0 ? 'active' : ''}" data-qty="${t.qty}" data-price="${t.price}">${num(t.qty)}+ pcs · <b>${money(t.price)}</b></button>`).join('')}
            <span class="chip static">Retail: ${money(p.price)}</span>
          </div>
        </div>` : ''}

        <div class="row" style="gap:12px;flex-wrap:wrap">
          <div class="qty" data-qty-box>
            <button data-dec aria-label="Decrease">${icon('minus', '', 15)}</button>
            <span data-qty-val>1</span>
            <button data-inc aria-label="Increase">${icon('plus', '', 15)}</button>
          </div>
          <button class="btn btn-grad btn-lg" style="flex:1;min-width:150px" data-buy>${icon('cart', '', 17)} <span>Add to cart</span></button>
          <button class="btn btn-primary btn-lg" data-buy-now>Buy now ${icon('arrow', '', 16)}</button>
          <button class="icon-btn" data-like-big="${p.id}" style="width:50px;height:50px;border-radius:16px">${icon('heart', '', 19)}</button>
        </div>

        <div class="progress"><i style="width:${Math.min(100, (p.stock / 120) * 100)}%"></i></div>
        <div class="tiny muted">${p.stock <= 0 ? 'Out of stock' : 'In stock'}${p.wholesale?.on ? ' · wholesale ke liye quantity 12+' : ''}</div>

        <div class="trust-row">
          <div>${icon('truck', '', 15)} Delivery 2–5 days</div>
          <div>${icon('refresh', '', 15)} 7-day exchange</div>
          <div>${icon('shield', '', 15)} Verified store</div>
        </div>

        ${s ? `<div class="wrap-flex">
          ${Object.entries(s.socials || {}).filter(([, v]) => v).map(([k, v]) => `<a class="chip" href="${esc(v)}" target="_blank" rel="noopener">${icon(k === 'whatsapp' ? 'whatsapp' : k === 'instagram' ? 'instagram' : k === 'tiktok' ? 'tiktok' : k === 'facebook' ? 'facebook' : 'youtube', '', 14)} ${k}</a>`).join('')}
        </div>` : ''}
      </div>
    </div>

    <section class="sec" id="chat" style="padding-bottom:20px">
      <div class="grid grid-2" style="gap:26px;align-items:start">
        <div>
          <span class="kicker">Ask the seller</span>
          <h2 class="h3" style="margin-top:10px">Is product ke bare mein poochein</h2>
          <p class="muted small" style="margin-top:8px">Aapki chat ${esc(s?.name || 'store')} tak jati hai. AI pehla jawab turant deta hai — owner bhi yahin aa kar reply kar sakta hai.</p>
          <div class="wrap-flex" style="margin-top:14px">
            ${['Size mil jayega?', 'Wholesale rate?', 'Delivery kab tak?'].map((q) => `<button class="chip" data-quick="${esc(q)}">${esc(q)}</button>`).join('')}
          </div>
        </div>
        ${u && s ? `<div class="chatbox" data-chat data-store="${s.id}" data-product="${p.id}">
          <div class="chat-head">
            <span class="avatar sm" style="background:${esc(s.theme?.primary || '#16110D')}">${esc(s.name.slice(0, 2).toUpperCase())}</span>
            <div style="flex:1"><b class="small">${esc(s.name)}</b><div class="sub">Product chat · AI + owner</div></div>
            <span class="badge badge-teal">${icon('sparkles', '', 12)} AI on</span>
          </div>
          <div class="chat-body" data-chat-body>
            <div class="msg them"><div class="who">${esc(s.name)}</div>Assalam! «${esc(p.title)}» ke bare mein kuch bhi pooch sakte hain — size, delivery, wholesale ya custom option.<div class="time">${timeAgo(Date.now())}</div></div>
          </div>
          <div class="chat-foot">
            <input class="input" data-chat-input placeholder="Sawaal likhein…">
            <button class="btn btn-primary" data-chat-send>${icon('send', '', 16)}</button>
          </div>
        </div>` : `<div class="empty"><p class="muted">Chat ke liye login karein.</p><div style="margin-top:14px"><a class="btn btn-primary" href="#/auth"><span>Login</span></a></div></div>`}
      </div>
    </section>

    <section class="sec" style="padding-top:0">
      <div class="grid grid-3" style="gap:26px;align-items:start">
        <div class="panel" style="text-align:center;box-shadow:var(--shadow-s)">
          <div class="h1" style="font-size:52px">${r ? r.toFixed(1) : '—'}</div>
          <div class="stars" style="justify-content:center;margin:6px 0">${[1, 2, 3, 4, 5].map((i) => icon('star', i <= Math.round(r) ? 'fill' : 'off', 18)).join('')}</div>
          <div class="small muted">${num(reviews.length)} verified reviews</div>
          <div class="divider"></div>
          ${u ? `<button class="btn btn-ghost btn-block" data-write-review>${icon('edit', '', 15)} Write a review</button>` : `<a class="btn btn-ghost btn-block" href="#/auth">Login to review</a>`}
        </div>
        <div style="grid-column:span 2">
          <h3 class="h3" style="margin-bottom:8px">Customer reviews</h3>
          <div data-review-list>${reviews.length ? reviews.map(reviewItem).join('') : `<div class="empty"><p class="muted">Abhi koi review nahi — aap pehle likhein!</p></div>`}</div>
        </div>
      </div>
    </section>

    ${related.length ? `<section class="sec" style="padding-top:0">
      <div class="sec-head"><h2 class="h3">Isi store se aur</h2><a class="link-more" href="#/store/${s?.slug}">View store ${icon('arrow', '', 14)}</a></div>
      <div class="grid grid-4 stagger">${related.map(productCard).join('')}</div>
    </section>` : ''}
  </div>`
}

productPage.mount = (params, query, root) => {
  const p = productById(params.id)
  if (!p) return
  const s = storeOf(p)

  // gallery
  const main = root.querySelector('[data-gallery-main]')
  root.querySelectorAll('[data-thumbs] button')?.forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('[data-thumbs] button').forEach((x) => x.classList.toggle('active', x === b))
    const m = p.media[Number(b.dataset.i)]
    main.innerHTML = m.type === 'video' ? `<video src="${esc(m.url)}" controls autoplay muted loop playsinline></video>` : `<img src="${esc(m.url)}" alt="${esc(p.title)}">`
  }))

  // state
  let qty = 1
  let chosen = (p.customizable?.options || []).map((o) => ({ name: o.name, choice: o.choices[0] }))
  let customizedImage = p.media?.[0]?.url || ''
  const unit = () => {
    const base = p.price
    const delta = chosen.reduce((a, c) => a + (c.choice?.delta || 0), 0)
    const tier = (p.wholesale?.tiers || []).filter((t) => qty >= t.qty).sort((a, b) => b.qty - a.qty)[0]
    return tier ? tier.price : base + delta
  }
  const paint = () => {
    root.querySelector('[data-qty-val]').textContent = qty
    const currentPrice = unit()
    root.querySelector('[data-price]').textContent = money(currentPrice)
    const notice = root.querySelector('[data-wholesale-notice]')
    if (notice) {
      const activeTier = (p.wholesale?.tiers || []).filter((t) => qty >= t.qty).sort((a, b) => b.qty - a.qty)[0]
      if (activeTier) {
        const savingsTotal = (p.price - activeTier.price) * qty
        notice.style.display = 'block'
        notice.innerHTML = `${icon('scale', '', 14)} <b>Wholesale Rate Active!</b> ${money(activeTier.price)}/pc (Bulk order savings: <b>${money(savingsTotal)}</b>)`
      } else {
        notice.style.display = 'none'
      }
    }
  }
  paint()

  root.querySelector('[data-inc]')?.addEventListener('click', () => { qty++; paint() })
  root.querySelector('[data-dec]')?.addEventListener('click', () => { qty = Math.max(1, qty - 1); paint() })

  root.querySelectorAll('[data-opt]').forEach((group) => group.addEventListener('click', (e) => {
    const b = e.target.closest('[data-choice]')
    if (!b) return
    group.querySelectorAll('[data-choice]').forEach((x) => x.classList.toggle('active', x === b))
    const oi = Number(group.dataset.opt)
    chosen[oi] = { name: p.customizable.options[oi].name, choice: p.customizable.options[oi].choices[Number(b.dataset.choice)] }
    paint()
  }))

  root.querySelectorAll('[data-tiers] [data-qty]').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('[data-tiers] [data-qty]').forEach((x) => x.classList.toggle('active', x === b))
    qty = Number(b.dataset.qty); paint()
  }))

  const doAdd = (buyNow) => {
    const options = {}
    chosen.forEach((c) => { if (c.choice) options[c.name] = c.choice.label })
    addToCart({ product: p.id, qty, options: { ...options, ...(customizedImage !== p.media?.[0]?.url ? { 'AI design': 'Customized' } : {}) }, unitPrice: unit(), image: customizedImage, customizedImage })
    toast(`${p.title} × ${qty} cart mein add ho gaya`, 'ok')
    if (buyNow) navigate('#/cart')
    else updateCartBadge()
  }
  root.querySelector('[data-buy]')?.addEventListener('click', () => doAdd(false))
  root.querySelector('[data-buy-now]')?.addEventListener('click', () => doAdd(true))
  root.querySelector('[data-custom-generate]')?.addEventListener('click', async (event) => {
    const prompt = root.querySelector('[data-custom-prompt]').value.trim()
    const status = root.querySelector('[data-custom-status]')
    if (!prompt) return toast('Design instruction likhein', 'err')
    event.currentTarget.disabled = true
    status.textContent = 'AI image generate ho rahi hai…'
    try {
      const response = await fetch('/api/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, image: p.media?.[0]?.url || '' }) })
      const raw = await response.text()
      let data = {}
      try { data = raw ? JSON.parse(raw) : {} } catch { data = { error: raw.slice(0, 240) || `Image service returned HTTP ${response.status}` } }
      if (!response.ok || !data.url) throw new Error(data.error || 'Image generate nahi hui')
      customizedImage = data.url
      root.querySelector('[data-custom-preview]').src = customizedImage
      status.textContent = 'Design ready — ab order karein.'
    } catch (error) {
      status.textContent = error.message
      toast(error.message, 'err')
    } finally { event.currentTarget.disabled = false }
  })

  // wishlist
  const likeBtn = root.querySelector('[data-like-big]')
  likeBtn?.addEventListener('click', () => {
    const on = toggleLike(p.id)
    likeBtn.style.background = on ? 'var(--magenta)' : '#fff'
    likeBtn.style.color = on ? '#fff' : 'var(--ink)'
    toast(on ? 'Saved to wishlist' : 'Removed from wishlist')
  })
  if (likedProducts().includes(p.id)) { likeBtn.style.background = 'var(--magenta)'; likeBtn.style.color = '#fff' }

  // chat
  const box = root.querySelector('[data-chat]')
  if (box) {
    const u = currentUser()
    const thread = state.threads.find((t) => t.product === p.id && t.store === p.store && t.customer === u?.id)
    bindChat(box, { storeId: p.store, productId: p.id, who: s?.name || 'Store', thread })
    root.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => {
      const input = box.querySelector('[data-chat-input]')
      input.value = b.dataset.quick
      box.querySelector('[data-chat-send]').click()
    }))
  }

  // reviews
  root.querySelector('[data-write-review]')?.addEventListener('click', () => openReviewModal(p))
}

function openReviewModal(p) {
  let rating = 5
  import('../ui.js').then(({ modal }) => {
    modal({
      title: 'Write a review',
      body: `
        <p class="small muted">${esc(p.title)}</p>
        <div class="row" style="gap:6px;margin:14px 0" data-star-picker>
          ${[1, 2, 3, 4, 5].map((i) => `<button class="icon-btn" data-star="${i}" style="color:var(--gold)">${icon('star', 'fill', 20)}</button>`).join('')}
        </div>
        <textarea class="textarea" id="rev-text" placeholder="Quality, delivery aur overall experience…"></textarea>`,
      foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-submit><span>Post review</span></button>`,
      onOpen: (el) => {
        el.querySelectorAll('[data-star]').forEach((b) => b.addEventListener('click', () => {
          rating = Number(b.dataset.star)
          el.querySelectorAll('[data-star]').forEach((x) => { x.style.opacity = Number(x.dataset.star) <= rating ? '1' : '.3' })
        }))
        el.querySelector('[data-submit]').addEventListener('click', () => {
          const text = el.querySelector('#rev-text').value.trim()
          if (!text) return toast('Thoda text likhein', 'err')
          addReview({ product: p.id, store: p.store, rating, text })
          closeModal()
          toast('Shukriya! Aapka review post ho gaya', 'ok')
          setTimeout(() => location.reload(), 700)
        })
      },
    })
  })
}

function updateCartBadge() {
  import('../store.js').then(({ cartCount }) => {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = cartCount()
      el.style.display = cartCount() ? 'grid' : 'none'
    })
  })
}

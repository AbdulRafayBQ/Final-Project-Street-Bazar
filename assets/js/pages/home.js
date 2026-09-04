import { icon, esc, money, num, marqueeHTML, toast, modal, closeModal } from '../ui.js'
import { sectionHead, productCard, storeCard } from '../components.js'
import { liveStores, followedStores, saleStores, recommendations, storeProducts, searchAll, storeById, state } from '../store.js'
import { assistantReply } from '../ai.js'

export async function home() {
  const stores = liveStores()
  const sales = saleStores()
  const saleProducts = state.products.filter((p) => p.status !== 'hidden' && p.compareAt && p.compareAt > p.price && storeById(p.store)?.status === 'live').slice(0, 6)

  const actionCards = [
    { title: 'Start Your Store', desc: 'Create your online store in just 5 minutes', icon: 'store', color: '#EF4444', bg: '#FEE2E2', href: '#/create-store' },
    { title: 'Explore Stores', desc: 'Discover amazing stores and products', icon: 'shopping-bag', color: '#10B981', bg: '#D1FAE5', href: '#/dukanien' },
    { title: 'AI Assistant', desc: 'Smart shopping & store management AI', icon: 'sparkles', color: '#8B5CF6', bg: '#EDE9FE', action: 'ai-scan' },
    { title: 'Inventory & Orders', desc: 'Manage inventory and orders in real time', icon: 'box', color: '#3B82F6', bg: '#DBEAFE', href: '#/dashboard' },
    { title: 'Wholesale Deals', desc: 'Bulk pricing and exclusive offers', icon: 'tag', color: '#F59E0B', bg: '#FEF3C7', href: '#/explore' },
    { title: 'Order Tracking', desc: 'Track your orders live anytime', icon: 'truck', color: '#059669', bg: '#D1FAE5', href: '#/orders' },
  ]

  const categoryCards = [
    { name: 'Fashion', icon: 'tag', bg: '#FEE2E2', color: '#EF4444', desc: 'Clothes, lawn, streetwear & accessories' },
    { name: 'Electronics', icon: 'box', bg: '#DBEAFE', color: '#3B82F6', desc: 'Gadgets, audio, earbuds & smart tech' },
    { name: 'Mobile Accessories', icon: 'sparkles', bg: '#EDE9FE', color: '#8B5CF6', desc: 'Covers, chargers, cables & stands' },
    { name: 'Home & Kitchen', icon: 'home', bg: '#D1FAE5', color: '#10B981', desc: 'Decor, lamps, kitchenware & bedding' },
    { name: 'Food & Groceries', icon: 'store', bg: '#FEF3C7', color: '#F59E0B', desc: 'Fresh bakes, snacks, tea & organic food' },
    { name: 'Footwear', icon: 'grid', bg: '#FCE7F3', color: '#EC4899', desc: 'Sneakers, sandals, heels & boots' },
    { name: 'Beauty & Care', icon: 'heart', bg: '#FFEDD5', color: '#EA580C', desc: 'Skincare, serums, makeup & haircare' },
    { name: 'Jewelry', icon: 'star', bg: '#E0E7FF', color: '#4F46E5', desc: 'Silver jhumkas, brassware & handmade' },
  ]

  return `
  <section class="sec" style="padding-top:20px;padding-bottom:16px">
    <div class="wrap">
      <div class="action-cards-grid">
        ${actionCards.map(c => `
          <${c.href ? `a href="${c.href}"` : `div data-ai-scan style="cursor:pointer"`} class="action-card">
            <div class="action-card-ic" style="background:${c.bg};color:${c.color}">
              ${icon(c.icon, '', 22)}
            </div>
            <h3 class="action-card-title">${c.title}</h3>
            <p class="action-card-desc">${c.desc}</p>
            <div class="action-card-arrow">
              ${icon('arrow', '', 14)}
            </div>
          </${c.href ? 'a' : 'div'}>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="sec" style="padding-top:16px;padding-bottom:24px">
    <div class="wrap">
      <div class="sec-head-row">
        <h2 class="h2">Live Sales & Deals</h2>
        <a class="btn-link-sm" href="#/explore">Explore all deals ${icon('arrow', '', 14)}</a>
      </div>
      
      ${sales.length || saleProducts.length ? `
      <div class="sale-carousel" data-sale-carousel style="margin-top:16px;margin-bottom:20px"></div>` : ''}

      <div class="grid grid-6 stagger">
        ${saleProducts.map(productCard).join('')}
      </div>
    </div>
  </section>

  <section class="sec" style="padding-top:8px;padding-bottom:28px">
    <div class="wrap">
      <div class="sec-head-row">
        <h2 class="h2">Browse Categories</h2>
        <a class="btn-link-sm" href="#/explore">View all categories ${icon('arrow', '', 14)}</a>
      </div>
      <div class="grid grid-4 stagger" style="margin-top:16px;gap:16px">
        ${categoryCards.map(c => `
          <a class="cat-card" href="#/explore?cat=${encodeURIComponent(c.name)}">
            <div class="cat-card-ic" style="background:${c.bg};color:${c.color}">
              ${icon(c.icon, '', 22)}
            </div>
            <div class="cat-card-info"><h3 class="cat-card-title">${c.name}</h3></div>
            <span class="cat-card-arrow">${icon('chev', '', 14)}</span>
          </a>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="sec" style="padding-top:0;padding-bottom:40px">
    <div class="wrap">
      <div class="trust-bar">
        <div class="trust-item">
          <span class="trust-ic" style="color:#8B5CF6;background:#F3E8FF">${icon('shield', '', 20)}</span>
          <div>
            <b>100% Secure</b>
            <p>Your data and transactions are fully protected</p>
          </div>
        </div>
        <div class="trust-item">
          <span class="trust-ic" style="color:#F59E0B;background:#FEF3C7">${icon('headphone', '', 20)}</span>
          <div>
            <b>24/7 Support</b>
            <p>Always here to help you anytime, anywhere</p>
          </div>
        </div>
        <div class="trust-item">
          <span class="trust-ic" style="color:#10B981;background:#D1FAE5">${icon('refresh', '', 20)}</span>
          <div>
            <b>Easy Returns</b>
            <p>Hassle-free returns and refunds policy</p>
          </div>
        </div>
        <div class="trust-item">
          <span class="trust-ic" style="color:#2563EB;background:#DBEAFE">${icon('star', '', 20)}</span>
          <div>
            <b>Trusted Stores</b>
            <p>Verified stores and quality products</p>
          </div>
        </div>
        <div class="trust-item">
          <span class="trust-ic" style="color:#EF4444;background:#FEE2E2">${icon('truck', '', 20)}</span>
          <div>
            <b>Fast Delivery</b>
            <p>Quick and reliable delivery at your doorstep</p>
          </div>
        </div>
      </div>
    </div>
  </section>`
}

home.mount = (p, q, root) => {
  root.querySelector('[data-ai-scan]')?.addEventListener('click', openAIScan)
  const carousel = root.querySelector('[data-sale-carousel]')
  if (!carousel) return
  const storeSlides = saleStores().map((store) => ({ kind: 'store', store }))
  const productSlides = state.products
    .filter((product) => product.status !== 'hidden' && product.compareAt && product.compareAt > product.price && storeById(product.store)?.status === 'live')
    .map((product) => ({ kind: 'product', product, store: storeById(product.store) }))
  const slides = [...storeSlides, ...productSlides]
  if (!slides.length) return
  let index = 0
  const paint = () => {
    const slide = slides[index % slides.length]
    const isProduct = slide.kind === 'product'
    const s = isProduct ? slide.store : slide.store
    const p = slide.product
    const image = isProduct ? p.media?.[0]?.url : s.banner
    const title = isProduct ? `${p.title} — ${Math.round((1 - p.price / p.compareAt) * 100)}% OFF` : s.sale.text
    const href = isProduct ? `#/product/${p.id}` : `#/store/${s.slug}`
    const detail = isProduct ? `${s.name} · Rs ${Number(p.price).toLocaleString('en-PK')} instead of Rs ${Number(p.compareAt).toLocaleString('en-PK')}` : `Ends ${new Date(s.sale.until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${num(storeProducts(s.id).length)} products`
    carousel.innerHTML = `
      <a class="ad-card reveal sale-carousel-card" href="${href}">
        <img src="${esc(image || './images/banner-fashion.png')}" alt="${esc(isProduct ? p.title : s.name)}" onerror="this.src='./images/banner-fashion.png'">
        <span class="ad-tag badge badge-sale">${icon('tag', '', 12)} SALE</span>
        <div class="ad-in">
          <div class="small" style="opacity:.85">${esc(s.name)}</div>
          <div class="h4" style="color:#fff;margin:4px 0 8px">${esc(title)}</div>
          <div class="tiny" style="opacity:.8">${esc(detail)}</div>
        </div>
      </a>`
    index += 1
  }
  paint()
  root._saleTimer = setInterval(paint, 4500)
}

export function openAIScan() {
  modal({
    title: `${icon('sparkles', '', 18)} Bazar AI — catalog scan`,
    body: `
      <p class="small muted">Kuch bhi likhein — AI poore database se product ya store dhoond kar direct button dega. Jaise "wholesale kurta" ya "custom cover".</p>
      <div class="row" style="margin-top:14px;gap:9px">
        <input class="input" id="scan-q" placeholder="e.g. brass chai set / custom phone cover">
        <button class="btn btn-grad" id="scan-go">${icon('sparkles', '', 16)} <span>Scan</span></button>
      </div>
      <div id="scan-out" style="margin-top:18px"></div>`,
    onOpen: (el) => {
      const run = async () => {
        const q = el.querySelector('#scan-q').value.trim()
        const out = el.querySelector('#scan-out')
        if (!q) return toast('Kuch toh likhein', 'err')
        out.innerHTML = '<div class="ai-out"><span class="lbl">AI is scanning…</span>Database mein products, stores aur categories check ho rahe hain…</div>'
        const res = await assistantReply({ question: q })
        const { products, stores } = searchAll(q)
        const extra = products.length ? [] : liveStores().map((s) => storeProducts(s.id).find((p) => p.categories.some((c) => c.toLowerCase().includes(q.toLowerCase().split(' ')[0])))).filter(Boolean).slice(0, 2)
        const hits = [...products, ...extra].slice(0, 3)
        out.innerHTML = `
          <div class="ai-out"><span class="lbl">AI · ${res.source === 'live' ? 'live model' : 'Bazar Brain'}</span>${esc(res.text).replace(/\n/g, '<br>')}</div>
          ${hits.length ? `<div style="margin-top:14px" class="stack">${hits.map((p) => {
            const st = storeById(p.store)
            return `<div class="card" style="padding:12px;display:flex;gap:12px;align-items:center">
              <img src="${esc(p.media[0].url)}" alt="" style="width:56px;height:56px;border-radius:14px;object-fit:cover">
              <div style="flex:1"><b class="small">${esc(p.title)}</b><div class="tiny muted">Store: ${esc(st?.name || '')} · ${money(p.price)}</div></div>
              <a class="btn btn-sm btn-primary" href="#/product/${p.id}" data-close-modal><span>Open product</span></a>
            </div>`
          }).join('')}</div>` : `<p class="small muted" style="margin-top:12px">Koi exact product nahi mili — Explore page par poora catalog dekhein.</p>`}
          ${stores.length ? `<div class="wrap-flex" style="margin-top:12px">${stores.map((s) => `<a class="chip" href="#/store/${s.slug}" data-close-modal>${icon('store', '', 13)} ${esc(s.name)}</a>`).join('')}</div>` : ''}`
        out.querySelectorAll('[data-close-modal]').forEach((a) => a.addEventListener('click', () => closeModal()))
      }
      el.querySelector('#scan-go').addEventListener('click', run)
      el.querySelector('#scan-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') run() })
    },
  })
}

/* Street Bazar — Explore (search + filters) & For You feeds */

import { icon, esc, num, toast } from '../ui.js'
import { sectionHead, productCard, storeCard, emptyLogin } from '../components.js'
import { liveStores, storeProducts, allCategories, searchAll, followedStores, newProductsFor, recommendations, saleStores, currentUser, isFollowing } from '../store.js'
import { openAIScan } from './home.js'

export async function explore(params = {}, query = {}) {
  const activeCat = query.cat || ''
  const q = query.q || ''
  return `
  <section class="sec" style="padding-bottom:20px">
    <div class="wrap">
      <span class="kicker">Bazaar Products</span>
      <h1 class="h1" style="margin-top:12px">Poora <span class="grad-text">bazaar</span> ek jagah.</h1>
      <p class="lead" style="margin-top:12px">Search karo, category filter karo — ya AI se scan karwa lo ki kya dhoondna hai.</p>
      <div class="catalog-searchbar" style="margin-top:24px">
        <div class="hd-search" style="max-width:520px;flex:1;position:relative">
          ${icon('search', '', 17)}
          <input class="input" id="ex-q" value="${esc(q)}" placeholder="Product ya category search karein…" style="padding-left:42px;border-radius:99px">
        </div>
        <button class="btn btn-grad" id="ex-ai">${icon('box', '', 16)} <span>Ask AI</span></button>
      </div>
      <div class="catalog-filters" style="margin-top:12px">
        <input class="input price-input" id="ex-min" type="number" min="0" placeholder="Min price">
        <input class="input price-input" id="ex-max" type="number" min="0" placeholder="Max price">
        <select class="input filter-select" id="ex-sort-select" aria-label="Sort products"><option value="popular">Popular</option><option value="low">Price low to high</option><option value="high">Price high to low</option></select>
      </div>
      <div class="chip-row" style="margin-top:20px" id="ex-cats">
        <button class="chip ${!activeCat ? 'active' : ''}" data-cat="">${icon('grid', '', 14)} All</button>
        ${allCategories().map((c) => `<button class="chip ${activeCat === c ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
      </div>
      <select class="input mobile-filter-select" id="ex-cat-select" aria-label="Product category"><option value="">All categories</option>${allCategories().map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
      <div class="row-between" style="margin-top:18px;flex-wrap:wrap;gap:10px">
        <div class="small muted" id="ex-count"></div>
      </div>
    </div>
  </section>

  <section class="sec catalog-results-section" style="padding-top:0">
    <div class="wrap">
      <div id="ex-results"></div>
    </div>
  </section>`
}

explore.mount = (params, query, root) => {
  let cat = query.cat || ''
  let sort = 'popular'
  let term = query.q || ''
  let minPrice = 0
  let maxPrice = 0

  const paint = () => {
    const { products } = searchAll(term)
    const catalog = term ? products : liveStores().flatMap((store) => storeProducts(store.id))
    const normalizedCat = cat.trim().toLowerCase()
    let list = catalog.filter((p) => !normalizedCat || (p.categories || []).some((value) => String(value).trim().toLowerCase() === normalizedCat))
    list = list.filter((p) => (!minPrice || p.price >= minPrice) && (!maxPrice || p.price <= maxPrice))
    list = [...list].sort((a, b) => {
      if (sort === 'popular') return b.sales - a.sales
      if (sort === 'low') return a.price - b.price
      return b.price - a.price
    })
    root.querySelector('#ex-results').innerHTML = list.length
      ? `${sectionHead({ kicker: 'Products', title: cat ? `${num(list.length)} <span class="grad-text">products</span> mile` : 'Products' })}<div class="grid grid-4 stagger">${list.map(productCard).join('')}</div>`
      : `<div class="empty reveal"><div class="ic">${icon('search', '', 30)}</div><h3 class="h3">Kuch nahi mila</h3><p class="muted">Try another keyword, ya Ask AI se pooch lein.</p><div style="margin-top:16px"><button class="btn btn-grad" onclick="document.getElementById('ex-ai').click()">${icon('box', '', 15)} <span>Ask AI</span></button></div></div>`
    root.querySelector('#ex-count').textContent = cat ? `${num(list.length)} products` : ''
  }
  paint()

  root.querySelector('#ex-q').addEventListener('input', (e) => { term = e.target.value; paint() })
  root.querySelector('#ex-min').addEventListener('input', (e) => { minPrice = Number(e.target.value) || 0; paint() })
  root.querySelector('#ex-max').addEventListener('input', (e) => { maxPrice = Number(e.target.value) || 0; paint() })
  root.querySelector('#ex-sort-select').addEventListener('change', (e) => { sort = e.target.value; paint() })
  root.querySelector('#ex-ai').addEventListener('click', openAIScan)
  root.querySelector('#ex-cat-select')?.addEventListener('change', (e) => { cat = e.target.value; root.querySelectorAll('#ex-cats .chip').forEach((x) => x.classList.toggle('active', x.dataset.cat === cat)); paint() })
  root.querySelectorAll('#ex-cats .chip').forEach((b) => b.addEventListener('click', () => {
    cat = b.dataset.cat
    root.querySelectorAll('#ex-cats .chip').forEach((x) => x.classList.toggle('active', x === b))
    paint()
  }))
}

/* ---------------- For You ---------------- */
export async function foryou() {
  const u = currentUser()
  if (!u) return `<section class="sec"><div class="wrap">${emptyLogin('Follow stores to build your personal feed. Naye product aate hi yahan show honge.')}</div></section>`

  const followed = followedStores()
  const fresh = newProductsFor()
  const recos = recommendations(8)
  const sales = saleStores().filter((s) => isFollowing(s.id))

  return `
  <section class="sec" style="padding-bottom:16px">
    <div class="wrap">
      <span class="kicker">For you</span>
      <h1 class="h1" style="margin-top:12px">Welcome back, ${esc(u.name.split(' ')[0])}! <span class="grad-text">Here is your feed</span>.</h1>
      <p class="lead" style="margin-top:12px">Discover new arrivals and exclusive deals from your followed stores.</p>
    </div>
  </section>

  ${sales.length ? `<section class="sec" style="padding-top:0"><div class="wrap">
    ${sectionHead({ kicker: 'Sale alerts', title: 'Aapke stores par <span class="grad-text">sale</span> chal rahi hai' })}
    <div class="grid grid-3 stagger">${sales.map((s) => `
      <a class="ad-card reveal" href="#/store/${s.slug}">
        <img src="${esc(s.banner)}" alt="${esc(s.name)}" onerror="this.src='./images/banner-fashion.png'">
        <span class="ad-tag badge badge-sale">${icon('tag', '', 12)} SALE</span>
        <div class="ad-in"><div class="small" style="opacity:.85">${esc(s.name)}</div><div class="h4" style="color:#fff;margin-top:4px">${esc(s.sale.text)}</div></div>
      </a>`).join('')}</div>
  </div></section>` : ''}

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      ${followed.length
        ? `${sectionHead({ kicker: 'New drops', title: 'Followed stores ke <span class="grad-text">naye products</span>', sub: 'Sabse recent listing pehle — jaise hi store kuch add kare, yahan dikhega.' })}
           <div class="grid grid-4 stagger">${fresh.slice(0, 8).map(productCard).join('')}</div>`
        : `<div class="empty reveal"><div class="ic">${icon('store', '', 30)}</div><h3 class="h3">Abhi koi store follow nahi</h3><p class="muted">Kisi bhi store par "Follow" dabayein — uska har naya product yahan aayega.</p><div style="margin-top:18px"><a class="btn btn-grad" href="#/dukanien"><span>Explore Dukanien</span> ${icon('arrow', '', 15)}</a></div></div>`}
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      ${sectionHead({ kicker: 'Picked for you', title: 'Product you <span class="grad-text">may like</span>', sub: 'Likes, category aur reviews ke basis par.' })}
      <div class="grid grid-4 stagger">${recos.map(productCard).join('')}</div>
    </div>
  </section>`
}

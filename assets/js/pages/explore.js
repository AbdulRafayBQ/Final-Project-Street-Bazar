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
      <span class="kicker">Explore</span>
      <h1 class="h1" style="margin-top:12px">Poora <span class="grad-text">bazaar</span> ek jagah.</h1>
      <p class="lead" style="margin-top:12px">Search karo, category filter karo — ya AI se scan karwa lo ki kya dhoondna hai.</p>
      <div class="row" style="margin-top:24px;gap:10px;flex-wrap:wrap">
        <div class="hd-search" style="max-width:520px;flex:1;position:relative">
          ${icon('search', '', 17)}
          <input class="input" id="ex-q" value="${esc(q)}" placeholder="Product, store ya category search karein…" style="padding-left:42px;border-radius:99px">
        </div>
        <button class="btn btn-grad" id="ex-ai">${icon('sparkles', '', 16)} <span>AI scan</span></button>
      </div>
      <div class="chip-row" style="margin-top:20px" id="ex-cats">
        <button class="chip ${!activeCat ? 'active' : ''}" data-cat="">${icon('grid', '', 14)} All</button>
        ${allCategories().map((c) => `<button class="chip ${activeCat === c ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
      </div>
      <div class="row-between" style="margin-top:18px;flex-wrap:wrap;gap:10px">
        <div class="small muted" id="ex-count"></div>
        <div class="seg" id="ex-sort">
          <button data-sort="popular" class="active">Popular</button>
          <button data-sort="new">Newest</button>
          <button data-sort="low">Price ↑</button>
          <button data-sort="high">Price ↓</button>
        </div>
      </div>
    </div>
  </section>

  <section class="sec" style="padding-top:10px">
    <div class="wrap">
      <div id="ex-stores"></div>
      <div id="ex-results"></div>
    </div>
  </section>`
}

explore.mount = (params, query, root) => {
  let cat = query.cat || ''
  let sort = 'popular'
  let term = query.q || ''

  const paint = () => {
    const { products, stores } = searchAll(term)
    let list = products.filter((p) => !cat || p.categories.includes(cat))
    if (!term && !cat) list = liveStores().flatMap((p0) => storeProducts(p0.id))
    list = [...list].sort((a, b) => {
      if (sort === 'popular') return b.sales - a.sales
      if (sort === 'new') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sort === 'low') return a.price - b.price
      return b.price - a.price
    })
    const catStores = liveStores().filter((s) => !cat || s.categories.includes(cat))
    root.querySelector('#ex-stores').innerHTML = (term || cat) && catStores.length
      ? `<div style="margin-bottom:34px">${sectionHead({ kicker: 'Stores', title: 'Matching <span class="grad-text">stores</span>' })}<div class="grid grid-4 stagger">${catStores.slice(0, 4).map(storeCard).join('')}</div></div>`
      : ''
    root.querySelector('#ex-results').innerHTML = list.length
      ? `${sectionHead({ kicker: 'Products', title: `${num(list.length)} <span class="grad-text">products</span> mile` })}<div class="grid grid-4 stagger">${list.map(productCard).join('')}</div>`
      : `<div class="empty reveal"><div class="ic">${icon('search', '', 30)}</div><h3 class="h3">Kuch nahi mila</h3><p class="muted">Try another keyword, ya AI scan se pooch lein kya dhoondna hai.</p><div style="margin-top:16px"><button class="btn btn-grad" onclick="document.getElementById('ex-ai').click()">${icon('sparkles', '', 15)} <span>AI scan</span></button></div></div>`
    root.querySelector('#ex-count').textContent = `${num(list.length)} products · ${num(catStores.length)} stores`
  }
  paint()

  root.querySelector('#ex-q').addEventListener('input', (e) => { term = e.target.value; paint() })
  root.querySelector('#ex-ai').addEventListener('click', openAIScan)
  root.querySelectorAll('#ex-cats .chip').forEach((b) => b.addEventListener('click', () => {
    cat = b.dataset.cat
    root.querySelectorAll('#ex-cats .chip').forEach((x) => x.classList.toggle('active', x === b))
    paint()
  }))
  root.querySelectorAll('#ex-sort button').forEach((b) => b.addEventListener('click', () => {
    sort = b.dataset.sort
    root.querySelectorAll('#ex-sort button').forEach((x) => x.classList.toggle('active', x === b))
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
        : `<div class="empty reveal"><div class="ic">${icon('store', '', 30)}</div><h3 class="h3">Abhi koi store follow nahi</h3><p class="muted">Kisi bhi store par "Follow" dabayein — uska har naya product yahan aayega.</p><div style="margin-top:18px"><a class="btn btn-grad" href="#/explore"><span>Explore stores</span> ${icon('arrow', '', 15)}</a></div></div>`}
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      ${sectionHead({ kicker: 'Picked for you', title: 'Product you <span class="grad-text">may like</span>', sub: 'Likes, category aur reviews ke basis par.' })}
      <div class="grid grid-4 stagger">${recos.map(productCard).join('')}</div>
    </div>
  </section>`
}

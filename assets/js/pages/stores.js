/* Street Bazar — Explore Dukanien (All Stores page) */

import { icon, esc, num } from '../ui.js'
import { sectionHead, storeCard } from '../components.js'
import { liveStores, allCategories, storeProducts } from '../store.js'

export async function storesPage(params = {}, query = {}) {
  const activeCat = query.cat || ''
  const q = query.q || ''
  const stores = liveStores()

  return `
  <section class="sec" style="padding-bottom:20px">
    <div class="wrap">
      <span class="kicker">Explore Dukanien</span>
      <h1 class="h1" style="margin-top:12px">Marketplace ke <span class="grad-text">Sab Stores</span></h1>
      <p class="lead" style="margin-top:12px">Explore verified sellers, official brand outlets, and local artisanal dukanien across Pakistan.</p>
      
      <div class="row" style="margin-top:24px;gap:12px;flex-wrap:wrap">
        <div class="hd-search" style="max-width:520px;flex:1;position:relative">
          ${icon('search', '', 17)}
          <input class="input" id="st-search-q" value="${esc(q)}" placeholder="Dukan ka naam, category ya city search karein…" style="padding-left:42px;border-radius:99px">
        </div>
        <a class="btn btn-grad" href="#/create-store">${icon('plus', '', 16)} <span>Apni Dukan Kholain</span></a>
      </div>

      <div class="chip-row" style="margin-top:20px" id="st-cats">
        <button class="chip ${!activeCat ? 'active' : ''}" data-cat="">${icon('grid', '', 14)} All Stores</button>
        ${allCategories().map((c) => `<button class="chip ${activeCat === c ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
      </div>

      <div class="row-between" style="margin-top:20px;flex-wrap:wrap;gap:10px">
        <div class="small muted" id="st-count">${num(stores.length)} stores live</div>
      </div>
    </div>
  </section>

  <section class="sec" style="padding-top:10px">
    <div class="wrap">
      <div id="st-grid-container"></div>
    </div>
  </section>`
}

storesPage.mount = (params, query, root) => {
  let cat = query.cat || ''
  let term = query.q || ''

  const render = () => {
    let list = liveStores()
    if (cat) {
      list = list.filter((s) => s.categories && s.categories.includes(cat))
    }
    if (term) {
      const qLower = term.toLowerCase()
      list = list.filter((s) => 
        s.name.toLowerCase().includes(qLower) || 
        (s.tagline && s.tagline.toLowerCase().includes(qLower)) ||
        (s.city && s.city.toLowerCase().includes(qLower)) ||
        (s.description && s.description.toLowerCase().includes(qLower))
      )
    }

    const container = root.querySelector('#st-grid-container')
    const countEl = root.querySelector('#st-count')
    if (countEl) countEl.textContent = `${num(list.length)} dukanien milein`

    if (!list.length) {
      container.innerHTML = `
        <div class="empty reveal">
          <div class="ic">${icon('store', '', 32)}</div>
          <h3 class="h3">Koi dukan nahi mili</h3>
          <p class="muted">Aap ki search query "${esc(term)}" se matching koi store filhaal active nahi hai.</p>
          <div style="margin-top:16px">
            <button class="btn btn-ghost" id="clear-st-search">Reset search</button>
          </div>
        </div>`
      container.querySelector('#clear-st-search')?.addEventListener('click', () => {
        term = ''
        cat = ''
        const searchInput = root.querySelector('#st-search-q')
        if (searchInput) searchInput.value = ''
        root.querySelectorAll('#st-cats .chip').forEach((x) => x.classList.toggle('active', !x.dataset.cat))
        render()
      })
      return
    }

    container.innerHTML = `
      <div class="grid grid-3 stagger">
        ${list.map(storeCard).join('')}
      </div>`
  }

  render()

  const searchInput = root.querySelector('#st-search-q')
  searchInput?.addEventListener('input', (e) => {
    term = e.target.value
    render()
  })

  root.querySelectorAll('#st-cats .chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      cat = btn.dataset.cat
      root.querySelectorAll('#st-cats .chip').forEach((x) => x.classList.toggle('active', x === btn))
      render()
    })
  })
}


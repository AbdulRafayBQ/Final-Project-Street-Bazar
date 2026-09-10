/* Street Bazar — Wishlist Page */

import { icon, esc, money, num, toast } from '../ui.js'
import { state, likedProducts, toggleLike, productById, addToCart } from '../store.js'
import { productCard } from '../components.js'
import { renderRoute } from '../router.js'

export async function wishlistPage() {
  const likedIds = likedProducts()
  const products = likedIds.map((id) => productById(id)).filter(Boolean)

  if (!products.length) {
    return `<section class="sec"><div class="wrap">
      <div class="empty reveal">
        <div class="ic" style="color:var(--magenta)">${icon('heart', '', 32)}</div>
        <h3 class="h3">Aapki Wishlist khaali hai</h3>
        <p class="muted">Marketplace mein koi bhi product pasand aaye toh heart icon daba kar yahan save karein.</p>
        <div style="margin-top:18px"><a class="btn btn-grad" href="#/explore"><span>Explore products</span> ${icon('arrow', '', 15)}</a></div>
      </div>
    </div></section>`
  }

  return `
  <div class="wrap" style="padding-top:28px;padding-bottom:50px">
    <div class="small muted" style="margin-bottom:14px">
      <a href="#/">Home</a> ${icon('chev', '', 12)} <span>Wishlist</span>
    </div>

    <div class="row-between" style="flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <div>
        <span class="kicker">Saved items</span>
        <h1 class="h1" style="margin-top:8px">Aapki <span class="grad-text">Wishlist</span></h1>
        <p class="muted" style="margin-top:4px">${num(products.length)} product${products.length > 1 ? 's' : ''} saved for later</p>
      </div>
      <a class="btn btn-ghost" href="#/explore">${icon('search', '', 15)} Continue shopping</a>
    </div>

    <div class="grid grid-4 stagger">
      ${products.map(productCard).join('')}
    </div>
  </div>`
}

wishlistPage.mount = (params, query, root) => {
  root.querySelectorAll('[data-like]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const id = btn.dataset.like
      const on = toggleLike(id)
      toast(on ? 'Saved to wishlist' : 'Removed from wishlist')
      renderRoute()
    })
  })

  root.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const id = btn.dataset.add
      const p = productById(id)
      if (!p) return
      addToCart({ product: p.id, qty: 1, options: {}, unitPrice: p.price, image: p.media?.[0]?.url || '' })
      toast(`${p.title} cart mein add ho gaya`, 'ok')
      document.querySelectorAll('[data-cart-count]').forEach((el) => {
        import('../store.js').then(({ cartCount }) => {
          el.textContent = cartCount()
          el.style.display = cartCount() ? 'grid' : 'none'
        })
      })
    })
  })
}

/* Street Bazar — AI Studio (owner + customer AI toolbox) */

import { icon, esc, money, num, toast, timeAgo, spinner, closeModal } from '../ui.js'
import { myStores, storeById, storeProducts, createProduct, addStock, currentUser, state, CATEGORIES, allCategories } from '../store.js'
import { genProductCopy, genTitleOnly, suggestPrice, genStockPlan, genCategorySuggestion, assistantReply, aiStatusText } from '../ai.js'
import { isAIConnected } from '../db.js'
import { navigate } from '../router.js'

const TOOLS = [
  { id: 'copy', label: 'Product copy', icon: 'wand', hint: 'Idea se title + description + tags + price' },
  { id: 'stock', label: 'Bulk stock', icon: 'box', hint: 'Paste list → AI warehouse entries' },
  { id: 'cat', label: 'Category guess', icon: 'grid', hint: 'Sahi category AI choose kare' },
  { id: 'chat', label: 'Store assistant', icon: 'chat', hint: 'Catalog se kuch bhi poochein' },
]

export async function aiStudioPage() {
  const u = currentUser()
  const stores = u ? myStores() : []
  const log = state.aiLog.slice(0, 12)

  return `
  <div class="wrap" style="padding-top:28px">
    <div class="row-between" style="flex-wrap:wrap;gap:16px">
      <div>
        <span class="kicker">AI Studio</span>
        <h1 class="h1" style="margin-top:12px">Store ka <span class="grad-text">apna AI</span>.</h1>
        <p class="lead" style="margin-top:10px">Description, title, tags, price, stock — sab AI se. Phir bhi sab kuch aapke control mein.</p>
      </div>
      <div class="panel" style="padding:14px 18px;box-shadow:var(--shadow-s)">
        <div class="row"><span class="ai-orb">${icon('sparkles', '', 20)}</span>
          <div><b class="small">${isAIConnected() ? 'Live AI connected' : 'Bazar Brain active'}</b>
          <div class="tiny muted">${aiStatusText()}</div></div>
        </div>
      </div>
    </div>

    <div class="chip-row" style="margin-top:24px" data-tools>
      ${TOOLS.map((t, i) => `<button class="chip ${i === 0 ? 'active' : ''}" data-tool="${t.id}">${icon(t.icon, '', 14)} ${t.label}</button>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1.25fr .75fr;gap:24px;align-items:start;margin-top:22px" class="cs-grid">
      <div class="panel" data-tool-body></div>
      <div class="stack">
        <div class="panel">
          <h3 class="h4">AI kya-kya kar leta hai</h3>
          <div class="stack small" style="margin-top:12px">
            ${[
              ['Product description', 'Tone choose karo — Friendly, Premium, Desi Masala…'],
              ['Title & SEO tags', 'Search mein aane wale keywords khud banata hai'],
              ['Smart pricing', 'Category + cost dekh kar market rate suggest'],
              ['Warehouse bulk add', 'Poora stock list paste karo, entries khud ban jayengi'],
              ['Category suggestion', 'Aapki custom category bhi handle karta hai'],
              ['Customer chat', 'Product page par pehla jawab AI deta hai'],
            ].map(([t, d]) => `<div class="row" style="align-items:flex-start"><span style="color:var(--green)">${icon('check', '', 15)}</span><div><b>${t}</b><div class="muted tiny">${d}</div></div></div>`).join('')}
          </div>
        </div>
        <div class="panel">
          <div class="row-between"><h3 class="h4">Usage log</h3><span class="badge badge-soft">${num(state.aiLog.length)} runs</span></div>
          <div class="stack tiny" style="margin-top:12px">
            ${log.length ? log.map((l) => `<div class="row-between"><span class="muted">${esc(l.kind)}</span><span>${esc((l.label || '').slice(0, 24))} · ${timeAgo(l.at)}</span></div>`).join('') : '<span class="muted">Abhi koi AI run nahi.</span>'}
          </div>
        </div>
      </div>
    </div>
  </div>`
}

aiStudioPage.mount = (params, query, root) => {
  const body = root.querySelector('[data-tool-body]')
  const stores = myStores()
  let active = query.tool || 'copy'

  const views = {
    copy: () => `
      <div class="row-between"><h3 class="h3">Product copy generator</h3><span class="badge badge-violet">${icon('sparkles', '', 12)} AI</span></div>
      <p class="muted small" style="margin:8px 0 18px">Sirf idea likhein — AI poora listing copy likh dega.</p>
      <div class="stack">
        <div class="field"><span class="label">Aapka idea</span><textarea class="textarea" id="st-idea" placeholder="e.g. hand-block printed lawn suit, 3 pieces, ghar par bana rahe hain"></textarea></div>
        <div class="grid grid-3" style="gap:12px">
          <div class="field"><span class="label">Category</span><select class="select" id="st-cat">${allCategories().map((c) => `<option>${c}</option>`).join('')}</select></div>
          <div class="field"><span class="label">Tone</span><select class="select" id="st-tone"><option>Friendly</option><option>Premium</option><option>Desi Masala</option><option>Minimal</option><option>Sales Push</option></select></div>
          <div class="field"><span class="label">Store (optional)</span><select class="select" id="st-store"><option value="">— my store —</option>${stores.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
        </div>
        <div class="wrap-flex">
          <button class="btn btn-grad" id="st-run">${icon('sparkles', '', 16)} <span>Generate copy</span></button>
          <button class="ai-chip" id="st-title">${icon('wand', '', 14)} Title only</button>
          <button class="ai-chip" id="st-price">${icon('coins', '', 14)} Suggest price</button>
        </div>
        <div id="st-out"></div>
      </div>`,
    stock: () => `
      <div class="row-between"><h3 class="h3">Bulk stock importer</h3><span class="badge badge-violet">${icon('sparkles', '', 12)} AI</span></div>
      <p class="muted small" style="margin:8px 0 18px">Har line: <b>name, qty, price</b>. AI rows banayega — phir ek click mein warehouse mein daal dein.</p>
      <div class="field"><span class="label">Your list</span>
        <textarea class="textarea" id="bulk-text" placeholder="Cotton Cap Black, 50, 450&#10;Cotton Cap Maroon, 40, 450&#10;Canvas Tote Bag, 25, 1200"></textarea>
      </div>
      <div class="field" style="margin-top:12px"><span class="label">Add to store</span>
        <select class="select" id="bulk-store">${stores.length ? stores.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('') : '<option value="">Create a store first</option>'}</select>
      </div>
      <button class="btn btn-grad" id="bulk-run" style="margin-top:14px">${icon('sparkles', '', 16)} <span>Parse with AI</span></button>
      <div id="bulk-out" style="margin-top:16px"></div>`,
    cat: () => `
      <div class="row-between"><h3 class="h3">Category suggestion</h3><span class="badge badge-violet">${icon('sparkles', '', 12)} AI</span></div>
      <p class="muted small" style="margin:8px 0 18px">Product likhein — AI best categories suggest karega (preset ya aapki custom category).</p>
      <div class="field"><span class="label">Product note</span><input class="input" id="cat-in" placeholder="e.g. handmade ceramic mug with truck art"></div>
      <button class="btn btn-grad" id="cat-run" style="margin-top:12px">${icon('grid', '', 16)} <span>Suggest categories</span></button>
      <div id="cat-out" style="margin-top:16px"></div>`,
    chat: () => `
      <div class="row-between"><h3 class="h3">Store assistant</h3><span class="badge badge-violet">${icon('sparkles', '', 12)} AI</span></div>
      <p class="muted small" style="margin:8px 0 18px">Catalog ke bare mein kuch bhi poochein — sales, follow, budget picks, product details.</p>
      <div class="chatbox" style="height:420px">
        <div class="chat-head"><span class="ai-orb" style="width:34px;height:34px;border-radius:12px">${icon('sparkles', '', 16)}</span>
          <div style="flex:1"><b class="small">Bazar AI</b><div class="sub">${aiStatusText()}</div></div></div>
        <div class="chat-body" data-ai-body>
          <div class="msg ai"><div class="who">Bazar AI</div>Assalam! Main poora catalog jaanta hoon. Poochein — "budget picks", "sale kya chal raha hai" ya koi product naam.<div class="time">abhi</div></div>
        </div>
        <div class="chat-foot"><input class="input" data-ai-input placeholder="Sawaal poochein…"><button class="btn btn-primary" data-ai-send>${icon('send', '', 16)}</button></div>
      </div>`,
  }

  const paint = () => {
    body.innerHTML = views[active]()
    root.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('active', b.dataset.tool === active))
    bind()
  }

  const bind = () => {
    if (active === 'copy') {
      body.querySelector('#st-run').addEventListener('click', async (e) => {
        const idea = body.querySelector('#st-idea').value.trim()
        if (!idea) return toast('Idea likhein', 'err')
        const btn = spinner(e.currentTarget)
        const out = body.querySelector('#st-out')
        out.innerHTML = '<div class="ai-out"><span class="lbl">Writing…</span>Copy ban rahi hai…</div>'
        const cat = body.querySelector('#st-cat').value
        const tone = body.querySelector('#st-tone').value
        const store = storeById(body.querySelector('#st-store').value)
        const price = suggestPrice({ title: idea, category: cat })
        const res = await genProductCopy({ rough: idea, category: cat, storeName: store?.name || 'Street Bazar', tone, price })
        btn()
        out.innerHTML = `
          <div class="ai-out"><span class="lbl">Title</span><b style="font-size:16px">${esc(res.title)}</b></div>
          <div class="ai-out" style="margin-top:10px"><span class="lbl">Description</span>${esc(res.description)}</div>
          <div class="ai-out" style="margin-top:10px"><span class="lbl">Tags & price</span>${esc(res.tags.join(' · '))} — <b>${money(price)}</b></div>
          <div class="wrap-flex" style="margin-top:12px">
            <button class="btn btn-primary btn-sm" id="st-use">${icon('plus', '', 14)} Use in new listing</button>
            <button class="ai-chip" id="st-copy">${icon('copy', '', 13)} Copy text</button>
          </div>`
        out.querySelector('#st-use').addEventListener('click', () => {
          sessionStorage.setItem('sb-ai-draft', JSON.stringify({ title: res.title, description: res.description, tags: res.tags, price, category: cat, store: store?.id || '' }))
          navigate(stores.length ? '#/add-product/' + stores[0].id : '#/create-store')
        })
        out.querySelector('#st-copy').addEventListener('click', async () => {
          await navigator.clipboard?.writeText(res.title + '\n\n' + res.description).catch(() => {})
          toast('Copy clipboard mein', 'ok')
        })
        toast('AI ne copy likh di ✨', 'ai')
      })
      body.querySelector('#st-title').addEventListener('click', async () => {
        const idea = body.querySelector('#st-idea').value.trim()
        if (!idea) return toast('Idea likhein', 'err')
        const t = await genTitleOnly({ rough: idea, category: body.querySelector('#st-cat').value })
        body.querySelector('#st-out').innerHTML = `<div class="ai-out"><span class="lbl">Suggested title</span><b style="font-size:16px">${esc(t)}</b></div>`
      })
      body.querySelector('#st-price').addEventListener('click', () => {
        const idea = body.querySelector('#st-idea').value.trim() || 'product'
        const p = suggestPrice({ title: idea, category: body.querySelector('#st-cat').value })
        body.querySelector('#st-out').innerHTML = `<div class="ai-out"><span class="lbl">Suggested price</span><b style="font-size:18px">${money(p)}</b><br><span class="tiny muted">Compare-at: ${money(Math.round(p * 1.28 / 50) * 50)} · Wholesale 82%: ${money(Math.round(p * 0.82))}</span></div>`
      })
    }

    if (active === 'stock') {
      body.querySelector('#bulk-run').addEventListener('click', async (e) => {
        const raw = body.querySelector('#bulk-text').value.trim()
        const sid = body.querySelector('#bulk-store').value
        if (!raw) return toast('List paste karein', 'err')
        const btn = spinner(e.currentTarget)
        const out = body.querySelector('#bulk-out')
        out.innerHTML = '<div class="ai-out"><span class="lbl">AI reading…</span>Rows ban rahe hain…</div>'
        const { rows, source } = await genStockPlan({ rough: raw, storeName: storeById(sid)?.name || 'your store' })
        btn()
        out.innerHTML = `
          <div class="ai-out"><span class="lbl">${rows.length} rows · ${source === 'live' ? 'live AI' : 'Bazar Brain'}</span>Check kar lein aur warehouse mein add kar dein.</div>
          <div class="table-wrap" style="margin-top:10px"><table style="min-width:auto">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
            <tbody>${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.qty}</td><td>${r.price ? money(r.price) : '—'}</td></tr>`).join('')}</tbody>
          </table></div>
          <button class="btn btn-primary btn-block" id="bulk-apply" style="margin-top:12px" ${sid ? '' : 'disabled'}>${icon('box', '', 15)} <span>Add to warehouse</span></button>`
        out.querySelector('#bulk-apply')?.addEventListener('click', () => {
          rows.forEach((r) => {
            const exists = storeProducts(sid).find((p) => p.title.toLowerCase() === r.name.toLowerCase())
            if (exists) addStock(exists.id, r.qty)
            else createProduct({
              store: sid, title: r.name, description: 'AI bulk import se add hua.', price: r.price || 1200,
              stock: r.qty, sku: r.sku, categories: [storeById(sid)?.categories?.[0] || 'Fashion'], tags: [],
              media: [{ type: 'image', url: './images/p-kurta.png' }],
            })
          })
          toast(rows.length + ' entries warehouse mein add ho gayi', 'ok')
          navigate('#/warehouse/' + sid)
        })
      })
    }

    if (active === 'cat') {
      body.querySelector('#cat-run').addEventListener('click', async () => {
        const note = body.querySelector('#cat-in').value.trim()
        if (!note) return toast('Thoda note likhein', 'err')
        const cats = await genCategorySuggestion({ rough: note, storeName: myStores()[0]?.name || 'your store' })
        body.querySelector('#cat-out').innerHTML = `
          <div class="ai-out"><span class="lbl">AI suggests</span>${cats.map((c) => `<span class="chip static" style="margin:4px 6px 0 0;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);color:#fff">${esc(c)}</span>`).join('')}</div>
          <p class="tiny muted" style="margin-top:10px">Custom category chahiye? Store edit mein ja kar khud likh lein — wo bisi AI ki tarah filter hoti hai.</p>`
      })
    }

    if (active === 'chat') {
      const chatBody = body.querySelector('[data-ai-body]')
      const input = body.querySelector('[data-ai-input]')
      const send = async () => {
        const q = input.value.trim()
        if (!q) return
        input.value = ''
        chatBody.insertAdjacentHTML('beforeend', `<div class="msg me"><div class="who">You</div>${esc(q)}<div class="time">abhi</div></div>`)
        chatBody.insertAdjacentHTML('beforeend', `<div class="msg ai" data-typing><div class="who">Bazar AI</div><span class="typing"><i></i><i></i><i></i></span></div>`)
        chatBody.scrollTop = chatBody.scrollHeight
        const res = await assistantReply({ question: q })
        body.querySelector('[data-typing]')?.remove()
        chatBody.insertAdjacentHTML('beforeend', `<div class="msg ai"><div class="who">Bazar AI · ${res.source === 'live' ? 'live' : 'brain'}</div>${esc(res.text).replace(/\n/g, '<br>')}<div class="time">abhi</div></div>`)
        chatBody.scrollTop = chatBody.scrollHeight
      }
      body.querySelector('[data-ai-send]').addEventListener('click', send)
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send() })
    }
  }

  root.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => { active = b.dataset.tool; paint() }))
  paint()
}

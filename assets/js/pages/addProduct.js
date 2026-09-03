/* Street Bazar — Add / Edit product with AI listing tools */

import { icon, esc, money, toast, spinner, bindMediaPicker, closeModal } from '../ui.js'
import { myStores, storeById, createProduct, updateProduct, productById, currentUser, allCategories, CATEGORIES } from '../store.js'
import { genProductCopy, genTitleOnly, suggestPrice, aiStatusText } from '../ai.js'
import { navigate } from '../router.js'

export async function addProductPage(params) {
  const u = currentUser()
  if (!u) return `<section class="sec"><div class="wrap"><div class="empty"><div class="ic">${icon('user', '', 30)}</div><h3 class="h3">Login required</h3><p class="muted">Product add karne ke liye owner account chahiye.</p><div style="margin-top:16px"><a class="btn btn-grad" href="#/auth"><span>Login</span></a></div></div></div></section>`

  const stores = myStores()
  if (!stores.length) return `<section class="sec"><div class="wrap"><div class="empty"><div class="ic">${icon('store', '', 30)}</div><h3 class="h3">Pehle store banayein</h3><p class="muted">Har product kisi na kisi store par publish hota hai.</p><div style="margin-top:16px"><a class="btn btn-grad" href="#/create-store">${icon('plus', '', 16)} <span>Create your first store</span></a></div></div></div></section>`

  const editing = params.pid ? productById(params.pid) : null
  const preStore = params.storeId && storeById(params.storeId) ? params.storeId : stores[0].id

  return `
  <div class="wrap" style="padding-top:28px">
    <span class="kicker">${editing ? 'Edit product' : 'New listing'}</span>
    <h1 class="h1" style="margin-top:12px">${editing ? 'Product update karein' : 'Product <span class="grad-text">list karein</span>'}</h1>
    <p class="lead" style="margin-top:10px">Details likhein ya sirf idea dein — AI title, description, tags aur price tak likh dega. ${aiStatusText()}</p>

    <div style="display:grid;grid-template-columns:1.15fr .85fr;gap:26px;align-items:start;margin-top:26px" class="cs-grid">
      <div class="stack" style="gap:20px">
        <div class="panel">
          <div class="row-between"><h3 class="h4">1 · AI se likhwao</h3><span class="badge badge-violet">${icon('sparkles', '', 12)} AI</span></div>
          <p class="tiny muted" style="margin:6px 0 14px">Simple Urdu/English mein likhein aap kya bech rahe hain — baqi AI sambhal lega.</p>
          <div class="field"><span class="label">Aapka idea (rough note)</span>
            <textarea class="textarea" id="ai-rough" placeholder="e.g. handmade leather wallet, brown colour, 6 card slots, ghar par bana rahe hain">${editing ? esc(editing.title) : ''}</textarea>
          </div>
          <div class="grid grid-2" style="gap:12px;margin-top:12px">
            <div class="field"><span class="label">Category</span>
              <select class="select" id="ai-cat">${allCategories().map((c) => `<option ${editing?.categories?.includes(c) ? 'selected' : ''}>${c}</option>`).join('')}</select>
            </div>
            <div class="field"><span class="label">Tone</span>
              <select class="select" id="ai-tone">
                <option>Friendly</option><option>Premium</option><option>Desi Masala</option><option>Minimal</option><option>Sales Push</option>
              </select>
            </div>
          </div>
          <div class="wrap-flex" style="margin-top:14px">
            <button class="ai-chip" id="ai-all">${icon('sparkles', '', 14)} Generate everything</button>
            <button class="ai-chip" id="ai-title">${icon('wand', '', 14)} Title only</button>
            <button class="ai-chip" id="ai-price">${icon('coins', '', 14)} Suggest price</button>
            <a class="ai-chip" href="#/warehouse/${stores[0].id}">${icon('box', '', 14)} Bulk stock with AI</a>
          </div>
          <div id="ai-out" style="margin-top:14px"></div>
        </div>

        <div class="panel">
          <h3 class="h4">2 · Listing details</h3>
          <div class="stack" style="margin-top:14px">
            <div class="field"><span class="label">Store *</span>
              <select class="select" id="p-store">${stores.map((s) => `<option value="${s.id}" ${s.id === preStore ? 'selected' : ''}>${esc(s.name)}${s.status !== 'live' ? ' (pending)' : ''}</option>`).join('')}</select>
            </div>
            <div class="field"><span class="label">Product title *</span><input class="input" id="p-title" value="${esc(editing?.title || '')}" placeholder="e.g. Hand-Stitched Leather Wallet"></div>
            <div class="field"><span class="label">Description</span><textarea class="textarea" id="p-desc" style="min-height:150px" placeholder="Features, material, delivery…">${esc(editing?.description || '')}</textarea></div>
            <div class="grid grid-3" style="gap:12px">
              <div class="field"><span class="label">Price (Rs) *</span><input class="input" id="p-price" type="number" min="0" value="${editing?.price || ''}" placeholder="1499"></div>
              <div class="field"><span class="label">Compare-at</span><input class="input" id="p-compare" type="number" min="0" value="${editing?.compareAt || ''}" placeholder="1999"></div>
              <div class="field"><span class="label">Stock *</span><input class="input" id="p-stock" type="number" min="0" value="${editing?.stock ?? ''}" placeholder="50"></div>
            </div>
            <div class="grid grid-2" style="gap:12px">
              <div class="field"><span class="label">SKU (optional)</span><input class="input" id="p-sku" value="${esc(editing?.sku || '')}" placeholder="NA-KUR-01"></div>
              <div class="field"><span class="label">Category *</span>
                <select class="select" id="p-cat">${allCategories().map((c) => `<option ${editing?.categories?.includes(c) ? 'selected' : ''}>${c}</option>`).join('')}</select>
              </div>
            </div>
            <div class="field"><span class="label">Tags (comma separated)</span><input class="input" id="p-tags" value="${esc((editing?.tags || []).join(', '))}" placeholder="handmade, leather, gift"></div>
          </div>
        </div>

        <div class="panel">
          <div class="row-between"><h3 class="h4">3 · Photos & videos</h3><span class="badge badge-soft">Multiple allowed</span></div>
          <p class="tiny muted" style="margin:6px 0 14px">Direct upload ya direct link — video bhi chalega (MP4/WebM).</p>
          <div id="p-media">${mediaMarkup(editing?.media || [])}</div>
        </div>

        <div class="panel">
          <div class="row-between">
            <div><h3 class="h4">4 · Customize by customer</h3><p class="tiny muted" style="margin-top:4px">Size, colour, print, fabric — jo bhi custom ho, customer khud select karega.</p></div>
            <label class="switch"><input type="checkbox" id="cust-on" ${editing?.customizable?.on ? 'checked' : ''}><span class="track"></span></label>
          </div>
          <div id="cust-ui" hidden style="margin-top:16px"></div>
        </div>

        <div class="panel">
          <div class="row-between">
            <div><h3 class="h4">5 · Wholesale</h3><p class="tiny muted" style="margin-top:4px">Bulk quantity par rate kam karein — resellers attract honge.</p></div>
            <label class="switch"><input type="checkbox" id="ws-on" ${editing?.wholesale?.on ? 'checked' : ''}><span class="track"></span></label>
          </div>
          <div id="ws-ui" hidden style="margin-top:16px"></div>
        </div>

        <div class="wrap-flex">
          <button class="btn btn-grad btn-lg" id="p-publish">${icon('store', '', 17)} <span>${editing ? 'Save product' : 'Publish product'}</span></button>
          <a class="btn btn-ghost btn-lg" href="#/dashboard">Cancel</a>
        </div>
      </div>

      <div style="position:sticky;top:calc(var(--header-h) + 16px)">
        <div class="preview-shell">
          <div class="preview-bar"><i></i><i></i><i></i><span style="margin-left:8px">Live card preview</span></div>
          <div style="padding:16px;background:var(--paper)" id="p-preview"></div>
          <div class="preview-note">${icon('info', '', 13)} Ye card customer ko catalogue mein dikhega.</div>
        </div>
      </div>
    </div>
  </div>`
}

function mediaMarkup(list) {
  return `
    <label class="drop" for="p-files">${icon('upload')}<div><b>Upload photos / videos</b></div><div class="hint">JPG, PNG, WEBP, MP4 — multiple select karein</div></label>
    <input type="file" id="p-files" accept="image/*,video/*" multiple hidden>
    <input class="input" id="p-media-url" placeholder="…ya direct link paste karein + Enter" style="margin-top:8px">
    <div class="media-grid" id="p-media-list" style="margin-top:10px"></div>`
}

addProductPage.mount = (params, query, root) => {
  const editing = params.pid ? productById(params.pid) : null
  let media = editing?.media ? [...editing.media.map((m) => ({ ...m }))] : []
  let options = editing?.customizable?.options ? JSON.parse(JSON.stringify(editing.customizable.options)) : [{ name: 'Size', choices: [{ label: 'M', delta: 0 }, { label: 'L', delta: 0 }] }]
  let tiers = editing?.wholesale?.tiers ? [...editing.wholesale.tiers] : [{ qty: 12, price: 0 }]

  bindMediaPicker(root.querySelector('#p-media'), media, (m) => { media = m; paintPreview() })

  /* ---- AI ---- */
  const aiOut = root.querySelector('#ai-out')
  const rough = () => root.querySelector('#ai-rough').value.trim()

  root.querySelector('#ai-all').addEventListener('click', async (e) => {
    const idea = rough()
    if (!idea) return toast('Pehle apna idea likhein', 'err')
    const btn = spinner(e.currentTarget)
    aiOut.innerHTML = '<div class="ai-out"><span class="lbl">AI is writing…</span>Title, description, tags aur price ban rahe hain…</div>'
    const cat = root.querySelector('#ai-cat').value
    const tone = root.querySelector('#ai-tone').value
    const price = suggestPrice({ title: idea, category: cat })
    const res = await genProductCopy({ rough: idea, category: cat, storeName: 'your store', tone, price })
    btn()
    root.querySelector('#p-title').value = res.title
    root.querySelector('#p-desc').value = res.description
    root.querySelector('#p-price').value = price
    root.querySelector('#p-compare').value = Math.round(price * 1.28 / 50) * 50
    if (!root.querySelector('#p-stock').value) root.querySelector('#p-stock').value = 25
    root.querySelector('#p-tags').value = res.tags.join(', ')
    aiOut.innerHTML = `<div class="ai-out"><span class="lbl">AI ready · ${res.source === 'live' ? 'live model' : 'Bazar Brain'}</span>Listing tayyar hai — neeche details check kar lein aur publish karein.</div>`
    toast('AI ne listing likh di ✨', 'ai')
    paintPreview()
  })

  root.querySelector('#ai-title').addEventListener('click', async () => {
    const idea = rough()
    if (!idea) return toast('Pehle idea likhein', 'err')
    const t = await genTitleOnly({ rough: idea, category: root.querySelector('#ai-cat').value })
    root.querySelector('#p-title').value = t
    toast('Title update ho gaya', 'ai')
    paintPreview()
  })

  root.querySelector('#ai-price').addEventListener('click', () => {
    const idea = rough() || root.querySelector('#p-title').value
    const p = suggestPrice({ title: idea, category: root.querySelector('#ai-cat').value })
    root.querySelector('#p-price').value = p
    toast('Suggested price: Rs ' + p.toLocaleString('en-PK'), 'ai')
    paintPreview()
  })

  /* ---- customize options ---- */
  const custOn = root.querySelector('#cust-on')
  const custUI = root.querySelector('#cust-ui')
  const paintCust = () => {
    custUI.hidden = !custOn.checked
    custUI.innerHTML = custOn.checked ? `
      <div class="stack">
        ${options.map((o, oi) => `
          <div class="opt-box" style="background:var(--paper)">
            <div class="row-between">
              <input class="input" data-opt-name="${oi}" value="${esc(o.name)}" placeholder="Option name (Size, Colour…)" style="max-width:260px;font-weight:700">
              <button class="icon-btn" data-opt-del="${oi}">${icon('trash', '', 16)}</button>
            </div>
            <div class="stack" style="margin-top:10px">
              ${o.choices.map((c, ci) => `<div class="row" style="gap:8px">
                <input class="input" data-c-label="${oi}:${ci}" value="${esc(c.label)}" placeholder="Choice (XL, Maroon…)">
                <input class="input" type="number" data-c-delta="${oi}:${ci}" value="${c.delta}" placeholder="0" style="max-width:120px" title="Price delta">
                <button class="icon-btn" data-c-del="${oi}:${ci}">${icon('x', '', 15)}</button>
              </div>`).join('')}
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:10px" data-c-add="${oi}">${icon('plus', '', 14)} Add choice</button>
          </div>`).join('')}
        <button class="btn btn-ghost" data-opt-add>${icon('plus', '', 15)} Add option group</button>
        <p class="tiny muted">Price delta = us choice par kitna extra lagega (0 = free).</p>
      </div>` : ''
    bindCust()
  }
  const bindCust = () => {
    custUI.querySelectorAll('[data-opt-name]').forEach((i) => i.addEventListener('input', () => { options[Number(i.dataset.optName)].name = i.value }))
    custUI.querySelectorAll('[data-c-label]').forEach((i) => i.addEventListener('input', () => { const [a, b] = i.dataset.cLabel.split(':'); options[+a].choices[+b].label = i.value }))
    custUI.querySelectorAll('[data-c-delta]').forEach((i) => i.addEventListener('input', () => { const [a, b] = i.dataset.cDelta.split(':'); options[+a].choices[+b].delta = Number(i.value) || 0 }))
    custUI.querySelectorAll('[data-c-add]').forEach((b) => b.addEventListener('click', () => { options[Number(b.dataset.cAdd)].choices.push({ label: 'New choice', delta: 0 }); paintCust() }))
    custUI.querySelectorAll('[data-c-del]').forEach((b) => b.addEventListener('click', () => { const [a, c] = b.dataset.cDel.split(':'); options[+a].choices.splice(+c, 1); paintCust() }))
    custUI.querySelectorAll('[data-opt-del]').forEach((b) => b.addEventListener('click', () => { options.splice(Number(b.dataset.optDel), 1); paintCust() }))
    custUI.querySelector('[data-opt-add]')?.addEventListener('click', () => { options.push({ name: 'Option', choices: [{ label: 'Choice 1', delta: 0 }] }); paintCust() })
  }
  custOn.addEventListener('change', paintCust)
  paintCust()

  /* ---- wholesale ---- */
  const wsOn = root.querySelector('#ws-on')
  const wsUI = root.querySelector('#ws-ui')
  const paintWs = () => {
    wsUI.hidden = !wsOn.checked
    if (!wsOn.checked) return
    const price = Number(root.querySelector('#p-price').value) || 0
    wsUI.innerHTML = `
      <div class="stack">
        ${tiers.map((t, i) => `<div class="row" style="gap:8px">
          <div class="field" style="flex:1"><span class="label">Min quantity</span><input class="input" type="number" data-t-qty="${i}" value="${t.qty}"></div>
          <div class="field" style="flex:1"><span class="label">Wholesale price</span><input class="input" type="number" data-t-price="${i}" value="${t.price || Math.round(price * 0.82)}"></div>
          <button class="icon-btn" style="margin-top:20px" data-t-del="${i}">${icon('trash', '', 15)}</button>
        </div>`).join('')}
        <button class="btn btn-ghost btn-sm" data-t-add>${icon('plus', '', 14)} Add tier</button>
      </div>`
    wsUI.querySelectorAll('[data-t-qty]').forEach((i) => i.addEventListener('input', () => { tiers[+i.dataset.tQty].qty = Number(i.value) || 1 }))
    wsUI.querySelectorAll('[data-t-price]').forEach((i) => i.addEventListener('input', () => { tiers[+i.dataset.tPrice].price = Number(i.value) || 0 }))
    wsUI.querySelectorAll('[data-t-del]').forEach((b) => b.addEventListener('click', () => { tiers.splice(Number(b.dataset.tDel), 1); paintWs() }))
    wsUI.querySelector('[data-t-add]')?.addEventListener('click', () => { tiers.push({ qty: 25, price: 0 }); paintWs() })
  }
  wsOn.addEventListener('change', paintWs)
  paintWs()

  /* ---- live preview ---- */
  const preview = root.querySelector('#p-preview')
  const paintPreview = () => {
    const title = root.querySelector('#p-title').value || 'Your product title'
    const price = Number(root.querySelector('#p-price').value) || 0
    const compare = Number(root.querySelector('#p-compare').value) || 0
    const img = media.find((m) => m.type === 'image')?.url || './images/p-kurta.png'
    const off = compare > price ? Math.round((1 - price / compare) * 100) : 0
    const store = storeById(root.querySelector('#p-store').value)
    preview.innerHTML = `
      <article class="pcard">
        <div class="pcard-media">
          <img src="${esc(img)}" alt="" onerror="this.src='./images/p-kurta.png'">
          <div class="pcard-badges">${off ? `<span class="badge badge-sale">${off}% OFF</span>` : ''}${custOn.checked ? `<span class="badge badge-violet">Custom</span>` : ''}${wsOn.checked ? `<span class="badge badge-teal">Wholesale</span>` : ''}</div>
        </div>
        <div class="pcard-body">
          <div class="pcard-store"><i class="live-dot"></i> ${esc(store?.name || 'Your store')}</div>
          <div class="pcard-title">${esc(title)}</div>
          <div class="pcard-price"><span class="price">${money(price)}</span>${compare > price ? `<span class="price-old">${money(compare)}</span>` : ''}</div>
          <button class="btn btn-primary btn-sm pcard-add">Add to cart</button>
        </div>
      </article>`
  }
  ;['#p-title', '#p-price', '#p-compare', '#p-store'].forEach((sel) => root.querySelector(sel).addEventListener('input', paintPreview))
  root.querySelector('#p-store').addEventListener('change', paintPreview)
  paintPreview()

  /* ---- publish ---- */
  root.querySelector('#p-publish').addEventListener('click', async (e) => {
    const title = root.querySelector('#p-title').value.trim()
    const price = Number(root.querySelector('#p-price').value)
    const stock = Number(root.querySelector('#p-stock').value)
    if (!title) return toast('Title zaroori hai', 'err')
    if (!price) return toast('Price dalna zaroori hai', 'err')
    if (root.querySelector('#p-stock').value === '') return toast('Stock likhein (0 bhi chalega)', 'err')
    const btn = spinner(e.currentTarget)
    await new Promise((r) => setTimeout(r, 500))
    const data = {
      store: root.querySelector('#p-store').value,
      title,
      description: root.querySelector('#p-desc').value.trim(),
      price, compareAt: Number(root.querySelector('#p-compare').value) || null,
      stock, sku: root.querySelector('#p-sku').value.trim(),
      categories: [root.querySelector('#p-cat').value],
      tags: root.querySelector('#p-tags').value.split(',').map((t) => t.trim()).filter(Boolean),
      media: media.length ? media : [{ type: 'image', url: './images/p-kurta.png' }],
      customizable: { on: custOn.checked, options: custOn.checked ? options.filter((o) => o.name && o.choices.length) : [] },
      wholesale: { on: wsOn.checked, tiers: wsOn.checked ? tiers : [] },
    }
    if (editing) { updateProduct(editing.id, data); btn(); toast('Product update ho gaya', 'ok'); navigate('#/product/' + editing.id) }
    else {
      const p = createProduct(data)
      btn()
      toast('Product live ho gaya 🎉', 'ok')
      navigate('#/product/' + p.id)
    }
  })
}

/* Street Bazar — Create / Edit Store wizard with live interface preview */

import { icon, esc, money, toast, modal, closeModal, readFile, themeStyle, spinner } from '../ui.js'
import { THEME_PRESETS, FONT_PAIRS, STORE_TYPES, CATEGORIES, createStore, updateStore, storeById, currentUser, allCategories } from '../store.js'
import { navigate } from '../router.js'

const STEPS = ['Basics', 'Design & fonts', 'Branding', 'Categories & links', 'Preview & publish']

let draft = null

function blank() {
  return {
    name: '', tagline: '', type: 'home', city: '', address: '', description: '',
    logo: '', banner: '', themeId: 'bazaar',
    theme: { ...THEME_PRESETS[0] },
    categories: [], socials: { instagram: '', whatsapp: '', tiktok: '', facebook: '', youtube: '' },
    sale: { text: '', until: '' },
  }
}

export async function createStorePage(params) {
  const editing = params.id ? storeById(params.id) : null
  draft = editing ? {
    name: editing.name, tagline: editing.tagline, type: editing.type, city: editing.city, address: editing.address,
    description: editing.description, logo: editing.logo, banner: editing.banner,
    themeId: editing.theme?.id || 'bazaar', theme: { ...editing.theme },
    categories: [...(editing.categories || [])], socials: { instagram: '', whatsapp: '', tiktok: '', facebook: '', youtube: '', ...(editing.socials || {}) },
    sale: editing.sale ? { text: editing.sale.text, until: new Date(editing.sale.until).toISOString().slice(0, 10) } : { text: '', until: '' },
  } : blank()

  if (!currentUser()) {
    return `<section class="sec"><div class="wrap">
      <div class="empty reveal"><div class="ic">${icon('user', '', 30)}</div><h3 class="h3">Pehle login karein</h3>
      <p class="muted">Store banane ke liye account chahiye — 30 second main ban jata hai.</p>
      <div style="margin-top:18px"><a class="btn btn-grad" href="#/auth"><span>Continue to login</span> ${icon('arrow', '', 15)}</a></div></div>
    </div></section>`
  }

  return `
  <div class="wrap" style="padding-top:28px">
    <span class="kicker">${editing ? 'Edit store' : 'Store setup'}</span>
    <h1 class="h1" style="margin-top:12px">${editing ? 'Update aapka store' : 'Apna bazaar <span class="grad-text">kholein</span>'}</h1>
    <p class="lead" style="margin-top:10px">Har detail live neeche preview mein dikhti jayegi. Jab sab theek lagay — "See interface of your store" dekh kar publish kar dein.</p>

    <div class="steps" style="margin-top:26px" data-steps>
      ${STEPS.map((s, i) => `<div class="step ${i === 0 ? 'active' : ''}" data-step="${i}"><span class="num">${i + 1}</span>${s}</div>${i < STEPS.length - 1 ? '<span class="step-line"></span>' : ''}`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1.05fr .95fr;gap:26px;align-items:start" class="cs-grid">
      <div class="panel" data-form></div>
      <div style="position:sticky;top:calc(var(--header-h) + 16px)">
        <div class="preview-shell">
          <div class="preview-bar"><i></i><i></i><i></i><span style="margin-left:8px">streetbazar.pk/store/preview</span></div>
          <div class="preview-body" data-preview></div>
          <div class="preview-note">${icon('eye', '', 13)} Live preview — jaisa dikh raha hai waisa hi store khulega (mobile par bhi responsive).</div>
        </div>
        <button class="btn btn-ghost btn-block" style="margin-top:12px" data-see-interface>${icon('eye', '', 16)} See interface of your store</button>
      </div>
    </div>
  </div>`
}

createStorePage.mount = (params, query, root) => {
  let step = 0
  const form = root.querySelector('[data-form]')
  const preview = root.querySelector('[data-preview]')
  const stepEls = root.querySelectorAll('[data-step]')

  const renderPreview = () => {
    const t = draft.theme
    preview.innerHTML = `
      <div class="store-page ${t.dark ? 'dark' : ''}" style="margin:0;border-radius:0;border:0;box-shadow:none;${themeStyle(t)};--st-d:${FONT_PAIRS.find((f) => f.id === t.fontPair)?.d};--st-b:${FONT_PAIRS.find((f) => f.id === t.fontPair)?.b}">
        <div class="store-hero" style="min-height:150px">
          <img class="bg" src="${esc(draft.banner || './images/banner-fashion.png')}" alt="" onerror="this.src='./images/banner-fashion.png'">
          <div class="store-hero-in" style="padding:16px">
            <span class="store-logo" style="width:60px;height:60px;font-size:20px">${draft.logo ? `<img src="${esc(draft.logo)}" alt="">` : esc((draft.name || 'SB').slice(0, 2).toUpperCase())}</span>
            <div>
              <h1 style="font-size:22px;color:#fff">${esc(draft.name || 'Your Store Name')}</h1>
              <p class="tiny" style="color:rgba(255,255,255,.8);margin-top:4px">${esc(draft.tagline || 'Aapka tagline yahan aayega')}</p>
            </div>
          </div>
        </div>
        <div class="store-tabs" style="position:static;padding:10px 14px">
          <button class="active">Products</button><button>About</button><button>Reviews</button><button>Chat</button>
        </div>
        <div style="padding:14px">
          <div class="wrap-flex" style="margin-bottom:12px">
            ${(draft.categories.length ? draft.categories : ['Your category']).slice(0, 4).map((c) => `<span class="chip static tiny">${esc(c)}</span>`).join('')}
          </div>
          <div class="grid grid-auto-sm">
            ${['./images/p-kurta.png', './images/p-cover.png', './images/p-chai.png'].map((img, i) => `
              <div class="pcard" style="border-radius:14px">
                <div class="pcard-media" style="aspect-ratio:4/3"><img src="${img}" alt=""></div>
                <div class="pcard-body" style="padding:10px">
                  <div class="pcard-title" style="font-size:13px">${['Sample Product One', 'Sample Product Two', 'Sample Product Three'][i]}</div>
                  <div class="pcard-price"><span class="price" style="font-size:14px">${money(1999 + i * 700)}</span></div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>`
  }

  const fields = {
    basics: () => `
      <h3 class="h3">Store basics</h3>
      <p class="muted small" style="margin:8px 0 20px">Ye details store page par publicly dikhegi.</p>
      <div class="stack">
        <div class="field"><span class="label">Store name *</span><input class="input" data-f="name" value="${esc(draft.name)}" placeholder="e.g. Noor Attire"></div>
        <div class="field"><span class="label">Tagline</span><input class="input" data-f="tagline" value="${esc(draft.tagline)}" placeholder="Ek line mein batao kya bechte ho"></div>
        <div class="field">
          <span class="label">Store type * — kaise chalate hain?</span>
          <div class="grid grid-2" style="gap:10px" data-types>
            ${STORE_TYPES.map((t) => `<button type="button" class="check ${draft.type === t.id ? 'on' : ''}" data-type="${t.id}">
              <span class="tick"></span>
              <span>${icon(t.icon, '', 16)} <b>${t.label}</b><br><span class="tiny muted" style="font-weight:500">${t.hint}</span></span>
            </button>`).join('')}
          </div>
        </div>
        <div class="grid grid-2" style="gap:12px">
          <div class="field"><span class="label">City</span><input class="input" data-f="city" value="${esc(draft.city)}" placeholder="Lahore"></div>
          <div class="field"><span class="label">Address / pickup point</span><input class="input" data-f="address" value="${esc(draft.address)}" placeholder="Shop 12, Main Boulevard"></div>
        </div>
        <div class="field"><span class="label">Store description</span><textarea class="textarea" data-f="description" placeholder="Aur detail mein batao — materials, timing, packing…">${esc(draft.description)}</textarea></div>
        <div class="pill-note">${icon('info', '', 14)} Home business ho toh bhi store bilkul normal dikhega — sirf type badge alag hoga.</div>
      </div>`,
    design: () => `
      <h3 class="h3">Design & fonts</h3>
      <p class="muted small" style="margin:8px 0 20px">Theme chunein ya khud colors mix karein. Sab kuch live preview mein dikhta hai.</p>
      <div class="grid grid-3" style="gap:12px" data-presets>
        ${THEME_PRESETS.map((t) => `
          <div class="theme-preview ${draft.themeId === t.id ? 'on' : ''}" data-preset="${t.id}">
            <div class="tp-top" style="background:linear-gradient(120deg,${t.primary},${t.accent})"></div>
            <div class="tp-in" style="background:${t.bg}">
              <div class="tp-line w60"></div><div class="tp-line w40"></div>
              <div class="tp-btn" style="background:${t.primary}"></div>
            </div>
            <div class="tiny muted" style="padding:0 12px 10px;font-weight:700">${t.name}${t.dark ? ' · dark' : ''}</div>
          </div>`).join('')}
      </div>
      <div class="divider"></div>
      <div class="grid grid-3" style="gap:14px">
        <div class="field"><span class="label">Primary colour</span><input type="color" data-color="primary" value="${draft.theme.primary}" style="width:100%;height:46px;border-radius:12px;border:1px solid var(--line);background:#fff"></div>
        <div class="field"><span class="label">Accent colour</span><input type="color" data-color="accent" value="${draft.theme.accent}" style="width:100%;height:46px;border-radius:12px;border:1px solid var(--line);background:#fff"></div>
        <div class="field"><span class="label">Background</span><input type="color" data-color="bg" value="${draft.theme.bg}" style="width:100%;height:46px;border-radius:12px;border:1px solid var(--line);background:#fff"></div>
      </div>
      <div class="grid grid-2" style="gap:14px;margin-top:16px">
        <div class="field"><span class="label">Font pair</span>
          <select class="select" data-f="fontPair">
            ${FONT_PAIRS.map((f) => `<option value="${f.id}" ${draft.theme.fontPair === f.id ? 'selected' : ''}>${f.name}</option>`).join('')}
          </select>
        </div>
        <div class="field"><span class="label">Corner style — <span data-radius-val>${draft.theme.radius}px</span></span>
          <input type="range" min="4" max="28" value="${draft.theme.radius}" data-radius style="width:100%;accent-color:var(--marigold)">
        </div>
      </div>
      <label class="switch" style="margin-top:16px"><input type="checkbox" data-dark ${draft.theme.dark ? 'checked' : ''}><span class="track"></span><span><b>Dark store theme</b><br><span class="tiny muted">Raat ke vibe ke liye — text automatically adjust hota hai.</span></span></label>`,
    branding: () => `
      <h3 class="h3">Logo, banner & sale ad</h3>
      <p class="muted small" style="margin:8px 0 20px">Direct image upload karein ya link paste karein — dono chalte hain.</p>
      <div class="stack">
        <div class="field"><span class="label">Logo</span>
          <label class="drop" for="logo-in">${icon('image')}<div><b>Upload logo</b></div><div class="hint">Square image best lagta hai (PNG/JPG/WEBP)</div></label>
          <input type="file" id="logo-in" accept="image/*" hidden>
          <div class="row" style="margin-top:8px"><input class="input" data-url="logo" placeholder="…ya direct image link" value="${esc(draft.logo)}">${draft.logo ? `<img src="${esc(draft.logo)}" alt="" style="width:46px;height:46px;border-radius:12px;object-fit:cover;border:1px solid var(--line)">` : ''}</div>
        </div>
        <div class="field"><span class="label">Banner</span>
          <label class="drop" for="banner-in">${icon('image')}<div><b>Upload banner</b></div><div class="hint">Wide image (16:9) — store ke top par dikhta hai</div></label>
          <input type="file" id="banner-in" accept="image/*" hidden>
          <div class="row" style="margin-top:8px"><input class="input" data-url="banner" placeholder="…ya direct image link" value="${esc(draft.banner)}">${draft.banner ? `<img src="${esc(draft.banner)}" alt="" style="width:64px;height:40px;border-radius:8px;object-fit:cover;border:1px solid var(--line)">` : ''}</div>
        </div>
        <div class="divider"></div>
        <h4 class="h4">Sale ad (optional)</h4>
        <p class="tiny muted">Agar store par sale hai toh homepage par ad card ban jayega.</p>
        <div class="field"><span class="label">Sale text</span><input class="input" data-sale="text" value="${esc(draft.sale.text)}" placeholder="e.g. Eid Sale — 30% OFF"></div>
        <div class="field"><span class="label">Sale ends</span><input type="date" class="input" data-sale="until" value="${esc(draft.sale.until)}"></div>
      </div>`,
    links: () => `
      <h3 class="h3">Categories & social links</h3>
      <p class="muted small" style="margin:8px 0 20px">Preset category chunein — ya neeche likh kar <b>khud ki category</b> banayein.</p>
      <div class="chip-row" data-cats>
        ${allCategories().map((c) => `<button type="button" class="chip ${draft.categories.includes(c) ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
      </div>
      <div class="row" style="margin-top:12px;gap:8px">
        <input class="input" data-new-cat placeholder="Apni category likhein (e.g. Phone Covers)">
        <button class="btn btn-ghost" data-add-cat>${icon('plus', '', 15)} Add</button>
      </div>
      <div class="divider"></div>
      <div class="stack">
        ${Object.keys(draft.socials).map((k) => `
          <div class="field"><span class="label">${icon(k === 'whatsapp' ? 'whatsapp' : k === 'instagram' ? 'instagram' : k === 'tiktok' ? 'tiktok' : k === 'facebook' ? 'facebook' : 'youtube', '', 13)} ${k} link</span>
            <input class="input" data-social="${k}" value="${esc(draft.socials[k] || '')}" placeholder="https://${k === 'whatsapp' ? 'wa.me/92300…' : k + '.com/yourhandle'}"></div>`).join('')}
      </div>`,
    publish: () => `
      <h3 class="h3">Ready to go live?</h3>
      <p class="muted small" style="margin:8px 0 20px">Publish se pehle "See interface of your store" dekh lein. Admin approval ke baad store public ho jayega — apni listing pehle se bana sakte hain.</p>
      <div class="panel" style="background:var(--paper-2);box-shadow:none">
        <div class="stack small">
          <div class="row-between"><span class="muted">Store name</span><b>${esc(draft.name || '—')}</b></div>
          <div class="row-between"><span class="muted">Type</span><b>${STORE_TYPES.find((t) => t.id === draft.type)?.label}</b></div>
          <div class="row-between"><span class="muted">Theme</span><b>${esc(draft.theme.name)}${draft.theme.dark ? ' · dark' : ''}</b></div>
          <div class="row-between"><span class="muted">Fonts</span><b>${FONT_PAIRS.find((f) => f.id === draft.theme.fontPair)?.name}</b></div>
          <div class="row-between"><span class="muted">Categories</span><b>${draft.categories.length ? esc(draft.categories.join(', ')) : '—'}</b></div>
          <div class="row-between"><span class="muted">Social links</span><b>${Object.values(draft.socials).filter(Boolean).length}</b></div>
          <div class="row-between"><span class="muted">Sale ad</span><b>${draft.sale.text ? esc(draft.sale.text) : 'None'}</b></div>
        </div>
      </div>
      <div class="pill-note" style="margin-top:16px">${icon('shield', '', 14)} Aapka store admin review ke baad "Live" hoga. Aap tab tak bhi products add kar sakte hain.</div>
      <div class="wrap-flex" style="margin-top:22px">
        <button class="btn btn-grad btn-lg" data-publish>${icon('store', '', 17)} <span>${params.id ? 'Save changes' : 'Publish store'}</span></button>
        <button class="btn btn-ghost btn-lg" data-see-interface>${icon('eye', '', 16)} See interface</button>
      </div>`,
  }

  let paint = () => {
    form.innerHTML = fields[Object.keys(fields)[step]]()
    stepEls.forEach((el, i) => {
      el.classList.toggle('active', i === step)
      el.classList.toggle('done', i < step)
    })
    bindForm()
    form.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  const bindForm = () => {
    form.querySelectorAll('[data-f]').forEach((inp) => inp.addEventListener('input', () => {
      const k = inp.dataset.f
      if (k === 'fontPair') { draft.theme.fontPair = inp.value; draft.themeId = (THEME_PRESETS.find((t) => t.id === draft.themeId) || THEME_PRESETS[0]).id }
      else draft[k] = inp.value
      renderPreview()
    }))
    form.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => {
      draft.type = b.dataset.type
      form.querySelectorAll('[data-type]').forEach((x) => x.classList.toggle('on', x === b))
      renderPreview()
    }))
    form.querySelectorAll('[data-preset]').forEach((el) => el.addEventListener('click', () => {
      const t = THEME_PRESETS.find((x) => x.id === el.dataset.preset)
      draft.themeId = t.id
      draft.theme = { ...t }
      paint()
      renderPreview()
    }))
    form.querySelectorAll('[data-color]').forEach((inp) => inp.addEventListener('input', () => {
      draft.theme[inp.dataset.color] = inp.value
      draft.themeId = 'custom'
      renderPreview()
    }))
    form.querySelector('[data-radius]')?.addEventListener('input', (e) => {
      draft.theme.radius = Number(e.target.value)
      form.querySelector('[data-radius-val]').textContent = e.target.value + 'px'
      renderPreview()
    })
    form.querySelector('[data-dark]')?.addEventListener('change', (e) => {
      draft.theme.dark = e.target.checked
      renderPreview()
    })
    const bindUpload = (id, key) => {
      const inp = form.querySelector('#' + id)
      inp?.addEventListener('change', async () => {
        const f = inp.files?.[0]
        if (!f) return
        draft[key] = await readFile(f)
        toast(key === 'logo' ? 'Logo lag gaya' : 'Banner lag gaya')
        paint(); renderPreview()
      })
    }
    bindUpload('logo-in', 'logo')
    bindUpload('banner-in', 'banner')
    form.querySelectorAll('[data-url]').forEach((inp) => inp.addEventListener('change', () => {
      draft[inp.dataset.url] = inp.value.trim()
      renderPreview()
    }))
    form.querySelectorAll('[data-sale]').forEach((inp) => inp.addEventListener('input', () => { draft.sale[inp.dataset.sale] = inp.value }))
    form.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
      const c = b.dataset.cat
      const i = draft.categories.indexOf(c)
      if (i >= 0) draft.categories.splice(i, 1)
      else draft.categories.push(c)
      b.classList.toggle('active', draft.categories.includes(c))
      renderPreview()
    }))
    form.querySelector('[data-add-cat]')?.addEventListener('click', () => {
      const inp = form.querySelector('[data-new-cat]')
      const v = inp.value.trim()
      if (!v) return toast('Category ka naam likhein', 'err')
      if (!draft.categories.includes(v)) draft.categories.push(v)
      inp.value = ''
      paint(); renderPreview()
      toast(`Custom category "${v}" add ho gayi`, 'ok')
    })
    form.querySelectorAll('[data-social]').forEach((inp) => inp.addEventListener('input', () => { draft.socials[inp.dataset.social] = inp.value.trim() }))
    form.querySelector('[data-publish]')?.addEventListener('click', onPublish)
    form.querySelector('[data-see-interface]')?.addEventListener('click', seeInterface)
  }

  const seeInterface = () => {
    modal({
      title: `${icon('eye', '', 17)} Interface of your store`,
      wide: true,
      body: `<div style="border-radius:var(--r-m);overflow:hidden;border:1px solid var(--line)">
        <div class="preview-bar"><i></i><i></i><i></i><span style="margin-left:8px">${esc((draft.name || 'your-store').toLowerCase().replace(/[^a-z0-9]+/g, '-'))}</span></div>
        <div style="max-height:66vh;overflow:auto">${preview.innerHTML}</div>
      </div>
      <div class="pill-note" style="margin-top:14px">${icon('info', '', 14)} Ye bilkul wahi interface hai jo customer ko dikhega — colors, fonts aur layout ke sath.</div>`,
      foot: `<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-grad" data-publish-from-modal><span>${params.id ? 'Save changes' : 'Publish store'}</span></button>`,
      onOpen: (el) => el.querySelector('[data-publish-from-modal]').addEventListener('click', () => { closeModal(); onPublish() }),
    })
  }

  const onPublish = async (e) => {
    if (!draft.name.trim()) return toast('Store ka naam zaroori hai', 'err')
    const btn = e?.currentTarget || form.querySelector('[data-publish]')
    const done = btn ? spinner(btn) : () => {}
    await new Promise((r) => setTimeout(r, 650))
    const data = {
      ...draft,
      sale: draft.sale.text ? { text: draft.sale.text, until: draft.sale.until ? new Date(draft.sale.until).getTime() : Date.now() + 7 * 86400000 } : null,
    }
    if (params.id) {
      updateStore(params.id, data)
      done()
      toast('Store update ho gaya', 'ok')
      navigate('#/store/' + storeById(params.id).slug)
    } else {
      const s = createStore(data)
      done()
      toast('Store ban gaya! Admin approval ke baad live ho jayega 🎉', 'ok')
      navigate('#/store/' + s.slug)
    }
  }

  root.querySelectorAll('[data-step]').forEach((el) => el.addEventListener('click', () => { step = Number(el.dataset.step); paint() }))
  root.querySelector('[data-see-interface]').addEventListener('click', seeInterface)

  // step navigation buttons inside form
  form.addEventListener('click', (e) => {
    const next = e.target.closest('[data-next]')
    const prev = e.target.closest('[data-prev]')
    if (next) { step = Math.min(STEPS.length - 1, step + 1); paint() }
    if (prev) { step = Math.max(0, step - 1); paint() }
  })

  const navBar = () => `<div class="row-between" style="margin-top:24px">
    ${step > 0 ? `<button class="btn btn-ghost" data-prev>${icon('chev', '', 15)} Back</button>` : '<span></span>'}
    ${step < STEPS.length - 1 ? `<button class="btn btn-primary" data-next><span>Continue</span> ${icon('arrow', '', 15)}</button>` : ''}
  </div>`
  const origPaint = paint
  paint = () => { origPaint(); form.insertAdjacentHTML('beforeend', navBar()) }

  paint()
  renderPreview()
}

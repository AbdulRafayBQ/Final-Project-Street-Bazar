/* Street Bazar — UI toolkit: icons, DOM helpers, toasts, modals */

export const $ = (s, r = document) => r.querySelector(s)
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s))

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
export const money = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK')
export const num = (n) => Number(n || 0).toLocaleString('en-PK')
export const uid = (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
export const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
export const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n))
export const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } }

export function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return m + 'm ago'
  const h = Math.floor(m / 60); if (h < 24) return h + 'h ago'
  const d = Math.floor(h / 24); if (d < 30) return d + 'd ago'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
export const dateStr = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
export const timeStr = (ts) => new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/* ---------------- icons ---------------- */
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  cart: '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/>',
  store: '<path d="M3 9 4.5 4h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  sparkles: '<path d="m12 3 1.9 4.6 4.6 1.9-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9Z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.9 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 15.9a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 6.6V6a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1Z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 13 4 4 10-10"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>',
  heart: '<path d="M12 20s-7-4.4-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7C19 15.6 12 20 12 20Z"/>',
  truck: '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  chevd: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-4 4 3 3-2 4 3"/>',
  video: '<rect x="3" y="6" width="12" height="12" rx="3"/><path d="m15 11 6-3v8l-6-3z"/>',
  trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L20 8l-4-4L4 16Z"/><path d="m14 6 4 4"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.7 0 2-1 1.4-2-.7-1.2 0-2 1.2-2H17a4 4 0 0 0 4-4c0-5-4-10-9-10Z"/><circle cx="8" cy="10" r="1.3"/><circle cx="12" cy="7.5" r="1.3"/><circle cx="16" cy="10" r="1.3"/>',
  trend: '<path d="m3 16 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 7 5 5-5 5"/><path d="M21 12H9"/>',
  google: '<path fill="#4285F4" stroke="none" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z"/><path fill="#34A853" stroke="none" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" stroke="none" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z"/><path fill="#EA4335" stroke="none" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/>',
  whatsapp: '<path d="M3.5 20.5 5 16.6A8.3 8.3 0 1 1 8.2 19.6Z"/><path d="M9 9.5c.4 2.6 2.9 5 5.5 5.4"/>',
  tiktok: '<path d="M15 4c.6 2.3 2.2 3.6 4.5 3.8v3c-1.7 0-3.2-.5-4.5-1.4v5.9a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 1 0 1.7 2.4V4Z"/>',
  facebook: '<path d="M14 8h3V4.6h-3c-2.2 0-4 1.8-4 4V12H7v3.4h3V22h3.5v-6.6H17l.6-3.4h-4.1V8.9c0-.6.4-1 .5-.9Z"/>',
  youtube: '<rect x="3" y="6" width="18" height="12" rx="4"/><path d="m11 10 4 2-4 2z"/>',
  eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.6"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="3"/><path d="M6 15H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  tag: '<path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9Z"/><circle cx="8" cy="8" r="1.6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>',
  bell: '<path d="M18 16H6l1.5-2.2V10a4.5 4.5 0 0 1 9 0v3.8Z"/><path d="M10.5 19a1.8 1.8 0 0 0 3 0"/>',
  coins: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 4v4h-4"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 20v-4h4"/>',
  download: '<path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
  upload: '<path d="M12 20V9"/><path d="m7 13 5-5 5 5"/><path d="M4 4h16"/>',
  send: '<path d="m4 12 16-8-6 16-2.5-6Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/>',
  warning: '<path d="M12 4 3 20h18Z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>',
  badge: '<path d="M12 3l2.5 2 3.2-.4 1 3 2.8 1.6-1.4 2.9 1.4 2.9-2.8 1.6-1 3-3.2-.4-2.5 2-2.5-2-3.2.4-1-3L2.5 16l1.4-2.9L2.5 10l2.8-1.6 1-3 3.2.4Z"/><path d="m9 12 2 2 4-4"/>',
  sliders: '<path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1.4"/><circle cx="4" cy="12" r="1.4"/><circle cx="4" cy="18" r="1.4"/>',
  bank: '<path d="M3 10 12 4l9 6"/><path d="M5 10v9M19 10v9M9 10v9M15 10v9"/><path d="M3 21h18"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z"/>',
  wand: '<path d="m15 4 5 5L9 20l-5-5Z"/><path d="M13 6l5 5"/><path d="M5 3v3M3.5 4.5h3M19 15v3M17.5 16.5h3"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8Z"/>',
  scale: '<path d="M12 4v16M6 8h12"/><path d="m6 8-3 6h6ZM18 8l-3 6h6Z"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 19h2v2h-2zM14 19h2v2h-2zM19 14h2v3h-2z"/>',
}

export function icon(name, cls = '', size = 20) {
  const d = P[name] || P.info
  const filled = name === 'star' && cls.includes('fill')
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
}

/* ---------------- ratings ---------------- */
export function stars(rating = 0, count = null) {
  const full = Math.round(Number(rating))
  let out = '<span class="stars" aria-label="' + Number(rating).toFixed(1) + ' out of 5">'
  for (let i = 1; i <= 5; i++) out += icon('star', i <= full ? 'fill' : 'off', 14)
  out += '</span>'
  if (count !== null) out += `<span class="rate-row">${Number(rating).toFixed(1)} · ${num(count)} review${count === 1 ? '' : 's'}</span>`
  return out
}

export function avatar(user, cls = '') {
  const name = typeof user === 'string' ? user : user?.name
  const hue = [...String(name || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `<span class="avatar ${cls}" style="background:linear-gradient(135deg,hsl(${hue} 80% 52%),hsl(${(hue + 40) % 360} 85% 48%))" title="${esc(name)}">${esc(initials(name))}</span>`
}

/* ---------------- toasts ---------------- */
export function toast(msg, type = 'ok') {
  const root = $('#toast-root')
  const ic = type === 'err' ? 'warning' : type === 'ai' ? 'sparkles' : 'check'
  const el = document.createElement('div')
  el.className = 'toast ' + type
  el.innerHTML = `<span class="ic">${icon(ic, '', 15)}</span><span>${msg}</span>`
  root.appendChild(el)
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320) }, 3400)
}

/* ---------------- modal ---------------- */
export function modal({ title = '', body = '', foot = '', wide = false, onOpen }) {
  closeModal()
  const root = $('#modal-root')
  const back = document.createElement('div')
  back.className = 'modal-back'
  back.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" style="${wide ? 'width:min(880px,100%)' : ''}">
      ${title ? `<div class="modal-head"><h3 class="h4">${title}</h3><button class="icon-btn" data-close aria-label="Close">${icon('x', '', 18)}</button></div>` : ''}
      <div class="modal-body">${body}</div>
      ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
    </div>`
  root.appendChild(back)
  document.body.classList.add('no-scroll')
  back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) closeModal() })
  const escHandler = (e) => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler) } }
  document.addEventListener('keydown', escHandler)
  onOpen?.(back)
  return { el: back, close: closeModal }
}
export function closeModal() {
  $('#modal-root').innerHTML = ''
  document.body.classList.remove('no-scroll')
}
export function confirmBox(title, text, onYes, yesLabel = 'Confirm') {
  modal({
    title,
    body: `<p class="muted">${text}</p>`,
    foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-yes><span>${yesLabel}</span></button>`,
    onOpen: (el) => el.querySelector('[data-yes]').addEventListener('click', () => { closeModal(); onYes?.() }),
  })
}

/* ---------------- render helpers ---------------- */
export function reveal(root = document) {
  const els = $$('.reveal', root)
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) } })
  }, { threshold: 0.08, rootMargin: '0px 0px -40px' })
  els.forEach((e) => io.observe(e))
}

export function countUp(root = document) {
  $$('[data-count]', root).forEach((el) => {
    const target = Number(el.dataset.count)
    const dur = 1100
    const t0 = performance.now()
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      el.textContent = num(Math.round(target * eased))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

export function emptyState({ icon: ic = 'store', title = 'Nothing here yet', text = '', cta = '' }) {
  return `<div class="empty reveal"><div class="ic">${icon(ic, '', 30)}</div><h3 class="h3">${title}</h3><p class="muted" style="max-width:44ch;margin:8px auto 0">${text}</p>${cta ? `<div style="margin-top:20px">${cta}</div>` : ''}</div>`
}
export const skeletonGrid = (n = 4, cls = 'grid-4') => `<div class="grid ${cls}">${Array.from({ length: n }, () => '<div class="skeleton" style="height:270px"></div>').join('')}</div>`

export function marqueeHTML(items) {
  const row = items.map((t) => `<span><b class="star">✦</b> ${t}</span>`).join('')
  return `<div class="marquee"><div class="marquee-track">${row}${row}</div></div>`
}

export function copyText(text, label = 'Copied') {
  const done = () => toast(label + ' to clipboard')
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done)
  else {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select()
    try { document.execCommand('copy') } catch { /* noop */ }
    ta.remove(); done()
  }
}

export function readFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export function mediaPickerHTML(id = 'media') {
  return `
    <div class="field">
      <span class="label">Photos & videos</span>
      <label class="drop" for="${id}">${icon('upload')}<div><b>Upload images or videos</b></div><div class="hint">JPG, PNG, WEBP, MP4 — multiple files allowed. Ya direct link bhi add kar sakte hain.</div></label>
      <input type="file" id="${id}" accept="image/*,video/*" multiple hidden>
      <input class="input" data-media-url placeholder="…or paste a direct image/video link + Enter" style="margin-top:8px">
      <div class="media-grid" data-media-list style="margin-top:10px"></div>
    </div>`
}

export function bindMediaPicker(root, list = [], onChange) {
  const input = root.querySelector('input[type=file]')
  const urlIn = root.querySelector('[data-media-url]')
  const grid = root.querySelector('[data-media-list]')
  const paint = () => {
    grid.innerHTML = list.map((m, i) => `
      <div class="media-tile">
        ${m.type === 'video' ? `<video src="${esc(m.url)}" muted></video><span class="tagv">VIDEO</span>` : `<img src="${esc(m.url)}" alt="media ${i + 1}">`}
        <button class="rm" data-rm="${i}" type="button" aria-label="Remove">${icon('x', '', 13)}</button>
      </div>`).join('')
  }
  paint()
  input?.addEventListener('change', async () => {
    for (const f of Array.from(input.files || [])) {
      const url = await readFile(f)
      list.push({ type: f.type.startsWith('video') ? 'video' : 'image', url })
    }
    paint(); onChange?.(list); input.value = ''
  })
  urlIn?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const v = urlIn.value.trim()
    if (!v) return
    const isVid = /\.(mp4|webm|mov)(\?|$)/i.test(v) || v.includes('video')
    list.push({ type: isVid ? 'video' : 'image', url: v })
    urlIn.value = ''; paint(); onChange?.(list)
  })
  grid?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rm]')
    if (!b) return
    list.splice(Number(b.dataset.rm), 1); paint(); onChange?.(list)
  })
  return list
}

export function spinner(btn) {
  const old = btn.innerHTML
  btn.disabled = true
  btn.innerHTML = '<span class="spin"></span> Working…'
  return () => { btn.disabled = false; btn.innerHTML = old }
}

export function themeStyle(theme = {}) {
  const pair = theme.fontPairD ? { d: theme.fontPairD, b: theme.fontPairB } : null
  const p = theme.primary || '#16110D', a = theme.accent || '#FF8A1E', bg = theme.bg || '#FBF6EE'
  const fonts = pair ? `--st-d:${pair.d};--st-b:${pair.b};` : ''
  return `--st-primary:${p};--st-accent:${a};--st-bg:${bg};--st-radius:${theme.radius || 18}px;${fonts}`
}

export function fmtQty(n) { return num(n) + ' pcs' }

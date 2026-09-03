/* Street Bazar — AI engine.
   Uses the configured provider (OpenAI-compatible) when an API key is set in Settings,
   otherwise falls back to the built-in "Bazar Brain" so every AI feature still works. */

import { state, logAI, CATEGORIES, productById, storeById, ratingOf, productReviews, currentUser } from './store.js'
import { isAIConnected, getAIKey } from './db.js'
import { money, num } from './ui.js'

const T = (s) => String(s || '')
const cap = (s) => T(s).charAt(0).toUpperCase() + T(s).slice(1)
const hash = (s) => { let h = 0; for (const c of T(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }
const pick = (arr, seedStr) => arr[hash(seedStr) % arr.length]

/* ---------------- real API ---------------- */
async function api(system, user, maxTokens = 800) {
  const apiKey = getAIKey()
  if (!apiKey) throw new Error('API key nahi mili')

  const { base, model } = state.settings.ai || {}

  // Auto-detect Gemini key (starts with AIza or not sk-) vs OpenAI key
  const isGemini = apiKey.startsWith('AIza') || !apiKey.startsWith('sk-') || (base && base.includes('googleapis')) || (model && model.includes('gemini'))

  if (isGemini) {
    const geminiModel = model && model.includes('gemini') ? model : 'gemini-1.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`
    const promptText = `${system ? system + '\n\n' : ''}User instruction: ${user}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data.error?.message || ('Error ' + res.status)
      throw new Error('Gemini: ' + msg)
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  }

  // Standard OpenAI-compatible API
  const res = await fetch((base || 'https://api.openai.com/v1').replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.8, max_tokens: maxTokens,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.error?.message || ('Error ' + res.status)
    throw new Error('OpenAI: ' + msg)
  }
  return data.choices?.[0]?.message?.content?.trim() || ''
}

async function think(kind, system, offline, label = '') {
  logAI(kind, label || kind)
  if (isAIConnected()) {
    try {
      const out = await api(system.prompt, system.user)
      if (out) return { text: out, source: 'live' }
    } catch (e) {
      console.warn('AI API failed, using Bazar Brain fallback:', e.message)
      toast('AI API Error: ' + e.message, 'err')
    }
  }
  return { text: await offline(), source: 'brain' }
}

/* ---------------- offline: Bazar Brain ---------------- */
const BENEFIT = {
  Fashion: 'comfort jo poora din sath de',
  Electronics: 'performance jo aapke pace se match kare',
  'Mobile Accessories': 'protection jo style ke sath aaye',
  'Home & Kitchen': 'roz ka kaam aasaan kar dene wala design',
  'Food & Groceries': 'taaza taste, ghar jaisa',
  'Beauty & Care': 'glow jo notice kiya jaye',
  Handicraft: 'haath ki mehnat ka asli nateeja',
  Footwear: 'comfort jo kabhi na ruke',
  Jewelry: 'sparkle jo har outfit ko complete kare',
}
const AUDIENCE = {
  Fashion: 'everyday wardrobe', Electronics: 'smart setups', 'Mobile Accessories': 'phone people',
  'Home & Kitchen': 'busy kitchens', 'Food & Groceries': 'chai time', Footwear: 'long walks',
  Jewelry: 'festive evenings', Handicraft: 'home decor lovers',
}
const HOOKS = {
  Friendly: (t, s) => `${t} — bilkul naya, bilkul aap jaisa. ${s} se order karein, delivery 2–5 din mein.`,
  Premium: (t, s) => `Ek refined choice: ${t}. ${s} par handpicked quality, jahan finish par compromise nahi hota.`,
  'Desi Masala': (t, s) => `Baat simple hai — ${t} jo dekhe wahi poochhe "ye kahan se liya?" Ab sirf ${s} par.`,
  Minimal: (t, s) => `${t}. No extra noise. Sirf clean quality, ${s} se.`,
  'Sales Push': (t, s) => `🔥 Aaj ka best deal: ${t} — limited stock, ${s} se direct. Sale khatam hone se pehle order karein.`,
}

export function genTitle({ seed, category = 'Fashion' }) {
  const s = T(seed).trim().replace(/\s+/g, ' ') || 'Premium Product'
  const b = BENEFIT[category] || BENEFIT.Fashion
  const patterns = [
    `${cap(s)} — ${cap(b)}`,
    `Premium ${cap(s)} for ${AUDIENCE[category] || 'everyday use'}`,
    `${cap(s)} · Everyday Edition`,
    `Signature ${cap(s)}`,
  ]
  return patterns[hash(s + category) % patterns.length].slice(0, 90)
}

const FEATURES = {
  Fashion: ['Fabric jo skin par soft rahe, din bhar comfortable', 'Stitching clean-finish, seams mazboot', 'Colour-locked dye — dhone par rang na jaye', 'Size exchange 7 din ke andar'],
  Electronics: ['Latest chipset, smooth daily performance', 'Battery jo pooray din sath de', '12 months official warranty', 'Same-day dispatch major cities mein'],
  'Mobile Accessories': ['5-layer shockproof protection', 'Camera lip aur screen edge protection', 'Custom print sirf 24 ghante mein ready', 'All major models supported'],
  'Home & Kitchen': ['Food-safe material, family ke liye safe', 'Roz wash karo, saal bhar chale', 'Handmade finish — har piece thoda unique', 'Gas aur electric dono stoves par kaam kare'],
  'Food & Groceries': ['Roz taaza banaya jata hai', 'No preservatives, no added colour', 'Resealable packing freshness ke liye', 'Best within 10 days of dispatch'],
  Jewelry: ['Anti-tarnish finish', 'Lightweight — poora din comfortable', 'Gift box included', 'Skin-friendly, no irritation'],
  Footwear: ['Cushioned sole for all-day comfort', 'Non-slip grip', 'Breathable material', '7-day size exchange'],
}

export function genDescription({ title, category = 'Fashion', storeName = 'Street Bazar', tone = 'Friendly', price = 0 }) {
  const hook = (HOOKS[tone] || HOOKS.Friendly)(title, storeName)
  const features = FEATURES[category] || ['Quality checked before every dispatch', 'Honest description, fair price', 'Safe & secure packing', 'Delivery all over Pakistan']
  const priceLine = price ? `\n\nPrice: ${money(price)} · Wholesale rates bulk orders ke liye available hain.` : ''
  return `${hook}\n\nWhy people love it:\n${features.map((f) => '✦ ' + f).join('\n')}${priceLine}\n\n📦 Delivery 2–5 working days\n↺ 7-day easy exchange\n💬 Sawal ho toh product page par chat karein — owner khud reply karta hai.`
}

export function genTags({ title, category = '' }) {
  const base = T(title).toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter((w) => w.length > 2)
  const extra = {
    Fashion: ['clothing', 'style', 'everyday'], Electronics: ['gadget', 'tech'], 'Mobile Accessories': ['mobile', 'accessory'],
    'Home & Kitchen': ['kitchen', 'home'], 'Food & Groceries': ['food', 'fresh'], Jewelry: ['jewelry', 'accessory'], Footwear: ['shoes', 'footwear'],
  }[category] || ['bazaar', 'pakistan']
  return [...new Set([...base, ...extra, T(category).toLowerCase()].filter(Boolean))].slice(0, 8)
}

export function suggestPrice({ title = '', category = 'Fashion', cost = 0 }) {
  if (cost) return Math.round((cost * 1.9) / 50) * 50
  const base = { Fashion: 2800, Electronics: 5200, 'Mobile Accessories': 1450, 'Home & Kitchen': 2600, 'Food & Groceries': 950, Jewelry: 1200, Footwear: 4200 }[category] || 2000
  const jitter = (hash(title) % 900) - 300
  return Math.round((base + jitter) / 50) * 50
}

export function parseStock(text) {
  const rows = []
  T(text).split(/\n+/).forEach((line) => {
    const clean = line.trim().replace(/^[-•*]\s*/, '')
    if (!clean || /^(name|item|product)[,\t ]/i.test(clean)) return
    const parts = clean.split(/[,;\t]|\s+[-|]\s+/).map((s) => s.trim()).filter(Boolean)
    let name = '', qty = 0, price = 0
    parts.forEach((part) => {
      const numeric = part.replace(/[,\s]/g, '')
      if (/^rs?\d{2,7}$/i.test(numeric) || /^pkr\d{2,7}$/i.test(numeric)) price = Number(numeric.replace(/^(rs|pkr)/i, ''))
      else if (/^\d{1,6}$/.test(numeric)) {
        if (!qty) qty = Number(numeric)
        else if (!price) price = Number(numeric)
      } else if (!name) name = part
      else if (!/^(pcs|pieces|unit|qty|units)$/i.test(part)) name += ' ' + part
    })
    if (!name) name = 'Item ' + (rows.length + 1)
    if (!qty) qty = 1
    rows.push({ name: name.trim().slice(0, 60), qty, price, sku: 'SKU-' + (hash(name) % 9000 + 1000) })
  })
  return rows
}

export function chatReply({ question, productId, storeId }) {
  const p = productId ? productById(productId) : null
  const s = storeId ? storeById(storeId) : (p ? storeById(p.store) : null)
  const q = T(question).toLowerCase()
  const has = (...words) => words.some((w) => q.includes(w))
  const opts = p?.customizable?.on ? (p.customizable.options || []).map((o) => o.name + ': ' + o.choices.map((c) => c.label).join(', ')).join(' | ') : ''
  const tiers = p?.wholesale?.on ? (p.wholesale.tiers || []).map((t) => num(t.qty) + '+ pcs = ' + money(t.price)).join(', ') : ''

  if (has('hi', 'salam', 'hello', 'assalam', 'hey')) return `Walaikum salam! 👋 ${s ? s.name : 'Street Bazar'} mein aapka swagat hai. Bataiye kis product ke bare mein poochna hai?`
  if (has('price', 'rate', 'cost', 'kitne', 'qemat', 'daam')) return p ? `${p.title} ki current price ${money(p.price)} hai${p.compareAt ? ' (was ' + money(p.compareAt) + ')' : ''}. ${tiers ? 'Wholesale: ' + tiers + '.' : ''}` : 'Product ka naam batayein, main price bata deta hoon.'
  if (has('size', 'fit', 'measure')) return opts ? `Options available: ${options2(opts)}. Agar confusion ho toh apna usual size batayein — main owner se confirm karwa deta hoon.` : 'Is product mein single size available hai. Custom size chahiye toh order note mein likh dein.'
  if (has('custom', 'personal', 'print', 'embroid', 'design', 'apna')) return p?.customizable?.on ? `Haan ji! ${p.title} customize ho sakta hai — ${opts}. Custom order 24–48 ghante extra leta hai.` : 'Filhaal ye product ready-made hai. Custom request chahiye toh owner se chat karein, wo koshish karega.'
  if (has('wholesale', 'bulk', 'quantity', 'reseller', 'thoka', 'bada order', 'rate list')) return tiers ? `Wholesale available hai: ${tiers}. Minimum order ${num(p.wholesale.tiers?.[0]?.qty || 1)} pcs. Rate list chahiye toh order note mein "WHOLESALE" likh dein.` : 'Is product par abhi wholesale nahi hai, lekin 10+ pcs order par owner custom rate de sakta hai.'
  if (has('delivery', 'ship', 'kab tak', 'courier', 'postal', 'how long', 'deliver')) return `Pakistan bhar mein delivery 2–5 working days. Karachi/Lahore mein 2 din. Order ke sath tracking ID milti hai jo Track page par check kar sakte hain.`
  if (has('stock', 'available', 'moujood', 'khatam', 'bacha')) return p ? `Stock update: ${num(p.stock)} pcs available hain${p.stock <= 8 ? ' — kam bacha hai, jaldi lein!' : ''}.` : 'Stock batane ke liye product select karein.'
  if (has('return', 'exchange', 'wapis', 'refund')) return '7-day easy exchange hai — tag laga rahe aur unworn condition mein. Order par store delivery charges bhi bear karta hai.'
  if (has('discount', 'sale', 'off', 'cheap')) return s?.sale ? `${s.name} par abhi sale chal rahi hai: ${s.sale.text}. Jaldi lein!` : 'Filhaal koi active sale nahi hai, lekin follow karne par naye drops aur offers seedha For You feed mein aayenge.'
  if (has('whatsapp', 'contact', 'call', 'number', 'social')) return s?.socials?.whatsapp ? `WhatsApp: ${s.socials.whatsapp} — usually 1 ghante ke andar reply.` : `${s ? s.name : 'Store'} ka WhatsApp abhi link nahi hai. Yahan chat karein, owner jaldi reply karta hai.`
  if (has('timing', 'hours', 'open', 'band', 'khula')) return s?.type === 'physical' ? `${s.name} ${s.address || ''} par subah 11 se raat 9 tak khula rehta hai.` : 'Ye online store hai — order 24/7 kar sakte hain, dispatch working days par hota hai.'
  if (has('quality', 'acha', 'original', 'genuine', 'nakli', 'verify')) return `${p ? p.title : 'Har product'} dispatch se pehle check hota hai. Agar pasand na aaye toh 7 din ke andar exchange.`
  if (has('track', 'order id', 'kahan pohncha')) return 'Track page par apni Order ID (SB-XXXXXX) daliye — live status aur expected delivery aa jayegi.'
  if (has('follow', 'notify')) return 'Store page par "Follow" dabayein — naya product aate hi aapke For You feed mein show ho jayega.'

  const ratingLine = p && ratingOf(p) ? ` Is waqt ${Number(ratingOf(p)).toFixed(1)}★ rating hai (${num(productReviews(p.id).length)} reviews).` : ''
  return `Achha sawal! ${p ? '«' + p.title + '»' : 'Is product'} ke bare mein itna bata sakta hoon: ${money(p?.price || 0)}, ${p && p.stock > 8 ? 'stock available' : 'limited stock'} hai.${ratingLine} Baaki detail owner ko notify kar di hai — wo yahin reply karega.`
}
const options2 = (s) => s

/* ---------------- feature entry points ---------------- */
export async function genProductCopy({ rough, category, storeName, tone, price }) {
  const result = await think(
    'product-copy',
    {
      prompt: 'You are the listing copywriter for Street Bazar, a Pakistani marketplace. Write crisp e-commerce copy in English with light Roman-Urdu warmth. Return EXACTLY this format:\nTITLE: ...\nDESCRIPTION: ...\nTAGS: tag, tag, tag',
      user: `Product idea: ${rough}\nCategory: ${category}\nStore: ${storeName}\nTone: ${tone}\nPrice: ${price}`,
    },
    async () => {
      const title = genTitle({ seed: rough, category })
      const desc = genDescription({ title, category, storeName, tone, price })
      const tags = genTags({ title, category })
      return `TITLE: ${title}\nDESCRIPTION: ${desc}\nTAGS: ${tags.join(', ')}`
    },
    rough
  )
  const title = /TITLE:\s*(.+)/i.exec(result.text)?.[1]?.trim() || genTitle({ seed: rough, category })
  const description = /DESCRIPTION:\s*([\s\S]*?)(?=\nTAGS:|$)/i.exec(result.text)?.[1]?.trim() || genDescription({ title, category, storeName, tone, price })
  const tags = (/TAGS:\s*(.+)/i.exec(result.text)?.[1] || '').split(',').map((t) => t.trim()).filter(Boolean)
  return { title, description, tags: tags.length ? tags : genTags({ title, category }), source: result.source }
}

export async function genTitleOnly({ rough, category }) {
  const r = await think('title', { prompt: 'Write ONE catchy e-commerce product title, max 60 chars, English with optional Roman Urdu flair. Return only the title.', user: `${rough} (${category})` }, async () => genTitle({ seed: rough, category }), rough)
  return r.text.replace(/^TITLE:\s*/i, '').split('\n')[0].trim().slice(0, 90)
}

export async function genDescriptionOnly({ title, category, storeName, tone, price }) {
  const r = await think('description', { prompt: 'Write an e-commerce product description: 1 hook line, 4 bullet features, delivery & exchange note. English with Roman Urdu warmth. Under 140 words.', user: `${title} | ${category} | ${storeName} | ${tone} | ${price}` }, async () => genDescription({ title, category, storeName, tone, price }), title)
  return r.text
}

export async function genStockPlan({ rough, storeName }) {
  const r = await think('stock-plan', { prompt: 'You help shop owners plan inventory. From the rough note, output rows as: NAME, QTY, PRICE (PKR). 4-8 rows, plain text only.', user: `${rough} — for ${storeName}` }, async () => {
    const items = parseStock(rough)
    if (items.length > 1) return items.map((i) => `${i.name}, ${i.qty}, ${i.price || 1200}`).join('\n')
    const base = T(rough).trim().replace(/\n/g, ' ').slice(0, 30) || 'New item'
    return [`${base} — Small, 12, 950`, `${base} — Medium, 18, 1250`, `${base} — Large, 10, 1450`, `Combo Pack (${base}), 6, 2600`].join('\n')
  }, rough)
  const rows = parseStock(r.text)
  return { rows, raw: r.text, source: r.source }
}

export async function genCategorySuggestion({ rough, storeName }) {
  const r = await think('category', { prompt: 'Pick the 2 best marketplace categories for this note. Return ONLY comma separated category names.', user: `${rough} (store: ${storeName})` }, async () => {
    const q = T(rough).toLowerCase()
    const found = CATEGORIES.filter((c) => q.includes(c.toLowerCase().split(' ')[0]))
    return (found.length ? found : ['Fashion']).join(', ')
  }, rough)
  const list = r.text.split(',').map((c) => c.trim()).filter((c) => CATEGORIES.includes(c))
  return list.length ? list : ['Fashion']
}

export async function assistantReply({ question }) {
  const r = await think('assistant', { prompt: 'You are the Street Bazar in-app assistant. Answer briefly (max 60 words), helpful and friendly, English mixed with Roman Urdu. You can inspect the demo catalog.', user: question }, async () => {
    const q = T(question).toLowerCase()
    if (q.includes('sale') || q.includes('offer')) {
      const list = state.stores.filter((s) => s.sale && s.sale.until > Date.now())
      return list.length ? 'Active sales right now:\n' + list.map((s) => '• ' + s.name + ' — ' + s.sale.text).join('\n') : 'Filhaal koi live sale nahi hai, lekin For You feed check karte rahein.'
    }
    if (q.includes('follow')) {
      const u = currentUser()
      const f = state.follows.filter((x) => x.user === u?.id)
      return f.length ? 'Aap ' + f.length + ' stores follow kar rahe hain. Nayi listing For You feed mein show hoti hai.' : 'Abhi tak koi store follow nahi kiya. Explore se apne favourite store follow karein.'
    }
    if (q.includes('cheap') || q.includes('best price') || q.includes('budget')) {
      const cheap = state.products.filter((p) => p.status !== 'hidden').sort((a, b) => a.price - b.price).slice(0, 3)
      return 'Budget picks:\n' + cheap.map((p) => '• ' + p.title + ' — ' + money(p.price)).join('\n')
    }
    if (q.includes('track') || q.includes('order')) return 'Track page par Order ID (SB-XXXXXX) daliye — status, courier note aur expected delivery sab aa jayega.'
    const hit = state.products.find((p) => q.split(/\s+/).some((w) => w.length > 3 && p.title.toLowerCase().includes(w)))
    if (hit) return chatReply({ question, productId: hit.id, storeId: hit.store })
    return 'Main poore catalog ko search kar sakta hoon — product ka naam, category ya store batayein. Jaise "custom cover", "namkeen" ya "wholesale kurta".'
  }, question)
  return r
}

export function aiStatusText() {
  return isAIConnected() ? 'Live AI connected · ' + state.settings.ai.model : 'Bazar Brain (offline mode)'
}

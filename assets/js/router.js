/* Street Bazar — tiny hash router with page transitions */

import { $, reveal, countUp } from './ui.js'

const routes = []
let notFound = null
let current = null
let onAfterRender = null

export function route(pattern, page) {
  const keys = []
  const rx = new RegExp('^' + pattern.replace(/:[a-zA-Z]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)' }).replace(/\//g, '\\/') + '$')
  routes.push({ rx, keys, page, pattern })
}
export function setNotFound(page) { notFound = page }
export function onRender(fn) { onAfterRender = fn }

export function parseHash(hash = location.hash) {
  const raw = (hash || '#/').replace(/^#/, '')
  const [path, query = ''] = raw.split('?')
  const params = {}
  new URLSearchParams(query).forEach((v, k) => { params[k] = v })
  return { path: '/' + path.replace(/^\/+/, ''), query: params }
}

export function navigate(to, replace = false) {
  const target = to.startsWith('#') ? to : '#' + (to.startsWith('/') ? to : '/' + to)
  if (replace) location.replace(target)
  else location.hash = target
}

export async function renderRoute() {
  const { path, query } = parseHash()
  let match = null, params = {}
  for (const r of routes) {
    const m = path.match(r.rx)
    if (m) {
      match = r
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]) })
      break
    }
  }
  const page = match ? match.page : notFound
  const view = $('#view')
  if (!page || !view) return
  current = { path, params, query, pattern: match?.pattern }

  view.classList.remove('page-enter')
  void view.offsetWidth
  view.classList.add('page-enter')
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })

  try {
    view.innerHTML = await page(params, query)
  } catch (err) {
    console.error(err)
    view.innerHTML = `<div class="wrap sec"><div class="empty"><h3 class="h3">Kuch gadbad ho gayi</h3><p class="muted">Something went wrong loading this page. Please try again.</p></div></div>`
  }

  reveal(view)
  countUp(view)
  onAfterRender?.(current)
  await page.mount?.(params, query, view)
}

export function currentRoute() { return current }
export function startRouter() {
  window.addEventListener('hashchange', renderRoute)
  if (!location.hash) location.replace('#/')
  renderRoute()
}

import { esc, icon, modal, timeAgo } from '../ui.js'
import { currentUser, myThreads, storeById, productById, state } from '../store.js'
import { bindChat } from './store.js'
import { syncPull } from '../db.js'

export async function messagesPage() {
  const user = currentUser()
  if (!user) return '<section class="sec"><div class="wrap"><div class="empty"><h3 class="h3">Messages ke liye login karein</h3></div></div></section>'
  await syncPull()
  const threads = myThreads()
  const contacts = [...new Map(threads.map((thread) => {
    const store = storeById(thread.store)
    return [thread.store, { store, threads: threads.filter((item) => item.store === thread.store) }]
  })).values()]
  return `<section class="sec"><div class="wrap"><span class="kicker">Messages</span><h1 class="h1" style="margin-top:12px">Your contacts</h1><p class="muted">Har store aur product ki conversation yahan ek contact ki tarah milegi.</p>
    <div class="grid grid-2" style="margin-top:24px">${contacts.length ? contacts.map(({ store, threads: storeThreads }) => {
      const latest = storeThreads.flatMap((thread) => thread.messages).sort((a, b) => b.at - a.at)[0]
      return `<article class="card contact-card"><a class="row" href="#/store/${esc(store?.slug || '')}"><span class="avatar sm">${esc((store?.name || 'Store').slice(0, 2).toUpperCase())}</span><div><b>${esc(store?.name || 'Store')}</b><div class="tiny muted">${timeAgo(latest?.at || Date.now())}</div></div></a>
        <p class="small muted" style="margin:14px 0">${esc(latest?.text || 'Conversation start karein')}</p>
        <div class="stack">${storeThreads.map((thread) => {
          const product = productById(thread.product)
          return `<div class="row-between"><a class="small" href="#/product/${esc(product?.id || '')}">${esc(product?.title || 'Store chat')}</a><button class="btn btn-sm btn-ghost" data-contact-thread="${esc(thread.id)}">${icon('chat', '', 14)} Open chat</button></div>`
        }).join('')}</div>
      </article>`
    }).join('') : '<div class="empty"><p class="muted">Abhi koi contact nahi. Store ya product page se message karein.</p></div>'}</div></div></section>`
}

messagesPage.mount = async (params, query, root) => {
  root.querySelectorAll('[data-contact-thread]').forEach((button) => button.addEventListener('click', () => {
    const thread = state.threads.find((item) => item.id === button.dataset.contactThread)
    const store = storeById(thread?.store)
    const product = productById(thread?.product)
    if (!thread || !store) return
    modal({
      title: product ? `Chat · ${product.title}` : `Chat · ${store.name}`,
      wide: true,
      body: `<div class="chatbox" data-chat data-store="${esc(store.id)}" data-product="${esc(product?.id || '')}"><div class="chat-head"><a href="#/store/${esc(store.slug)}"><b>${esc(store.name)}</b></a>${product ? `<a class="tiny muted" href="#/product/${esc(product.id)}">${esc(product.title)}</a>` : ''}</div><div class="chat-body" data-chat-body></div><div class="chat-foot"><input class="input" data-chat-input placeholder="Message likhein…"><button class="btn btn-primary" data-chat-send>${icon('send', '', 16)}</button></div></div>`,
      onOpen: (element) => bindChat(element.querySelector('[data-chat]'), { storeId: store.id, productId: product?.id || '', who: store.name, thread }),
    })
  }))
}

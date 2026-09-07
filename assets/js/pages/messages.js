import { esc, icon, storeAvatar, timeAgo } from '../ui.js'
import { currentUser, myThreads, storeById, productById, state } from '../store.js'
import { bindChat } from './store.js'
import { syncPull } from '../db.js'

export async function messagesPage() {
  const user = currentUser()
  if (!user) return '<section class="sec"><div class="wrap"><div class="empty"><h3 class="h3">Messages ke liye login karein</h3></div></div></section>'
  const threads = myThreads()
  const contacts = [...new Map(threads.map((thread) => {
    const store = storeById(thread.store)
    return [thread.store, { store, threads: threads.filter((item) => item.store === thread.store) }]
  })).values()].filter((entry) => entry.store)
  const first = contacts[0]?.threads[0]
  return `<section class="sec"><div class="wrap">
    <div class="row-between" style="align-items:end;gap:14px"><div><span class="kicker">Inbox</span><h1 class="h1" style="margin-top:12px">Messages</h1><p class="muted">Stores aur products ke saath aapki conversations.</p></div><span class="badge badge-soft">${contacts.length} chat${contacts.length === 1 ? '' : 's'}</span></div>
    <div class="messenger-shell" style="margin-top:24px">
      <aside class="messenger-sidebar"><h3 class="h4">Conversations</h3>
        ${contacts.length ? contacts.map(({ store, threads: storeThreads }) => {
          const latest = storeThreads.flatMap((thread) => thread.messages).sort((a, b) => b.at - a.at)[0]
          return `<button class="message-contact${storeThreads[0].id === first?.id ? ' active' : ''}" data-message-thread="${esc(storeThreads[0].id)}">${storeAvatar(store, 'sm')}<span class="preview"><b>${esc(store.name)}</b><span class="tiny muted">${esc(latest?.text || 'Start conversation')}</span></span><span class="tiny muted">${timeAgo(latest?.at || Date.now())}</span></button>`
        }).join('') : '<p class="muted small" style="padding:10px">Abhi koi conversation nahi.</p>'}
      </aside>
      <main class="messenger-main" data-message-main>${first ? '' : '<div class="empty" style="margin:auto"><p class="muted">Store ya product page se message start karein.</p></div>'}</main>
    </div>
  </div></section>`
}

messagesPage.mount = (params, query, root) => {
  const main = root.querySelector('[data-message-main]')
  const open = (id) => {
    const thread = state.threads.find((item) => item.id === id)
    const store = storeById(thread?.store)
    const product = productById(thread?.product)
    if (!thread || !store || !main) return
    thread.readByCustomer = true
    thread.read = true
    import('../db.js').then(({ syncThread }) => syncThread(thread)).catch((error) => console.error('Read receipt sync failed:', error))
    root.querySelectorAll('[data-message-thread]').forEach((button) => button.classList.toggle('active', button.dataset.messageThread === id))
    main.innerHTML = `<div class="chatbox" data-chat data-store="${esc(store.id)}" data-product="${esc(product?.id || '')}">
      <div class="chat-head">${storeAvatar(store, 'sm')}<div style="flex:1"><a href="#/store/${esc(store.slug)}"><b class="small">${esc(store.name)}</b></a><div class="sub">${product ? `<a href="#/product/${esc(product.id)}">${esc(product.title)}</a>` : 'Store conversation'}</div></div><a class="tiny" href="#/store/${esc(store.slug)}">View store</a></div>
      <div class="chat-body" data-chat-body></div><div class="chat-foot"><input class="input" data-chat-input placeholder="Message likhein…"><button class="btn btn-primary" data-chat-send>${icon('send', '', 16)}</button></div>
    </div>`
    bindChat(main.querySelector('[data-chat]'), { storeId: store.id, productId: product?.id || '', who: store.name, thread })
  }
  root.querySelectorAll('[data-message-thread]').forEach((button) => button.addEventListener('click', () => open(button.dataset.messageThread)))
  const first = root.querySelector('[data-message-thread]')
  if (first) open(first.dataset.messageThread)
}

/* Street Bazar — Settings (account and server integrations) */

import { icon, esc, toast, modal, closeModal, copyText, confirmBox, timeAgo } from '../ui.js'
import { currentUser, state, setRole, logout, save } from '../store.js'
import { SQL_SCHEMA, isConnected, isAIConnected, syncBoth } from '../db.js'
import { navigate } from '../router.js'

export async function settingsPage() {
  const u = currentUser()
  if (!u || u.role !== 'admin') return `<section class="sec"><div class="wrap"><div class="empty"><div class="ic">${icon('shield', '', 30)}</div><h3 class="h3">Admin access required</h3><p class="muted small" style="margin-top:8px">AI, Vercel aur Supabase settings sirf admin panel se available hain.</p><div style="margin-top:16px"><a class="btn btn-grad" href="#/admin"><span>Go to admin panel</span></a></div></div></div></section>`
  const s = state.settings

  return `
  <div class="wrap" style="padding-top:28px;max-width:940px">
    <span class="kicker">Settings</span>
    <h1 class="h1" style="margin-top:12px">Account & <span class="grad-text">integrations</span></h1>

    <div class="panel" style="margin-top:26px">
      <h3 class="h4">Profile</h3>
      <div class="grid grid-2" style="margin-top:14px;gap:14px">
        <div class="field"><span class="label">Name</span><input class="input" id="set-name" value="${esc(u.name)}"></div>
        <div class="field"><span class="label">Email</span><input class="input" value="${esc(u.email)}" disabled style="opacity:.7"></div>
      </div>
      <div class="field" style="margin-top:14px"><span class="label">Account type</span>
        <div class="seg" data-role-seg>
          ${['customer', 'owner', 'admin'].map((r) => `<button data-role-v="${r}" class="${u.role === r ? 'active' : ''}">${r}</button>`).join('')}
        </div>
        <span class="hint">Owner banne par store creation, warehouse aur AI Studio khul jate hain.</span>
      </div>
      <div class="wrap-flex" style="margin-top:16px">
        <button class="btn btn-primary" id="save-profile"><span>Save profile</span></button>
        <button class="btn btn-ghost" id="do-logout">${icon('logout', '', 15)} Log out</button>
      </div>
    </div>

    <div class="panel" style="margin-top:22px">
      <div class="row-between"><h3 class="h4">AI engine</h3><span class="badge badge-live">Server managed</span></div>
      <p class="small muted" style="margin-top:8px">AI provider key, base URL aur model Vercel environment variables mein secure hain. Keys browser ya users ko kabhi nahi dikhayi jatin.</p>
      <button class="btn btn-primary" id="test-ai" style="margin-top:14px">${icon('sparkles', '', 15)} Test server AI</button>
    </div>

    <div class="panel" style="margin-top:22px">
      <div class="row-between"><h3 class="h4">Supabase database</h3><span class="badge ${isConnected() ? 'badge-live' : 'badge-soft'}">${isConnected() ? 'Connected' : 'Local storage'}</span></div>
      <p class="small muted" style="margin-top:8px">Supabase connection Vercel backend par configured hai. Accounts, stores, products, orders aur reviews server API ke zariye database mein persist hote hain.</p>
      <div class="wrap-flex" style="margin-top:14px">
        <button class="btn btn-ghost" id="sync-sb">${icon('refresh', '', 15)} Push + pull sync</button>
        <button class="btn btn-ghost" id="show-sql">${icon('copy', '', 15)} Copy SQL schema</button>
      </div>
      <div class="tiny muted" style="margin-top:10px">Last sync: ${s.lastSync ? timeAgo(s.lastSync) : '—'}</div>
    </div>

    <div class="panel" style="margin-top:22px;border-color:rgba(229,72,77,.4)">
      <h3 class="h4" style="color:var(--red)">Danger zone</h3>
      <p class="small muted" style="margin-top:8px">Local browser cache clear karke latest catalog ko dobara load karein.</p>
      <button class="btn btn-danger" id="reset-all" style="margin-top:14px">${icon('warning', '', 15)} Clear local cache</button>
    </div>
  </div>`
}

settingsPage.mount = (params, query, root) => {
  root.querySelector('#save-profile').addEventListener('click', () => {
    const name = root.querySelector('#set-name').value.trim()
    if (name) { currentUser().name = name; save(); toast('Profile saved', 'ok') }
  })
  root.querySelectorAll('[data-role-seg] button').forEach((b) => b.addEventListener('click', () => {
    setRole(b.dataset.roleV)
    root.querySelectorAll('[data-role-seg] button').forEach((x) => x.classList.toggle('active', x === b))
    toast('Role updated: ' + b.dataset.roleV, 'ok')
  }))
  root.querySelector('#do-logout').addEventListener('click', () => { logout(); toast('Logged out'); navigate('#/') })

  root.querySelector('#test-ai').addEventListener('click', async () => {
    toast('Testing AI API…')
    try {
      const { assistantReply } = await import('../ai.js')
      const res = await assistantReply({ question: 'Hello! Respond in 5 words.' })
      if (res.source === 'live') {
        toast('🎉 Live AI Success: ' + res.text.slice(0, 45) + '…', 'ok')
      } else {
        toast('⚠️ API fail ho gayi, fallback active hai. Key aur Model verify karein.', 'err')
      }
    } catch (err) {
      toast('AI Error: ' + err.message, 'err')
    }
  })

  root.querySelector('#sync-sb').addEventListener('click', async () => { await syncBoth() })
  root.querySelector('#show-sql').addEventListener('click', () => {
    modal({
      title: 'Supabase SQL schema',
      wide: true,
      body: `<p class="small muted">Apne Supabase project ke SQL Editor mein paste karke tables banayein.</p>
        <pre class="ai-out" style="margin-top:12px;overflow:auto;max-height:52vh;font-size:12px">${esc(SQL_SCHEMA)}</pre>`,
      foot: `<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-primary" id="copy-sql"><span>Copy SQL</span></button>`,
      onOpen: (el) => el.querySelector('#copy-sql').addEventListener('click', () => copyText(SQL_SCHEMA, 'SQL schema')),
    })
  })

  root.querySelector('#reset-all').addEventListener('click', () => {
    confirmBox('Clear local cache?', 'Browser ki local cache clear ho jayegi aur page fresh catalog ke sath load hoga.', () => {
      localStorage.removeItem('street-bazar-v1'); toast('Local cache clear ho gayi'); location.hash = '#/'
      location.reload()
    }, 'Reset everything')
  })
}

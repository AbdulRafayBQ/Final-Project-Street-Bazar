/* Street Bazar — Login / Sign up / Google */

import { icon, esc, toast, spinner } from '../ui.js'
import { login, signup, googleAuth, currentUser, setRole, logout } from '../store.js'
import { navigate } from '../router.js'

export async function authPage(params, query) {
  if (currentUser()) {
    return `<section class="sec"><div class="wrap"><div class="panel" style="max-width:520px;margin:0 auto;text-align:center">
      <span class="avatar lg" style="margin:0 auto">${esc(currentUser().name.slice(0, 2).toUpperCase())}</span>
      <h2 class="h3" style="margin-top:14px">Aap already logged in hain</h2>
      <p class="muted small" style="margin-top:8px">${esc(currentUser().name)} · ${currentUser().role}</p>
      <div class="wrap-flex" style="justify-content:center;margin-top:20px">
        <a class="btn btn-grad" href="#/"><span>Go home</span></a>
        <button class="btn btn-ghost" data-logout>${icon('logout', '', 15)} Log out</button>
      </div>
    </div></div></section>`
  }

  return `
  <div class="auth-wrap">
    <div class="auth-art">
      <div class="auth-art-in">
        <div class="auth-brand">
          <img src="./images/logo.png" alt="Street Bazar" style="height:48px;width:auto">
        </div>
        <h1 class="h1" style="color:var(--ink);margin-top:20px;font-size:clamp(28px,3.5vw,42px);line-height:1.2">Ek account,<br>poora bazaar.</h1>
        <p class="muted" style="margin-top:14px;font-size:15px">
          Apna online store banayein, AI se products list karein, aur wholesale deals explore karein.
        </p>
        <div class="stack small" style="margin-top:28px;gap:14px">
          <div class="row" style="gap:10px;color:var(--accent)">${icon('check', '', 18)} <span style="color:var(--ink);font-weight:500">Multiple stores, apni marzi ka design</span></div>
          <div class="row" style="gap:10px;color:var(--accent)">${icon('check', '', 18)} <span style="color:var(--ink);font-weight:500">AI se listing, stock aur customer chat</span></div>
          <div class="row" style="gap:10px;color:var(--accent)">${icon('check', '', 18)} <span style="color:var(--ink);font-weight:500">Wholesale, reviews aur live order tracking</span></div>
        </div>
        <div class="auth-stats-badge" style="margin-top:32px;display:inline-flex;align-items:center;gap:10px;background:#FFFFFF;border:1px solid var(--line);padding:10px 18px;border-radius:99px;box-shadow:var(--shadow-s)">
          <span class="dot" style="background:#10B981;width:8px;height:8px;border-radius:50%;display:inline-block"></span>
          <span class="tiny" style="color:var(--ink);font-weight:600">+12,600 verified buyers & sellers active</span>
        </div>
      </div>
    </div>

    <div class="auth-form">
      <div class="auth-card">
        <div class="seg" style="width:100%" data-auth-tabs>
          <button class="active" data-mode="signin" style="flex:1">Sign in</button>
          <button data-mode="signup" style="flex:1">Create account</button>
        </div>

        <div style="margin-top:24px" data-auth-body></div>

        <div class="or">or continue with</div>
        <button class="gbtn" data-google>${icon('google', '', 19)} Continue with Google</button>

        <div class="demo-box" style="margin-top:22px">
          <b>Demo accounts</b> — ek click mein try karein:<br>
          <div class="wrap-flex" style="margin-top:8px;gap:7px">
            <button class="chip" data-demo="admin@streetbazar.pk|admin1234">${icon('shield', '', 13)} Admin</button>
            <button class="chip" data-demo="hassan@demo.pk|demo1234">${icon('store', '', 13)} Store owner</button>
            <button class="chip" data-demo="ali@demo.pk|demo1234">${icon('user', '', 13)} Customer</button>
          </div>
        </div>
      </div>
    </div>
  </div>`
}

authPage.mount = (params, query, root) => {
  let mode = 'signin'
  const body = root.querySelector('[data-auth-body]')
  const redirect = query.next ? '#' + query.next : '#/'

  const forms = {
    signin: () => `
      <h2 class="h3">Welcome Back! 👋</h2>
      <p class="muted small" style="margin:8px 0 18px">Login karke apne stores, orders aur follow kiye stores dekhein.</p>
      <div class="stack">
        <div class="field"><span class="label">Email</span><input class="input" id="au-email" type="email" placeholder="you@email.com"></div>
        <div class="field"><span class="label">Password</span><input class="input" id="au-pass" type="password" placeholder="••••••••"></div>
        <button class="btn btn-primary btn-lg btn-block" id="au-go"><span>Sign in</span> ${icon('arrow', '', 16)}</button>
      </div>`,
    signup: () => `
      <h2 class="h3">Bazaar mein aapka swagat hai</h2>
      <p class="muted small" style="margin:8px 0 18px">30 second main account banayein — phir store, AI, wholesale sab open ho jayega.</p>
      <div class="stack">
        <div class="field"><span class="label">Your name</span><input class="input" id="au-name" placeholder="Full name"></div>
        <div class="field"><span class="label">Email</span><input class="input" id="au-email" type="email" placeholder="you@email.com"></div>
        <div class="field"><span class="label">Password</span><input class="input" id="au-pass" type="password" placeholder="6+ characters"></div>
        <div class="field"><span class="label">I am joining as</span>
          <div class="seg" style="width:100%" data-role>
            <button class="active" data-role-v="customer" style="flex:1">${icon('user', '', 14)} Customer</button>
            <button data-role-v="owner" style="flex:1">${icon('store', '', 14)} Store owner</button>
          </div>
        </div>
        <button class="btn btn-grad btn-lg btn-block" id="au-go"><span>Create account</span> ${icon('arrow', '', 16)}</button>
      </div>`,
  }

  let role = 'customer'
  const paint = () => {
    body.innerHTML = forms[mode]()
    root.querySelectorAll('[data-auth-tabs] button').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode))
    root.querySelectorAll('[data-role] button').forEach((b) => b.classList.toggle('active', b.dataset.roleV === role))
    root.querySelectorAll('[data-role] button').forEach((b) => b.addEventListener('click', () => { role = b.dataset.roleV; paint() }))
    body.querySelector('#au-go').addEventListener('click', async (e) => {
      const btn = spinner(e.currentTarget)
      const email = body.querySelector('#au-email').value.trim()
      const pass = body.querySelector('#au-pass').value
      await new Promise((r) => setTimeout(r, 500))
      try {
        if (mode === 'signin') {
          const u = login(email, pass)
          btn(); toast('Welcome back, ' + u.name.split(' ')[0] + '!', 'ok')
        } else {
          const name = body.querySelector('#au-name').value.trim()
          if (!name) throw new Error('Apna naam likhein')
          if (pass.length < 6) throw new Error('Password kam se kam 6 characters ka ho')
          const u = signup({ name, email, pass, role })
          btn(); toast('Account ban gaya 🎉', 'ok')
          if (role === 'owner') { navigate('#/create-store'); return }
        }
        navigate(redirect)
      } catch (err) {
        btn(); toast(err.message, 'err')
      }
    })
  }
  paint()

  root.querySelectorAll('[data-auth-tabs] button').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; paint() }))
  root.querySelector('[data-google]').addEventListener('click', () => {
    const u = googleAuth()
    toast('Signed in with Google as ' + u.name, 'ok')
    navigate(redirect)
  })
  root.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => {
    const [email, pass] = b.dataset.demo.split('|')
    try {
      const u = login(email, pass)
      toast('Demo login: ' + u.name, 'ok')
      navigate(email.startsWith('admin') ? '#/admin' : redirect)
    } catch (e) { toast(e.message, 'err') }
  }))
  root.querySelector('[data-logout]')?.addEventListener('click', () => { logout(); toast('Logged out'); navigate('#/') })
}

/* Street Bazar — Supabase-backed Login / Sign up */

import { icon, esc, toast, spinner } from '../ui.js'
import { currentUser, setRole, logout, state, save } from '../store.js'
import { authRequest } from '../db.js'
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
        <div class="field"><span class="label">Password</span><div class="password-wrap"><input class="input" id="au-pass" type="password" placeholder="••••••••"><button type="button" class="password-toggle" data-password-toggle>Show</button></div></div>
        <button class="btn btn-primary btn-lg btn-block" id="au-go"><span>Sign in</span> ${icon('arrow', '', 16)}</button>
        <button class="btn btn-ghost btn-lg btn-block" id="google-auth">${icon('google', '', 17)} Continue with Google</button>
      </div>`,
    signup: () => `
      <h2 class="h3">Bazaar mein aapka swagat hai</h2>
      <p class="muted small" style="margin:8px 0 18px">30 second main account banayein — phir store, AI, wholesale sab open ho jayega.</p>
      <div class="stack">
        <div class="field"><span class="label">Your name</span><input class="input" id="au-name" placeholder="Full name"></div>
        <div class="field"><span class="label">Email</span><input class="input" id="au-email" type="email" placeholder="you@email.com"></div>
        <div class="field"><span class="label">Password</span><div class="password-wrap"><input class="input" id="au-pass" type="password" placeholder="6+ characters"><button type="button" class="password-toggle" data-password-toggle>Show</button></div></div>
        <label class="terms-check"><input type="checkbox" id="au-terms"> <span>I agree to the <a href="#/terms">Terms & Conditions</a> and Privacy Policy.</span></label>
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
  let pendingSignup = null
  const paint = () => {
    body.innerHTML = pendingSignup
      ? `<h2 class="h3">Verify your email</h2><p class="muted small" style="margin:8px 0 18px">Email par aaya verification code enter karein (${esc(pendingSignup.email)}).</p><div class="stack"><input class="input" id="au-code" inputmode="numeric" pattern="[0-9]*" maxlength="10" placeholder="Verification code"><button class="btn btn-grad btn-lg btn-block" id="au-verify">Verify & continue</button><button class="btn btn-ghost" id="au-back">Back</button></div>`
      : forms[mode]()
    root.querySelectorAll('[data-auth-tabs] button').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode))
    root.querySelectorAll('[data-role] button').forEach((b) => b.classList.toggle('active', b.dataset.roleV === role))
    root.querySelectorAll('[data-role] button').forEach((b) => b.addEventListener('click', () => { role = b.dataset.roleV; paint() }))
    body.querySelector('[data-password-toggle]')?.addEventListener('click', (e) => {
      const input = body.querySelector('#au-pass')
      input.type = input.type === 'password' ? 'text' : 'password'
      e.currentTarget.textContent = input.type === 'password' ? 'Show' : 'Hide'
    })
    body.querySelector('#google-auth')?.addEventListener('click', async () => {
      const response = await fetch(`/api/auth?action=google&redirect=${encodeURIComponent(location.origin + location.pathname)}`)
      const data = await response.json()
      if (!response.ok) return toast(data.error || 'Google sign in unavailable', 'err')
      location.href = data.url
    })
    body.querySelector('#au-verify')?.addEventListener('click', async (e) => {
      const btn = spinner(e.currentTarget)
      try {
        const result = await authRequest('verify', { email: pendingSignup.email, token: body.querySelector('#au-code').value.trim() })
        const u = result.user
        state.users.push(u); state.session = u.id; save(); pendingSignup = null; btn(); toast('Account verified 🎉', 'ok'); navigate(redirect)
      } catch (err) { btn(); toast(err.message, 'err') }
    })
    body.querySelector('#au-back')?.addEventListener('click', () => { pendingSignup = null; paint() })
    body.querySelector('#au-go')?.addEventListener('click', async (e) => {
      const btn = spinner(e.currentTarget)
      const email = body.querySelector('#au-email').value.trim()
      const pass = body.querySelector('#au-pass').value
      await new Promise((r) => setTimeout(r, 500))
      try {
        if (mode === 'signin') {
          let u
          const result = await authRequest('login', { email, password: pass })
          u = result.user
          const existing = state.users.find((x) => x.email.toLowerCase() === email.toLowerCase())
          if (existing) Object.assign(existing, u)
          else state.users.push(u)
          state.session = u.id
          save()
          btn(); toast('Welcome back, ' + u.name.split(' ')[0] + '!', 'ok')
        } else {
          const name = body.querySelector('#au-name').value.trim()
          if (!name) throw new Error('Apna naam likhein')
          if (pass.length < 6) throw new Error('Password kam se kam 6 characters ka ho')
          if (!body.querySelector('#au-terms').checked) throw new Error('Terms & Conditions accept karein')
          const result = await authRequest('signup', { name, email, password: pass, role })
          if (result.pending_verification) {
            pendingSignup = { email, name, role }
            btn(); paint(); toast('Verification code email par bhej diya gaya', 'ok'); return
          }
          const u = result.user
          state.users.push(u)
          state.session = u.id
          save()
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
  root.querySelector('[data-logout]')?.addEventListener('click', () => { logout(); toast('Logged out'); navigate('#/') })
}

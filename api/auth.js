const json = (res, status, body) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body))
}

const authKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY

const googleAccountFor = async (email) => {
  if (!email || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false
  for (let page = 1; page <= 20; page += 1) {
    const users = await supabaseRequest(`/auth/v1/admin/users?page=${page}&per_page=1000`, {}, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const list = Array.isArray(users) ? users : users.users || []
    const match = list.find((item) => String(item.email || '').toLowerCase() === email.toLowerCase())
    if (match) return Boolean(match.identities?.some((identity) => identity.provider === 'google'))
    if (list.length < 1000) break
  }
  return false
}
const googleConflict = (res) => json(res, 409, {
  code: 'google_email_conflict',
  error: 'This email is already registered with Google. Please continue with Google to log in.',
})
const registeredConflict = (res) => json(res, 409, {
  code: 'email_already_registered',
  error: 'This email is already registered. Please sign in or use Forgot password.',
})
const existingProfileFor = async (email) => {
  const rows = await supabaseRequest(`/rest/v1/users?select=id,email&id=not.is.null&email=eq.${encodeURIComponent(email)}&limit=1`)
  return rows[0] || null
}
const removeAuthUser = async (id) => {
  if (!id || !process.env.SUPABASE_SERVICE_ROLE_KEY) return
  await supabaseRequest(`/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

const supabaseRequest = async (path, options = {}, requestKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY) => {
  const base = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '')
  const key = String(requestKey || '').trim()
  if (!base || !key) throw new Error('Supabase environment variables are not configured')
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.msg || data.error_description || data.message || `Supabase ${response.status}`)
  return data
}

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query?.action === 'google') {
    const base = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '')
    const key = authKey()
    if (!base || !key) return json(res, 503, { error: 'Supabase environment variables are not configured' })
    const redirect = req.query.redirect || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/`
    const params = new URLSearchParams({ provider: 'google', redirect_to: redirect })
    if (req.query.code_challenge) {
      params.set('code_challenge', req.query.code_challenge)
      params.set('code_challenge_method', 'S256')
    }
    return json(res, 200, { url: `${base}/auth/v1/authorize?${params.toString()}` })
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  try {
    const { action, name, password, token, access_token, code, code_verifier, type = 'signup', role = 'customer' } = req.body || {}
    const normalizedEmail = String(req.body?.email || '').trim().toLowerCase()
    if (action === 'signup' && await googleAccountFor(normalizedEmail)) {
      return googleConflict(res)
    }
    if (action === 'oauth' && !access_token) return json(res, 400, { error: 'Google session is missing' })
    if (action === 'oauth_code' && (!code || !code_verifier)) return json(res, 400, { error: 'Google verification is incomplete' })
    if (!['oauth', 'oauth_code', 'reset'].includes(action) && (!normalizedEmail || (action === 'verify' ? !token : action === 'forgot' ? false : !password))) {
      return json(res, 400, { error: action === 'verify' ? 'Email and verification code are required' : 'Email and password are required' })
    }

    let auth
    if (action === 'forgot') {
      // Request an OTP for recovery (explicitly hint 'recovery' where supported)
      await supabaseRequest('/auth/v1/otp', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, create_user: false, type: 'recovery' }),
      }, authKey())
      return json(res, 200, { sent: true })
    } else if (action === 'reset') {
      if (!access_token || !password || password.length < 6) return json(res, 400, { error: 'Verification code and new password are required' })
      await supabaseRequest('/auth/v1/user', {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + access_token },
        body: JSON.stringify({ password }),
      }, authKey())
      return json(res, 200, { reset: true })
    } else if (action === 'oauth_code') {
      auth = await supabaseRequest('/auth/v1/token?grant_type=pkce', {
        method: 'POST',
        body: JSON.stringify({ auth_code: code, code_verifier }),
      }, authKey())
      auth.user = await supabaseRequest('/auth/v1/user', {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + auth.access_token },
      }, authKey())
    } else if (action === 'oauth') {
      auth = await supabaseRequest('/auth/v1/user', {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + access_token },
      }, authKey())
      auth.access_token = access_token
    } else if (action === 'verify') {
      auth = await supabaseRequest('/auth/v1/verify', {
        method: 'POST',
        body: JSON.stringify({ type, email: normalizedEmail, token }),
      }, authKey())
    } else if (action === 'signup') {
      auth = await supabaseRequest('/auth/v1/signup', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password, data: { name, role: 'customer' } }),
      }, authKey())
      if (auth.user?.identities?.some((identity) => identity.provider === 'google')) {
        return googleConflict(res)
      }
      if (auth.user && Array.isArray(auth.user.identities) && auth.user.identities.length === 0) {
        return (await googleAccountFor(normalizedEmail)) ? googleConflict(res) : registeredConflict(res)
      }
      if (auth.user?.email_confirmed_at && !auth.access_token) {
        return (await googleAccountFor(normalizedEmail)) ? googleConflict(res) : registeredConflict(res)
      }
    } else if (action === 'login') {
      auth = await supabaseRequest('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password }),
      }, authKey())
    } else {
      return json(res, 400, { error: 'Unsupported auth action' })
    }

    const user = auth.user || (auth.id ? auth : null)
    if (!user) {
      if (action === 'signup') return json(res, 200, { pending_verification: true, email: normalizedEmail, name, role })
      throw new Error(`Supabase returned no user (${Object.keys(auth || {}).join(', ') || 'empty response'}). This email may already be registered, or the Auth anon key/project URL do not belong to the same Supabase project.`)
    }
    if (['oauth', 'oauth_code'].includes(action)) {
      const existingProfile = await existingProfileFor(normalizedEmail)
      if (existingProfile && existingProfile.id !== user.id) {
        try {
          await removeAuthUser(user.id)
        } catch (cleanupError) {
          console.error('Conflicting OAuth user cleanup failed:', cleanupError.message)
        }
        return json(res, 409, {
          code: 'email_account_conflict',
          error: 'This email is already registered with email and password. Please sign in with your password instead.',
        })
      }
    }
    if (action === 'signup' && (!auth.access_token || !user.email_confirmed_at)) {
      return json(res, 200, { pending_verification: true, email: normalizedEmail, name, role })
    }
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
    const assignedRole = adminEmails.includes(String(user.email || normalizedEmail).toLowerCase()) ? 'admin' : 'customer'
    const profile = {
      id: user.id,
      name: name || user.user_metadata?.name || normalizedEmail.split('@')[0],
      email: user.email,
      role: assignedRole,
      avatar: user.user_metadata?.avatar || '',
      created_at: user.created_at,
    }
    let profileSaved = false
    try {
      await supabaseRequest('/rest/v1/users?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(profile),
      })
      profileSaved = true
    } catch (profileError) {
      console.error('Supabase profile write failed after successful auth:', profileError.message)
    }
    return json(res, 200, { user: profile, access_token: auth.access_token || null, profile_saved: profileSaved })
  } catch (error) {
    const message = /already registered|already been registered|user already registered|email.*registered/i.test(error.message)
      ? 'Is email par account pehle se registered hai. Sign in ya Forgot password use karein.'
      : error.message === 'Invalid login credentials'
      ? 'Email ya password match nahi kar raha. Password dobara type karein ya Forgot password se naya password set karein.'
      : error.message
    return json(res, 400, { error: message })
  }
}

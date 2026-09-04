const json = (res, status, body) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body))
}

const supabaseRequest = async (path, options = {}) => {
  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!base || !key) throw new Error('Supabase environment variables are not configured')
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.msg || data.error_description || data.message || `Supabase ${response.status}`)
  return data
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  try {
    const { action, name, email, password, role = 'customer' } = req.body || {}
    if (!email || (action !== 'google' && !password)) return json(res, 400, { error: 'Email and password are required' })

    let auth
    if (action === 'signup') {
      auth = await supabaseRequest('/auth/v1/signup', {
        method: 'POST',
        headers: { apikey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY },
        body: JSON.stringify({ email, password, data: { name, role } }),
      })
    } else if (action === 'login') {
      auth = await supabaseRequest('/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { apikey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY },
        body: JSON.stringify({ email, password }),
      })
    } else {
      return json(res, 400, { error: 'Unsupported auth action' })
    }

    const user = auth.user
    if (!user) throw new Error('Supabase did not return a user')
    const profile = {
      id: user.id,
      name: name || user.user_metadata?.name || email.split('@')[0],
      email: user.email,
      role: role || user.user_metadata?.role || 'customer',
      avatar: user.user_metadata?.avatar || '',
      created_at: user.created_at,
    }
    await supabaseRequest('/rest/v1/users?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(profile),
    })
    return json(res, 200, { user: profile, access_token: auth.access_token || null })
  } catch (error) {
    return json(res, 400, { error: error.message })
  }
}

const json = (res, status, body) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body))
}

const supabaseRequest = async (path, options = {}, requestKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) => {
  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const key = requestKey
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
        body: JSON.stringify({ email, password, data: { name, role } }),
      }, process.env.SUPABASE_ANON_KEY)
    } else if (action === 'login') {
      auth = await supabaseRequest('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, process.env.SUPABASE_ANON_KEY)
    } else {
      return json(res, 400, { error: 'Unsupported auth action' })
    }

    const user = auth.user
    if (!user) throw new Error('Supabase signup completed without a user. Check SUPABASE_ANON_KEY and Auth email settings in Vercel.')
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
    const assignedRole = adminEmails.includes(String(user.email || email).toLowerCase()) ? 'admin' : (role === 'owner' ? 'owner' : 'customer')
    const profile = {
      id: user.id,
      name: name || user.user_metadata?.name || email.split('@')[0],
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
    return json(res, 400, { error: error.message })
  }
}

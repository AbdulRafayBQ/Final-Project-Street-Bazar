const json = (res, status, body) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body))
}

const request = async (path, options = {}) => {
  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) throw new Error('Supabase environment variables are not configured')
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || `Supabase ${response.status}`)
  return data
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await request('/rest/v1/app_state?select=payload&key=eq.global&limit=1')
      return json(res, 200, rows[0]?.payload || null)
    }
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
    await request('/rest/v1/app_state?on_conflict=key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ key: 'global', payload: req.body }),
    })
    return json(res, 200, { ok: true })
  } catch (error) {
    return json(res, 400, { error: error.message })
  }
}

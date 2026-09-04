const json = (res, status, body) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const key = process.env.AI_API_KEY
  if (!key) return json(res, 503, { error: 'AI_API_KEY is not configured on Vercel' })
  const configuredBase = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '').replace(/\/v1beta$/, '')
  const configuredModel = (process.env.AI_MODEL || 'gpt-4o-mini').trim().replace(/^models\//, '').replace(/^gemini-2\.0-flash(?:-.*)?$/i, 'gemini-3.6-flash')
  const { system = '', user = '', maxTokens = 800 } = req.body || {}
  const isGemini = key.startsWith('AIza') || configuredBase.includes('googleapis.com') || configuredModel.toLowerCase().includes('gemini')
  const isAnthropic = !isGemini && (configuredBase.includes('anthropic.com') || configuredModel.toLowerCase().includes('claude'))
  const base = isGemini
    ? (configuredBase.includes('googleapis.com') ? configuredBase : 'https://generativelanguage.googleapis.com')
    : configuredBase
  const model = isGemini && !configuredModel.toLowerCase().includes('gemini') ? 'gemini-3.6-flash' : configuredModel
  const url = isGemini
    ? `${base}/v1beta/models/${model}:generateContent?key=${key}`
    : isAnthropic ? `${base}/v1/messages` : `${base}/chat/completions`
  const headers = isGemini
    ? { 'Content-Type': 'application/json' }
    : isAnthropic
      ? { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }
      : { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }
  const body = isGemini
    ? { contents: [{ parts: [{ text: `${system}\n\n${user}` }] }] }
    : isAnthropic
      ? { model, system, max_tokens: maxTokens, messages: [{ role: 'user', content: user }] }
      : { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.8, max_tokens: maxTokens }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return json(res, response.status, { error: data.error?.message || `AI provider ${response.status}` })
  const text = isGemini
    ? data.candidates?.[0]?.content?.parts?.[0]?.text
    : isAnthropic ? data.content?.[0]?.text : data.choices?.[0]?.message?.content
  return json(res, 200, { text: text?.trim() || '' })
}

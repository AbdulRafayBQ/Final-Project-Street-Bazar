const json = (res, status, body) => res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body))

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const key = process.env.IMAGE_API_KEY || process.env.AI_API_KEY
  if (!key) return json(res, 503, { error: 'IMAGE_API_KEY is not configured on Vercel' })
  const { prompt = '', image = '' } = req.body || {}
  if (!prompt.trim()) return json(res, 400, { error: 'Design prompt is required' })
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.IMAGE_MODEL || 'gpt-image-1', prompt: `${prompt.trim()}. Product reference: ${image || 'none'}`, size: '1024x1024', n: 1 }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return json(res, response.status, { error: data.error?.message || 'Image provider request failed' })
  const imageData = data.data?.[0] || {}
  return json(res, 200, { url: imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : '') })
}

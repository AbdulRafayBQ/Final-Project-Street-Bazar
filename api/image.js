const json = (res, status, body) => res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body))
const imageInput = async (source) => {
  if (!source) return ''
  if (source.startsWith('data:')) return source.split(',', 2)[1] || ''
  const response = await fetch(source)
  if (!response.ok) throw new Error(`Reference image could not be loaded (${response.status})`)
  return Buffer.from(await response.arrayBuffer()).toString('base64')
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
    const { prompt = '', image = '' } = req.body || {}
    if (!prompt.trim()) return json(res, 400, { error: 'Design prompt is required' })
    const provider = (process.env.IMAGE_PROVIDER || 'openai').toLowerCase()
    const fullPrompt = `Create a polished product image based on this request: ${prompt.trim()}.`

    if (provider === 'huggingface') {
      const key = process.env.HF_TOKEN
      if (!key) return json(res, 503, { error: 'HF_TOKEN is not configured on Vercel' })
      const configuredModel = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-dev'
      const configuredProvider = (process.env.HF_IMAGE_PROVIDER || 'fal-ai').toLowerCase()
      const attempts = [
        { provider: configuredProvider, model: configuredModel, url: `https://router.huggingface.co/${configuredProvider}/fal-ai/flux/dev`, body: { prompt: fullPrompt, image_size: 'square_hd', num_images: 1 } },
        { provider: 'nscale', model: 'black-forest-labs/FLUX.1-schnell', url: 'https://router.huggingface.co/nscale/v1/images/generations', body: { model: 'black-forest-labs/FLUX.1-schnell', prompt: fullPrompt, n: 1, size: '1024x1024' } },
      ]
      let response
      let model = configuredModel
      let lastError = ''
      for (const attempt of attempts) {
        model = attempt.model
        response = await fetch(attempt.url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(attempt.body),
        })
        if (response.ok) break
        const body = await response.text().catch(() => '')
        let data = {}
        try { data = body ? JSON.parse(body) : {} } catch { data = {} }
        lastError = data.error || body.slice(0, 300) || 'Hugging Face image request failed'
        if (!/deprecated|no longer supported|model.*not found|not available|unsupported|provider/i.test(lastError)) break
      }
      const contentType = response.headers.get('content-type') || ''
      if (!response.ok) {
        const hint = /permission|sufficient permissions|inference providers|unauthorized|forbidden/i.test(lastError)
          ? ' Hugging Face token needs Inference Providers permission. Create a fine-grained token with Inference permissions, then update HF_TOKEN in Vercel and redeploy.'
          : ''
        return json(res, response.status, { error: `${lastError} (provider: ${configuredProvider}, model: ${model})${hint}` })
      }
      if (!contentType.startsWith('image/')) {
        const generated = await response.json().catch(() => ({}))
        const imageUrl = generated.images?.[0]?.url || generated.data?.[0]?.url || generated.image?.url || (generated.data?.[0]?.b64_json ? `data:image/png;base64,${generated.data[0].b64_json}` : '')
        if (imageUrl) return json(res, 200, { url: imageUrl })
        return json(res, 502, { error: 'Image provider did not return an image. Check that your Hugging Face token has Inference Providers permission.' })
      }
      const bytes = Buffer.from(await response.arrayBuffer())
      return json(res, 200, { url: `data:${contentType.split(';')[0]};base64,${bytes.toString('base64')}` })
    }

    const key = process.env.IMAGE_API_KEY || process.env.AI_API_KEY
    if (!key) return json(res, 503, { error: 'IMAGE_API_KEY is not configured on Vercel' })
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: process.env.IMAGE_MODEL || 'gpt-image-1', prompt: fullPrompt, size: '1024x1024', n: 1 }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return json(res, response.status, { error: data.error?.message || 'Image provider request failed' })
    const imageData = data.data?.[0] || {}
    return json(res, 200, { url: imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : '') })
  } catch (error) {
    console.error('Image generation failed:', error)
    return json(res, 502, { error: error?.message || 'Image generation provider failed' })
  }
}

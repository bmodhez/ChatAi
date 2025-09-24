import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
app.use(express.json({ limit: '10mb' }))

function toOpenAIContent(messages, imageBase64, imageMimeType) {
  const msgs = Array.isArray(messages) ? messages.map((m) => ({ role: m.role, content: m.content })) : []
  if (imageBase64 && imageMimeType) {
    // Attach image to the last user message
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        const dataUrl = `data:${imageMimeType};base64,${imageBase64}`
        msgs[i] = {
          role: 'user',
          content: [
            { type: 'text', text: typeof msgs[i].content === 'string' ? msgs[i].content : '' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        }
        break
      }
    }
  }
  return msgs
}

app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' })
      return
    }
    const { messages, imageBase64, imageMimeType } = req.body || {}
    const apiKey = process.env.GROK_API_KEY
    if (!apiKey) {
      res.status(500).json({ error: 'Missing API key. Set GROK_API_KEY.' })
      return
    }

    const payload = {
      model: process.env.GROK_MODEL || 'x-ai/grok-4',
      messages: toOpenAIContent(messages, imageBase64, imageMimeType),
      stream: false,
      temperature: 0.7,
      max_tokens: typeof (req.body?.max_tokens) === 'number' ? req.body.max_tokens : 512,
    }

    const baseURL = process.env.GROK_BASE_URL || process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1'

    const r = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.DEPLOY_URL || 'http://localhost:5173',
        'X-Title': 'AI Chat Bot',
      },
      body: JSON.stringify(payload),
    })

    if (!r.ok) {
      let errText = ''
      try { errText = await r.text() } catch {}
      res.status(r.status).json({ error: errText || `Upstream error (${r.status})` })
      return
    }

    const data = await r.json()
    const text = data?.choices?.[0]?.message?.content || ''
    res.status(200).json({ text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg || 'Server error' })
  }
})

// Static production hosting for built app
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})

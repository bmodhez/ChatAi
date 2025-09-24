import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ViteDevServer } from 'vite'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        try {
          const chunks: Buffer[] = []
          for await (const chunk of req as any) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          }
          const bodyStr = Buffer.concat(chunks).toString('utf8')
          const body = bodyStr ? JSON.parse(bodyStr) : {}
          const messages = Array.isArray(body?.messages) ? body.messages : []
          const system: string =
            typeof body?.system === 'string' && body.system.trim().length
              ? body.system
              : 'You are a production-grade AI assistant for chat. Help users ask questions, create content, learn new skills, and get real-time, accurate, and safe solutions. Be concise, friendly, and actionable.'

          const useGemini = !!process.env.GEMINI_API_KEY
          const grokKey = process.env.GROK_API_KEY
          const useGrok = !!grokKey

          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-cache')

          if (useGemini) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
            const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
            const model = genAI.getGenerativeModel({ model: modelName })

            const imageBase64 = typeof body?.imageBase64 === 'string' ? body.imageBase64 : undefined
            const imageMimeType = typeof body?.imageMimeType === 'string' ? body.imageMimeType : undefined

            const contents: any[] = []
            // System prompt as initial user instruction
            contents.push({ role: 'user', parts: [{ text: system }] })

            for (const m of messages) {
              if (m.role === 'system') continue
              contents.push({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: String(m.content ?? '') }],
              })
            }

            // If image provided with the last user message, append as inlineData part
            if (imageBase64 && imageMimeType) {
              const last = contents[contents.length - 1]
              if (last && last.role === 'user') {
                last.parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } })
              } else {
                contents.push({ role: 'user', parts: [{ inlineData: { data: imageBase64, mimeType: imageMimeType } }] })
              }
            }

            const streamResult = await model.generateContentStream({ contents })

            for await (const chunk of streamResult.stream) {
              const text = chunk.text()
              if (text) res.write(text)
            }
            res.end()
            return
          }

          if (useGrok) {
            const baseURL = (process.env as any).GROK_BASE_URL || (process.env as any).OPENAI_BASE_URL || 'https://openrouter.ai/api/v1'
            const openai = new OpenAI({
              apiKey: grokKey as string,
              baseURL,
              defaultHeaders: baseURL.includes('openrouter.ai') ? {
                'HTTP-Referer': process.env.DEPLOY_URL || 'http://localhost:5173',
                'X-Title': 'AI Chat Bot',
              } : undefined,
            } as any)
            const imageBase64 = typeof body?.imageBase64 === 'string' ? body.imageBase64 : undefined
            const imageMimeType = typeof body?.imageMimeType === 'string' ? body.imageMimeType : undefined

            const baseMsgs: any[] = messages.map((m: any) => ({ role: m.role, content: m.content }))
            let finalMsgs: any[] = [{ role: 'system', content: system }, ...baseMsgs]
            if (imageBase64 && imageMimeType) {
              const dataUrl = `data:${imageMimeType};base64,${imageBase64}`
              for (let i = finalMsgs.length - 1; i >= 0; i--) {
                if (finalMsgs[i].role === 'user') {
                  const c = finalMsgs[i].content
                  const textPart = Array.isArray(c) ? c : [{ type: 'text', text: String(c ?? '') }]
                  finalMsgs[i] = {
                    role: 'user',
                    content: [...textPart, { type: 'image_url', image_url: { url: dataUrl } }],
                  }
                  break
                }
              }
            }

            const resp = await openai.chat.completions.create({
              model: process.env.GROK_MODEL || process.env.OPENAI_MODEL || (baseURL.includes('openrouter.ai') ? 'x-ai/grok-4' : 'gpt-4o-mini'),
              stream: false,
              max_tokens: typeof body?.max_tokens === 'number' ? body.max_tokens : 512,
              messages: finalMsgs,
              temperature: typeof body?.temperature === 'number' ? body.temperature : 0.7,
            })

            const text = (resp as any)?.choices?.[0]?.message?.content || ''
            res.end(JSON.stringify({ text }))
            return
          }

          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Missing API key (set GROK_API_KEY or GEMINI_API_KEY)' }))
        } catch (err) {
          res.statusCode = 500
          const msg = (err && typeof (err as any).message === 'string') ? (err as any).message : 'Server error'
          res.end(JSON.stringify({ error: msg }))
          console.error('[API /api/chat] Error:', err)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    port: 5173,
  },
})

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
          const useOpenAI = !!process.env.OPENAI_API_KEY

          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.setHeader('Transfer-Encoding', 'chunked')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')

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

          if (useOpenAI) {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
            const stream = await openai.chat.completions.create({
              model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
              stream: true,
              messages: [
                { role: 'system', content: system },
                ...messages.map((m: any) => ({ role: m.role, content: m.content })),
              ],
              temperature: typeof body?.temperature === 'number' ? body.temperature : 0.7,
            })

            for await (const part of stream) {
              const delta = part.choices?.[0]?.delta?.content || ''
              if (delta) res.write(delta)
            }
            res.end()
            return
          }

          res.statusCode = 500
          res.end('Missing API key (set GEMINI_API_KEY or OPENAI_API_KEY)')
        } catch (err) {
          res.statusCode = 500
          const msg = (err && typeof (err as any).message === 'string') ? (err as any).message : 'Server error'
          res.end(`Server error: ${msg}`)
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

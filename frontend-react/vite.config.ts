import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ViteDevServer } from 'vite'
import OpenAI from 'openai'

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

          const apiKey = process.env.OPENAI_API_KEY
          if (!apiKey) {
            res.statusCode = 500
            res.end('Missing OPENAI_API_KEY')
            return
          }

          const openai = new OpenAI({ apiKey })

          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.setHeader('Transfer-Encoding', 'chunked')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')

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
        } catch (err: any) {
          res.statusCode = 500
          res.end('Server error')
          console.error('[API /api/chat] Error:', err?.message || err)
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

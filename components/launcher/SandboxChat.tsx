'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface SandboxChatProps {
  systemPrompt: string
  model: string
  apiKey: string
  onClose: () => void
}

export function SandboxChat({ systemPrompt, model, apiKey, onClose }: SandboxChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)
    setError(null)

    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, messages: nextMessages, model, apiKey }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Request failed')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages((m) => {
          const updated = [...m]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch (err) {
      setError(String(err))
      setMessages((m) => m.slice(0, -1)) // remove empty assistant bubble
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex flex-col w-full sm:max-w-lg h-[85vh] sm:h-[600px] border border-foreground/10 bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Sandbox
            </span>
            <span className="text-xs text-muted-foreground">No real transactions · {model}</span>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* System prompt preview */}
        <div className="border-b border-foreground/10 px-4 py-2 shrink-0">
          <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
            {systemPrompt || '(no system prompt)'}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <p className="text-sm text-muted-foreground">
                Test your agent here. Ask it anything your users might.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-sm px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground border border-foreground/10'
                }`}
              >
                {msg.content || (streaming && i === messages.length - 1 ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Spinner size="sm" /> thinking...
                  </span>
                ) : null)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 shrink-0">
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-foreground/10 p-3 shrink-0 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Type a message..."
            disabled={streaming}
            className="flex-1 rounded-sm border border-foreground/20 bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={send}
            disabled={streaming || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {streaming ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

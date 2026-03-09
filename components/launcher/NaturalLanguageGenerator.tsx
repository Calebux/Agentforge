'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

interface GeneratedConfig {
  name: string
  templateId: string
  systemPrompt: string
  suggestedSpendingLimit: number
  suggestedModel: string
  tags: string[]
  explanation: string
}

interface NaturalLanguageGeneratorProps {
  onUse: (config: GeneratedConfig) => void
}

const EXAMPLES = [
  'An agent that splits restaurant bills with my friends on Telegram and settles in USDT',
  'Auto-save 15% of every incoming payment to a separate savings wallet every week',
  'Monitor CELO price and buy the dip automatically when it drops below $0.80',
]

export function NaturalLanguageGenerator({ onUse }: NaturalLanguageGeneratorProps) {
  const [description, setDescription] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<GeneratedConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (!description.trim() || !apiKey.trim()) return
    setLoading(true)
    setGenerated(null)
    setError(null)

    try {
      const res = await fetch('/api/generate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, apiKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setGenerated(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-foreground/10 bg-foreground/[0.02]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-foreground/10 px-6 py-4">
        <Sparkles className="h-4 w-4 text-foreground/60" />
        <span className="text-sm font-semibold text-foreground">Generate with AI</span>
        <span className="ml-auto text-xs text-muted-foreground">Describe what you want in plain English</span>
      </div>

      <div className="p-6 flex flex-col gap-4">
        {/* Description */}
        <div>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="I want an agent that..."
            className="w-full rounded-sm border border-foreground/20 bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none resize-none"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setDescription(ex)}
                className="text-xs text-muted-foreground hover:text-foreground bg-foreground/5 hover:bg-foreground/10 rounded px-2 py-1 transition-colors text-left"
              >
                {ex.slice(0, 50)}...
              </button>
            ))}
          </div>
        </div>

        {/* API key */}
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="OpenAI API key (sk-...) — used for generation only"
          className="w-full rounded-sm border border-foreground/20 bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
        />

        {/* Generate button */}
        <button
          type="button"
          onClick={generate}
          disabled={loading || !description.trim() || !apiKey.trim()}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {loading ? <><Spinner size="sm" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Agent Config</>}
        </button>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2">{error}</p>
        )}

        {/* Generated result */}
        {generated && (
          <div className="flex flex-col gap-4 border border-foreground/10 p-4 bg-background animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Explanation */}
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-foreground/50 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground italic">{generated.explanation}</p>
            </div>

            {/* Config summary */}
            <div className="grid grid-cols-2 divide-x divide-y divide-foreground/10 border border-foreground/10">
              <div className="p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Name</p>
                <p className="text-sm font-semibold text-foreground mt-1">{generated.name}</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Model</p>
                <p className="text-sm font-semibold text-foreground mt-1">{generated.suggestedModel}</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Limit</p>
                <p className="text-sm font-semibold text-foreground mt-1">${generated.suggestedSpendingLimit} USDT</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Tags</p>
                <p className="text-xs text-muted-foreground mt-1">{generated.tags.join(', ')}</p>
              </div>
            </div>

            {/* System prompt preview */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">System Prompt</p>
              <pre className="text-xs text-foreground/70 whitespace-pre-wrap font-sans leading-relaxed line-clamp-4 border border-foreground/10 p-3 bg-foreground/[0.02]">
                {generated.systemPrompt}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onUse(generated)}
                className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Use This Config <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="flex items-center gap-2 rounded-md border border-foreground/20 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-all"
              >
                <RefreshCw className="h-4 w-4" /> Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

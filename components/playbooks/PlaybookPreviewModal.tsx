'use client'

import { useEffect } from 'react'
import { X, Zap, Radio, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { Playbook, PlaybookCategory } from '@/types/playbook'

const categoryVariant: Record<PlaybookCategory, 'green' | 'gold' | 'red' | 'gray' | 'blue'> = {
  payments:  'green',
  savings:   'gold',
  trading:   'red',
  social:    'blue',
  utility:   'gray',
  community: 'blue',
}

interface PlaybookPreviewModalProps {
  playbook: Playbook | null
  onClose: () => void
  onUse: (p: Playbook) => void
}

export function PlaybookPreviewModal({ playbook, onClose, onUse }: PlaybookPreviewModalProps) {
  useEffect(() => {
    if (!playbook) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [playbook, onClose])

  if (!playbook) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-none border border-foreground/10 bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-foreground/10 bg-background px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">{playbook.name}</h2>
            <Badge variant={categoryVariant[playbook.category]}>{playbook.category}</Badge>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Description */}
          <p className="text-sm text-muted-foreground">{playbook.description}</p>

          {/* Meta grid */}
          <div className="grid grid-cols-3 divide-x divide-foreground/10 border border-foreground/10">
            <div className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Deploys</p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />{playbook.uses.toLocaleString()}
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Triggers</p>
              <p className="text-xs text-foreground">{playbook.triggers.join(', ')}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Model</p>
              <p className="text-xs text-foreground">{playbook.defaultModel}</p>
            </div>
          </div>

          {/* Variables */}
          {playbook.variables.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Variables You Configure
              </p>
              <div className="flex flex-col gap-2">
                {playbook.variables.map((v) => (
                  <div key={v.key} className="flex items-start gap-3 rounded-sm border border-foreground/10 p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{v.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {v.type} · {v.required ? 'required' : 'optional'}
                        {v.options ? ` · options: ${v.options.join(', ')}` : ''}
                      </p>
                    </div>
                    <code className="rounded bg-foreground/5 px-2 py-0.5 text-xs text-muted-foreground font-mono">
                      {'{' + v.key + '}'}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Celo features */}
          {playbook.celoFeatures.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <Link2 className="h-3 w-3" /> Celo Features Used
              </p>
              <div className="flex flex-wrap gap-2">
                {playbook.celoFeatures.map((f) => (
                  <span key={f} className="rounded bg-green-500/10 px-2.5 py-1 text-xs text-green-400">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Channels */}
          {playbook.requiredChannels.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <Radio className="h-3 w-3" /> Required Channels
              </p>
              <div className="flex gap-2">
                {playbook.requiredChannels.map((c) => (
                  <span key={c} className="rounded bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* System prompt preview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">System Prompt Preview</p>
            <pre className="rounded-sm border border-foreground/10 bg-foreground/[0.02] p-4 text-xs text-foreground/70 whitespace-pre-wrap leading-relaxed font-sans overflow-auto max-h-48">
              {playbook.systemPrompt}
            </pre>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => { onUse(playbook); onClose() }}
            className="w-full rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
          >
            Use This Playbook
          </button>
        </div>
      </div>
    </div>
  )
}

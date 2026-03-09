'use client'

import { useState } from 'react'
import { TemplateGallery } from '@/components/templates/TemplateGallery'
import { PlaybookCard } from '@/components/playbooks/PlaybookCard'
import { PlaybookPreviewModal } from '@/components/playbooks/PlaybookPreviewModal'
import { Button } from '@/components/ui/Button'
import { OFFICIAL_PLAYBOOKS } from '@/lib/playbooks'
import type { AgentTemplate } from '@/types/template'
import type { Playbook } from '@/types/playbook'

type Tab = 'templates' | 'playbooks'

interface Step1Props {
  selectedTemplate: AgentTemplate | null
  onSelect: (t: AgentTemplate) => void
  selectedPlaybookId?: string
  onPlaybookSelect: (p: Playbook) => void
  onNext: () => void
}

export function Step1Template({ selectedTemplate, onSelect, selectedPlaybookId, onPlaybookSelect, onNext }: Step1Props) {
  const [tab, setTab] = useState<Tab>(selectedPlaybookId ? 'playbooks' : 'templates')
  const [preview, setPreview] = useState<Playbook | null>(null)

  const canContinue =
    (tab === 'templates' && !!selectedTemplate) ||
    (tab === 'playbooks' && !!selectedPlaybookId)

  return (
    <div className="flex flex-col gap-6">
      {/* Heading + tabs */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Choose a Starting Point</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start from a template or pick a ready-made playbook.
        </p>
        <div className="flex gap-2 mt-4">
          {(['templates', 'playbooks'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-all ${
                tab === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      {tab === 'templates' && (
        <TemplateGallery selectedId={selectedTemplate?.id} onSelect={onSelect} />
      )}

      {/* Playbooks */}
      {tab === 'playbooks' && (
        <div className="border border-foreground/10 grid sm:grid-cols-2 md:grid-cols-3 divide-x divide-y divide-foreground/10">
          {OFFICIAL_PLAYBOOKS.map((pb) => (
            <PlaybookCard
              key={pb.id}
              playbook={pb}
              selected={pb.id === selectedPlaybookId}
              onUse={() => onPlaybookSelect(pb)}
              onPreview={() => setPreview(pb)}
              compact
            />
          ))}
        </div>
      )}

      {/* Continue */}
      <div className="flex justify-end pt-2 max-w-3xl">
        <Button onClick={onNext} disabled={!canContinue} size="lg">
          Continue →
        </Button>
      </div>

      <PlaybookPreviewModal
        playbook={preview}
        onClose={() => setPreview(null)}
        onUse={(p) => { setPreview(null); onPlaybookSelect(p) }}
      />
    </div>
  )
}

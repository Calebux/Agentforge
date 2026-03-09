'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { OFFICIAL_PLAYBOOKS } from '@/lib/playbooks'
import { PlaybookCard } from '@/components/playbooks/PlaybookCard'
import { PlaybookPreviewModal } from '@/components/playbooks/PlaybookPreviewModal'
import type { Playbook, PlaybookCategory } from '@/types/playbook'

type Filter = 'all' | PlaybookCategory

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'payments',  label: 'Payments' },
  { value: 'savings',   label: 'Savings' },
  { value: 'trading',   label: 'Trading' },
  { value: 'social',    label: 'Social' },
  { value: 'utility',   label: 'Utility' },
  { value: 'community', label: 'Community' },
]

export default function PlaybooksPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [preview, setPreview] = useState<Playbook | null>(null)

  const filtered = filter === 'all'
    ? OFFICIAL_PLAYBOOKS
    : OFFICIAL_PLAYBOOKS.filter((p) => p.category === filter)

  function usePlaybook(p: Playbook) {
    router.push(`/launch?playbook=${p.id}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Playbooks</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Start with a Playbook</h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          Pre-built agent workflows for real-world Celo use cases. Pick one, fill in your details, and deploy in under 60 seconds.
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{OFFICIAL_PLAYBOOKS.length} official playbooks</span>
          <span>·</span>
          <span>{OFFICIAL_PLAYBOOKS.reduce((s, p) => s + p.uses, 0).toLocaleString()} total deploys</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              filter === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="border border-foreground/10 grid sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-foreground/10">
        {filtered.map((playbook) => (
          <PlaybookCard
            key={playbook.id}
            playbook={playbook}
            onUse={() => usePlaybook(playbook)}
            onPreview={() => setPreview(playbook)}
          />
        ))}
      </div>

      {/* Preview modal */}
      <PlaybookPreviewModal
        playbook={preview}
        onClose={() => setPreview(null)}
        onUse={(p) => { setPreview(null); usePlaybook(p) }}
      />
    </div>
  )
}

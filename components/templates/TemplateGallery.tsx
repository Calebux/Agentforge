'use client'

import { useState } from 'react'
import { AGENT_TEMPLATES } from '@/lib/templates'
import { TemplateCard } from './TemplateCard'
import type { AgentTemplate } from '@/types/template'

type Category = 'all' | AgentTemplate['category']

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'payments', label: 'Payments' },
  { value: 'savings',  label: 'Savings' },
  { value: 'social',   label: 'Social' },
  { value: 'trading',  label: 'Trading' },
  { value: 'custom',   label: 'Custom' },
]

interface TemplateGalleryProps {
  selectedId?: string
  onSelect?: (template: AgentTemplate) => void
}

export function TemplateGallery({ selectedId, onSelect }: TemplateGalleryProps) {
  const [category, setCategory] = useState<Category>('all')

  const filtered = category === 'all'
    ? AGENT_TEMPLATES
    : AGENT_TEMPLATES.filter((t) => t.category === category)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              category === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="border border-foreground/10 grid sm:grid-cols-2 md:grid-cols-3 divide-x divide-y divide-foreground/10">
        {filtered.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect?.(template)}
            className="block w-full text-left"
          >
            <TemplateCard
              template={template}
              selected={template.id === selectedId}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

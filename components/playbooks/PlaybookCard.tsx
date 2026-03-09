'use client'

import {
  CreditCard, PiggyBank, TrendingUp, MessageSquare, Settings, Users,
  CheckCircle, Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { Playbook, PlaybookCategory } from '@/types/playbook'
import type React from 'react'

const categoryIcons: Record<PlaybookCategory, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  payments:  CreditCard,
  savings:   PiggyBank,
  trading:   TrendingUp,
  social:    MessageSquare,
  utility:   Settings,
  community: Users,
}

const categoryVariant: Record<PlaybookCategory, 'green' | 'gold' | 'red' | 'gray' | 'blue'> = {
  payments:  'green',
  savings:   'gold',
  trading:   'red',
  social:    'blue',
  utility:   'gray',
  community: 'blue',
}

interface PlaybookCardProps {
  playbook: Playbook
  selected?: boolean
  onUse: () => void
  onPreview?: () => void
  compact?: boolean
}

export function PlaybookCard({ playbook, selected = false, onUse, onPreview, compact = false }: PlaybookCardProps) {
  const Icon = categoryIcons[playbook.category] ?? Settings

  return (
    <div
      className={`relative overflow-hidden p-6 flex flex-col gap-3 transition-colors ${
        selected ? 'bg-secondary' : 'hover:bg-foreground/[0.03]'
      }`}
    >
      {/* Decorative gradient — matches FeatureCard */}
      <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
        <div className="from-foreground/5 to-foreground/1 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100" />
      </div>

      {/* Icon row */}
      <div className="flex items-center justify-between">
        <Icon className="text-foreground/75 size-6" strokeWidth={1} aria-hidden />
        {playbook.author === 'official' && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle className="h-3 w-3" /> Verified
          </span>
        )}
      </div>

      {/* Title + description */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-foreground">{playbook.name}</h3>
        <p className={`text-muted-foreground mt-1 text-xs font-light leading-relaxed ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>
          {playbook.description}
        </p>
      </div>

      {/* Meta row */}
      {!compact && (
        <div className="flex items-center justify-between pt-1">
          <Badge variant={categoryVariant[playbook.category]}>{playbook.category}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />{playbook.uses.toLocaleString()} deploys
          </span>
        </div>
      )}

      {/* Tags */}
      {!compact && (
        <div className="flex flex-wrap gap-1">
          {playbook.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-foreground/5 px-1.5 py-0.5 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className={`flex gap-2 pt-1 ${compact ? 'mt-auto' : ''}`}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onUse() }}
          className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Use Playbook
        </button>
        {!compact && onPreview && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPreview() }}
            className="rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all"
          >
            Preview
          </button>
        )}
      </div>
    </div>
  )
}

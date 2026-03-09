'use client'

import { CreditCard, PiggyBank, TrendingUp, MessageSquare, Settings, Bot } from 'lucide-react'
import { FeatureCard } from '@/components/blocks/grid-feature-cards'
import type { AgentTemplate } from '@/types/template'
import type React from 'react'

const templateIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'payment-bot':     CreditCard,
  'savings-agent':   PiggyBank,
  'price-alert-bot': TrendingUp,
  'social-bot':      MessageSquare,
  'custom-agent':    Settings,
}

interface TemplateCardProps {
  template: AgentTemplate
  selected?: boolean
}

export function TemplateCard({ template, selected = false }: TemplateCardProps) {
  const Icon = templateIcons[template.id] ?? Bot
  return (
    <FeatureCard
      feature={{
        icon: Icon,
        title: template.name,
        description: template.description,
      }}
      className={selected ? 'bg-secondary' : ''}
    />
  )
}

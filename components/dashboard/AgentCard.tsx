import Link from 'next/link'
import { Bot, CreditCard, PiggyBank, TrendingUp, MessageSquare, Settings } from 'lucide-react'
import { FeatureCard } from '@/components/blocks/grid-feature-cards'
import { getTemplateById } from '@/lib/templates'
import type { Agent, AgentStatus } from '@/types/agent'
import type React from 'react'

const templateIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'payment-bot':     CreditCard,
  'savings-agent':   PiggyBank,
  'price-alert-bot': TrendingUp,
  'social-bot':      MessageSquare,
  'custom-agent':    Settings,
}

const statusLabel: Record<AgentStatus, string> = {
  running: 'Running',
  stopped: 'Stopped',
  error:   'Error',
  pending: 'Pending',
}

export function AgentCard({ agent }: { agent: Agent }) {
  const template = getTemplateById(agent.template_id)
  const Icon = templateIcons[agent.template_id] ?? Bot

  return (
    <Link href={`/agent/${agent.id}`} className="block h-full">
      <FeatureCard
        className="h-full"
        feature={{
          icon: Icon,
          title: agent.name,
          description: `${statusLabel[agent.status]} — ${agent.llm_provider} / ${agent.llm_model}`,
        }}
      />
    </Link>
  )
}

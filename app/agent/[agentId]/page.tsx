'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, Cpu, Calendar, Link2, DollarSign, Square, Play, Trash2, ExternalLink, Zap } from 'lucide-react'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { PendingApprovals } from '@/components/dashboard/PendingApprovals'
import { GlowCard } from '@/components/ui/GlowCard'
import { FeatureCard } from '@/components/blocks/grid-feature-cards'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { getTemplateById } from '@/lib/templates'
import type { Agent, AgentStatus } from '@/types/agent'

const statusBadge: Record<AgentStatus, { variant: 'green' | 'red' | 'gold' | 'gray'; label: string }> = {
  running: { variant: 'green', label: '● Running' },
  stopped: { variant: 'gray',  label: '○ Stopped' },
  error:   { variant: 'red',   label: '⚠ Error' },
  pending: { variant: 'gold',  label: '◌ Pending' },
}

export default function AgentPage() {
  const { agentId } = useParams<{ agentId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${agentId}`)
      if (!res.ok) throw new Error('Agent not found')
      return res.json()
    },
    refetchInterval: 10_000,
  })

  const simulateMutation = useMutation({
    mutationFn: async () => {
      const isYieldOptimizer = agent?.template_id === 'yield-optimizer'
      const body = isYieldOptimizer
        ? {
            action_type: 'bridge',
            description: 'Rebalance 100 USDC from Celo to Arbitrum — Aave yield: Celo 3.1% → Arbitrum 5.8%',
            amount: 100,
            from_chain: 'celo',
            to_chain: 'arbitrum',
            from_token: 'USDC',
            to_token: 'USDC',
          }
        : {
            action_type: 'payment',
            description: 'Send 25 USDC to 0xRecipient — exceeds approval threshold',
            amount: 25,
          }
      const res = await fetch(`/api/agents/${agentId}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create approval')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals', agentId] }),
  })

  const patchMutation = useMutation({
    mutationFn: async (fields: Partial<Agent>) => {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) throw new Error('Failed to update agent')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent', agentId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete agent')
    },
    onSuccess: () => router.push('/dashboard'),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  if (!agent) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">Agent not found.</p>
        <Link href="/dashboard"><Button variant="secondary">Back to Dashboard</Button></Link>
      </div>
    )
  }

  const template = getTemplateById(agent.template_id)
  const { variant, label } = statusBadge[agent.status]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col gap-6">
      {/* Back */}
      <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Bot className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">{template?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={variant}>{label}</Badge>
          <a
            href="https://agentscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Agentscan
          </a>
          {agent.status === 'running' && (
            <Button variant="secondary" size="sm" loading={patchMutation.isPending}
              onClick={() => patchMutation.mutate({ status: 'stopped' })}>
              <Square className="h-3.5 w-3.5" /> Stop
            </Button>
          )}
          {agent.status === 'stopped' && (
            <Button variant="secondary" size="sm" loading={patchMutation.isPending}
              onClick={() => patchMutation.mutate({ status: 'running' })}>
              <Play className="h-3.5 w-3.5" /> Restart
            </Button>
          )}
          <Button variant="secondary" size="sm" loading={simulateMutation.isPending}
            onClick={() => simulateMutation.mutate()}
            title="Simulate an agent action requiring approval (demo)">
            <Zap className="h-3.5 w-3.5" /> Simulate
          </Button>
          <Button variant="danger" size="sm" loading={deleteMutation.isPending}
            onClick={() => { if (confirm('Delete this agent? This cannot be undone.')) deleteMutation.mutate() }}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-foreground/10 border border-foreground/10">
        {[
          { icon: DollarSign, title: 'Monthly Limit', description: agent.spending_limit_monthly ? `$${agent.spending_limit_monthly}` : 'Unlimited' },
          { icon: DollarSign, title: 'Per-Tx Limit',  description: agent.spending_limit_per_tx  ? `$${agent.spending_limit_per_tx}`  : 'Unlimited' },
          { icon: Link2,      title: 'On-Chain',      description: agent.onchain_address ? `${agent.onchain_address.slice(0, 8)}…` : 'Not registered' },
          { icon: Calendar,   title: 'Created',       description: new Date(agent.created_at).toLocaleDateString() },
        ].map((stat) => (
          <FeatureCard key={stat.title} feature={stat} />
        ))}
      </div>

      {/* LLM info */}
      <GlowCard>
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">LLM Configuration</p>
        </div>
        <p className="text-foreground font-medium">{agent.llm_provider} / {agent.llm_model}</p>
      </GlowCard>

      {/* Pending approvals */}
      <GlowCard>
        <PendingApprovals agentId={agentId} />
        {/* Placeholder when empty */}
      </GlowCard>

      {/* Spending chart */}
      <SpendingChart agentId={agentId} />

      {/* System prompt */}
      <GlowCard>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">System Prompt</p>
        <pre className="text-sm text-foreground/70 whitespace-pre-wrap font-sans leading-relaxed">
          {agent.system_prompt || <span className="text-muted-foreground italic">No system prompt set.</span>}
        </pre>
      </GlowCard>

      {/* Activity feed */}
      <GlowCard>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Activity Feed</p>
        <ActivityFeed agentId={agentId} />
      </GlowCard>
    </div>
  )
}


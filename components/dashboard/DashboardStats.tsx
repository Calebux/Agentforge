'use client'

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { Bot, Play, Square, AlertTriangle } from 'lucide-react'
import { FeatureCard } from '@/components/blocks/grid-feature-cards'
import type { Agent } from '@/types/agent'

export function DashboardStats() {
  const { address, isConnected } = useAccount()

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['agents', address],
    queryFn: async () => {
      const url = address ? `/api/agents?owner=${address}` : '/api/agents'
      const res = await fetch(url)
      if (!res.ok) return []
      return res.json()
    },
    enabled: isConnected,
    refetchInterval: 10_000,
  })

  const stats = [
    { title: 'Total Agents', description: isConnected ? String(agents.length) : '—', icon: Bot },
    { title: 'Running',      description: isConnected ? String(agents.filter(a => a.status === 'running').length) : '—', icon: Play },
    { title: 'Stopped',      description: isConnected ? String(agents.filter(a => a.status === 'stopped').length) : '—', icon: Square },
    { title: 'Errors',       description: isConnected ? String(agents.filter(a => a.status === 'error').length)   : '—', icon: AlertTriangle },
  ]

  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-foreground/10 border border-foreground/10 lg:grid-cols-4">
      {stats.map((stat) => (
        <FeatureCard key={stat.title} feature={stat} />
      ))}
    </div>
  )
}

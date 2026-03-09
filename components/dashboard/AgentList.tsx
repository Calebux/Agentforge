'use client'

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { Rocket, Wallet } from 'lucide-react'
import { AgentCard } from './AgentCard'
import { Spinner } from '@/components/ui/Spinner'
import type { Agent } from '@/types/agent'

export function AgentList() {
  const { address, isConnected } = useAccount()

  const { data: agents, isLoading, error } = useQuery<Agent[]>({
    queryKey: ['agents', address],
    queryFn: async () => {
      const url = address ? `/api/agents?owner=${address}` : '/api/agents'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch agents')
      return res.json()
    },
    refetchInterval: 10_000,
    enabled: isConnected,
  })

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-foreground/15 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Wallet className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Wallet not connected</p>
          <p className="mt-1 text-sm text-muted-foreground">Connect your wallet to see your agents.</p>
        </div>
      </div>
    )
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  if (error) return <p className="text-center text-sm text-red-400 py-8">Failed to load agents.</p>

  if (!agents || agents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-foreground/15 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Rocket className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground">No agents yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Launch your first agent to get started.</p>
        </div>
        <Link
          href="/launch"
          className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-md"
        >
          <Rocket className="h-4 w-4" />
          Launch Your First Agent
        </Link>
      </div>
    )
  }

  return (
    <div className="border border-foreground/10 grid sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-foreground/10">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  )
}

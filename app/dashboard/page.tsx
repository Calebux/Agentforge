import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AgentList } from '@/components/dashboard/AgentList'
import { DashboardStats } from '@/components/dashboard/DashboardStats'

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your deployed agents</p>
        </div>
        <Link
          href="/launch"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-md"
        >
          <Plus className="h-4 w-4" />
          New Agent
        </Link>
      </div>

      {/* Stats */}
      <DashboardStats />

      {/* Agent grid */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Your Agents</h2>
        <AgentList />
      </div>
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import type { AgentEvent } from '@/types/agent'

const eventBadge: Record<AgentEvent['event_type'], { variant: 'green' | 'red' | 'blue' | 'gold' | 'gray'; label: string }> = {
  start:   { variant: 'green', label: 'START' },
  stop:    { variant: 'gray',  label: 'STOP' },
  message: { variant: 'blue',  label: 'MSG' },
  payment: { variant: 'gold',  label: 'PAY' },
  error:   { variant: 'red',   label: 'ERR' },
}

export function ActivityFeed({ agentId }: { agentId: string }) {
  const { data, isLoading } = useQuery<{ logs: string; events: AgentEvent[] }>({
    queryKey: ['logs', agentId],
    queryFn: async () => {
      const res = await fetch(`/api/logs/${agentId}`)
      if (!res.ok) throw new Error('Failed to fetch logs')
      return res.json()
    },
    refetchInterval: 3_000,
  })

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  const events = data?.events ?? []
  const rawLogs = data?.logs ?? ''

  return (
    <div className="flex flex-col gap-4">
      {events.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Events</h3>
          {events.map((ev) => {
            const { variant, label } = eventBadge[ev.event_type] ?? { variant: 'gray' as const, label: ev.event_type }
            return (
              <div key={ev.id} className="flex items-start gap-3 rounded-md border border-foreground/10 bg-secondary p-3">
                <Badge variant={variant}>{label}</Badge>
                <div className="flex-1 min-w-0">
                  {ev.payload && (
                    <p className="text-xs text-foreground/70 break-words">
                      {(() => { try { return JSON.stringify(JSON.parse(ev.payload), null, 0) } catch { return ev.payload } })()}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(ev.created_at).toLocaleString()}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {rawLogs && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Raw Logs</h3>
          <pre className="rounded-md border border-foreground/10 bg-black/60 p-4 text-xs text-muted-foreground overflow-auto max-h-64 font-mono">
            {rawLogs}
          </pre>
        </div>
      )}

      {events.length === 0 && !rawLogs && (
        <p className="text-center text-sm text-muted-foreground py-8">No activity yet. Logs will appear here.</p>
      )}
    </div>
  )
}

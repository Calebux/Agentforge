'use client'

import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function SpendingChart({ agentId }: { agentId: string }) {
  const { data = [] } = useQuery<{ day: string; spend: number }[]>({
    queryKey: ['spending', agentId],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${agentId}/spending`)
      if (!res.ok) return []
      return res.json()
    },
    refetchInterval: 30_000,
  })

  const total = data.reduce((sum, d) => sum + d.spend, 0)

  return (
    <div className="border border-foreground/10 bg-secondary p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          USDT Spending — Last 7 Days
        </h3>
        <span className="text-sm font-semibold text-foreground">
          ${total.toFixed(2)} total
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0 0% 98%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(0 0% 98%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(0 0% 9%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, fontSize: 12 }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            itemStyle={{ color: 'hsl(0 0% 98%)' }}
            formatter={(v: number) => [`$${v.toFixed(2)}`, 'Spent']}
          />
          <Area type="monotone" dataKey="spend" stroke="hsl(0 0% 98%)" strokeWidth={2} fill="url(#spendGradient)" />
        </AreaChart>
      </ResponsiveContainer>
      {total === 0 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">No payment events recorded yet.</p>
      )}
    </div>
  )
}

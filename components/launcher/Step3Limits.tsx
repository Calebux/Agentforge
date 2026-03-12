'use client'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export interface Step3Config {
  spending_limit_monthly: number
  spending_limit_per_tx: number
  approval_threshold: number
  allowed_actions: {
    send_payments: boolean
    browse_web: boolean
    read_messages: boolean
    post_messages: boolean
  }
  telegram_bot_token: string
}

interface Step3Props {
  config: Step3Config
  onChange: (c: Step3Config) => void
  onNext: () => void
  onBack: () => void
}

const ACTIONS: { key: keyof Step3Config['allowed_actions']; label: string; desc: string }[] = [
  { key: 'send_payments', label: 'Send Payments',  desc: 'Allow agent to send USDT transactions' },
  { key: 'browse_web',    label: 'Browse Web',     desc: 'Allow agent to fetch web data' },
  { key: 'read_messages', label: 'Read Messages',  desc: 'Allow agent to read incoming messages' },
  { key: 'post_messages', label: 'Post Messages',  desc: 'Allow agent to post messages' },
]

export function Step3Limits({ config, onChange, onNext, onBack }: Step3Props) {
  const set = (field: keyof Omit<Step3Config, 'allowed_actions'>, value: number) =>
    onChange({ ...config, [field]: value })

  const toggleAction = (key: keyof Step3Config['allowed_actions']) =>
    onChange({ ...config, allowed_actions: { ...config.allowed_actions, [key]: !config.allowed_actions[key] } })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Set Limits & Guardrails</h2>
        <p className="mt-1 text-sm text-muted-foreground">Control how much your agent can spend and what it can do.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Monthly Limit (USDT)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={1000}
                step={5}
                value={config.spending_limit_monthly}
                onChange={(e) => set('spending_limit_monthly', Number(e.target.value))}
                className="flex-1 accent-foreground"
              />
              <Input
                type="number"
                value={config.spending_limit_monthly}
                onChange={(e) => set('spending_limit_monthly', Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
          <Input
            label="Max per Transaction (USDT)"
            type="number"
            value={config.spending_limit_per_tx}
            onChange={(e) => set('spending_limit_per_tx', Number(e.target.value))}
          />
        </div>

        <Input
          label="Require Approval Above (USDT)"
          type="number"
          value={config.approval_threshold}
          onChange={(e) => set('approval_threshold', Number(e.target.value))}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Allowed Actions</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ACTIONS.map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => toggleAction(key)}
                className={`flex items-start gap-3 rounded-md border p-3 text-left transition-all ${
                  config.allowed_actions[key]
                    ? 'border-foreground/30 bg-secondary'
                    : 'border-foreground/10 bg-secondary/50'
                }`}
              >
                <div
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 transition-all ${
                    config.allowed_actions[key] ? 'border-primary bg-primary' : 'border-foreground/30'
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-foreground/10 bg-secondary/30 p-4 space-y-2">
        <p className="text-sm font-medium text-foreground">Telegram Bot (optional)</p>
        <p className="text-xs text-muted-foreground">
          Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">@BotFather</a> and paste the token here to give your agent its own dedicated Telegram bot.
        </p>
        <Input
          placeholder="123456789:ABCdef..."
          value={config.telegram_bot_token}
          onChange={(e) => onChange({ ...config, telegram_bot_token: e.target.value })}
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} size="lg">Continue →</Button>
      </div>
    </div>
  )
}

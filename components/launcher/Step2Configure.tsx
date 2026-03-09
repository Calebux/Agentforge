'use client'

import { useState } from 'react'
import { Eye, EyeOff, Brain, Sparkles, Server } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import type { Playbook, PlaybookVariable } from '@/types/playbook'

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', sub: 'GPT-4o · Mini', Icon: Brain },
  { value: 'anthropic', label: 'Anthropic', sub: 'Sonnet · Haiku', Icon: Sparkles },
  { value: 'ollama', label: 'Ollama', sub: 'Local · No key', Icon: Server },
]

const MODELS: Record<string, { value: string; label: string; sub: string }[]> = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o', sub: 'Most capable' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', sub: 'Faster · cheaper' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', sub: 'Best balance' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', sub: 'Fastest' },
  ],
  ollama: [
    { value: 'llama3.2', label: 'Llama 3.2', sub: 'General purpose' },
    { value: 'mistral', label: 'Mistral', sub: 'Efficient' },
  ],
}

const API_KEY_HINTS: Record<string, string> = {
  openai: 'platform.openai.com/api-keys',
  anthropic: 'console.anthropic.com/keys',
}

export interface Step2Config {
  name: string
  llm_provider: string
  llm_model: string
  system_prompt: string
  api_key: string
}

interface Step2Props {
  config: Step2Config
  onChange: (c: Step2Config) => void
  onNext: () => void
  onBack: () => void
  playbook?: Playbook | null
  playbookVarValues?: Record<string, string>
  onPlaybookVarChange?: (key: string, value: string) => void
  onOpenSandbox?: () => void
}

function VariableField({
  variable,
  value,
  onChange,
}: {
  variable: PlaybookVariable
  value: string
  onChange: (v: string) => void
}) {
  if (variable.type === 'select' && variable.options) {
    return (
      <Select
        label={variable.label + (variable.required ? ' *' : '')}
        value={value}
        options={variable.options.map((o) => ({ value: o, label: o }))}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  return (
    <Input
      label={variable.label + (variable.required ? ' *' : '')}
      placeholder={variable.placeholder}
      type={variable.type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  )
}

export function Step2Configure({
  config,
  onChange,
  onNext,
  onBack,
  playbook,
  playbookVarValues = {},
  onPlaybookVarChange,
  onOpenSandbox,
}: Step2Props) {
  const [showKey, setShowKey] = useState(false)
  const models = MODELS[config.llm_provider] ?? []

  const set = (field: keyof Step2Config, value: string) => {
    if (field === 'llm_provider') {
      onChange({ ...config, llm_provider: value, llm_model: MODELS[value]?.[0]?.value ?? '' })
    } else {
      onChange({ ...config, [field]: value })
    }
  }

  const canContinue = config.name && config.llm_provider && config.llm_model && config.system_prompt

  return (
    <div className="flex flex-col gap-8">
      {/* Agent name */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Agent Name</SectionLabel>
        <Input
          placeholder="e.g. My Payment Bot"
          value={config.name}
          onChange={(e) => set('name', e.target.value)}
        />
      </div>

      {/* LLM Provider */}
      <div className="flex flex-col gap-3">
        <SectionLabel>LLM Provider</SectionLabel>
        <div className="grid grid-cols-3 border border-foreground/10 divide-x divide-foreground/10">
          {PROVIDERS.map(({ value, label, sub, Icon }) => {
            const selected = config.llm_provider === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => set('llm_provider', value)}
                className={`flex flex-col items-center gap-2 px-4 py-5 text-center transition-all ${
                  selected
                    ? 'bg-foreground/[0.06] text-foreground'
                    : 'text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${selected ? 'text-foreground' : 'text-muted-foreground'}`} />
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
                <span
                  className={`mt-0.5 h-0.5 w-5 rounded-full transition-all ${
                    selected ? 'bg-foreground/60' : 'bg-transparent'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Model */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Model</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {models.map(({ value, label, sub }) => {
            const selected = config.llm_model === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => set('llm_model', value)}
                className={`flex flex-col items-start gap-0.5 border px-4 py-3 text-left transition-all ${
                  selected
                    ? 'border-foreground/40 bg-foreground/[0.06] text-foreground'
                    : 'border-foreground/10 text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                }`}
              >
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* API Key */}
      {config.llm_provider !== 'ollama' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel>API Key</SectionLabel>
            {API_KEY_HINTS[config.llm_provider] && (
              <span className="text-xs text-muted-foreground">
                Get yours at{' '}
                <span className="font-mono text-foreground/60">
                  {API_KEY_HINTS[config.llm_provider]}
                </span>
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder={config.llm_provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              value={config.api_key}
              onChange={(e) => set('api_key', e.target.value)}
              className="w-full border border-foreground/10 bg-secondary px-4 py-2.5 pr-11 font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Playbook variables */}
      {playbook && playbook.variables.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Playbook Variables</SectionLabel>
          <div className="flex flex-col gap-3 border border-foreground/10 p-4 bg-foreground/[0.02]">
            {playbook.variables.map((variable) => (
              <VariableField
                key={variable.key}
                variable={variable}
                value={playbookVarValues[variable.key] ?? ''}
                onChange={(v) => onPlaybookVarChange?.(variable.key, v)}
              />
            ))}
          </div>
        </div>
      )}

      {/* System prompt */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionLabel>System Prompt</SectionLabel>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {config.system_prompt.length} chars
            </span>
            {config.system_prompt && config.api_key && onOpenSandbox && (
              <button
                type="button"
                onClick={onOpenSandbox}
                className="border border-foreground/20 px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-all"
              >
                Test Agent
              </button>
            )}
          </div>
        </div>
        <textarea
          rows={10}
          placeholder="You are a helpful agent on the Celo blockchain. Your job is to..."
          value={config.system_prompt}
          onChange={(e) => set('system_prompt', e.target.value)}
          className="w-full resize-y border border-foreground/10 bg-secondary px-4 py-3 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
        />
        {playbook && playbook.variables.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Variables like{' '}
            <code className="bg-foreground/5 px-1 font-mono">{'{variable_key}'}</code>{' '}
            are replaced with your values above.
          </p>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} disabled={!canContinue} size="lg">Continue →</Button>
      </div>
    </div>
  )
}

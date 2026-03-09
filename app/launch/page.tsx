'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { StepIndicator } from '@/components/launcher/StepIndicator'
import { Step1Template } from '@/components/launcher/Step1Template'
import { Step2Configure, type Step2Config } from '@/components/launcher/Step2Configure'
import { Step3Limits, type Step3Config } from '@/components/launcher/Step3Limits'
import { Step4Deploy } from '@/components/launcher/Step4Deploy'
import { NaturalLanguageGenerator } from '@/components/launcher/NaturalLanguageGenerator'
import { SandboxChat } from '@/components/launcher/SandboxChat'
import { getPlaybookById } from '@/lib/playbooks'
import type { AgentTemplate } from '@/types/template'
import type { Playbook } from '@/types/playbook'

function injectVars(prompt: string, vars: Record<string, string>): string {
  return prompt.replace(/\{(\w+)\}/g, (match, key) => vars[key] || match)
}

function LaunchContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [showAIGen, setShowAIGen] = useState(false)
  const [showSandbox, setShowSandbox] = useState(false)

  const [template, setTemplate] = useState<AgentTemplate | null>(null)
  const [playbook, setPlaybook] = useState<Playbook | null>(null)
  const [playbookVarValues, setPlaybookVarValues] = useState<Record<string, string>>({})

  const [config, setConfig] = useState<Step2Config>({
    name: '',
    llm_provider: 'openai',
    llm_model: 'gpt-4o',
    system_prompt: '',
    api_key: '',
  })
  const [limits, setLimits] = useState<Step3Config>({
    spending_limit_monthly: 50,
    spending_limit_per_tx: 10,
    approval_threshold: 25,
    allowed_actions: {
      send_payments: true,
      browse_web: false,
      read_messages: true,
      post_messages: true,
    },
  })

  // Handle ?playbook= URL param
  useEffect(() => {
    const pbId = searchParams.get('playbook')
    if (pbId) {
      const pb = getPlaybookById(pbId)
      if (pb) selectPlaybook(pb)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectTemplate(t: AgentTemplate) {
    setTemplate(t)
    setPlaybook(null)
    setPlaybookVarValues({})
    setConfig((c) => ({
      ...c,
      name: c.name || t.name,
      system_prompt: c.system_prompt || t.defaultSystemPrompt,
    }))
    setLimits((l) => ({ ...l, spending_limit_monthly: t.defaultSpendingLimit }))
  }

  function selectPlaybook(p: Playbook) {
    setPlaybook(p)
    setTemplate(null)
    setPlaybookVarValues({})
    setConfig((c) => ({
      ...c,
      name: c.name || p.name,
      system_prompt: p.systemPrompt,
      llm_model: p.defaultModel,
      llm_provider: p.defaultModel.startsWith('gpt') ? 'openai' : 'anthropic',
    }))
    setLimits((l) => ({ ...l, spending_limit_monthly: p.defaultSpendingLimit }))
  }

  function handlePlaybookVarChange(key: string, value: string) {
    const updated = { ...playbookVarValues, [key]: value }
    setPlaybookVarValues(updated)
    if (playbook) {
      setConfig((c) => ({ ...c, system_prompt: injectVars(playbook.systemPrompt, updated) }))
    }
  }

  function useGeneratedConfig(generated: {
    name: string
    templateId: string
    systemPrompt: string
    suggestedSpendingLimit: number
    suggestedModel: string
  }) {
    const provider = generated.suggestedModel.startsWith('gpt') ? 'openai' : 'anthropic'
    setConfig((c) => ({
      ...c,
      name: generated.name,
      system_prompt: generated.systemPrompt,
      llm_model: generated.suggestedModel,
      llm_provider: provider,
    }))
    setLimits((l) => ({ ...l, spending_limit_monthly: generated.suggestedSpendingLimit }))
    setShowAIGen(false)
    setStep(2) // jump to configure step
  }

  const activeTemplate = template ?? null
  const activePlaybookId = playbook?.id

  const catMap: Record<string, AgentTemplate['category']> = {
    payments: 'payments', savings: 'savings', trading: 'trading', social: 'social',
  }
  const templateForDeploy: AgentTemplate | null = activeTemplate ?? (playbook ? {
    id: playbook.id,
    name: playbook.name,
    description: playbook.description,
    icon: playbook.icon,
    category: catMap[playbook.category] ?? 'custom',
    defaultSystemPrompt: playbook.systemPrompt,
    defaultSpendingLimit: playbook.defaultSpendingLimit,
    requiredChannels: playbook.requiredChannels,
    tags: playbook.tags,
  } : null)

  const STEP_META: Record<number, { title: string; sub: string }> = {
    1: { title: 'Choose a Template', sub: 'Pick a starting point — or describe your agent with AI.' },
    2: { title: 'Configure Your Agent', sub: 'Set the name, LLM backend, and system prompt.' },
    3: { title: 'Set Spending Limits', sub: 'Control how much your agent can spend per month.' },
    4: { title: 'Review & Deploy', sub: 'Launch your agent on the Celo blockchain.' },
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Centered header */}
      <div className="mx-auto max-w-2xl mb-10">
        <StepIndicator current={step} />

        <div className="mt-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{STEP_META[step].title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{STEP_META[step].sub}</p>
          </div>
          {step <= 2 && (
            <button
              type="button"
              onClick={() => setShowAIGen((v) => !v)}
              className="shrink-0 flex items-center gap-1.5 border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate with AI
              {showAIGen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* AI Generator (collapsible) */}
        {showAIGen && (
          <div className="mt-6">
            <NaturalLanguageGenerator onUse={useGeneratedConfig} />
          </div>
        )}
      </div>

      {/* Wizard */}
      {step === 1 && (
        <Step1Template
          selectedTemplate={activeTemplate}
          onSelect={selectTemplate}
          selectedPlaybookId={activePlaybookId}
          onPlaybookSelect={selectPlaybook}
          onNext={() => setStep(2)}
        />
      )}

      <div className="mx-auto max-w-2xl">
        {step === 2 && (
          <Step2Configure
            config={config}
            onChange={setConfig}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            playbook={playbook}
            playbookVarValues={playbookVarValues}
            onPlaybookVarChange={handlePlaybookVarChange}
            onOpenSandbox={() => setShowSandbox(true)}
          />
        )}
        {step === 3 && (
          <Step3Limits
            config={limits}
            onChange={setLimits}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && templateForDeploy && (
          <Step4Deploy
            template={templateForDeploy}
            config={config}
            limits={limits}
            onBack={() => setStep(3)}
          />
        )}
      </div>

      {/* Sandbox modal */}
      {showSandbox && (
        <SandboxChat
          systemPrompt={config.system_prompt}
          model={config.llm_model}
          apiKey={config.api_key}
          onClose={() => setShowSandbox(false)}
        />
      )}
    </div>
  )
}

export default function LaunchPage() {
  return (
    <Suspense>
      <LaunchContent />
    </Suspense>
  )
}

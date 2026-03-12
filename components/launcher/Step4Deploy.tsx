'use client'

import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import Link from 'next/link'
import { CheckCircle, Rocket, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { buildRegisterAgentCalldata } from '@/lib/erc8004'
import type { AgentTemplate } from '@/types/template'
import type { Step2Config } from './Step2Configure'
import type { Step3Config } from './Step3Limits'

type DeployState = 'idle' | 'deploying' | 'success' | 'error'

const DEPLOY_STEPS = [
  'Starting OpenClaw daemon',
  'Configuring LLM backend',
  'Registering ERC-8004 identity',
  'Agent live',
]

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ERC8004_CONTRACT_ADDRESS ?? ''
const HAS_CONTRACT =
  CONTRACT_ADDRESS !== '' && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000'

interface Step4Props {
  template: AgentTemplate
  config: Step2Config
  limits: Step3Config
  onBack: () => void
}

export function Step4Deploy({ template, config, limits, onBack }: Step4Props) {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [state, setState] = useState<DeployState>('idle')
  const [deployStep, setDeployStep] = useState(0)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [onchainTx, setOnchainTx] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function deploy() {
    if (!address) return
    setState('deploying')
    setDeployStep(0)
    setError(null)

    try {
      // Step 1 — start OpenClaw + configure LLM
      await new Promise((r) => setTimeout(r, 700))
      setDeployStep(1)
      await new Promise((r) => setTimeout(r, 700))
      setDeployStep(2)

      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_address: address,
          template_id: template.id,
          name: config.name,
          llm_provider: config.llm_provider,
          llm_model: config.llm_model,
          llm_api_key: config.api_key,
          system_prompt: config.system_prompt,
          spending_limit_monthly: limits.spending_limit_monthly,
          spending_limit_per_tx: limits.spending_limit_per_tx,
          allowed_actions: limits.allowed_actions,
          approval_threshold: limits.approval_threshold,
          telegram_bot_token: limits.telegram_bot_token || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Deployment failed')

      const newAgentId: string = data.agentId
      setAgentId(newAgentId)

      // Step 3 — ERC-8004 on-chain registration (if contract is configured)
      if (HAS_CONTRACT) {
        try {
          const calldata = buildRegisterAgentCalldata(
            newAgentId,
            address,
            { name: config.name, template: template.id, llm: config.llm_model }
          )
          const txHash = await writeContractAsync(calldata)
          setOnchainTx(txHash)
          // Persist the tx hash as on-chain reference
          await fetch(`/api/agents/${newAgentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ onchain_address: txHash }),
          })
        } catch (e) {
          // Non-fatal — agent is live even if on-chain registration fails
          console.warn('ERC-8004 registration skipped:', e)
        }
      }

      setDeployStep(3)
      setState('success')
    } catch (err) {
      setError(String(err))
      setState('error')
    }
  }

  if (state === 'success' && agentId) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center bg-secondary">
          <CheckCircle className="h-8 w-8 text-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Agent is Live!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {config.name} is running and ready to work.
          </p>
          {onchainTx && (
            <p className="mt-2 text-xs text-muted-foreground">
              ERC-8004 registered ·{' '}
              <span className="font-mono text-foreground/60">{onchainTx.slice(0, 18)}…</span>
            </p>
          )}
          {!onchainTx && HAS_CONTRACT === false && (
            <p className="mt-2 text-xs text-muted-foreground">
              On-chain registration skipped — set{' '}
              <span className="font-mono">NEXT_PUBLIC_ERC8004_CONTRACT_ADDRESS</span> to enable.
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`/agent/${agentId}`}>
            <Button size="lg">View Agent Dashboard</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" size="lg">All Agents</Button>
          </Link>
          <a
            href={`https://agentscan.io`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="lg">
              <ExternalLink className="h-4 w-4" /> Agentscan
            </Button>
          </a>
        </div>
      </div>
    )
  }

  if (state === 'deploying') {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <Spinner size="lg" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Deploying Agent...</h2>
          <p className="mt-1 text-sm text-muted-foreground">{DEPLOY_STEPS[deployStep]}</p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {DEPLOY_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-sm">
              <div className={`h-2 w-2 rounded-full ${
                i < deployStep ? 'bg-foreground' : i === deployStep ? 'bg-foreground/60 animate-pulse' : 'bg-foreground/20'
              }`} />
              <span className={i <= deployStep ? 'text-foreground' : 'text-muted-foreground'}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-foreground/10 bg-secondary p-4 space-y-3">
        <Row label="Template" value={template.name} />
        <Row label="Agent Name" value={config.name} />
        <Row label="LLM" value={`${config.llm_provider} / ${config.llm_model}`} />
        <Row label="Monthly Limit" value={`$${limits.spending_limit_monthly} USDT`} />
        <Row label="Per-Tx Limit" value={`$${limits.spending_limit_per_tx} USDT`} />
        <Row
          label="Actions"
          value={
            Object.entries(limits.allowed_actions)
              .filter(([, v]) => v)
              .map(([k]) => k.replace(/_/g, ' '))
              .join(', ') || 'none'
          }
        />
        <Row label="ERC-8004" value={HAS_CONTRACT ? 'Will register on-chain' : 'Contract not configured'} />
      </div>

      {!address && (
        <p className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          Connect your wallet before deploying.
        </p>
      )}
      {error && (
        <p className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button onClick={deploy} disabled={!address} size="lg">
          <Rocket className="h-4 w-4" /> Deploy Agent
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  )
}

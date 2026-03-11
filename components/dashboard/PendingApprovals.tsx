'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSendTransaction, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { CheckCircle, XCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { PendingApproval } from '@/lib/db'

interface LiFiQuote {
  transactionRequest?: {
    to: string
    data: string
    value: string
    gasLimit: string
    gasPrice?: string
    chainId: number
  }
  estimate?: {
    toAmount: string
    feeCosts?: { amountUSD: string }[]
    gasCosts?: { amountUSD: string }[]
    executionDuration: number
  }
  action?: {
    fromChainId: number
    toChainId: number
    fromToken: { symbol: string; decimals: number }
    toToken: { symbol: string }
  }
}

const CHAIN_NAMES: Record<string, string> = {
  celo: 'Celo',
  arbitrum: 'Arbitrum',
  polygon: 'Polygon',
  base: 'Base',
  ethereum: 'Ethereum',
  optimism: 'Optimism',
}

const ACTION_BADGE: Record<string, 'gold' | 'green' | 'gray'> = {
  bridge: 'gold',
  rebalance: 'green',
  payment: 'gray',
}

export function PendingApprovals({ agentId }: { agentId: string }) {
  const queryClient = useQueryClient()
  const { address } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()

  const { data: approvals = [], isLoading } = useQuery<PendingApproval[]>({
    queryKey: ['approvals', agentId],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${agentId}/approvals?status=pending`)
      if (!res.ok) throw new Error('Failed to fetch approvals')
      return res.json()
    },
    refetchInterval: 15_000,
  })

  if (isLoading) return null
  if (approvals.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
        Pending Approvals ({approvals.length})
      </p>
      {approvals.map((approval) => (
        <ApprovalCard
          key={approval.id}
          approval={approval}
          agentId={agentId}
          walletAddress={address}
          sendTransaction={sendTransactionAsync}
          onSettled={() => queryClient.invalidateQueries({ queryKey: ['approvals', agentId] })}
        />
      ))}
    </div>
  )
}

function ApprovalCard({
  approval,
  agentId,
  walletAddress,
  sendTransaction,
  onSettled,
}: {
  approval: PendingApproval
  agentId: string
  walletAddress?: string
  sendTransaction: ReturnType<typeof useSendTransaction>['sendTransactionAsync']
  onSettled: () => void
}) {
  const [lifiQuote, setLifiQuote] = useState<LiFiQuote | null>(
    approval.lifi_quote ? (() => { try { return JSON.parse(approval.lifi_quote!) } catch { return null } })() : null
  )
  const [fetchingQuote, setFetchingQuote] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const isBridge = approval.action_type === 'bridge' || approval.action_type === 'rebalance'
  const canExecute = isBridge && lifiQuote?.transactionRequest && walletAddress

  async function fetchLiFiQuote() {
    if (!approval.from_chain || !approval.to_chain || !approval.amount || !walletAddress) return
    setFetchingQuote(true)
    try {
      const params = new URLSearchParams({
        fromChain: approval.from_chain,
        toChain: approval.to_chain,
        fromToken: approval.from_token ?? 'USDC',
        toToken: approval.to_token ?? 'USDC',
        fromAmount: String(Math.round((approval.amount ?? 0) * 1e6)), // USDC has 6 decimals
        fromAddress: walletAddress,
      })
      const res = await fetch(`/api/lifi/quote?${params}`)
      const data = await res.json()
      if (res.ok) setLifiQuote(data)
    } finally {
      setFetchingQuote(false)
    }
  }

  const patchMutation = useMutation({
    mutationFn: async ({ status, tx_hash }: { status: 'approved' | 'rejected'; tx_hash?: string }) => {
      const res = await fetch(`/api/agents/${agentId}/approvals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: approval.id, status, tx_hash }),
      })
      if (!res.ok) throw new Error('Failed to update approval')
    },
    onSuccess: onSettled,
  })

  async function handleApprove() {
    if (canExecute && lifiQuote?.transactionRequest) {
      setExecuting(true)
      try {
        const tx = lifiQuote.transactionRequest
        const hash = await sendTransaction({
          to: tx.to as `0x${string}`,
          data: tx.data as `0x${string}`,
          value: tx.value ? parseEther('0') : undefined, // USDC bridge = no ETH value
          gas: BigInt(tx.gasLimit),
          chainId: tx.chainId,
        })
        setTxHash(hash)
        await patchMutation.mutateAsync({ status: 'approved', tx_hash: hash })
      } catch (err) {
        console.error('Transaction failed:', err)
      } finally {
        setExecuting(false)
      }
    } else {
      // Non-LI.FI approval — just mark as approved
      await patchMutation.mutateAsync({ status: 'approved' })
    }
  }

  const toAmount = lifiQuote?.estimate?.toAmount
    ? (Number(lifiQuote.estimate.toAmount) / 1e6).toFixed(2)
    : null

  const totalFeesUsd = lifiQuote?.estimate
    ? [
        ...(lifiQuote.estimate.feeCosts ?? []),
        ...(lifiQuote.estimate.gasCosts ?? []),
      ].reduce((sum, c) => sum + Number(c.amountUSD), 0)
    : null

  const estMins = lifiQuote?.estimate?.executionDuration
    ? Math.ceil(lifiQuote.estimate.executionDuration / 60)
    : null

  if (txHash) {
    return (
      <div className="border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Executed</p>
          <p className="text-xs text-muted-foreground font-mono truncate">{txHash}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={ACTION_BADGE[approval.action_type] ?? 'gray'}>
              {approval.action_type}
            </Badge>
            {approval.from_chain && approval.to_chain && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {CHAIN_NAMES[approval.from_chain] ?? approval.from_chain}
                <ArrowRight className="h-3 w-3" />
                {CHAIN_NAMES[approval.to_chain] ?? approval.to_chain}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground">{approval.description}</p>
          {approval.amount && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Amount: ${approval.amount} {approval.from_token ?? 'USDC'}
            </p>
          )}
        </div>
      </div>

      {/* LI.FI quote details */}
      {isBridge && (
        <div className="border border-foreground/10 bg-background/40 p-3 flex flex-col gap-1.5">
          {lifiQuote ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">You receive</p>
                  <p className="text-foreground font-medium">{toAmount ?? '—'} USDC</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total fees</p>
                  <p className="text-foreground font-medium">
                    {totalFeesUsd != null ? `$${totalFeesUsd.toFixed(2)}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Est. time</p>
                  <p className="text-foreground font-medium">{estMins != null ? `~${estMins}m` : '—'}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Get real-time route from LI.FI</p>
              <button
                type="button"
                onClick={fetchLiFiQuote}
                disabled={fetchingQuote || !walletAddress}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50 transition-colors"
              >
                {fetchingQuote
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <RefreshCw className="h-3 w-3" />}
                {fetchingQuote ? 'Fetching...' : 'Get Quote'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={patchMutation.isPending || executing}
          loading={executing || (patchMutation.isPending && patchMutation.variables?.status === 'approved')}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {canExecute ? 'Approve & Execute' : 'Approve'}
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => patchMutation.mutate({ status: 'rejected' })}
          disabled={patchMutation.isPending || executing}
          loading={patchMutation.isPending && patchMutation.variables?.status === 'rejected'}
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject
        </Button>
      </div>
    </div>
  )
}

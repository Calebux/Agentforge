import { createPublicClient, http } from 'viem'
import { celoAlfajores } from 'viem/chains'
import { CELO_RPC } from './celo'

export const ERC8004_ABI = [
  {
    name: 'registerAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'metadata', type: 'string' },
    ],
    outputs: [{ name: 'agentAddress', type: 'address' }],
  },
  {
    name: 'getReputation',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentAddress', type: 'address' }],
    outputs: [{ name: 'score', type: 'uint256' }],
  },
  {
    name: 'getAgent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'string' }],
    outputs: [
      { name: 'agentAddress', type: 'address' },
      { name: 'owner', type: 'address' },
      { name: 'metadata', type: 'string' },
    ],
  },
] as const

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ERC8004_CONTRACT_ADDRESS ??
  '0x0000000000000000000000000000000000000000') as `0x${string}`

export const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(CELO_RPC),
})

export async function getAgentReputation(agentAddress: `0x${string}`) {
  if (
    CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000'
  ) {
    return BigInt(0)
  }
  const score = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ERC8004_ABI,
    functionName: 'getReputation',
    args: [agentAddress],
  })
  return score
}

// Called from frontend after wallet signs the transaction
export function buildRegisterAgentCalldata(
  agentId: string,
  ownerAddress: `0x${string}`,
  metadata: object
) {
  return {
    address: CONTRACT_ADDRESS,
    abi: ERC8004_ABI,
    functionName: 'registerAgent' as const,
    args: [agentId, ownerAddress, JSON.stringify(metadata)] as const,
  }
}

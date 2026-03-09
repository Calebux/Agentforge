import { createPublicClient, http } from 'viem'
import { CELO_RPC, activeChain } from './celo'

// ERC-8004 IdentityRegistry ABI (real contract interface)
export const ERC8004_ABI = [
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    name: 'setMetadata',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'metadataKey', type: 'string' },
      { name: 'metadataValue', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'getMetadata',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'metadataKey', type: 'string' },
    ],
    outputs: [{ name: '', type: 'bytes' }],
  },
] as const

// Celo mainnet: 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
// Celo Alfajores: set NEXT_PUBLIC_ERC8004_CONTRACT_ADDRESS in .env.local
const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ERC8004_CONTRACT_ADDRESS ??
  '0x0000000000000000000000000000000000000000') as `0x${string}`

export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(CELO_RPC),
})

// Called from frontend after wallet signs the transaction.
// Registers the agent on ERC-8004 IdentityRegistry with a metadata URI
// pointing back to our API so the on-chain record is queryable.
export function buildRegisterAgentCalldata(
  agentId: string,
  ownerAddress: `0x${string}`,
  metadata: object
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  // agentURI is a link to our agent metadata endpoint
  const agentURI = `${appUrl}/api/agents/${agentId}`
  void ownerAddress
  void metadata

  return {
    address: CONTRACT_ADDRESS,
    abi: ERC8004_ABI,
    functionName: 'register' as const,
    args: [agentURI] as const,
  }
}

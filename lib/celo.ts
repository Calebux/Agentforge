import { defineChain } from 'viem'
import { celoAlfajores, celo } from 'viem/chains'

export const CELO_CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? '44787',
  10
)

export const activeChain = CELO_CHAIN_ID === 42220 ? celo : celoAlfajores

export const CELO_RPC =
  process.env.NEXT_PUBLIC_CELO_RPC ??
  'https://alfajores-forno.celo-testnet.org'

export { celoAlfajores, celo }

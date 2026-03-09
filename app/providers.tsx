'use client'

import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { celoAlfajores, celo } from 'viem/chains'
import '@rainbow-me/rainbowkit/styles.css'

// Get a free projectId at https://cloud.walletconnect.com
// Required for Trust Wallet, MetaMask Mobile, and all WalletConnect-based wallets
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'ffffffffffffffffffffffffffffffff'

const config = getDefaultConfig({
  appName: 'AgentForge',
  projectId: PROJECT_ID,
  chains: [celo, celoAlfajores],
  transports: {
    [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
    [celo.id]: http('https://forno.celo.org'),
  },
  ssr: true,
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

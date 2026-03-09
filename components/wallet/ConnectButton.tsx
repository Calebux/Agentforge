'use client'

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'

export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        if (!mounted) return null

        if (!account) {
          return (
            <button
              onClick={openConnectModal}
              className="px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-md"
            >
              Connect Wallet
            </button>
          )
        }

        if (chain?.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className="px-4 py-2 text-sm font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 transition-all"
            >
              Wrong Network
            </button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={openChainModal}
              className="hidden items-center gap-1.5 rounded-md border border-foreground/10 bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all sm:flex"
            >
              {chain?.name}
            </button>
            <button
              onClick={openAccountModal}
              className="px-4 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all active:scale-95"
            >
              {account.displayName}
            </button>
          </div>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}

'use client'

import Link from 'next/link'
import { Bot, LayoutDashboard, Plus, BookOpen } from 'lucide-react'
import { ConnectButton } from '@/components/wallet/ConnectButton'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Agent<span className="text-foreground/50">Forge</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors sm:flex"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/playbooks"
            className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors sm:flex"
          >
            <BookOpen className="h-4 w-4" />
            Playbooks
          </Link>
          <Link
            href="/launch"
            className="hidden items-center gap-1.5 rounded-md border border-foreground/20 px-3 py-1.5 text-sm text-foreground hover:bg-secondary transition-all sm:flex"
          >
            <Plus className="h-4 w-4" />
            New Agent
          </Link>
          <ConnectButton />
        </div>
      </div>
    </nav>
  )
}

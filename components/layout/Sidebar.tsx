'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Rocket } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/launch',    label: 'Launch Agent', icon: Rocket },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden w-56 shrink-0 border-r border-foreground/10 lg:block">
      <div className="sticky top-16 p-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Menu</p>
        <ul className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all ${
                  pathname === href
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

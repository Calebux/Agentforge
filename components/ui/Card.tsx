import { HTMLAttributes } from 'react'
import { GlowCard } from './GlowCard'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ hover = false, className = '', children, onClick, ...props }: CardProps) {
  return (
    <GlowCard onClick={hover ? (onClick as (() => void) | undefined) : undefined} className={className}>
      {children}
    </GlowCard>
  )
}

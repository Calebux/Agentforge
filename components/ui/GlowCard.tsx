'use client'

import { useId } from 'react'
import { motion, useMotionValue, useMotionTemplate, useAnimationFrame } from 'framer-motion'
import { cn } from '@/lib/utils'

const GridPattern = ({ offsetX, offsetY, patternId }: { offsetX: any; offsetY: any; patternId: string }) => (
  <svg className="w-full h-full">
    <defs>
      <motion.pattern
        id={patternId}
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
        x={offsetX}
        y={offsetY}
      >
        <path
          d="M 40 0 L 0 0 0 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground"
        />
      </motion.pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${patternId})`} />
  </svg>
)

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: boolean
}

export function GlowCard({ children, className, onClick, padding = true }: GlowCardProps) {
  const uid = useId().replace(/:/g, '')
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const gridOffsetX = useMotionValue(0)
  const gridOffsetY = useMotionValue(0)

  useAnimationFrame(() => {
    gridOffsetX.set((gridOffsetX.get() + 0.5) % 40)
    gridOffsetY.set((gridOffsetY.get() + 0.5) % 40)
  })

  const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black, transparent)`

  return (
    <div
      onClick={onClick}
      onMouseMove={(e) => {
        const { left, top } = e.currentTarget.getBoundingClientRect()
        mouseX.set(e.clientX - left)
        mouseY.set(e.clientY - top)
      }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-foreground/10 bg-background transition-all',
        onClick && 'cursor-pointer hover:border-foreground/25',
        className
      )}
    >
      {/* Base grid — exact match: opacity-[0.05] */}
      <div className="absolute inset-0 z-0 opacity-[0.05]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} patternId={`${uid}-base`} />
      </div>

      {/* Mouse-reveal grid — exact match: opacity-40 */}
      <motion.div
        className="absolute inset-0 z-0 opacity-40"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} patternId={`${uid}-reveal`} />
      </motion.div>

      {/* Color orbs — exact match from the component */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute right-[-20%] top-[-20%] w-[40%] h-[40%] rounded-full bg-orange-500/40 dark:bg-orange-600/20 blur-[120px]" />
        <div className="absolute right-[10%] top-[-10%] w-[20%] h-[20%] rounded-full bg-primary/30 blur-[100px]" />
        <div className="absolute left-[-10%] bottom-[-20%] w-[40%] h-[40%] rounded-full bg-blue-500/40 dark:bg-blue-600/20 blur-[120px]" />
      </div>

      {/* Content */}
      <div className={cn('relative z-10', padding && 'p-5')}>
        {children}
      </div>
    </div>
  )
}

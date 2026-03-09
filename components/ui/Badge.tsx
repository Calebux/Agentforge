type BadgeVariant = 'green' | 'gold' | 'red' | 'gray' | 'blue'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-500/20 text-green-400',
  gold:  'bg-orange-500/20 text-orange-400',
  red:   'bg-red-500/20 text-red-400',
  gray:  'bg-foreground/10 text-muted-foreground',
  blue:  'bg-blue-500/20 text-blue-400',
}

export function Badge({ variant = 'gray', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}

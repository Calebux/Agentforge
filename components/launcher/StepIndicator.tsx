const STEPS = [
  { n: 1, label: 'Template' },
  { n: 2, label: 'Configure' },
  { n: 3, label: 'Limits' },
  { n: 4, label: 'Deploy' },
]

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-start">
      {STEPS.map(({ n, label }, i) => (
        <div key={n} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full items-center">
            {i > 0 && (
              <div
                className={`h-px flex-1 transition-all ${
                  n <= current ? 'bg-foreground/50' : 'bg-foreground/10'
                }`}
              />
            )}
            <div
              className={`flex h-7 w-7 items-center justify-center text-xs font-bold transition-all ${
                n < current
                  ? 'bg-foreground text-background'
                  : n === current
                  ? 'border-2 border-foreground text-foreground'
                  : 'border border-foreground/20 text-muted-foreground'
              }`}
            >
              {n < current ? '✓' : n}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 transition-all ${
                  n < current ? 'bg-foreground/50' : 'bg-foreground/10'
                }`}
              />
            )}
          </div>
          <span
            className={`text-xs transition-all ${
              n === current ? 'font-semibold text-foreground' : 'text-muted-foreground'
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

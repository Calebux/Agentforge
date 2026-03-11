// Next.js instrumentation hook — runs once when the server starts
// Used to bootstrap OpenClaw config and spawn the gateway process

export async function register() {
  // Only run on the server, not in the edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') return
  // Only run once (Node.js runtime)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { bootstrapAndStartGateway } = await import('./lib/gateway-init')
  await bootstrapAndStartGateway()
}

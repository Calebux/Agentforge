const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_APPROVAL_CHAT_ID

export async function sendApprovalNotification(params: {
  agentName: string
  description: string
  amount?: number
  fromChain?: string
  toChain?: string
  approvalUrl: string
}) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_APPROVAL_CHAT_ID not set — skipping notification')
    return
  }

  const lines = [
    `⚠️ *Agent Action Requires Approval*`,
    ``,
    `*Agent:* ${params.agentName}`,
    `*Action:* ${params.description}`,
  ]

  if (params.amount) lines.push(`*Amount:* $${params.amount} USDC`)
  if (params.fromChain && params.toChain) {
    lines.push(`*Route:* ${params.fromChain} → ${params.toChain}`)
  }

  lines.push(``, `[Review & Approve](${params.approvalUrl})`)

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: lines.join('\n'),
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  }).catch((err) => console.error('[telegram] sendMessage failed:', err))
}

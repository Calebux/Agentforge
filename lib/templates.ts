import type { AgentTemplate } from '@/types/template'

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'payment-bot',
    name: 'Payment Bot',
    description: 'Sends and receives USDT payments on command via WhatsApp or Telegram. Perfect for freelancers and small businesses.',
    icon: '💸',
    category: 'payments',
    defaultSystemPrompt: `You are a payment assistant on the Celo blockchain. You help users send and receive USDT payments.

When a user asks you to send a payment, confirm the recipient address and amount before proceeding. Always show the transaction fee and ask for confirmation.

Never send payments without explicit user confirmation. Log all transactions clearly.`,
    defaultSpendingLimit: 100,
    requiredChannels: ['telegram'],
    tags: ['payments', 'USDT', 'Celo', 'beginner-friendly'],
  },
  {
    id: 'savings-agent',
    name: 'Savings Agent',
    description: 'Monitors your wallet activity and automatically saves a configurable percentage of incoming funds to a savings address.',
    icon: '🏦',
    category: 'savings',
    defaultSystemPrompt: `You are a savings assistant on the Celo blockchain. Your job is to help users build savings habits automatically.

When you detect incoming USDT, calculate the configured savings percentage and transfer that amount to the user's designated savings wallet.

Report savings milestones and monthly summaries to the user. Encourage consistent saving behavior.`,
    defaultSpendingLimit: 50,
    requiredChannels: [],
    tags: ['savings', 'auto-save', 'DeFi', 'passive'],
  },
  {
    id: 'price-alert-bot',
    name: 'Price Alert Bot',
    description: 'Monitors token prices on Celo DEXes and sends instant notifications when your price targets are hit.',
    icon: '📊',
    category: 'trading',
    defaultSystemPrompt: `You are a price monitoring assistant for Celo blockchain tokens.

Monitor the prices of configured tokens and alert the user immediately when:
- A price drops below their buy target
- A price rises above their sell target
- A price moves more than X% in 1 hour

Provide context with each alert: current price, 24h change, and volume.`,
    defaultSpendingLimit: 5,
    requiredChannels: ['telegram'],
    tags: ['trading', 'price-alerts', 'DeFi', 'monitoring'],
  },
  {
    id: 'social-bot',
    name: 'Social Bot',
    description: 'Posts updates and responds to community messages on Telegram and Discord. Great for project announcements and support.',
    icon: '📣',
    category: 'social',
    defaultSystemPrompt: `You are a community manager bot for a Celo blockchain project.

Your responsibilities:
- Post scheduled announcements and updates
- Answer common questions about the project
- Welcome new members
- Escalate complex issues to human moderators

Always be friendly, professional, and on-brand. Never make promises about price or investment returns.`,
    defaultSpendingLimit: 0,
    requiredChannels: ['telegram'],
    tags: ['social', 'community', 'announcements', 'support'],
  },
  {
    id: 'custom-agent',
    name: 'Custom Agent',
    description: 'Start from a blank canvas. Write your own system prompt and configure every aspect of your agent.',
    icon: '⚙️',
    category: 'custom',
    defaultSystemPrompt: '',
    defaultSpendingLimit: 10,
    requiredChannels: [],
    tags: ['custom', 'advanced', 'flexible'],
  },
]

export function getTemplateById(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find((t) => t.id === id)
}

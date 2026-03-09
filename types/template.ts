export type AgentTemplate = {
  id: string
  name: string
  description: string
  icon: string
  category: 'payments' | 'savings' | 'social' | 'trading' | 'custom'
  defaultSystemPrompt: string
  defaultSpendingLimit: number
  requiredChannels: string[]
  tags: string[]
}

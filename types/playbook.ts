export type PlaybookCategory =
  | 'payments'
  | 'savings'
  | 'trading'
  | 'social'
  | 'utility'
  | 'community'

export type PlaybookVariable = {
  key: string
  label: string
  type: 'text' | 'address' | 'number' | 'select'
  placeholder: string
  required: boolean
  options?: string[]
}

export type Playbook = {
  id: string
  name: string
  description: string
  icon: string
  category: PlaybookCategory
  author: string
  tags: string[]
  uses: number
  systemPrompt: string
  variables: PlaybookVariable[]
  defaultSpendingLimit: number
  defaultModel: string
  triggers: string[]
  requiredChannels: string[]
  celoFeatures: string[]
}

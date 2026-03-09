export type AgentStatus = 'pending' | 'running' | 'stopped' | 'error'

export type LLMProvider = 'openai' | 'anthropic' | 'ollama'

export type Agent = {
  id: string
  owner_address: string
  name: string
  template_id: string
  llm_provider: LLMProvider
  llm_model: string
  system_prompt: string
  spending_limit_monthly: number | null
  spending_limit_per_tx: number | null
  onchain_address: string | null
  status: AgentStatus
  created_at: string
  updated_at: string
}

export type AgentEvent = {
  id: number
  agent_id: string
  event_type: 'message' | 'payment' | 'error' | 'start' | 'stop'
  payload: string | null
  created_at: string
}

export type DeployAgentRequest = {
  owner_address: string
  template_id: string
  name: string
  llm_provider: LLMProvider
  llm_model: string
  system_prompt: string
  spending_limit_monthly: number
  spending_limit_per_tx: number
  allowed_actions: {
    send_payments: boolean
    browse_web: boolean
    read_messages: boolean
    post_messages: boolean
  }
  approval_threshold: number
}

export type DeployAgentResponse = {
  agentId: string
  status: AgentStatus
  dashboardUrl: string
}

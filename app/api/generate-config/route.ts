const SYSTEM_PROMPT = `You are an AI agent configuration generator for the Celo blockchain.
Given a user description, output a JSON object with exactly these fields:
- name: short agent name (max 4 words)
- templateId: one of ["payment-bot","savings-agent","price-alert-bot","social-bot","custom-agent"]
- systemPrompt: detailed system prompt for the agent (2–4 paragraphs, written in second person addressing the AI)
- suggestedSpendingLimit: number in USDT (monthly limit, conservative)
- suggestedModel: one of ["gpt-4o-mini","gpt-4o","claude-sonnet-4-6"]
- tags: array of 3–5 relevant tags (lowercase, hyphenated)
- explanation: one sentence explaining what you configured and why

Context: Agents run on the Celo blockchain using USDT/cUSD stablecoins, can connect to Telegram/WhatsApp, and run via the OpenClaw agent runtime.

Respond with valid JSON ONLY. No markdown fences, no extra text.`

export async function POST(req: Request) {
  try {
    const { description, apiKey } = await req.json()

    if (!apiKey) return Response.json({ error: 'API key required' }, { status: 400 })
    if (!description) return Response.json({ error: 'Description required' }, { status: 400 })

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: description },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1024,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return Response.json({ error: err.error?.message || 'OpenAI error' }, { status: 400 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content
    const config = JSON.parse(raw)
    return Response.json(config)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { systemPrompt, messages, model, apiKey } = await req.json()

    if (!apiKey) return Response.json({ error: 'API key required' }, { status: 400 })
    if (!systemPrompt) return Response.json({ error: 'System prompt required' }, { status: 400 })

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true,
        max_tokens: 1024,
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.json()
      return Response.json({ error: err.error?.message || 'OpenAI error' }, { status: 400 })
    }

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const reader = openaiRes.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') { controller.close(); return }
            try {
              const parsed = JSON.parse(data)
              const text = parsed.choices?.[0]?.delta?.content
              if (text) controller.enqueue(encoder.encode(text))
            } catch {}
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

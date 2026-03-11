import { NextRequest, NextResponse } from 'next/server'

// LI.FI quote proxy — no API key needed for quotes
// Docs: https://apidocs.li.fi/reference/get_v1-quote
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const required = ['fromChain', 'toChain', 'fromToken', 'toToken', 'fromAmount', 'fromAddress']
  for (const key of required) {
    if (!searchParams.get(key)) {
      return NextResponse.json({ error: `Missing required param: ${key}` }, { status: 400 })
    }
  }

  const upstream = new URL(`https://li.quest/v1/quote?${searchParams.toString()}`)

  try {
    const res = await fetch(upstream.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 }, // cache quotes for 30s
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? 'LI.FI error' }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

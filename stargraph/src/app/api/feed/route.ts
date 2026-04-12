import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDb, FEED_TTL_HOURS } from '@/lib/db'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VERTICALS = [
  { id: 'finserv', label: 'Financial Services', queries: ['financial services data integration AI governance', 'bank data management knowledge graph platform', 'financial compliance data unification enterprise'] },
  { id: 'healthcare', label: 'Healthcare', queries: ['healthcare data interoperability AI platform', 'clinical data integration knowledge management', 'pharmaceutical data governance enterprise'] },
  { id: 'manufacturing', label: 'Manufacturing', queries: ['manufacturing data integration digital twin AI', 'supply chain data management knowledge graph', 'industrial IoT data platform enterprise'] },
  { id: 'energy', label: 'Energy', queries: ['energy data management integration AI platform', 'oil gas data analytics knowledge graph', 'utility data platform modernization enterprise'] },
  { id: 'government', label: 'Government', queries: ['federal government data integration AI', 'government knowledge management platform', 'intelligence data fusion enterprise analytics'] },
  { id: 'technology', label: 'Technology', queries: ['enterprise knowledge graph platform AI', 'data fabric governance enterprise 2024', 'semantic data integration AI platform enterprise'] },
]

async function fetchGoogleNews(query: string): Promise<string[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const xml = await r.text()
    const titles: string[] = []
    // Match both CDATA-wrapped and plain title tags
    const matches = xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)
    for (const m of matches) {
      const t = m[1]?.trim()
      if (t && !t.includes('Google News') && t.length > 10) titles.push(t)
    }
    return titles.slice(0, 18)
  } catch {
    return []
  }
}

async function fetchFederalContracts(): Promise<string[]> {
  try {
    const keywords = ['data+integration', 'knowledge+management', 'graph+database', 'data+governance', 'AI+data+platform']
    const kw = keywords[Math.floor(Math.random() * keywords.length)]
    const url = `https://api.usaspending.gov/api/v2/search/spending_by_award/?limit=6&page=1&sort=Award%20Amount&order=desc&subawards=false`
    const body = {
      filters: {
        keywords: [kw.replace(/\+/g, ' ')],
        time_period: [{ start_date: '2024-01-01', end_date: '2026-12-31' }],
      },
      fields: ['Award ID', 'Recipient Name', 'Description', 'Award Amount', 'Start Date'],
      limit: 6,
      page: 1,
      sort: 'Award Amount',
      order: 'desc',
      subawards: false,
    }
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    const d = await r.json()
    return (d.results || []).map((c: any) =>
      `Federal Contract: ${c['Recipient Name']} - ${c['Description']?.slice(0, 120)} ($${(c['Award Amount'] || 0).toLocaleString()})`
    )
  } catch {
    return []
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const force = searchParams.get('force') === '1'
  const db = getDb()

  // Check cache
  if (!force) {
    const { data: cached } = await db
      .from('sg_feed_cache')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single()
    if (cached) {
      const age = (Date.now() - new Date(cached.fetched_at).getTime()) / 3600000
      if (age < FEED_TTL_HOURS) {
        return NextResponse.json({ companies: cached.companies, fetched_at: cached.fetched_at, cached: true })
      }
    }
  }

  // Fetch all signals
  const allHeadlines: string[] = []
  const verticalMap: Record<string, string[]> = {}

  const fetches = VERTICALS.flatMap(v =>
    v.queries.map(async q => {
      const titles = await fetchGoogleNews(q)
      titles.forEach(t => {
        allHeadlines.push(t)
        if (!verticalMap[v.id]) verticalMap[v.id] = []
        verticalMap[v.id].push(t)
      })
    })
  )
  const contractFetch = fetchFederalContracts().then(cs => cs.forEach(c => allHeadlines.push(c)))
  await Promise.all([...fetches, contractFetch])

  if (allHeadlines.length === 0) {
    // Serve stale cache
    const { data: stale } = await db.from('sg_feed_cache').select('*').order('fetched_at', { ascending: false }).limit(1).single()
    if (stale) return NextResponse.json({ companies: stale.companies, fetched_at: stale.fetched_at, cached: true, stale: true })
    return NextResponse.json({ error: 'No signals found' }, { status: 503 })
  }

  // Claude extraction
  try {
    const headlineBlock = VERTICALS.map(v =>
      `## ${v.label}\n${(verticalMap[v.id] || []).join('\n')}`
    ).join('\n\n')

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are a sales intelligence analyst for Stardog, a knowledge graph and data unification platform. Stardog helps enterprises connect siloed data without moving it, then grounds AI outputs in verified data relationships.

From these industry headlines and federal contracts, extract 15-25 companies that likely have data integration challenges Stardog can solve.

${headlineBlock}

## Federal Contracts
${allHeadlines.filter(h => h.startsWith('Federal Contract:')).join('\n')}

Return ONLY a JSON array. Each object:
{
  "company": "Company Name",
  "vertical_id": "finserv|healthcare|manufacturing|energy|government|technology",
  "vertical_label": "Full Vertical Name",
  "signal_count": number (1-5),
  "top_signal": "The key buying signal in one sentence",
  "signal_type": "news|funding|hiring|contract|partnership|earnings|research|regulation",
  "urgency": "high|medium|low",
  "amount": "$X or null",
  "date": "YYYY-MM or approximate",
  "why_stardog": "One sentence on why Stardog specifically solves their problem"
}

Focus on enterprise organizations with complex data challenges. Extract exactly 15 companies maximum. Keep why_stardog and top_signal under 20 words each to stay concise. Return ONLY the JSON array.`
      }]
    })

    const raw = (msg.content[0] as any).text || ''
    let json = raw
    const fenceMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) json = fenceMatch[1]
    json = json.trim()
    if (!json.startsWith('[')) {
      const arrStart = json.indexOf('[')
      if (arrStart >= 0) json = json.slice(arrStart)
    }

    // Attempt to repair truncated JSON
    if (!json.endsWith(']')) {
      const lastComplete = json.lastIndexOf('}')
      if (lastComplete > 0) json = json.slice(0, lastComplete + 1) + ']'
    }

    const companies = JSON.parse(json)

    // Write to timeline
    for (const c of companies) {
      await db.from('sg_signal_timeline').upsert(
        { company: c.company, signal_type: c.signal_type, urgency: c.urgency, signal_text: c.top_signal, signal_date: c.date },
        { onConflict: 'company,signal_text' }
      ).select()
    }

    // Cache
    await db.from('sg_feed_cache').insert({ companies })

    return NextResponse.json({ companies, fetched_at: new Date().toISOString(), cached: false })
  } catch (e: any) {
    // Serve stale on error
    const { data: stale } = await db.from('sg_feed_cache').select('*').order('fetched_at', { ascending: false }).limit(1).single()
    if (stale) return NextResponse.json({ companies: stale.companies, fetched_at: stale.fetched_at, cached: true, stale: true })
    return NextResponse.json({ error: e.message || 'Feed extraction failed' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDb, FEED_TTL_HOURS } from '@/lib/db'

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
    const matches = xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)
    for (const m of matches) {
      const t = m[1]?.trim()
      if (t && !t.includes('Google News') && t.length > 10) titles.push(t)
    }
    return titles.slice(0, 18)
  } catch (e: any) {
    console.error('[feed] fetchGoogleNews failed for query:', query, e.message)
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
  } catch (e: any) {
    console.error('[feed] fetchFederalContracts failed:', e.message)
    return []
  }
}

export async function GET(req: Request) {
  try {
    // Validate env vars upfront
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[feed] Missing Supabase env vars:', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      })
      return NextResponse.json({ error: 'Server configuration error: missing database credentials', companies: [] }, { status: 500 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[feed] Missing ANTHROPIC_API_KEY')
      return NextResponse.json({ error: 'Server configuration error: missing AI credentials', companies: [] }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const { searchParams } = new URL(req.url)
    const force = searchParams.get('force') === '1'

    let db: ReturnType<typeof getDb>
    try {
      db = getDb()
    } catch (dbErr: any) {
      console.error('[feed] getDb() threw:', dbErr.message)
      return NextResponse.json({ error: 'Database connection failed', companies: [] }, { status: 500 })
    }

    // Check cache
    if (!force) {
      try {
        const { data: cached, error: cacheError } = await db
          .from('sg_feed_cache')
          .select('*')
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single()

        if (cacheError) {
          console.error('[feed] Cache check error:', cacheError.message, cacheError.code)
        }

        if (cached?.companies && cached.fetched_at) {
          const age = (Date.now() - new Date(cached.fetched_at).getTime()) / 3600000
          if (age < FEED_TTL_HOURS) {
            return NextResponse.json({ companies: cached.companies, fetched_at: cached.fetched_at, cached: true })
          }
        }
      } catch (cacheErr: any) {
        console.error('[feed] Cache check threw:', cacheErr.message, cacheErr.stack)
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

    console.log('[feed] Fetched', allHeadlines.length, 'headlines across', Object.keys(verticalMap).length, 'verticals')

    if (allHeadlines.length === 0) {
      console.error('[feed] Zero headlines fetched — all RSS/contract fetches returned empty')
      // Serve stale cache
      try {
        const { data: stale } = await db.from('sg_feed_cache').select('*').order('fetched_at', { ascending: false }).limit(1).single()
        if (stale?.companies) return NextResponse.json({ companies: stale.companies, fetched_at: stale.fetched_at, cached: true, stale: true })
      } catch (staleErr: any) {
        console.error('[feed] Stale cache fallback threw:', staleErr.message)
      }
      return NextResponse.json({ error: 'No signals found and no cached data available', companies: [] }, { status: 503 })
    }

    // Claude extraction
    const headlineBlock = VERTICALS.map(v =>
      `## ${v.label}\n${(verticalMap[v.id] || []).join('\n')}`
    ).join('\n\n')

    let companies: any[]
    try {
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
      console.log('[feed] Claude response length:', raw.length, 'chars')

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

      companies = JSON.parse(json)
      console.log('[feed] Parsed', companies.length, 'companies from Claude')
    } catch (claudeErr: any) {
      console.error('[feed] Claude extraction failed:', claudeErr.message, claudeErr.stack)
      // Serve stale on error
      try {
        const { data: stale } = await db.from('sg_feed_cache').select('*').order('fetched_at', { ascending: false }).limit(1).single()
        if (stale?.companies) return NextResponse.json({ companies: stale.companies, fetched_at: stale.fetched_at, cached: true, stale: true })
      } catch (staleErr: any) {
        console.error('[feed] Stale cache fallback threw:', staleErr.message)
      }
      return NextResponse.json({ error: claudeErr.message || 'Feed extraction failed', companies: [] }, { status: 500 })
    }

    // Write to timeline
    for (const c of companies) {
      try {
        await db.from('sg_signal_timeline').upsert(
          { company: c.company, signal_type: c.signal_type, urgency: c.urgency, signal_text: c.top_signal, signal_date: c.date },
          { onConflict: 'company,signal_text' }
        ).select()
      } catch (tlErr: any) {
        console.error('[feed] Timeline upsert failed for', c.company, ':', tlErr.message)
      }
    }

    // Cache
    try {
      const { error: insertErr } = await db.from('sg_feed_cache').insert({ companies })
      if (insertErr) console.error('[feed] Cache insert error:', insertErr.message, insertErr.code)
    } catch (cacheInsertErr: any) {
      console.error('[feed] Cache insert threw:', cacheInsertErr.message)
    }

    return NextResponse.json({ companies, fetched_at: new Date().toISOString(), cached: false })
  } catch (outerErr: any) {
    console.error('[feed] Unhandled error in GET:', outerErr.message, outerErr.stack)
    return NextResponse.json({ error: outerErr.message || 'Internal server error', companies: [] }, { status: 500 })
  }
}

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const STARDOG_CONTEXT = `== YOUR COMPANY CONTEXT ==
Company: Stardog
Description: Stardog is the leading Enterprise Knowledge Graph platform. It connects, unifies, and queries data across enterprise systems without migration using virtual graph technology.
Products/Services:
- Stardog Enterprise Platform: Knowledge graph database with SPARQL, GraphQL, and SQL support
- Stardog Designer: Visual data modeling and ontology management
- Stardog Voicebox: AI-powered natural language interface for querying knowledge graphs
- Virtual Graph Module: Data federation layer that queries remote databases in-place without ETL
- Stardog Cloud: Fully managed cloud deployment
Key Differentiators: Only platform that unifies data as a knowledge graph WITHOUT data migration. Virtual graph technology federates across any system. AI grounding prevents LLM hallucination. Standards-based (RDF, OWL, SPARQL).
Target Industries: Financial Services, Healthcare, Manufacturing, Energy, Government, Technology
ICP: Enterprise organizations (5000+ employees) with complex data integration challenges
Competitors: Neo4j (requires data loading), Palantir (expensive consultants), Databricks (no semantic layer), Snowflake (no knowledge graph)
Common Objections: "We have a data warehouse" → Stardog layers on top. "Graph databases are niche" → Knowledge graphs are foundation for AI grounding. "We can build it" → TCO is 5-10x higher.
== END CONTEXT ==`;

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[product-fit] Missing ANTHROPIC_API_KEY');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let body: any;
    try {
      body = await request.json();
    } catch (parseErr: any) {
      console.error('[product-fit] Request body parse error:', parseErr.message);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { notes, dealName } = body;

    if (!notes) {
      return NextResponse.json({ error: 'notes is required' }, { status: 400 });
    }

    const systemPrompt = `You are a product-fit analysis expert for Stardog enterprise sales. You evaluate deal notes and discovery information to assess fit across Stardog-specific dimensions.

${STARDOG_CONTEXT}

Evaluate fit across these 6 Stardog-specific categories:
1. Knowledge Graph Fit - How well does the prospect's data landscape align with a knowledge graph approach?
2. Data Silo Impact - How severe are their data silo problems and how much value would unification deliver?
3. Semantic Layer Value - Would a semantic/ontology layer provide meaningful business value for their use cases?
4. Compliance & Governance - Do they have regulatory, audit, or data governance requirements that Stardog addresses?
5. AI Grounding Benefit - Would grounding AI outputs in verified data relationships solve a real problem for them?
6. Competitive Displacement - Is there an opportunity to displace an existing vendor (Neo4j, Palantir, custom-built)?

Also evaluate fit for each Stardog product:
1. Stardog Enterprise Platform
2. Stardog Designer
3. Stardog Voicebox
4. Virtual Graph Module
5. Stardog Cloud

Return ONLY valid JSON with no markdown fences, no backticks, no preamble. Use this exact structure:
{
  "results": {
    "overall_score": number (0-100),
    "overall_label": "Strong Fit | Moderate Fit | Weak Fit | Not a Fit",
    "overall_summary": "2-3 sentence summary",
    "products": [
      {
        "product": "category or product name",
        "score": number (0-100),
        "fit_label": "Strong | Moderate | Weak | Not a Fit",
        "reasoning": "1-2 sentence explanation",
        "evidence": ["evidence point 1", "evidence point 2"]
      }
    ],
    "discovery_gaps": [
      {
        "area": "Knowledge Graph Fit | Data Silo Impact | Semantic Layer Value | Compliance & Governance | AI Grounding Benefit | Competitive Displacement",
        "question": "specific question to ask",
        "why_important": "why this matters for the deal"
      }
    ],
    "red_flags": [
      {
        "flag": "flag name",
        "severity": "high | medium | low",
        "detail": "explanation"
      }
    ],
    "not_a_fit": [
      {
        "product": "product name",
        "reason": "why it's not a fit"
      }
    ]
  }
}`;

    console.log('[product-fit] Calling Claude for deal:', dealName || '(unnamed)');

    let response;
    try {
      response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyze the product fit${dealName ? ` for the "${dealName}" deal` : ''} based on these notes:\n\n${notes}`,
          },
        ],
      });
    } catch (claudeErr: any) {
      console.error('[product-fit] Claude API error:', claudeErr.message, claudeErr.status);
      return NextResponse.json({ error: 'AI analysis failed: ' + (claudeErr.message || 'unknown error') }, { status: 502 });
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    const raw = textBlock ? textBlock.text : '';
    console.log('[product-fit] Claude response length:', raw.length, 'chars');

    if (!raw) {
      console.error('[product-fit] Empty response from Claude');
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 });
    }

    // Strip markdown fences and find JSON
    let json = raw;
    const fenceMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) json = fenceMatch[1];
    json = json.trim();
    if (!json.startsWith('{')) {
      const objStart = json.indexOf('{');
      if (objStart >= 0) json = json.slice(objStart);
    }
    // Repair truncated JSON
    if (!json.endsWith('}')) {
      const lastBrace = json.lastIndexOf('}');
      if (lastBrace > 0) json = json.slice(0, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (jsonErr: any) {
      console.error('[product-fit] JSON parse error:', jsonErr.message, 'Raw (first 500):', raw.slice(0, 500));
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 });
    }

    console.log('[product-fit] Success, overall_score:', parsed.results?.overall_score ?? parsed.overall_score ?? 'N/A');
    return NextResponse.json(parsed);
  } catch (outerErr: any) {
    console.error('[product-fit] Unhandled error:', outerErr.message, outerErr.stack);
    return NextResponse.json({ error: outerErr.message || 'Internal server error' }, { status: 500 });
  }
}

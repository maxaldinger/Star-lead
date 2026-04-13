import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    const { transcript, dealName } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert at analyzing meeting transcripts and generating Letters of Understanding (LOUs) for enterprise sales deals. Your job is to extract pain points, issues, and requirements from meeting transcripts and produce structured LOU content.

For each issue identified, categorize it into one of these categories: "Design", "Data Management", "Analysis", "Manufacturing", "Company".

Assign a priority level: "High", "Medium", or "Low".

Reference Stardog capabilities where they address the identified pain points.

${STARDOG_CONTEXT}

You MUST respond with valid JSON only, no markdown formatting, no explanation outside the JSON. Use this exact structure:
{
  "company": "string (the prospect company name extracted from transcript)",
  "meetingDate": "string (date extracted or today's date)",
  "attendees": ["string array of attendee names extracted from transcript"],
  "rows": [
    {
      "issue": "string (the pain point or issue identified)",
      "response": "string (proposed solution referencing Stardog capabilities)",
      "category": "Data Integration | AI Readiness | Compliance / Governance | Infrastructure | Business Intelligence",
      "priority": "High | Medium | Low",
      "timeframe": "string (estimated timeframe to address, e.g. 'Phase 1 - 30 days')"
    }
  ]
}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a Letter of Understanding from the following meeting transcript${dealName ? ` for the "${dealName}" deal` : ''}:\n\n${transcript}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const raw = textBlock ? textBlock.text : '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('sa-lou error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

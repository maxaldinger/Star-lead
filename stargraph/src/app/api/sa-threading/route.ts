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
    const { contacts, dealName } = await request.json();

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'contacts array is required and must not be empty' }, { status: 400 });
    }

    const systemPrompt = `You are a multi-threading strategy expert for enterprise sales deals. You analyze the stakeholder map of a deal and assess how well-threaded the account is. You identify gaps in stakeholder coverage and recommend strategies to expand engagement across the buying committee.

Scoring rules:
- Calculate a score from 0-100 based on stakeholder coverage, seniority mix, department diversity, and engagement levels.
- Score labels: 0-25 = "Critical Risk", 26-50 = "Under-Threaded", 51-75 = "Moderately Threaded", 76-100 = "Well-Threaded"
- Score colors: 0-25 = "red", 26-50 = "orange", 51-75 = "yellow", 76-100 = "green"

${STARDOG_CONTEXT}

You MUST respond with valid JSON only, no markdown formatting, no explanation outside the JSON. Use this exact structure:
{
  "score": number (0-100),
  "score_label": "Critical Risk | Under-Threaded | Moderately Threaded | Well-Threaded",
  "score_color": "red | orange | yellow | green",
  "summary": "string (2-3 sentence summary of the threading assessment)",
  "contacts": [
    {
      "name": "string",
      "title": "string",
      "role": "string (Champion, Economic Buyer, Technical Evaluator, End User, Blocker, Coach, etc.)",
      "engagement": "High | Medium | Low | None",
      "influence": "High | Medium | Low",
      "sentiment": "Positive | Neutral | Negative | Unknown",
      "notes": "string (brief analysis of this contact's position and importance)"
    }
  ],
  "gaps": ["string array identifying missing roles or departments not yet engaged"],
  "recommendations": ["string array of 3-5 specific actionable recommendations to improve threading"]
}`;

    const contactsList = contacts
      .map((c: { name?: string; title?: string; role?: string; engagement?: string; notes?: string }) =>
        `- ${c.name || 'Unknown'}${c.title ? `, ${c.title}` : ''}${c.role ? ` (${c.role})` : ''}${c.engagement ? ` - Engagement: ${c.engagement}` : ''}${c.notes ? ` - Notes: ${c.notes}` : ''}`
      )
      .join('\n');

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze the multi-threading status${dealName ? ` for the "${dealName}" deal` : ''} with these contacts:\n\n${contactsList}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const raw = textBlock ? textBlock.text : '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('sa-threading error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

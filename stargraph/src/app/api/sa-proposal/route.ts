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
    const { notes, products, dealName } = await request.json();

    if (!notes) {
      return NextResponse.json({ error: 'notes is required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert enterprise sales proposal writer. You create compelling, professional proposals that clearly articulate business value and drive deals to close. Your proposals are structured, persuasive, and tailored to the prospect's specific challenges.

${STARDOG_CONTEXT}

You MUST respond with valid JSON only, no markdown formatting, no explanation outside the JSON. Use this exact structure:
{
  "title": "string (proposal title including prospect company name if available)",
  "date": "string (today's date formatted nicely)",
  "executiveSummary": "string (2-3 paragraph executive summary of the proposal)",
  "businessChallenges": ["string array of 3-5 key business challenges identified"],
  "recommendedSolution": "string (detailed description of the recommended Stardog solution, referencing specific products)",
  "whyUs": ["string array of 4-6 compelling reasons to choose Stardog over alternatives"],
  "nextSteps": ["string array of 3-5 concrete next steps with owners and timeframes"],
  "closingStatement": "string (1-2 paragraph compelling closing statement)"
}`;

    const productsText = products && products.length > 0
      ? `\n\nProducts to include in the proposal: ${products.join(', ')}`
      : '';

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a professional sales proposal${dealName ? ` for the "${dealName}" deal` : ''} based on these notes:\n\n${notes}${productsText}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const raw = textBlock ? textBlock.text : '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('sa-proposal error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

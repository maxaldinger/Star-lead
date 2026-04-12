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
    const { lineItems, dealName, discountPct } = await request.json();

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: 'lineItems array is required and must not be empty' }, { status: 400 });
    }

    const systemPrompt = `You are an expert at generating professional quote summaries for enterprise software deals. You analyze line items, pricing, and discounts to create clear, compelling quote summaries that help sales reps present pricing to prospects.

${STARDOG_CONTEXT}

You MUST respond with valid JSON only, no markdown formatting, no explanation outside the JSON. Use this exact structure:
{
  "summary": "string (2-3 paragraph professional summary of the quote including total value, key products, and value justification)",
  "notes": ["string array of 3-5 important notes, caveats, or recommendations about the quote (e.g., discount justification, bundle suggestions, competitive positioning notes, renewal considerations)"]
}`;

    const lineItemsList = lineItems
      .map((item: { product?: string; quantity?: number; unitPrice?: number; total?: number; description?: string }) =>
        `- ${item.product || 'Unknown Product'}${item.quantity ? ` x${item.quantity}` : ''}${item.unitPrice ? ` @ $${item.unitPrice.toLocaleString()}` : ''}${item.total ? ` = $${item.total.toLocaleString()}` : ''}${item.description ? ` (${item.description})` : ''}`
      )
      .join('\n');

    const discountText = discountPct ? `\n\nDiscount applied: ${discountPct}%` : '';

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a professional quote summary${dealName ? ` for the "${dealName}" deal` : ''} with these line items:\n\n${lineItemsList}${discountText}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const raw = textBlock ? textBlock.text : '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('sa-pricebook-quote error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

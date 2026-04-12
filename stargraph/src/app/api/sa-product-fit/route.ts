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
    const { notes, dealName } = await request.json();

    if (!notes) {
      return NextResponse.json({ error: 'notes is required' }, { status: 400 });
    }

    const systemPrompt = `You are a product-fit analysis expert for enterprise software sales. You evaluate deal notes and discovery information to determine which products from the company portfolio are the best fit for the prospect's needs. You assess fit levels, identify pain points each product addresses, and flag gaps or red flags.

Use the company context below to determine product fit. Evaluate each product in the portfolio against the prospect's stated needs.

${STARDOG_CONTEXT}

Products to evaluate fit for:
1. Stardog Enterprise Platform
2. Stardog Designer
3. Stardog Voicebox
4. Virtual Graph Module
5. Stardog Cloud

You MUST respond with valid JSON only, no markdown formatting, no explanation outside the JSON. Use this exact structure:
{
  "overallFit": "Strong | Moderate | Weak | Poor",
  "overallSummary": "string (2-3 sentence summary of the overall product fit)",
  "fits": [
    {
      "product": "string (product name)",
      "fitScore": number (0-100),
      "fitLevel": "Strong | Moderate | Weak | Not a Fit",
      "painPoints": ["string array of prospect pain points this product addresses"],
      "whyItFits": "string (explanation of why this product fits or doesn't)",
      "leadingMessage": "string (suggested messaging to lead with for this product)"
    }
  ],
  "notAFit": ["string array of products that are NOT a fit and brief reason why"],
  "discoveryGaps": ["string array of questions or areas that need more discovery"],
  "redFlags": ["string array of any concerns or red flags identified in the deal notes"]
}`;

    const response = await client.messages.create({
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

    const textBlock = response.content.find((block) => block.type === 'text');
    const raw = textBlock ? textBlock.text : '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('sa-product-fit error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

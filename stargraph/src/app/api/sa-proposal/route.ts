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
      console.error('[proposal] Missing ANTHROPIC_API_KEY');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let body: any;
    try {
      body = await request.json();
    } catch (parseErr: any) {
      console.error('[proposal] Request body parse error:', parseErr.message);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { notes, products, dealName } = body;

    if (!notes) {
      return NextResponse.json({ error: 'notes is required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert enterprise sales proposal writer for Stardog. You create compelling, professional proposals that clearly articulate business value and drive deals to close.

${STARDOG_CONTEXT}

Return ONLY valid JSON with no markdown fences, no backticks, no preamble. Use this exact structure:
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

    console.log('[proposal] Calling Claude for deal:', dealName || '(unnamed)');

    let response;
    try {
      response = await client.messages.create({
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
    } catch (claudeErr: any) {
      console.error('[proposal] Claude API error:', claudeErr.message, claudeErr.status);
      return NextResponse.json({ error: 'AI generation failed: ' + (claudeErr.message || 'unknown error') }, { status: 502 });
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    const raw = textBlock ? textBlock.text : '';
    console.log('[proposal] Claude response length:', raw.length, 'chars');

    if (!raw) {
      console.error('[proposal] Empty response from Claude');
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
      console.error('[proposal] JSON parse error:', jsonErr.message, 'Raw (first 500):', raw.slice(0, 500));
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 });
    }

    console.log('[proposal] Success, title:', parsed.title || 'N/A');
    return NextResponse.json(parsed);
  } catch (outerErr: any) {
    console.error('[proposal] Unhandled error:', outerErr.message, outerErr.stack);
    return NextResponse.json({ error: outerErr.message || 'Internal server error' }, { status: 500 });
  }
}

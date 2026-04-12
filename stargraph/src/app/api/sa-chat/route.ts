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

const TOOL_PROMPTS: Record<string, string> = {
  email: 'You are an expert sales email writer. You craft compelling, personalized outreach and follow-up emails that drive engagement and move deals forward. You write concise, value-driven emails that respect the recipient\'s time while clearly articulating business value.',
  lou: 'You are an expert LOU (Letter of Understanding) response writer. You help sales reps create professional, structured letters of understanding that document agreed-upon pain points, proposed solutions, and next steps from discovery calls and meetings.',
  pricebook: 'You are a pricing proposals expert. You help sales reps construct compelling pricing proposals that clearly communicate value, justify investment, and structure deals in a way that accelerates close. You understand enterprise software pricing models, discounting strategies, and how to present ROI.',
  objections: 'You are an objection handling expert. You use the Validate → Reframe → Proof → Close framework. First, you validate the prospect\'s concern to show empathy. Then you reframe the objection to shift perspective. Next you provide proof through data, case studies, or social proof. Finally you close by asking a question that moves the deal forward.',
  threading: 'You are a multi-threading strategy expert. You help sales reps identify and engage multiple stakeholders within a target account to build consensus and reduce single-thread risk. You understand organizational dynamics, buying committees, and how to map influence across enterprise deals.',
  general: 'You are an AI sales engineer and coach. You help sales reps with any aspect of the sales process including discovery, qualification, demos, proposals, negotiations, and closing. You provide strategic advice, tactical guidance, and help reps think through complex deal dynamics.',
};

const TONE_PROMPTS: Record<string, string> = {
  'Direct and confident': 'Write in a direct and confident tone. Be assertive and clear. Get to the point quickly and project authority.',
  'Consultative and warm': 'Write in a consultative and warm tone. Be approachable and helpful. Focus on understanding needs and guiding toward solutions.',
  'Formal and professional': 'Write in a formal and professional tone. Use proper business language and maintain a polished, executive-level voice.',
  'Casual and conversational': 'Write in a casual and conversational tone. Be friendly and relatable. Use natural language as if talking to a colleague.',
};

const METHODOLOGY_PROMPTS: Record<string, string> = {
  'MEDDPICC': 'Apply the MEDDPICC sales methodology. Focus on Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identify Pain, Champion, and Competition.',
  'Challenger Sale': 'Apply the Challenger Sale methodology. Focus on teaching the prospect something new about their business, tailoring the message to their specific situation, and taking control of the conversation.',
  'SPIN Selling': 'Apply the SPIN Selling methodology. Structure around Situation questions, Problem questions, Implication questions, and Need-payoff questions.',
  'Solution Selling': 'Apply the Solution Selling methodology. Focus on diagnosing the prospect\'s pain points, crafting a vision of a solution, and proving the value of that solution.',
};

export async function POST(request: Request) {
  try {
    const { messages, tool, toneOverride, methodologyOverride } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const toolKey = tool || 'general';
    const toolPrompt = TOOL_PROMPTS[toolKey] || TOOL_PROMPTS.general;

    let systemPrompt = `${toolPrompt}\n\n`;

    if (toneOverride && TONE_PROMPTS[toneOverride]) {
      systemPrompt += `${TONE_PROMPTS[toneOverride]}\n\n`;
    }

    if (methodologyOverride && METHODOLOGY_PROMPTS[methodologyOverride]) {
      systemPrompt += `${METHODOLOGY_PROMPTS[methodologyOverride]}\n\n`;
    }

    systemPrompt += `Use the following company context to inform your responses. Always position this company's products and capabilities when relevant.\n\n${STARDOG_CONTEXT}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const message = textBlock ? textBlock.text : '';

    return NextResponse.json({ message });
  } catch (error: unknown) {
    console.error('sa-chat error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

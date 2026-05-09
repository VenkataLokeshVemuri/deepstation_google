import { NextResponse } from 'next/server';
import { getGeminiClient, getGeminiApiKey } from '@/lib/gemini-config';

export async function POST(request: Request) {
  try {
    const { items, documentText, agentType } = await request.json();

    const apiKey = getGeminiApiKey();

    if (!apiKey) {
       console.warn('API key not configured, returning fallback data for agentic match');
       const fallbackData = items.slice(0, 3).map((item: any) => ({
           id: item.id,
           match_reason: "✨ AI Match (Demo Mode): This item was selected because it seems like a great fit for your query!"
       }));
       return NextResponse.json(fallbackData);
    }

    const ai = getGeminiClient();

    const prompt = `You are an expert autonomous matching agent for ${agentType}.
Analyze the user's uploaded document/profile and the available items. Find the items that best align with the user's profile.
Return a JSON array with the IDs of the top 3 best matching items, along with a creative, engaging 1-sentence "match_reason" explaining why it's a good fit.

User Document:
${documentText.substring(0, 3000)}

Available Items:
${JSON.stringify(items).substring(0, 5000)}

Output ONLY valid JSON array in this exact format:
[
  { "id": "item-id", "match_reason": "This is a great match because..." }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const data = JSON.parse(response.text || '[]');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Agentic Match Error:', error);
    return NextResponse.json({ error: 'MATCH_FAILED', message: error.message }, { status: 500 });
  }
}

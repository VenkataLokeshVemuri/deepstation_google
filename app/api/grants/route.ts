import { NextResponse } from 'next/server';
import { getGeminiClient, getGeminiApiKey } from '@/lib/gemini-config';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || 'technology';

  const fallbackData = [
    { id: 'fg1', title: 'Small Business Innovation Research (SBIR)', amount: '$150,000', deadline: '2024-08-15', provider: 'GovTech' },
    { id: 'fg2', title: 'Clean Energy Seed Grant', amount: '$50,000', deadline: '2024-09-01', provider: 'EarthFirst Foundation' },
    { id: 'fg3', title: 'Arts & Humanities Fellowship', amount: '$25,000', deadline: '2024-10-15', provider: 'National Endowment' },
    { id: 'fg4', title: 'AI for Good Grant', amount: '$100,000', deadline: '2024-07-30', provider: 'Tech Giant Org' },
  ];

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.warn('API key not configured or is placeholder, returning fallback data');
    return NextResponse.json(fallbackData);
  }

  const ai = getGeminiClient();

  const prompt = `Generate a JSON array of 8 highly realistic records representing Government and Private Foundation Grants related to "${q}".
Structure: [{ "id": "unique-id", "title": "Grant Name", "amount": "formatted amount with currency", "deadline": "YYYY-MM-DD", "provider": "Provider Name" }]
Return ONLY valid JSON array.`;

  try {
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
    console.error('Grants AI API Error:', error);
    // Explicitly return fallback data on error
    return NextResponse.json(fallbackData);
  }
}

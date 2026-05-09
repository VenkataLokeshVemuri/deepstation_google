import { NextResponse } from 'next/server';
import { getGeminiClient, getGeminiApiKey } from '@/lib/gemini-config';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || 'Austin, TX';

  const fallbackData = [
    { id: 'fh1', title: 'Luxury 2BR Apartment', location: 'Downtown Seattle', price: '$2,800/mo', type: 'Rent' },
    { id: 'fh2', title: 'Cozy Studio', location: 'Brooklyn, NY', price: '$2,100/mo', type: 'Rent' },
    { id: 'fh3', title: 'Suburban 4BR House', location: 'Austin, TX', price: '$550k', type: 'Buy' },
    { id: 'fh4', title: 'Modern Condo', location: 'Miami, FL', price: '$420k', type: 'Buy' },
  ];

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.warn('API key not configured or is placeholder, returning fallback data');
    return NextResponse.json(fallbackData);
  }

  const ai = getGeminiClient();

  const prompt = `Generate a JSON array of 8 highly realistic records representing Real Estate and Housing for the location "${q}".
Mix rentals and properties for sale.
Structure: [{ "id": "unique-id", "title": "Property Description", "location": "City, Country", "price": "formatted price with currency", "type": "Rent" or "Buy" }]
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
    console.error('Housing AI API Error:', error);
    return NextResponse.json(fallbackData);
  }
}

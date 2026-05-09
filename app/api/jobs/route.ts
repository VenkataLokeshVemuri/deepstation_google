import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || 'software engineer';

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return NextResponse.json(
      { error: 'MISSING_CREDENTIALS', message: 'Please add ADZUNA_APP_ID and ADZUNA_APP_KEY in your AI Studio Secrets.' },
      { status: 401 }
    );
  }

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(q)}&results_per_page=12`;
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'FETCH_FAILED', message: error.message }, { status: 500 });
  }
}

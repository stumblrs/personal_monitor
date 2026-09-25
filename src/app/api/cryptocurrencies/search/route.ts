import { NextResponse } from 'next/server';
import { marketDataProvider } from '@/lib/marketData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    const coins = await marketDataProvider.searchCoins(q);
    return NextResponse.json({ coins });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to search coins' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { Currency } from '@/types/domain';
import { marketDataProvider } from '@/lib/marketData';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { coinIds, currency = 'EUR' } = body;

    if (!Array.isArray(coinIds) || coinIds.length === 0) {
      return NextResponse.json({ prices: {} });
    }

    const prices = await marketDataProvider.getCurrentPrices(coinIds, currency as Currency);
    return NextResponse.json({ prices });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch prices' }, { status: 500 });
  }
}

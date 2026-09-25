import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId') || request.headers.get('x-device-id');

  if (!deviceId) {
    return NextResponse.json({ error: 'Device identity is required' }, { status: 400 });
  }

  try {
    const positions = await prisma.position.findMany({
      where: { userId: deviceId },
      include: {
        cryptocurrency: true,
        alerts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ positions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch positions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      deviceId,
      cryptocurrencyId,
      symbol,
      name,
      logoUrl,
      quantity,
      entryPrice,
      entryCurrency = 'EUR',
      purchaseDate,
      fees = 0,
      exchange,
      wallet,
      notes,
    } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Device identity is required' }, { status: 400 });
    }

    if (!cryptocurrencyId || !quantity || !entryPrice) {
      return NextResponse.json(
        { error: 'Missing required position fields: cryptocurrencyId, quantity, entryPrice' },
        { status: 400 }
      );
    }

    // 1. Ensure user exists
    await prisma.user.upsert({
      where: { id: deviceId },
      update: {},
      create: { id: deviceId, baseCurrency: entryCurrency },
    });

    // 2. Ensure cryptocurrency exists in catalog
    await prisma.cryptocurrency.upsert({
      where: { id: cryptocurrencyId },
      update: {
        symbol: symbol || cryptocurrencyId.toUpperCase(),
        name: name || cryptocurrencyId,
        logoUrl: logoUrl || undefined,
      },
      create: {
        id: cryptocurrencyId,
        symbol: symbol || cryptocurrencyId.toUpperCase(),
        name: name || cryptocurrencyId,
        logoUrl: logoUrl || undefined,
        status: 'ACTIVE',
      },
    });

    // 3. Create Position
    const position = await prisma.position.create({
      data: {
        userId: deviceId,
        cryptocurrencyId,
        quantity: parseFloat(quantity),
        entryPrice: parseFloat(entryPrice),
        entryCurrency,
        purchaseDate: purchaseDate || null,
        fees: parseFloat(fees) || 0,
        exchange: exchange || null,
        wallet: wallet || null,
        notes: notes || null,
        status: 'ACTIVE',
      },
      include: {
        cryptocurrency: true,
        alerts: true,
      },
    });

    return NextResponse.json({ position });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create position' }, { status: 500 });
  }
}

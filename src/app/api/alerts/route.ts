import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateAlertTargetPrice } from '@/lib/calculations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { positionId, type, direction, threshold, repeatMode = 'ONCE', cooldownMinutes = 30 } = body;

    if (!positionId || !type || threshold === undefined) {
      return NextResponse.json({ error: 'Missing required alert fields' }, { status: 400 });
    }

    const position = await prisma.position.findUnique({
      where: { id: positionId },
    });

    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    const targetPrice = calculateAlertTargetPrice(type, position.entryPrice, parseFloat(threshold));

    const alert = await prisma.alert.create({
      data: {
        positionId,
        type,
        direction: direction || (type === 'PROFIT_PERCENT' ? 'ABOVE' : 'BELOW'),
        threshold: parseFloat(threshold),
        targetPrice,
        repeatMode,
        cooldownMinutes: parseInt(cooldownMinutes, 10) || 30,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ alert });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create alert' }, { status: 500 });
  }
}

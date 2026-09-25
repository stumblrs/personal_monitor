import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateAlertTargetPrice } from '@/lib/calculations';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, entryPrice, quantity, fees, notes, exchange, wallet } = body;

    const existing = await prisma.position.findUnique({
      where: { id },
      include: { alerts: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (quantity !== undefined) updates.quantity = parseFloat(quantity);
    if (fees !== undefined) updates.fees = parseFloat(fees);
    if (notes !== undefined) updates.notes = notes;
    if (exchange !== undefined) updates.exchange = exchange;
    if (wallet !== undefined) updates.wallet = wallet;

    if (entryPrice !== undefined && parseFloat(entryPrice) !== existing.entryPrice) {
      const newEntry = parseFloat(entryPrice);
      updates.entryPrice = newEntry;

      // Recalculate target price for all alerts on this position as per Blueprint Section 20
      for (const alert of existing.alerts) {
        const newTarget = calculateAlertTargetPrice(
          alert.type as any,
          newEntry,
          alert.threshold
        );
        await prisma.alert.update({
          where: { id: alert.id },
          data: { targetPrice: newTarget },
        });
      }
    }

    const updated = await prisma.position.update({
      where: { id },
      data: updates,
      include: {
        cryptocurrency: true,
        alerts: true,
      },
    });

    return NextResponse.json({ position: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update position' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.position.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete position' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { marketDataProvider } from '@/lib/marketData';
import { evaluatePositionAlerts } from '@/lib/alertEngine';
import { Alert, Position } from '@/types/domain';

// Cache previous price quote in memory to calculate exact crossing boundaries
const previousServerPrices: Record<string, number> = {};

/**
 * Headless Server-Side Monitor and Evaluation Worker
 *
 * Runs automatically or via cron / background trigger.
 * 1. Pulls all ACTIVE positions from SQLite/Prisma.
 * 2. Fetches live market prices from CoinGecko.
 * 3. Evaluates all active alerts using the crossing algorithm.
 * 4. Persists any triggered AlertEvents in the database.
 * 5. Updates alert status (TRIGGERED or COOLDOWN) in the database.
 */
export async function GET(request: Request) {
  try {
    const activePositions = await prisma.position.findMany({
      where: { status: 'ACTIVE' },
      include: {
        cryptocurrency: true,
        alerts: { where: { status: 'ACTIVE' } },
      },
    });

    if (activePositions.length === 0) {
      return NextResponse.json({
        message: 'No active positions to monitor',
        evaluatedCount: 0,
        eventsCreated: 0,
      });
    }

    // Group active coin IDs
    const coinIds = Array.from(new Set(activePositions.map((p) => p.cryptocurrencyId)));
    const prices = await marketDataProvider.getCurrentPrices(coinIds, 'EUR');

    let totalEventsCreated = 0;
    const triggeredSummaries: string[] = [];

    for (const pos of activePositions) {
      const priceQuote = prices[pos.cryptocurrencyId];
      if (!priceQuote) continue;

      const currentPrice = priceQuote.price;
      const prevPrice = previousServerPrices[pos.cryptocurrencyId] || pos.entryPrice;

      // Adapt Prisma models to Domain types for the evaluation engine
      const domainPosition: Position = {
        id: pos.id,
        userId: pos.userId,
        cryptocurrencyId: pos.cryptocurrencyId,
        cryptocurrency: {
          id: pos.cryptocurrency.id,
          symbol: pos.cryptocurrency.symbol,
          name: pos.cryptocurrency.name,
          logoUrl: pos.cryptocurrency.logoUrl || undefined,
          status: pos.cryptocurrency.status as any,
        },
        quantity: pos.quantity,
        entryPrice: pos.entryPrice,
        entryCurrency: pos.entryCurrency as any,
        purchaseDate: pos.purchaseDate || undefined,
        fees: pos.fees || undefined,
        exchange: pos.exchange || undefined,
        wallet: pos.wallet || undefined,
        notes: pos.notes || undefined,
        status: pos.status as any,
        createdAt: pos.createdAt.toISOString(),
        updatedAt: pos.updatedAt.toISOString(),
      };

      const domainAlerts: Alert[] = pos.alerts.map((a) => ({
        id: a.id,
        positionId: a.positionId,
        type: a.type as any,
        direction: a.direction as any,
        threshold: a.threshold,
        targetPrice: a.targetPrice,
        repeatMode: a.repeatMode as any,
        cooldownMinutes: a.cooldownMinutes,
        status: a.status as any,
        lastTriggeredAt: a.lastTriggeredAt ? a.lastTriggeredAt.toISOString() : undefined,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }));

      const { triggeredAlerts } = evaluatePositionAlerts(
        domainPosition,
        domainAlerts,
        prevPrice,
        currentPrice
      );

      for (const item of triggeredAlerts) {
        // Persist AlertEvent in database
        await prisma.alertEvent.create({
          data: {
            alertId: item.alert.id,
            positionId: pos.id,
            coinSymbol: pos.cryptocurrency.symbol,
            conditionDescription: item.event.conditionDescription,
            triggerPrice: item.event.triggerPrice,
            actualPrice: item.event.actualPrice,
            delivered: true,
            channel: 'IN_APP',
          },
        });

        // Update alert in database
        await prisma.alert.update({
          where: { id: item.alert.id },
          data: {
            status: item.alert.status,
            lastTriggeredAt: new Date(),
          },
        });

        totalEventsCreated++;
        triggeredSummaries.push(
          `${pos.cryptocurrency.symbol}: ${item.event.conditionDescription} @ ${currentPrice}`
        );
      }

      previousServerPrices[pos.cryptocurrencyId] = currentPrice;
    }

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      monitoredPositions: activePositions.length,
      eventsCreated: totalEventsCreated,
      triggered: triggeredSummaries,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error running headless monitor' },
      { status: 500 }
    );
  }
}

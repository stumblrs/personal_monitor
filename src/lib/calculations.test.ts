import { describe, it, expect } from 'vitest';
import {
  calculatePositionMetrics,
  calculatePortfolioSummary,
  calculateAlertTargetPrice,
  formatCurrency,
  formatRoi,
} from './calculations';
import { PositionWithMetrics } from '@/types/domain';

describe('Calculations Engine', () => {
  it('correctly calculates position metrics: cost basis, value, diff, pnl, and roi', () => {
    // quantity: 0.5, entryPrice: 90,000, currentPrice: 96,500
    const metrics = calculatePositionMetrics(0.5, 90000, 96500);

    // Cost basis = 0.5 * 90,000 = 45,000
    expect(metrics.costBasis).toBe(45000);

    // Current value = 0.5 * 96,500 = 48,250
    expect(metrics.currentValue).toBe(48250);

    // Difference per unit = 96,500 - 90,000 = 6,500
    expect(metrics.priceDifference).toBe(6500);

    // Total P/L = 48,250 - 45,000 = 3,250
    expect(metrics.unrealizedPnl).toBe(3250);

    // ROI % = (6,500 / 90,000) * 100 = 7.222...%
    expect(metrics.roi).toBeCloseTo(7.222, 2);
  });

  it('correctly aggregates portfolio summary', () => {
    const pos1: PositionWithMetrics = {
      id: 'pos-1',
      userId: 'dev_user_1',
      cryptocurrencyId: 'bitcoin',
      cryptocurrency: {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        status: 'ACTIVE',
      },
      quantity: 0.5,
      entryPrice: 90000,
      entryCurrency: 'EUR',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceFreshness: 'LIVE',
      alerts: [],
      metrics: {
        costBasis: 45000,
        currentValue: 48250,
        priceDifference: 6500,
        unrealizedPnl: 3250,
        roi: 7.222,
      },
    };

    const pos2: PositionWithMetrics = {
      id: 'pos-2',
      userId: 'dev_user_1',
      cryptocurrencyId: 'ethereum',
      cryptocurrency: {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        status: 'ACTIVE',
      },
      quantity: 2,
      entryPrice: 25000,
      entryCurrency: 'EUR',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceFreshness: 'LIVE',
      alerts: [],
      metrics: {
        costBasis: 50000,
        currentValue: 55000,
        priceDifference: 2500,
        unrealizedPnl: 5000,
        roi: 10,
      },
    };

    const summary = calculatePortfolioSummary([pos1, pos2]);

    // Total Invested = 45,000 + 50,000 = 95,000
    expect(summary.totalInvested).toBe(95000);

    // Total Value = 48,250 + 55,000 = 103,250
    expect(summary.currentValue).toBe(103250);

    // Total P/L = 103,250 - 95,000 = 8,250
    expect(summary.unrealizedPnl).toBe(8250);

    // Total ROI = (8,250 / 95,000) * 100 = 8.684%
    expect(summary.roi).toBeCloseTo(8.684, 2);
    expect(summary.activePositionsCount).toBe(2);
  });

  it('calculates alert target prices accurately', () => {
    // 10% profit from 90,000 = 99,000
    expect(calculateAlertTargetPrice('PROFIT_PERCENT', 90000, 10)).toBeCloseTo(99000, 2);

    // 5% loss from 90,000 = 85,500
    expect(calculateAlertTargetPrice('LOSS_PERCENT', 90000, 5)).toBeCloseTo(85500, 2);

    // Exact entry price
    expect(calculateAlertTargetPrice('ENTRY_PRICE', 90000, 0)).toBe(90000);

    // Fixed price
    expect(calculateAlertTargetPrice('PRICE', 90000, 105000)).toBe(105000);
  });

  it('formats currencies properly including Naira and Cedis', () => {
    expect(formatCurrency(1000, 'EUR')).toContain('€');
    expect(formatCurrency(1000, 'USD')).toContain('$');
    expect(formatCurrency(1000, 'GBP')).toContain('£');
    expect(formatCurrency(1000, 'NGN')).toContain('₦');
    expect(formatCurrency(1000, 'GHS')).toContain('GH₵');
  });

  it('formats ROI with signs', () => {
    expect(formatRoi(7.22)).toBe('+7.22%');
    expect(formatRoi(-3.5)).toBe('-3.50%');
    expect(formatRoi(0)).toBe('0.00%');
  });
});

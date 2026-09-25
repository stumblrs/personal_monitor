import { CalculatedPositionMetrics, PortfolioSummary, PositionWithMetrics } from '@/types/domain';

/**
 * Calculates deterministic position metrics based on Invariant 5 of the functional specification.
 *
 * Cost Basis = Quantity * Entry Price
 * Current Value = Quantity * Current Price
 * Price Difference = Current Price - Entry Price
 * Unrealized P/L = Current Value - Cost Basis
 * ROI (%) = ((Current Price - Entry Price) / Entry Price) * 100
 */
export function calculatePositionMetrics(
  quantity: number,
  entryPrice: number,
  currentPrice: number
): CalculatedPositionMetrics {
  if (entryPrice <= 0) {
    throw new Error('Entry price must be greater than zero.');
  }

  const costBasis = quantity * entryPrice;
  const currentValue = quantity * currentPrice;
  const priceDifference = currentPrice - entryPrice;
  const unrealizedPnl = currentValue - costBasis;
  const roi = (priceDifference / entryPrice) * 100;

  return {
    costBasis,
    currentValue,
    priceDifference,
    unrealizedPnl,
    roi,
  };
}

/**
 * Aggregates all ACTIVE positions to generate the Portfolio Summary.
 */
export function calculatePortfolioSummary(
  positions: PositionWithMetrics[]
): PortfolioSummary {
  const activePositions = positions.filter((p) => p.status === 'ACTIVE');

  let totalInvested = 0;
  let currentValue = 0;

  for (const pos of activePositions) {
    if (pos.metrics) {
      totalInvested += pos.metrics.costBasis;
      currentValue += pos.metrics.currentValue;
    } else {
      // Fallback if current price is unavailable
      totalInvested += pos.quantity * pos.entryPrice;
      currentValue += pos.quantity * pos.entryPrice;
    }
  }

  const unrealizedPnl = currentValue - totalInvested;
  const roi = totalInvested > 0 ? (unrealizedPnl / totalInvested) * 100 : 0;

  return {
    totalInvested,
    currentValue,
    unrealizedPnl,
    roi,
    activePositionsCount: activePositions.length,
  };
}

/**
 * Calculates the exact trigger fiat price for any alert configuration.
 */
export function calculateAlertTargetPrice(
  type: 'PRICE' | 'PROFIT_PERCENT' | 'LOSS_PERCENT' | 'ENTRY_PRICE',
  entryPrice: number,
  threshold: number
): number {
  switch (type) {
    case 'PRICE':
      return threshold;
    case 'PROFIT_PERCENT':
      // threshold is e.g. 10 for +10%
      return entryPrice * (1 + threshold / 100);
    case 'LOSS_PERCENT':
      // threshold is e.g. -5 for -5% or positive 5 passed as percentage drop
      const loss = Math.abs(threshold);
      return entryPrice * (1 - loss / 100);
    case 'ENTRY_PRICE':
      return entryPrice;
    default:
      return threshold;
  }
}

/**
 * Formats currency values cleanly according to the locale and currency symbol.
 */
export function formatCurrency(
  value: number,
  currency: string = 'EUR',
  maximumFractionDigits: number = 2
): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    NGN: '₦',
    GHS: 'GH₵ ',
  };

  const symbol = symbols[currency] || `${currency} `;
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  // Dynamic decimals for small crypto numbers
  const decimals = absValue > 0 && absValue < 1 ? Math.min(6, Math.max(2, 4)) : maximumFractionDigits;

  const formattedNum = absValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });

  return `${isNegative ? '-' : ''}${symbol}${formattedNum}`;
}

/**
 * Formats ROI with leading +/- sign.
 */
export function formatRoi(roi: number): string {
  const sign = roi > 0 ? '+' : roi < 0 ? '-' : '';
  return `${sign}${Math.abs(roi).toFixed(2)}%`;
}

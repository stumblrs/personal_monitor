export type Currency = 'EUR' | 'USD' | 'GBP' | 'NGN' | 'GHS';

export type PositionStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export type AlertType = 'PRICE' | 'PROFIT_PERCENT' | 'LOSS_PERCENT' | 'ENTRY_PRICE';

export type AlertDirection = 'ABOVE' | 'BELOW';

export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'PAUSED';

export type AlertRepeatMode = 'ONCE' | 'REPEAT';

export type PriceFreshness = 'LIVE' | 'RECENT' | 'STALE' | 'UNAVAILABLE';

export interface Cryptocurrency {
  id: string; // e.g., 'bitcoin'
  symbol: string; // e.g., 'BTC'
  name: string; // e.g., 'Bitcoin'
  logoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Position {
  id: string;
  userId: string;
  cryptocurrencyId: string;
  cryptocurrency: Cryptocurrency;
  quantity: number;
  entryPrice: number;
  entryCurrency: Currency;
  purchaseDate?: string; // ISO date string
  fees?: number;
  exchange?: string;
  wallet?: string;
  notes?: string;
  status: PositionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MarketPrice {
  cryptocurrencyId: string;
  currency: Currency;
  price: number;
  source: string;
  timestamp: string; // ISO string
  freshness: PriceFreshness;
}

export interface Alert {
  id: string;
  positionId: string;
  type: AlertType;
  direction: AlertDirection;
  threshold: number; // For PROFIT_PERCENT / LOSS_PERCENT: percentage (e.g. 10 for +10%, -5 for -5%). For PRICE / ENTRY_PRICE: target price
  targetPrice: number; // Pre-calculated target price in fiat for quick evaluation
  repeatMode: AlertRepeatMode;
  cooldownMinutes: number;
  status: AlertStatus;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertEvent {
  id: string;
  alertId: string;
  positionId: string;
  coinSymbol: string;
  conditionDescription: string;
  triggerPrice: number;
  actualPrice: number;
  triggeredAt: string;
  delivered: boolean;
  channel: 'IN_APP' | 'PUSH' | 'EMAIL' | 'TELEGRAM';
}

export interface CalculatedPositionMetrics {
  costBasis: number;
  currentValue: number;
  priceDifference: number;
  unrealizedPnl: number;
  roi: number; // in percentage e.g. 7.22
}

export interface PositionWithMetrics extends Position {
  currentPrice?: number;
  priceUpdatedAt?: string;
  priceFreshness: PriceFreshness;
  metrics?: CalculatedPositionMetrics;
  alerts: Alert[];
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  unrealizedPnl: number;
  roi: number;
  activePositionsCount: number;
}

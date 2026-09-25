import {
  Currency,
  Position,
  Alert,
  AlertEvent,
  PositionWithMetrics,
  PortfolioSummary,
} from '@/types/domain';
import {
  calculatePositionMetrics,
  calculatePortfolioSummary,
  calculateAlertTargetPrice,
} from '@/lib/calculations';
import { evaluatePositionAlerts } from '@/lib/alertEngine';
import { getOrCreateDeviceId } from '@/lib/deviceId';

const STORAGE_KEYS = {
  POSITIONS: 'cpm_positions_v1',
  ALERTS: 'cpm_alerts_v1',
  ALERT_EVENTS: 'cpm_alert_events_v1',
  BASE_CURRENCY: 'cpm_base_currency_v1',
  REFRESH_INTERVAL: 'cpm_refresh_interval_v1',
};

// Initial state starts completely empty as per non-negotiable Invariant 1:
// "No coin should appear in the user's active dashboard unless the user explicitly selected it."
export class PositionStore {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  static getDeviceId(): string {
    return getOrCreateDeviceId();
  }

  static getBaseCurrency(): Currency {
    if (!this.isBrowser()) return 'EUR';
    return (localStorage.getItem(STORAGE_KEYS.BASE_CURRENCY) as Currency) || 'EUR';
  }

  static setBaseCurrency(curr: Currency): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.BASE_CURRENCY, curr);
  }

  static getRefreshInterval(): number {
    if (!this.isBrowser()) return 30; // 30 seconds default
    const saved = localStorage.getItem(STORAGE_KEYS.REFRESH_INTERVAL);
    return saved ? parseInt(saved, 10) : 30;
  }

  static setRefreshInterval(seconds: number): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.REFRESH_INTERVAL, seconds.toString());
  }

  /**
   * Retrieves only positions strictly belonging to this device (userId: deviceId)
   * Also purges any legacy demo positions (userId: 'user-default' or id starting with 'pos-demo-')
   */
  static getPositions(): Position[] {
    if (!this.isBrowser()) return [];
    const data = localStorage.getItem(STORAGE_KEYS.POSITIONS);
    if (!data) return [];
    try {
      const all: Position[] = JSON.parse(data);
      const currentDeviceId = this.getDeviceId();
      // Filter out any demo data completely
      const realPositions = all.filter(
        (p) =>
          p.userId === currentDeviceId &&
          !p.id.startsWith('pos-demo-') &&
          p.userId !== 'user-default'
      );
      // If demo data was found, clean localStorage immediately
      if (realPositions.length !== all.length) {
        localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(realPositions));
        // Clean demo alerts as well
        const alertsData = localStorage.getItem(STORAGE_KEYS.ALERTS);
        if (alertsData) {
          try {
            const alerts: Alert[] = JSON.parse(alertsData);
            const realAlerts = alerts.filter((a) => !a.id.startsWith('alt-demo-'));
            localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(realAlerts));
          } catch {}
        }
      }
      return realPositions;
    } catch {
      return [];
    }
  }

  static savePositions(positions: Position[]): void {
    if (!this.isBrowser()) return;
    // Preserve any existing entries for other devices in storage while updating current device's positions
    const currentDeviceId = this.getDeviceId();
    let allPositions: Position[] = [];
    try {
      const existing = localStorage.getItem(STORAGE_KEYS.POSITIONS);
      if (existing) {
        allPositions = (JSON.parse(existing) as Position[]).filter(
          (p) => p.userId !== currentDeviceId && p.userId !== 'user-default'
        );
      }
    } catch {
      allPositions = [];
    }

    const merged = [...allPositions, ...positions.map((p) => ({ ...p, userId: currentDeviceId }))];
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(merged));
  }

  static getAlerts(): Alert[] {
    if (!this.isBrowser()) return [];
    const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveAlerts(alerts: Alert[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  }

  static getAlertEvents(): AlertEvent[] {
    if (!this.isBrowser()) return [];
    const data = localStorage.getItem(STORAGE_KEYS.ALERT_EVENTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveAlertEvents(events: AlertEvent[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.ALERT_EVENTS, JSON.stringify(events));
  }

  static addPosition(
    positionData: Omit<Position, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): Position {
    const positions = this.getPositions();
    const now = new Date().toISOString();
    const deviceId = this.getDeviceId();
    const newPosition: Position = {
      ...positionData,
      id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: deviceId,
      createdAt: now,
      updatedAt: now,
    };

    positions.push(newPosition);
    this.savePositions(positions);
    return newPosition;
  }

  static updatePosition(id: string, updates: Partial<Position>): Position | null {
    const positions = this.getPositions();
    const idx = positions.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const updated = {
      ...positions[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    positions[idx] = updated;
    this.savePositions(positions);

    // If entry price changed, re-calculate alert target prices as specified in Section 20
    if (updates.entryPrice !== undefined && updates.entryPrice !== positions[idx].entryPrice) {
      const alerts = this.getAlerts();
      const updatedAlerts = alerts.map((a) => {
        if (a.positionId === id) {
          const newTarget = calculateAlertTargetPrice(a.type, updates.entryPrice!, a.threshold);
          return {
            ...a,
            targetPrice: newTarget,
            updatedAt: new Date().toISOString(),
          };
        }
        return a;
      });
      this.saveAlerts(updatedAlerts);
    }

    return updated;
  }

  static pausePosition(id: string): void {
    this.updatePosition(id, { status: 'PAUSED' });
  }

  static resumePosition(id: string): void {
    this.updatePosition(id, { status: 'ACTIVE' });
  }

  static archivePosition(id: string): void {
    this.updatePosition(id, { status: 'ARCHIVED' });
  }

  static restorePosition(id: string): void {
    this.updatePosition(id, { status: 'ACTIVE' });
  }

  static deletePosition(id: string): void {
    const positions = this.getPositions().filter((p) => p.id !== id);
    this.savePositions(positions);

    // Clean up associated alerts
    const alerts = this.getAlerts().filter((a) => a.positionId !== id);
    this.saveAlerts(alerts);
  }

  static addAlert(
    alertData: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'targetPrice'>
  ): Alert {
    const positions = this.getPositions();
    const position = positions.find((p) => p.id === alertData.positionId);
    if (!position) throw new Error('Position not found');

    const targetPrice = calculateAlertTargetPrice(
      alertData.type,
      position.entryPrice,
      alertData.threshold
    );

    const alerts = this.getAlerts();
    const now = new Date().toISOString();
    const newAlert: Alert = {
      ...alertData,
      id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      targetPrice,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    alerts.push(newAlert);
    this.saveAlerts(alerts);
    return newAlert;
  }

  static deleteAlert(id: string): void {
    const alerts = this.getAlerts().filter((a) => a.id !== id);
    this.saveAlerts(alerts);
  }

  static resetAlert(id: string): void {
    const alerts = this.getAlerts();
    const updated = alerts.map((a) =>
      a.id === id ? { ...a, status: 'ACTIVE' as const, updatedAt: new Date().toISOString() } : a
    );
    this.saveAlerts(updated);
  }

  static dismissAlertEvent(eventId: string): void {
    const events = this.getAlertEvents().filter((e) => e.id !== eventId);
    this.saveAlertEvents(events);
  }

  /**
   * Loads sample realistic portfolio (BTC, ETH, SOL) for instant demonstration if desired.
   */
  static seedDemoPositions(): void {
    const samplePositions: Position[] = [
      {
        id: 'pos-demo-btc',
        userId: 'user-default',
        cryptocurrencyId: 'bitcoin',
        cryptocurrency: {
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          logoUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
          status: 'ACTIVE',
        },
        quantity: 0.25,
        entryPrice: 90000,
        entryCurrency: 'EUR',
        purchaseDate: '2026-09-24',
        fees: 25,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pos-demo-eth',
        userId: 'user-default',
        cryptocurrencyId: 'ethereum',
        cryptocurrency: {
          id: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
          status: 'ACTIVE',
        },
        quantity: 2.0,
        entryPrice: 3200,
        entryCurrency: 'EUR',
        purchaseDate: '2026-09-20',
        fees: 15,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pos-demo-sol',
        userId: 'user-default',
        cryptocurrencyId: 'solana',
        cryptocurrency: {
          id: 'solana',
          symbol: 'SOL',
          name: 'Solana',
          logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
          status: 'ACTIVE',
        },
        quantity: 15.0,
        entryPrice: 140,
        entryCurrency: 'EUR',
        purchaseDate: '2026-09-18',
        fees: 5,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const sampleAlerts: Alert[] = [
      {
        id: 'alt-demo-btc-10',
        positionId: 'pos-demo-btc',
        type: 'PROFIT_PERCENT',
        direction: 'ABOVE',
        threshold: 10,
        targetPrice: 99000,
        repeatMode: 'ONCE',
        cooldownMinutes: 30,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'alt-demo-eth-prot',
        positionId: 'pos-demo-eth',
        type: 'LOSS_PERCENT',
        direction: 'BELOW',
        threshold: -5,
        targetPrice: 3040,
        repeatMode: 'ONCE',
        cooldownMinutes: 30,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    this.savePositions(samplePositions);
    this.saveAlerts(sampleAlerts);
  }

  static clearAll(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.POSITIONS);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.ALERT_EVENTS);
  }
}

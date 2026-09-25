import { describe, it, expect } from 'vitest';
import { evaluatePositionAlerts } from './alertEngine';
import { Position, Alert } from '@/types/domain';

describe('Alert Boundary Crossing Engine', () => {
  const mockPosition: Position = {
    id: 'pos-1',
    userId: 'dev_user_1',
    cryptocurrencyId: 'bitcoin',
    cryptocurrency: {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      status: 'ACTIVE',
    },
    quantity: 1,
    entryPrice: 90000,
    entryCurrency: 'EUR',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('triggers an ABOVE alert when price crosses threshold upwards', () => {
    const alert: Alert = {
      id: 'alert-1',
      positionId: 'pos-1',
      type: 'PRICE',
      direction: 'ABOVE',
      threshold: 99000,
      targetPrice: 99000,
      repeatMode: 'ONCE',
      cooldownMinutes: 30,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Crossing from 98,700 to 99,050
    const result = evaluatePositionAlerts(mockPosition, [alert], 98700, 99050);

    expect(result.triggeredAlerts.length).toBe(1);
    expect(result.triggeredAlerts[0].event.triggerPrice).toBe(99000);
    expect(result.triggeredAlerts[0].event.actualPrice).toBe(99050);
    expect(result.triggeredAlerts[0].alert.status).toBe('TRIGGERED');
  });

  it('does NOT trigger an ABOVE alert if already above the threshold previously', () => {
    const alert: Alert = {
      id: 'alert-1',
      positionId: 'pos-1',
      type: 'PRICE',
      direction: 'ABOVE',
      threshold: 99000,
      targetPrice: 99000,
      repeatMode: 'ONCE',
      cooldownMinutes: 30,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Already above (99,100 -> 99,200), no crossing boundary
    const result = evaluatePositionAlerts(mockPosition, [alert], 99100, 99200);
    expect(result.triggeredAlerts.length).toBe(0);
  });

  it('triggers a BELOW alert when price crosses threshold downwards', () => {
    const alert: Alert = {
      id: 'alert-2',
      positionId: 'pos-1',
      type: 'LOSS_PERCENT',
      direction: 'BELOW',
      threshold: 10, // -10% from 90,000 = 81,000
      targetPrice: 81000,
      repeatMode: 'ONCE',
      cooldownMinutes: 30,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Crossing from 82,000 to 80,500
    const result = evaluatePositionAlerts(mockPosition, [alert], 82000, 80500);

    expect(result.triggeredAlerts.length).toBe(1);
    expect(result.triggeredAlerts[0].event.triggerPrice).toBe(81000);
    expect(result.triggeredAlerts[0].event.actualPrice).toBe(80500);
  });

  it('respects repeatMode REPEAT with cooldown', () => {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

    const alertInCooldown: Alert = {
      id: 'alert-3',
      positionId: 'pos-1',
      type: 'PRICE',
      direction: 'ABOVE',
      threshold: 95000,
      targetPrice: 95000,
      repeatMode: 'REPEAT',
      cooldownMinutes: 30,
      status: 'ACTIVE',
      lastTriggeredAt: tenMinutesAgo, // triggered 10m ago, cooldown is 30m
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = evaluatePositionAlerts(mockPosition, [alertInCooldown], 94000, 96000);
    // Should not trigger because 10 minutes < 30 minutes cooldown
    expect(result.triggeredAlerts.length).toBe(0);
  });
});

import { Alert, AlertEvent, Position } from '@/types/domain';

export interface AlertEvaluationResult {
  triggeredAlerts: {
    alert: Alert;
    event: AlertEvent;
  }[];
  updatedAlerts: Alert[];
}

/**
 * Evaluates active alerts for a position against current and previous price.
 * Follows the Crossing Logic specified in Section 14 and 16 of the Blueprint:
 *
 * For Upward / Above alerts:
 *   previousPrice < targetPrice && currentPrice >= targetPrice
 *
 * For Downward / Below alerts:
 *   previousPrice > targetPrice && currentPrice <= targetPrice
 */
export function evaluatePositionAlerts(
  position: Position,
  alerts: Alert[],
  previousPrice: number,
  currentPrice: number
): AlertEvaluationResult {
  const now = new Date().toISOString();
  const triggeredAlerts: { alert: Alert; event: AlertEvent }[] = [];
  const updatedAlerts: Alert[] = [];

  for (const alert of alerts) {
    if (alert.status !== 'ACTIVE') {
      updatedAlerts.push(alert);
      continue;
    }

    const targetPrice = alert.targetPrice;
    let isCrossed = false;

    if (alert.direction === 'ABOVE') {
      // Crossed upwards
      if (previousPrice < targetPrice && currentPrice >= targetPrice) {
        isCrossed = true;
      }
    } else {
      // Crossed downwards
      if (previousPrice > targetPrice && currentPrice <= targetPrice) {
        isCrossed = true;
      }
    }

    if (isCrossed) {
      // Cooldown check for repeat mode
      let canTrigger = true;
      if (alert.repeatMode === 'REPEAT' && alert.lastTriggeredAt) {
        const lastTrigger = new Date(alert.lastTriggeredAt).getTime();
        const elapsedMinutes = (Date.now() - lastTrigger) / (1000 * 60);
        if (elapsedMinutes < alert.cooldownMinutes) {
          canTrigger = false;
        }
      }

      if (canTrigger) {
        let conditionDesc = '';
        if (alert.type === 'PROFIT_PERCENT') {
          conditionDesc = `+${alert.threshold}% Profit Target`;
        } else if (alert.type === 'LOSS_PERCENT') {
          conditionDesc = `${alert.threshold}% Protection Threshold`;
        } else if (alert.type === 'ENTRY_PRICE') {
          conditionDesc = 'Returned to Entry Price';
        } else {
          conditionDesc = `Price Target reached (${targetPrice})`;
        }

        const event: AlertEvent = {
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          alertId: alert.id,
          positionId: position.id,
          coinSymbol: position.cryptocurrency.symbol,
          conditionDescription: conditionDesc,
          triggerPrice: targetPrice,
          actualPrice: currentPrice,
          triggeredAt: now,
          delivered: true,
          channel: 'IN_APP',
        };

        const nextStatus = alert.repeatMode === 'ONCE' ? 'TRIGGERED' : 'ACTIVE';
        const updatedAlert: Alert = {
          ...alert,
          status: nextStatus,
          lastTriggeredAt: now,
          updatedAt: now,
        };

        triggeredAlerts.push({ alert: updatedAlert, event });
        updatedAlerts.push(updatedAlert);
        continue;
      }
    }

    // Check re-arming logic for repeat mode if price dipped back
    updatedAlerts.push(alert);
  }

  return {
    triggeredAlerts,
    updatedAlerts,
  };
}

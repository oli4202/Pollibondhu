import { prisma } from '../patterns/singleton/DatabaseManager';

/**
 * Check price changes for all subscribed commodities and send alerts
 * when price change exceeds the user's threshold.
 */
export async function checkPriceAlerts() {
  // Get all active alerts
  const alerts = await prisma.priceAlert.findMany({
    where: { is_active: true },
    include: {
      user: { select: { user_id: true, full_name: true } },
    },
  });

  if (alerts.length === 0) return { checked: 0, alertsSent: 0 };

  let alertsSent = 0;

  for (const alert of alerts) {
    try {
      // Get latest two prices for this commodity
      const prices = await prisma.marketPrice.findMany({
        where: {
          crop: { name: { contains: alert.commodity } },
        },
        orderBy: { recorded_at: 'desc' },
        take: 2,
      });

      if (prices.length < 2) continue;

      const oldPrice = Number(prices[1].price);
      const newPrice = Number(prices[0].price);

      if (oldPrice === 0) continue;

      const changePct = ((newPrice - oldPrice) / oldPrice) * 100;

      // Check if change exceeds threshold
      if (Math.abs(changePct) >= alert.threshold_pct) {
        // Check if we already notified for this price
        const existingLog = await prisma.priceAlertLog.findFirst({
          where: {
            user_id: alert.user_id,
            commodity: alert.commodity,
            new_price: newPrice,
          },
        });

        if (existingLog) continue;

        // Create alert log
        const direction = changePct > 0 ? 'increased' : 'decreased';
        const emoji = changePct > 0 ? '📈' : '📉';
        const message = `${emoji} ${alert.commodity} price ${direction} by ${Math.abs(changePct).toFixed(1)}% — now ৳${newPrice} (was ৳${oldPrice})`;

        await prisma.priceAlertLog.create({
          data: {
            user_id: alert.user_id,
            commodity: alert.commodity,
            old_price: oldPrice,
            new_price: newPrice,
            change_pct: changePct,
            message,
          },
        });

        // Update last notified time
        await prisma.priceAlert.update({
          where: { alert_id: alert.alert_id },
          data: { last_notified_at: new Date() },
        });

        alertsSent++;
      }
    } catch (err) {
      console.error(`Error checking alert for ${alert.commodity}:`, err);
    }
  }

  return { checked: alerts.length, alertsSent };
}

/**
 * Subscribe user to price alerts for a commodity
 */
export async function subscribeToPriceAlert(
  userId: number,
  commodity: string,
  thresholdPct: number = 5
) {
  return prisma.priceAlert.upsert({
    where: {
      user_id_commodity: { user_id: userId, commodity },
    },
    update: {
      threshold_pct: thresholdPct,
      is_active: true,
    },
    create: {
      user_id: userId,
      commodity,
      threshold_pct: thresholdPct,
    },
  });
}

/**
 * Unsubscribe user from price alerts for a commodity
 */
export async function unsubscribeFromPriceAlert(userId: number, commodity: string) {
  return prisma.priceAlert.updateMany({
    where: { user_id: userId, commodity },
    data: { is_active: false },
  });
}

/**
 * Get user's active price alert subscriptions
 */
export async function getUserAlerts(userId: number) {
  return prisma.priceAlert.findMany({
    where: { user_id: userId, is_active: true },
    orderBy: { created_at: 'desc' },
  });
}

/**
 * Get user's price alert notification logs
 */
export async function getUserAlertLogs(userId: number, unreadOnly: boolean = false) {
  return prisma.priceAlertLog.findMany({
    where: {
      user_id: userId,
      ...(unreadOnly ? { is_read: false } : {}),
    },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
}

/**
 * Mark alert logs as read
 */
export async function markAlertsAsRead(userId: number, logIds?: number[]) {
  return prisma.priceAlertLog.updateMany({
    where: {
      user_id: userId,
      ...(logIds && logIds.length > 0 ? { log_id: { in: logIds } } : {}),
    },
    data: { is_read: true },
  });
}

/**
 * Check if user is subscribed to alerts for a commodity
 */
export async function isSubscribed(userId: number, commodity: string) {
  const alert = await prisma.priceAlert.findUnique({
    where: {
      user_id_commodity: { user_id: userId, commodity },
    },
  });
  return alert?.is_active ?? false;
}

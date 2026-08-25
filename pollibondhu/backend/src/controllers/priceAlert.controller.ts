import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  subscribeToPriceAlert,
  unsubscribeFromPriceAlert,
  getUserAlerts,
  getUserAlertLogs,
  markAlertsAsRead,
  isSubscribed,
  checkPriceAlerts,
} from '../services/priceAlert.service';

export class PriceAlertController {
  // Subscribe to price alerts
  async subscribe(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) { sendError(res, 'Unauthorized', 401); return; }

      const { commodity, threshold_pct } = req.body;
      if (!commodity) { sendError(res, 'Commodity name required', 400); return; }

      const alert = await subscribeToPriceAlert(userId, commodity, threshold_pct || 5);
      sendSuccess(res, alert, 'Subscribed to price alerts');
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Unsubscribe from price alerts
  async unsubscribe(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) { sendError(res, 'Unauthorized', 401); return; }

      const { commodity } = req.body;
      if (!commodity) { sendError(res, 'Commodity name required', 400); return; }

      await unsubscribeFromPriceAlert(userId, commodity);
      sendSuccess(res, null, 'Unsubscribed from price alerts');
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Get user's subscriptions
  async getMyAlerts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) { sendError(res, 'Unauthorized', 401); return; }

      const alerts = await getUserAlerts(userId);
      sendSuccess(res, alerts);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Get alert notification logs
  async getMyAlertLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) { sendError(res, 'Unauthorized', 401); return; }

      const unreadOnly = req.query.unread === 'true';
      const logs = await getUserAlertLogs(userId, unreadOnly);
      sendSuccess(res, logs);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Mark alerts as read
  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) { sendError(res, 'Unauthorized', 401); return; }

      const { log_ids } = req.body;
      await markAlertsAsRead(userId, log_ids);
      sendSuccess(res, null, 'Alerts marked as read');
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Check if subscribed to a commodity
  async checkSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.user_id;
      if (!userId) { sendError(res, 'Unauthorized', 401); return; }

      const commodity = req.query.commodity as string;
      if (!commodity) { sendError(res, 'Commodity required', 400); return; }

      const subscribed = await isSubscribed(userId, commodity);
      sendSuccess(res, { subscribed });
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Trigger alert check (admin or cron)
  async triggerCheck(req: Request, res: Response) {
    try {
      const result = await checkPriceAlerts();
      sendSuccess(res, result, `Checked ${result.checked} alerts, sent ${result.alertsSent}`);
    } catch (err: any) { sendError(res, err.message, 500); }
  }
}

export const priceAlertController = new PriceAlertController();

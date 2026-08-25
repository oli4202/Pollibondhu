import { Router } from 'express';
import { priceAlertController } from '../controllers/priceAlert.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Subscribe / unsubscribe
router.post('/subscribe', (req, res) => priceAlertController.subscribe(req, res));
router.post('/unsubscribe', (req, res) => priceAlertController.unsubscribe(req, res));

// Check subscription status
router.get('/check', (req, res) => priceAlertController.checkSubscription(req, res));

// Get my subscriptions
router.get('/my', (req, res) => priceAlertController.getMyAlerts(req, res));

// Get notification logs
router.get('/logs', (req, res) => priceAlertController.getMyAlertLogs(req, res));

// Mark as read
router.post('/read', (req, res) => priceAlertController.markAsRead(req, res));

// Trigger alert check (for cron/admin)
router.post('/check-all', (req, res) => priceAlertController.triggerCheck(req, res));

export default router;

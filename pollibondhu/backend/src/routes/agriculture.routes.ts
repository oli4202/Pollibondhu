import { Router } from 'express';
import { agricultureController } from '../controllers/agriculture.controller';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Public routes - Crops
router.get('/crops', (req, res) => agricultureController.getCrops(req, res));
router.get('/crops/:id', (req, res) => agricultureController.getCrop(req, res));

// Public routes - Market prices
router.get('/market-prices', (req, res) => agricultureController.getMarketPrices(req, res));
router.get('/market-prices/latest', (req, res) => agricultureController.getLatestMarketPrices(req, res));

// Public routes - Weather
router.get('/weather', (req, res) => agricultureController.getWeather(req, res));

// Protected routes - Crop management
router.post('/crops', authMiddleware, requirePermission('agriculture.crop.create'), (req, res) => agricultureController.createCrop(req, res));
router.put('/crops/:id', authMiddleware, requirePermission('agriculture.crop.update'), (req, res) => agricultureController.updateCrop(req, res));

// Protected routes - Market price management
router.post('/market-prices', authMiddleware, requirePermission('agriculture.market_price.create'), (req, res) => agricultureController.createMarketPrice(req, res));

// Protected routes - Seed management
router.get('/seeds', (req, res) => agricultureController.getSeeds(req, res));
router.post('/seeds', authMiddleware, requirePermission('agriculture.seed.create'), (req, res) => agricultureController.createSeed(req, res));
router.put('/seeds/:id', authMiddleware, requirePermission('agriculture.seed.update'), (req, res) => agricultureController.updateSeed(req, res));

// Protected routes - Fertilizer management
router.get('/fertilizers', (req, res) => agricultureController.getFertilizers(req, res));
router.post('/fertilizers', authMiddleware, requirePermission('agriculture.fertilizer.create'), (req, res) => agricultureController.createFertilizer(req, res));
router.put('/fertilizers/:id', authMiddleware, requirePermission('agriculture.fertilizer.update'), (req, res) => agricultureController.updateFertilizer(req, res));

// Protected routes - Crop advice
router.get('/crop-advice', (req, res) => agricultureController.getCropAdvice(req, res));
router.post('/crop-advice', authMiddleware, requirePermission('agriculture.advice.create'), (req, res) => agricultureController.createCropAdvice(req, res));

// Live Market Prices (scraped from DAM)
router.get('/live-prices', (req, res) => agricultureController.getLivePrices(req, res));
router.post('/live-prices/refresh', (req, res) => agricultureController.refreshLivePrices(req, res));
router.get('/crops/:cropId/prices', (req, res) => agricultureController.getCropPrices(req, res));

// Commodity detail
router.get('/commodity/:name', (req, res) => agricultureController.getCommodityDetail(req, res));

export default router;

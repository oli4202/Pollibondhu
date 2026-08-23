import { Router } from 'express';
import { listCrops, getCrop, listMarketPrices, getWeather } from '../controllers/agriculture.controller';
const router = Router();
router.get('/crops', listCrops);
router.get('/crops/:id', getCrop);
router.get('/market-prices', listMarketPrices);
router.get('/weather', getWeather);
export default router;

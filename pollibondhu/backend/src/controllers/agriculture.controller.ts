import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getLiveMarketPrices, getLatestPricesFromDB, getPricesForCrop, getCommodityDetail, scrapeAndStoreLivePrices } from '../services/marketPrice.service';

// Class wrapper for consistency with other controllers
export class AgricultureController {
  // Crops
  async getCrops(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const category = req.query.category as string;
      const where: any = {};
      if (search) where.OR = [{ name: { contains: search } }, { name_bn: { contains: search } }];
      if (category) where.category_id = parseInt(category);
      const [data, total] = await Promise.all([
        prisma.crop.findMany({ where, skip: (page - 1) * limit, take: limit, include: { category: true } }),
        prisma.crop.count({ where }),
      ]);
      sendSuccess(res, { data, total, page, limit });
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  async getCrop(req: Request, res: Response) {
    try {
      const crop_id = parseInt(req.params.id);
      const crop = await prisma.crop.findUnique({
        where: { crop_id },
        include: {
          market_prices: { orderBy: { recorded_at: 'desc' }, take: 7 },
          crop_advices: { include: { expert: { include: { user: { select: { full_name: true } } } } } },
          seeds: true,
        },
      });
      if (!crop) { sendError(res, 'Crop not found', 404); return; }
      sendSuccess(res, crop);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  async createCrop(req: AuthenticatedRequest, res: Response) {
    try {
      const crop = await prisma.crop.create({ data: req.body });
      sendSuccess(res, crop, 'Crop created', 201);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  async updateCrop(req: AuthenticatedRequest, res: Response) {
    try {
      const crop_id = parseInt(req.params.id);
      const crop = await prisma.crop.update({ where: { crop_id }, data: req.body });
      sendSuccess(res, crop);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Market Prices
  async getMarketPrices(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const cropId = req.query.crop_id as string;
      const where: any = {};
      if (cropId) where.crop_id = parseInt(cropId);
      const prices = await prisma.marketPrice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { recorded_at: 'desc' },
        include: { crop: { select: { name: true, name_bn: true } } },
      });
      sendSuccess(res, prices);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  async getLatestMarketPrices(req: Request, res: Response) {
    try {
      const prices = await prisma.marketPrice.findMany({
        take: 20,
        orderBy: { recorded_at: 'desc' },
        include: { crop: { select: { name: true, name_bn: true } } },
      });
      sendSuccess(res, prices);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  async createMarketPrice(req: AuthenticatedRequest, res: Response) {
    try {
      const price = await prisma.marketPrice.create({ data: req.body });
      sendSuccess(res, price, 'Price created', 201);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Weather
  async getWeather(req: Request, res: Response) {
    try {
      const district = req.query.district as string || 'Dhaka';
      const weather = await prisma.weather.findFirst({ where: { district }, orderBy: { forecast_date: 'desc' } });
      sendSuccess(res, weather);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Seeds
  async getSeeds(req: Request, res: Response) {
    try {
      const cropId = req.query.crop_id as string;
      const where: any = {};
      if (cropId) where.crop_id = parseInt(cropId);
      const seeds = await prisma.seed.findMany({
        where,
        include: { crop: { select: { name: true, name_bn: true } } },
        orderBy: { name: 'asc' },
      });
      sendSuccess(res, seeds);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  async createSeed(req: AuthenticatedRequest, res: Response) {
    try {
      const seed = await prisma.seed.create({ data: req.body });
      sendSuccess(res, seed, 'Seed created', 201);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  async updateSeed(req: AuthenticatedRequest, res: Response) {
    try {
      const seed_id = parseInt(req.params.id);
      const seed = await prisma.seed.update({ where: { seed_id }, data: req.body });
      sendSuccess(res, seed);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Fertilizers
  async getFertilizers(req: Request, res: Response) {
    try {
      const fertilizers = await prisma.fertilizer.findMany({ orderBy: { name: 'asc' } });
      sendSuccess(res, fertilizers);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  async createFertilizer(req: AuthenticatedRequest, res: Response) {
    try {
      const fertilizer = await prisma.fertilizer.create({ data: req.body });
      sendSuccess(res, fertilizer, 'Fertilizer created', 201);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  async updateFertilizer(req: AuthenticatedRequest, res: Response) {
    try {
      const fertilizer_id = parseInt(req.params.id);
      const fertilizer = await prisma.fertilizer.update({ where: { fertilizer_id }, data: req.body });
      sendSuccess(res, fertilizer);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Crop Advice
  async getCropAdvice(req: Request, res: Response) {
    try {
      const cropId = req.query.crop_id as string;
      const where: any = {};
      if (cropId) where.crop_id = parseInt(cropId);
      const advice = await prisma.cropAdvice.findMany({
        where,
        include: { crop: { select: { name: true } }, expert: { include: { user: { select: { full_name: true } } } } },
        orderBy: { created_at: 'desc' },
      });
      sendSuccess(res, advice, 'Advice fetched');
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  async createCropAdvice(req: AuthenticatedRequest, res: Response) {
    try {
      const advice = await prisma.cropAdvice.create({ data: req.body });
      sendSuccess(res, advice);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Live Market Prices (scraped from DAM)
  async getLivePrices(req: Request, res: Response) {
    try {
      const data = await getLiveMarketPrices();
      sendSuccess(res, data);
    } catch (err: any) {
      // If scraping fails, fall back to DB data
      try {
        const dbPrices = await getLatestPricesFromDB(50);
        sendSuccess(res, { prices: dbPrices, scrapedAt: new Date(), source: 'Database (cached)', fallback: true });
      } catch (fallbackErr: any) {
        sendError(res, fallbackErr.message, 500);
      }
    }
  }

  async refreshLivePrices(req: Request, res: Response) {
    try {
      const data = await scrapeAndStoreLivePrices();
      sendSuccess(res, data, 'Prices refreshed from DAM');
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  async getCropPrices(req: Request, res: Response) {
    try {
      const cropId = parseInt(req.params.cropId);
      if (isNaN(cropId)) { sendError(res, 'Invalid crop ID', 400); return; }
      const prices = await getPricesForCrop(cropId);
      sendSuccess(res, prices);
    } catch (err: any) { sendError(res, err.message, 500); }
  }

  // Commodity detail by name or ID
  async getCommodityDetail(req: Request, res: Response) {
    try {
      const { name } = req.params;
      if (!name) { sendError(res, 'Commodity name required', 400); return; }
      const decoded = decodeURIComponent(name);
      const detail = await getCommodityDetail(decoded);
      
      // Also fetch live DAM prices matching this commodity
      let livePrices: any[] = [];
      try {
        const liveData = await getLiveMarketPrices();
        livePrices = liveData.prices.filter(p => 
          p.commodity.toLowerCase().includes(decoded.toLowerCase()) || 
          decoded.toLowerCase().includes(p.commodity.toLowerCase())
        );
      } catch (e) { /* ignore scrape errors */ }

      if (!detail && livePrices.length === 0) {
        sendError(res, 'Commodity not found', 404); return;
      }

      sendSuccess(res, {
        ...(detail || { name: decoded, name_bn: null, season: null, description: null, market_prices: [], crop_advices: [], seeds: [] }),
        live_prices: livePrices,
      });
    } catch (err: any) { sendError(res, err.message, 500); }
  }
}

export const agricultureController = new AgricultureController();

// Keep legacy exports for backward compatibility
export const listCrops = agricultureController.getCrops.bind(agricultureController);
export const getCrop = agricultureController.getCrop.bind(agricultureController);
export const listMarketPrices = agricultureController.getMarketPrices.bind(agricultureController);
export const getWeather = agricultureController.getWeather.bind(agricultureController);

import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../patterns/singleton/DatabaseManager';

export async function listCrops(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const where: any = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { name_bn: { contains: search, mode: 'insensitive' } }];
    const [data, total] = await Promise.all([
      prisma.crop.findMany({ where, skip: (page - 1) * limit, take: limit, include: { category: true } }),
      prisma.crop.count({ where }),
    ]);
    sendSuccess(res, { data, total, page, limit });
  } catch (err: any) { sendError(res, err.message, 500); }
}

export async function getCrop(req: Request, res: Response): Promise<void> {
  try {
    const crop_id = parseInt(req.params.id);
    const crop = await prisma.crop.findUnique({ where: { crop_id }, include: { market_prices: { orderBy: { recorded_at: 'desc' }, take: 7 }, crop_advices: { include: { expert: { include: { user: { select: { full_name: true } } } } } } } });
    if (!crop) { sendError(res, 'Crop not found', 404); return; }
    sendSuccess(res, crop);
  } catch (err: any) { sendError(res, err.message, 500); }
}

export async function listMarketPrices(req: Request, res: Response): Promise<void> {
  try {
    const prices = await prisma.marketPrice.findMany({
      take: 20,
      orderBy: { recorded_at: 'desc' },
      include: { crop: { select: { name: true } } },
    });
    sendSuccess(res, prices);
  } catch (err: any) { sendError(res, err.message, 500); }
}

export async function getWeather(req: Request, res: Response): Promise<void> {
  try {
    const district = req.query.district as string || 'Dhaka';
    const weather = await prisma.weather.findFirst({ where: { district }, orderBy: { forecast_date: 'desc' } });
    sendSuccess(res, weather);
  } catch (err: any) { sendError(res, err.message, 500); }
}

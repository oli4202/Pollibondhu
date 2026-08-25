import https from 'https';
import http from 'http';
import { prisma } from '../patterns/singleton/DatabaseManager';

interface LivePrice {
  commodity: string;
  lowPrice: number;
  highPrice: number;
  changePct: number;
}

interface ScrapedMarketData {
  prices: LivePrice[];
  scrapedAt: Date;
  source: string;
}

/**
 * Scrape live market prices from Bangladesh Department of Agricultural Marketing
 * Source: https://market.dam.gov.bd
 */
async function fetchDAMPage(): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = 'https://market.dam.gov.bd/market_daily_price_report?L=E';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseDAMPrices(html: string): LivePrice[] {
  const prices: LivePrice[] = [];

  // The DAM page has price data in <span class="stockbox"> elements like:
  // <span class="stockbox"><a href="#Aman-Fine">Aman-Fine</a>:&nbsp; 72.00 - 75.00 <span ...>▲0.00% </span></span>
  // We first extract the stockbox spans, then parse each one
  
  // Match each stockbox span content
  const stockboxRegex = /<span class="stockbox">(.*?)<\/span>/gs;
  let stockboxMatch;
  
  while ((stockboxMatch = stockboxRegex.exec(html)) !== null) {
    const content = stockboxMatch[1];
    // Strip all HTML tags
    const text = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#x25B2;/g, '▲').replace(/&#x25BC;/g, '▼');
    
    // Parse: "Aman-Fine:  72.00 - 75.00 ▲0.00% "
    const priceRegex = /([A-Za-z][A-Za-z0-9\s\-()]+?):\s*([\d,.]+)\s*-\s*([\d,.]+)\s*[▲▼★]?\s*([\-]?[\d.]+)%/;
    const match = text.match(priceRegex);
    
    if (match) {
      const commodity = match[1].trim();
      const lowPrice = parseFloat(match[2].replace(/,/g, ''));
      const highPrice = parseFloat(match[3].replace(/,/g, ''));
      const changePct = parseFloat(match[4]) || 0;

      if (!isNaN(lowPrice) && !isNaN(highPrice)) {
        prices.push({ commodity, lowPrice, highPrice, changePct });
      }
    }
  }

  // Fallback: if stockbox parsing didn't work, try plain text approach
  if (prices.length === 0) {
    // Strip all HTML tags first
    const plainText = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
    const priceRegex = /([A-Za-z][A-Za-z0-9\s\-()]+?):\s*([\d,.]+)\s*-\s*([\d,.]+)\s*[▲▼★]?\s*([\-]?[\d.]+)%/g;
    let match;
    while ((match = priceRegex.exec(plainText)) !== null) {
      const commodity = match[1].trim();
      const lowPrice = parseFloat(match[2].replace(/,/g, ''));
      const highPrice = parseFloat(match[3].replace(/,/g, ''));
      const changePct = parseFloat(match[4]) || 0;
      if (!isNaN(lowPrice) && !isNaN(highPrice)) {
        prices.push({ commodity, lowPrice, highPrice, changePct });
      }
    }
  }

  return prices;
}

/**
 * Map DAM commodity names to our internal crop IDs (if matching)
 */
const COMMODITY_TO_CROP_MAP: Record<string, string> = {
  'Aman-Fine': 'Aman Paddy',
  'Aman-Medium': 'Aman Paddy',
  'Aman-Coarse': 'Aman Paddy',
  'Boro-Fine': 'Boro Paddy',
  'Boro-Medium': 'Boro Paddy',
  'Boro-Coarse': 'Boro Paddy',
  'Wheat': 'Wheat',
  'Potato': 'Potato',
  'Onion-local': 'Onion',
  'Garlic-local': 'Garlic',
  'Green Chili': 'Green Chili',
  'Mung': 'Mung',
  'Soybean': 'Soybean',
};

/**
 * Scrape live prices and store them in the database.
 * Returns the scraped data along with stored records.
 */
export async function scrapeAndStoreLivePrices(): Promise<ScrapedMarketData> {
  const html = await fetchDAMPage();
  const livePrices = parseDAMPrices(html);

  // Store each price in the database
  const storedPrices = [];

  for (const lp of livePrices) {
    // Check if there's a matching crop in our database
    const cropName = COMMODITY_TO_CROP_MAP[lp.commodity] || lp.commodity;
    const crop = await prisma.crop.findFirst({
      where: { name: cropName },
    });

    const avgPrice = ((lp.lowPrice + lp.highPrice) / 2).toFixed(2);

    // Upsert market price: update if same crop+market exists today, else create
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.marketPrice.findFirst({
      where: {
        market_name: 'Dhaka DAM',
        recorded_at: { gte: today },
        ...(crop ? { crop_id: crop.crop_id } : {}),
      },
    });

    if (existing) {
      await prisma.marketPrice.update({
        where: { price_id: existing.price_id },
        data: {
          price: avgPrice,
          change_pct: lp.changePct,
          unit: 'kg',
        },
      });
      storedPrices.push({ ...lp, price_id: existing.price_id, crop_id: crop?.crop_id });
    } else {
      // If no matching crop, use a default or skip
      if (crop) {
        const newPrice = await prisma.marketPrice.create({
          data: {
            crop_id: crop.crop_id,
            market_name: 'Dhaka DAM',
            price: avgPrice,
            unit: 'kg',
            change_pct: lp.changePct,
          },
        });
        storedPrices.push({ ...lp, price_id: newPrice.price_id, crop_id: crop.crop_id });
      }
    }
  }

  return {
    prices: livePrices,
    scrapedAt: new Date(),
    source: 'Department of Agricultural Marketing, Bangladesh',
  };
}

/**
 * Get all live prices (fresh scrape)
 */
export async function getLiveMarketPrices(): Promise<ScrapedMarketData> {
  return scrapeAndStoreLivePrices();
}

/**
 * Get latest prices from DB (fast, no scraping)
 */
export async function getLatestPricesFromDB(limit: number = 50) {
  return prisma.marketPrice.findMany({
    take: limit,
    orderBy: { recorded_at: 'desc' },
    include: { crop: { select: { crop_id: true, name: true, name_bn: true } } },
  });
}

/**
 * Get prices for a specific crop
 */
export async function getPricesForCrop(cropId: number) {
  return prisma.marketPrice.findMany({
    where: { crop_id: cropId },
    orderBy: { recorded_at: 'desc' },
    take: 30,
    include: { crop: { select: { crop_id: true, name: true, name_bn: true } } },
  });
}

/**
 * Get a commodity/commodity detail with its price history
 */
export async function getCommodityDetail(commodityName: string) {
  // Try to find crop by name
  const crop = await prisma.crop.findFirst({
    where: {
      OR: [
        { name: { contains: commodityName } },
        { name_bn: { contains: commodityName } },
      ],
    },
    include: {
      market_prices: {
        orderBy: { recorded_at: 'desc' },
        take: 30,
      },
      crop_advices: {
        include: {
          expert: {
            include: { user: { select: { full_name: true } } },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
      },
      seeds: true,
    },
  });

  return crop;
}

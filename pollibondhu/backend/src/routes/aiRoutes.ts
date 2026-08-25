import { Router } from 'express';
import { getAiResponse } from '../services/groqService';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../patterns/singleton/DatabaseManager';
import { sendSuccess, sendError } from '../utils/apiResponse';

const router = Router();

// Main AI chat endpoint
router.post('/chat', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { prompt } = req.body;
    const userRole = req.user?.role || 'CITIZEN';
    const userPermissions = req.user?.permissions || [];

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const rbacContext = `User role: ${userRole}, Roles: [${req.user?.roles?.join(', ')}], ` +
      `Permissions: [${userPermissions.join(', ')}], ` +
      `Departments: [${req.user?.department_ids?.join(', ')}]`;

    const response = await getAiResponse(userRole, prompt, rbacContext);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process AI request' });
  }
});

// AI Crop Suggestion — instant answer based on season, soil, location
router.post('/crop-suggestion', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { season, soilType, waterAvailable, location, previousCrop, plotSize } = req.body;

    // Fetch existing crops from DB for context
    let dbCrops: any[] = [];
    try {
      dbCrops = await prisma.crop.findMany({ select: { name: true, name_bn: true, season: true, description: true } });
    } catch {}

    const cropList = dbCrops.map(c => `${c.name} (${c.name_bn || ''}) - ${c.season || 'Unknown'}: ${c.description || ''}`).join('\n');

    const systemContext = `You are an expert Bangladeshi agriculture advisor for PolliBondhu.
    You help farmers choose the best crops based on their conditions.
    Always respond in English with some Bangla terms where helpful.
    Be specific about varieties, timing, and expected yield.
    If the farmer asks about a specific crop, give detailed advice.
    Keep answers concise but actionable — 3-5 sentences max.
    Always mention a recommended variety if possible.

    Available crops in our database:
    ${cropList || 'Boro Paddy, Aman Paddy, Potato, Mustard, Wheat, Jute, Maize, Lentil, Onion, Tomato, Chili'}`;

    const userPrompt = `Help me choose the best crops to plant.
    Season: ${season || 'Current season'}
    Soil type: ${soilType || 'Not specified'}
    Water availability: ${waterAvailable || 'Normal rainfall'}
    Location/District: ${location || 'Bangladesh'}
    Previous crop: ${previousCrop || 'None'}
    Plot size: ${plotSize || 'Small farm'}

    Give me 3-5 crop recommendations with:
    1. Which variety to plant
    2. Expected yield per acre
    3. Best planting time
    4. Estimated cost and profit`;

    const response = await getAiResponse('CITIZEN', userPrompt, systemContext);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get crop suggestion' });
  }
});

// AI Disease Detection — describe symptoms, get diagnosis
router.post('/disease-diagnosis', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { cropName, symptoms, imageUrl } = req.body;

    const systemContext = `You are a plant disease expert for Bangladeshi crops.
    Diagnose plant diseases based on described symptoms.
    Always provide:
    1. Most likely disease name
    2. Cause (fungal, bacterial, viral, pest)
    3. Organic treatment option
    4. Chemical treatment option
    5. Prevention tips
    Be concise and practical.`;

    const userPrompt = `I need help diagnosing a problem with my ${cropName || 'crop'}.
    Symptoms: ${symptoms || 'Not described in detail'}
    ${imageUrl ? 'I have uploaded a photo for reference.' : ''}

    What disease or pest problem is this? How should I treat it?`;

    const response = await getAiResponse('CITIZEN', userPrompt, systemContext);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to diagnose' });
  }
});

// AI Market Price Analysis
router.post('/price-analysis', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { commodity, currentPrice, market } = req.body;

    // Fetch live prices from DB
    let livePrices: any[] = [];
    try {
      const crops = await prisma.crop.findMany({
        include: { market_prices: { orderBy: { recorded_at: 'desc' }, take: 5 } },
      });
      const matchedCrop = crops.find(c => c.name.toLowerCase().includes((commodity || '').toLowerCase()));
      if (matchedCrop) livePrices = matchedCrop.market_prices;
    } catch {}

    const priceData = livePrices.length > 0
      ? livePrices.map(p => `${p.market_name}: ৳${p.price}/${p.unit} (${p.change_pct > 0 ? '+' : ''}${p.change_pct}%)`).join('\n')
      : 'No live price data available';

    const systemContext = `You are a market analyst for Bangladeshi agricultural commodities.
    Analyze price trends and give buying/selling advice.
    Consider seasonal patterns, supply/demand, and regional price differences.
    Be practical — help farmers decide when to sell and when to hold.`;

    const userPrompt = `Analyze the market for ${commodity || 'agricultural products'}.
    Current price: ${currentPrice ? `৳${currentPrice}` : 'Not specified'}
    Market: ${market || 'Local market'}

    Recent prices from our database:
    ${priceData}

    Should I sell now or wait? What's the expected price trend?`;

    const response = await getAiResponse('CITIZEN', userPrompt, systemContext);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to analyze prices' });
  }
});

// AI Service Finder — find the right government/service provider
router.post('/service-finder', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { query, district, serviceType } = req.body;

    // Fetch services from DB
    let services: any[] = [];
    try {
      services = await prisma.service.findMany({
        where: { status: 'APPROVED', is_available: true },
        select: { title: true, description: true, price: true, district: true, category: { select: { name: true } } },
        take: 20,
      });
    } catch {}

    const serviceList = services.map(s =>
      `${s.title} (${s.category?.name || 'General'}) - ${s.district || 'All'} - ${s.price ? `৳${s.price}` : 'Free'}: ${s.description || ''}`
    ).join('\n');

    const systemContext = `You are a service navigator for PolliBondhu Smart Village.
    Help users find the right government services, healthcare, or provider services.
    Explain the process, required documents, fees, and timeline.
    Be helpful and guide them step by step.
    If they need a specific service, tell them where to find it on the platform.`;

    const userPrompt = `I need help with: ${query || 'finding a service'}
    ${district ? `My district: ${district}` : ''}
    ${serviceType ? `Service type: ${serviceType}` : ''}

    Available services on our platform:
    ${serviceList || 'NID Application, Birth Registration, Trade License, Health Card, Vaccination, Blood Donation'}

    What service do I need? How do I apply? What documents are required?`;

    const response = await getAiResponse('CITIZEN', userPrompt, systemContext);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to find service' });
  }
});

// AI Health Assistant
router.post('/health-assistant', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { symptoms, age, gender, medicalHistory } = req.body;

    const systemContext = `You are a health information assistant for PolliBondhu.
    Provide general health guidance — NOT medical diagnosis.
    Always recommend visiting a qualified healthcare professional.
    Cover common rural health concerns: nutrition, vaccination, maternal health, seasonal diseases, first aid.
    Be empathetic and clear. Use simple language.`;

    const userPrompt = `Health question:
    Symptoms/Concern: ${symptoms || 'General health inquiry'}
    Age: ${age || 'Not specified'}
    Gender: ${gender || 'Not specified'}
    Medical history: ${medicalHistory || 'None known'}

    What could this be? What should I do? Is it urgent?`;

    const response = await getAiResponse('CITIZEN', userPrompt, systemContext);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get health advice' });
  }
});

// AI Weather-based Farming Advice
router.post('/weather-advice', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { district, temperature, rainfall, humidity, condition } = req.body;

    const systemContext = `You are a weather-smart farming advisor for Bangladesh.
    Give practical advice based on current weather conditions.
    Cover: irrigation timing, pest risk, spraying windows, harvesting advice, storage tips.
    Be specific about what farmers should do TODAY based on the weather.`;

    const userPrompt = `Weather conditions in ${district || 'my area'}:
    Temperature: ${temperature || 'Normal'}
    Rainfall: ${rainfall || 'Normal'}
    Humidity: ${humidity || 'Normal'}
    Condition: ${condition || 'Not specified'}

    What should I do in my farm today? Any precautions?`;

    const response = await getAiResponse('CITIZEN', userPrompt, systemContext);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get weather advice' });
  }
});

// AI Quick Help — instant one-liner answers
router.post('/quick-help', async (req: any, res) => {
  try {
    const { question, page } = req.body;
    if (!question) { sendError(res, 'Question required', 400); return; }

    const systemContext = `You are a quick-help assistant for PolliBondhu Smart Village.
    Give SHORT, direct answers (1-3 sentences max).
    Be helpful and actionable.
    Current page context: ${page || 'General'}`;

    const response = await getAiResponse('CITIZEN', question, systemContext);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

export default router;

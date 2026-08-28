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

    const systemContext = `You are an intelligent service navigator for PolliBondhu Smart Village.
    Your goal is to understand exactly what the user is trying to accomplish and provide a highly logical, sensible, and structured response based on their actual needs.
    1. Analyze the user's request carefully to determine what they actually need.
    2. Recommend the exact service they need from the 'Available services on our platform' list. If the exact service isn't listed, suggest the closest alternative or explain the general government process.
    3. Clearly explain the step-by-step process to apply.
    4. List the required documents, fees, and expected timeline.
    Be concise, helpful, and directly address the user's specific situation. Do not give generic advice if a specific service matches their need.

    CRITICAL INSTRUCTION: You MUST return your response as a valid JSON object. Do not wrap it in markdown code blocks. The JSON must have this exact structure:
    {
      "message": "Your detailed step-by-step explanation here",
      "action_links": [
        { "title": "Apply for [Service Name]", "url": "/services?filter=[Category Name]" }
      ]
    }
    For the url, use '/services?filter=CategoryName' where CategoryName is the exact category of the service (e.g. Education, Citizen, Health).`;

    const userPrompt = `I need help with: ${query || 'finding a service'}
    ${district ? `My district: ${district}` : ''}
    ${serviceType ? `Service type: ${serviceType}` : ''}

    Available services on our platform:
    ${serviceList || 'NID Application, Birth Registration, Trade License, Health Card, Vaccination, Blood Donation'}

    What service do I need? How do I apply? What documents are required? Return ONLY valid JSON.`;

    const response = await getAiResponse('CITIZEN', userPrompt, systemContext);
    
    let parsedResponse = { message: response, action_links: [] };
    try {
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResponse = JSON.parse(jsonStr);
    } catch (e) {
      // Fallback if AI fails to return valid JSON
      parsedResponse = { message: response, action_links: [] };
    }

    res.json({ success: true, response: parsedResponse });
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

// Grammar and spelling correction endpoint
router.post('/correct', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { text, language } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const lang = language || 'English';
    const prompt = `Correct the grammar, spelling, and punctuation of the following ${lang} text. Return ONLY the corrected text, nothing else. Keep the same meaning and tone. If the text is already correct, return it as-is.\n\nText: "${text}"`;

    const response = await getAiResponse('CITIZEN', prompt, 'You are a grammar and spelling correction assistant. Return only the corrected text.');
    res.json({ success: true, corrected: response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to correct text' });
  }
});

// AI text improvement endpoint (for descriptions, titles)
router.post('/improve', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { text, type } = req.body; // type: 'title' | 'description' | 'complaint'

    if (!text?.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const typePrompts: Record<string, string> = {
      title: 'Improve this service title to be more professional and clear. Return ONLY the improved title.',
      description: 'Improve this service description to be more professional, clear, and appealing to customers. Keep it concise. Return ONLY the improved description.',
      complaint: 'Rewrite this complaint to be more formal, clear, and effective. Keep the same facts. Return ONLY the improved text.',
    };

    const prompt = `${typePrompts[type] || typePrompts.description}\n\nOriginal: "${text}"`;

    const response = await getAiResponse('CITIZEN', prompt, 'You are a professional text improvement assistant.');
    res.json({ success: true, improved: response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to improve text' });
  }
});

// AI auto-reply for application responses
router.post('/application-response', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, serviceName, applicantName } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const actionContext = status === 'APPROVED' ? 'The application is approved and closed.' :
                          status === 'REJECTED' ? 'The application is rejected because it does not meet the requirements.' :
                          status === 'ADDITIONAL_DOCS_REQUIRED' ? 'The applicant needs to provide additional documentation.' :
                          status === 'IN_PROGRESS' ? 'The application is being processed.' :
                          status === 'REVIEWING' ? 'The application is currently under review.' : 'The application status has been updated.';

    const prompt = `Write a short, professional response from a government service provider to a citizen named ${applicantName || 'Citizen'}.
The response is regarding their application for the service "${serviceName || 'Service'}".
The current status update is: ${status}.
Context to include: ${actionContext}.
Keep it to 2-3 sentences max. Be polite. Return ONLY the text of the response, nothing else. No greetings at the beginning or sign-offs at the end, just the body text.`;

    const response = await getAiResponse('SERVICE_PROVIDER', prompt, 'You are an AI assisting a government provider in generating short, professional responses to citizens.');
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate response' });
  }
});

// AI auto-reply for complaints
router.post('/complaint-response', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { action, complaintSubject, complaintDescription, citizenName } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'Action is required' });
    }

    const actionContext = action === 'RESOLVE' ? 'You are marking this complaint as fully resolved.' :
                          'You are responding to this complaint to provide an update or ask for more information.';

    const prompt = `Write a short, professional response from a service provider to a citizen named ${citizenName || 'Citizen'}.
The response is regarding their complaint.
Complaint Subject: "${complaintSubject || 'Service Issue'}"
Complaint Description: "${complaintDescription || 'I am facing an issue.'}"
Context: ${actionContext}.
Keep it to 2-3 sentences max. Be empathetic and professional. Return ONLY the text of the response, nothing else. No greetings at the beginning or sign-offs at the end, just the body text.`;

    const response = await getAiResponse('SERVICE_PROVIDER', prompt, 'You are an AI assisting a provider in generating empathetic, professional responses to citizen complaints.');
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate response' });
  }
});

// AI suggest replies for a received message
router.post('/suggest-reply', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { receivedMessage, context } = req.body;

    if (!receivedMessage) {
      return res.status(400).json({ success: false, error: 'Received message is required' });
    }

    const prompt = `A user has received the following message in a chat: "${receivedMessage}".
Context about the chat: ${context || 'General chat conversation.'}

Suggest exactly 3 short, natural, and context-appropriate replies that the user can send back.
The replies should be very concise (1-5 words max, like "Okay, thanks!", "I understand", "When?", "Yes", etc).
Format the response as a valid JSON array of 3 strings. ONLY return the JSON array, no markdown, no backticks, no other text.`;

    const responseText = await getAiResponse('CITIZEN', prompt, 'You are an AI assistant helping users quickly reply to chat messages.');
    
    // Parse the JSON array
    let suggestions = [];
    try {
      // Clean up potential markdown formatting from the AI response
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      suggestions = JSON.parse(cleanJson);
      if (!Array.isArray(suggestions)) throw new Error('Not an array');
    } catch (e) {
      // Fallback if parsing fails
      suggestions = ["Yes, absolutely", "Okay, thank you", "I understand"];
    }

    res.json({ success: true, suggestions: suggestions.slice(0, 3) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate suggestions' });
  }
});

// AI auto-generate project
router.post('/generate-project', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const prompt = `Generate a realistic government infrastructure or social development project for Bangladesh. 
Return ONLY a valid JSON object with the following fields: 
- title (string)
- description (string)
- budget (number between 500000 and 50000000)
- funding_source (string, e.g., 'Government ADP', 'World Bank', 'Green Energy Fund')
- contractor (string, realistic Bangladeshi contractor name)
- deadline (YYYY-MM-DD format, within the next 2 years)`;

    const response = await getAiResponse('ADMIN', prompt, 'You are an AI generating mock project data. Return ONLY valid JSON. No markdown, no comments.');
    
    // clean up response to parse json
    let project;
    try {
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      project = JSON.parse(jsonStr);
    } catch (e) {
      // Fallback
      project = {
        title: 'Rural Road Development - Union 4',
        description: 'Constructing 5km of paved roads connecting the main market to local villages.',
        budget: 2500000,
        funding_source: 'Government ADP',
        contractor: 'Local Builders Ltd.',
        deadline: '2025-12-31'
      };
    }
    
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate project' });
  }
});

// AI Dynamic Form Generator
router.post('/dynamic-form', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { serviceName } = req.body;
    if (!serviceName) return res.status(400).json({ success: false, error: 'Service name is required' });

    const systemContext = `You are a government digital service architect.
Generate a dynamic JSON schema for an application form for the service: "${serviceName}".
Do NOT include Applicant Name and Phone fields (we already collect them).
Provide 3-5 specific, essential fields needed for this service (e.g. for Birth Registration: Hospital Name, Father NID, Date of Birth).
CRITICAL: Return ONLY a valid JSON array of objects.
Each object must have:
- name (string, camelCase, e.g., 'hospitalName')
- label (string, human-readable, e.g., 'Hospital Name')
- type (string: 'text' | 'textarea' | 'date' | 'select' | 'number')
- placeholder (string)
- required (boolean)
- options (array of strings, ONLY if type is 'select')`;

    const prompt = `Generate the form schema for: ${serviceName}`;
    const response = await getAiResponse('CITIZEN', prompt, systemContext);
    
    let fields = [];
    try {
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      fields = JSON.parse(jsonStr);
      if (!Array.isArray(fields)) throw new Error('Not an array');
    } catch (e) {
      // Fallback
      fields = [
        { name: 'purpose', label: 'Application Purpose', type: 'text', placeholder: 'Why do you need this?', required: true },
        { name: 'additionalInfo', label: 'Additional Notes', type: 'textarea', placeholder: 'Any extra details...', required: false }
      ];
    }
    res.json({ success: true, fields });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate form schema' });
  }
});

// AI Magic Fill for dynamic forms
router.post('/magic-fill', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { serviceName, fields } = req.body;
    
    const systemContext = `You are an AI assistant helping a user auto-fill an application form.
Generate realistic mock data for a Bangladeshi citizen applying for "${serviceName}".
The form has the following fields:
${JSON.stringify(fields)}

CRITICAL: Return ONLY a valid JSON object where keys are the field "name" properties and values are realistic Bangladeshi mock data strings.
No markdown, no explanations.`;

    const prompt = `Generate magic fill mock data for ${serviceName}`;
    const response = await getAiResponse('CITIZEN', prompt, systemContext);
    
    let mockData = {};
    try {
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      mockData = JSON.parse(jsonStr);
    } catch (e) {
      mockData = {};
    }
    res.json({ success: true, mockData });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate mock data' });
  }
});

export default router;

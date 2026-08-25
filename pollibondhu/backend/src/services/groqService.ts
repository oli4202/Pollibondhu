import { logger } from '../patterns/singleton/Logger';

/**
 * Lazy-initialized Groq client.
 * Only creates the client when first needed, and only if GROQ_API_KEY is set.
 */
let groqClient: any = null;

function getGroqClient() {
  if (groqClient) return groqClient;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn('GROQ_API_KEY not set — AI assistant will return a fallback response');
    return null;
  }

  // Dynamic import to avoid crash at module load time
  try {
    const Groq = require('groq-sdk').default;
    groqClient = new Groq({ apiKey });
    return groqClient;
  } catch (error) {
    logger.error('Failed to initialize Groq client:', error);
    return null;
  }
}

export const getAiResponse = async (userRole: string, prompt: string, systemPromptContext?: string) => {
    let baseSystemPrompt = `You are an AI Assistant for PolliBondhu Smart Village. 
    You must always adhere to the user's role: ${userRole}. 
    Do not expose sensitive information or data that belongs to a higher privilege level. 
    You can help with agriculture advice, government services, health services, and reporting complaints.`;

    if (systemPromptContext) {
        baseSystemPrompt += `\nAdditional Context: ${systemPromptContext}`;
    }

    const groq = getGroqClient();
    if (!groq) {
        return `I'm sorry, the AI assistant is currently unavailable. Please try again later or contact support for help with your query: "${prompt.substring(0, 100)}"`;
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: baseSystemPrompt,
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "groq/compound-mini",
            temperature: 0.5,
            max_tokens: 1024,
        });

        return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
        logger.error("Groq API Error:", error);
        throw new Error("Failed to get AI response.");
    }
};

import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export const getAiResponse = async (userRole: string, prompt: string, systemPromptContext?: string) => {
    let baseSystemPrompt = `You are an AI Assistant for PolliBondhu Smart Village. 
    You must always adhere to the user's role: ${userRole}. 
    Do not expose sensitive information or data that belongs to a higher privilege level. 
    You can help with agriculture advice, government services, health services, and reporting complaints.`;

    if (systemPromptContext) {
        baseSystemPrompt += `\nAdditional Context: ${systemPromptContext}`;
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
            model: "llama-3.1-8b-instant",
            temperature: 0.5,
            max_tokens: 1024,
        });

        return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq API Error:", error);
        throw new Error("Failed to get AI response.");
    }
};

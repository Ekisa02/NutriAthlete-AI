import { GoogleGenAI, Type, Chat, Modality, GenerateContentResponse } from "@google/genai";
import { UserProfile, NutritionPlan, ChatMessage, EventRecommendationResponse } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// --- Audio Decoding Utilities for TTS ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Helper to add retry logic with exponential backoff for API calls
const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3): Promise<T> => {
    let attempt = 0;
    while (true) {
        try {
            return await apiCall();
        } catch (error: any) {
            const isRateLimitError = error.toString().includes("RESOURCE_EXHAUSTED") || error.message?.includes("exceeded your current quota");

            if (isRateLimitError && attempt < maxRetries) {
                attempt++;
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                console.warn(`Rate limit exceeded. Retrying in ${delay.toFixed(0)}ms... (Attempt ${attempt})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
};

let cachedPlans: Record<string, NutritionPlan> | null = null;

const getNutritionPlans = async (): Promise<Record<string, NutritionPlan>> => {
    if (cachedPlans) {
        return cachedPlans;
    }
    // Use fetch to load the JSON file from the root directory.
    const response = await fetch('/data/nutrition-plans.json');
    if (!response.ok) {
        throw new Error('Failed to fetch nutrition plans.');
    }
    const data = await response.json();
    cachedPlans = data;
    return data;
};


export const generateNutritionPlan = async (profile: UserProfile): Promise<NutritionPlan> => {
    const plans = await getNutritionPlans();
    const planForSport = plans[profile.sport as keyof typeof plans];

    // Simulate a short delay to allow loading indicator to show briefly
    return new Promise((resolve) => {
        setTimeout(() => {
            // Fallback to default plan if a sport-specific plan doesn't exist
            resolve(planForSport || plans.default);
        }, 500);
    });
};

export const getEventRecommendations = async (profile: UserProfile, eventName: string, eventDate: string, location: {latitude: number, longitude: number} | null): Promise<EventRecommendationResponse> => {
    const prompt = `
As 'NutriAthlete AI', provide pre-event and recovery nutrition recommendations for the following athlete and event.

**Athlete Profile:**
- Sport: ${profile.sport}
- Weight: ${profile.weight} kg
- Current Location: ${location ? `${location.latitude}, ${location.longitude}`: 'Not provided'}

**Event Details:**
- Name: ${eventName}
- Date: ${eventDate}

Provide concise, actionable advice for the day before, the morning of, and immediately after the event. Focus on hydration, carbohydrate loading, and protein intake for muscle repair. If the user's location is available, use your knowledge to suggest specific types of nearby places (like 'healthy restaurants' or 'juice bars') that would be good for a pre- or post-event meal. Format the response as clean Markdown.
`;

    const apiCall = () => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{googleMaps: {}}],
            ...(location && { toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude
                }
              }
            }})
        }
    });

    const response: GenerateContentResponse = await withRetry(apiCall);
    
    return {
        text: response.text,
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
};

export const getMealDetails = async (mealName: string, mealDescription: string): Promise<string> => {
    const prompt = `
You are a recipe assistant. Based on the following meal, provide a simple list of ingredients and preparation steps. Format the response in clean Markdown.

**Meal:** ${mealName}
**Description:** ${mealDescription}

**Output format:**
### Ingredients
- List item 1
- List item 2

### Preparation
1. Step 1
2. Step 2
`;
    
    const apiCall = () => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    const response: GenerateContentResponse = await withRetry(apiCall);
    return response.text;
};

export const generateSpeech = async (text: string, audioContext: AudioContext): Promise<AudioBuffer> => {
    const apiCall = () => ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with a calm and encouraging tone: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const response: GenerateContentResponse = await withRetry(apiCall);

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            audioContext,
            24000,
            1,
        );
        return audioBuffer;
    } else {
        throw new Error("No audio data received from API.");
    }
};


let chat: Chat | null = null;

export const startChat = () => {
  chat = ai.chats.create({
    model: 'gemini-flash-lite-latest',
    config: {
      systemInstruction: 'You are NutriAthlete AI, a friendly and knowledgeable sports nutrition assistant. Answer questions concisely and accurately. If asked about supplements, advise consulting a certified doctor or nutritionist before use.',
    },
  });
};

export const sendMessageToAssistant = async (message: string, history: ChatMessage[]): Promise<string> => {
  if (!chat) {
    startChat();
  }
  
  if (history.length > 0 && chat?.history.length === 0) {
      chat.history = history;
  }

  const apiCall = () => chat!.sendMessage({ message });
  const response: GenerateContentResponse = await withRetry(apiCall);
  return response.text;
};

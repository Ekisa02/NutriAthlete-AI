

import { GoogleGenAI, Type, Chat, Modality, GenerateContentResponse } from "@google/genai";
import { UserProfile, NutritionPlan, ChatMessage, EventRecommendations, DeliveryPartner, MealDeliveryOption } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const MOCK_DELIVERY_PARTNERS: DeliveryPartner[] = [
  { name: "Uber Eats", logoUrl: "https://d3i4yxtzktqr9n.cloudfront.net/web-eats-v2/97c43f8404e6231e.svg", area: ["all"] },
  { name: "Glovo", logoUrl: "https://res.cloudinary.com/glovoapp/image/fetch/f_svg,q_auto/https://glovoapp.com/images/logo_green.svg", area: ["all"] },
  { name: "KFC Delivery", logoUrl: "https://www.kfc.co.ke/static/media/kfc-logo.88334237.svg", area: ["all"] },
  { name: "EldoFresh Meals", logoUrl: "", area: ["Eldoret, Kenya"] },
  { name: "Nairobi Bites", logoUrl: "", area: ["Nairobi, Kenya"] }
];

const MOCK_DELIVERY_OPTIONS: MealDeliveryOption[] = [
    // Oatmeal Options
    { partnerName: "Uber Eats", mealName: "Classic Berry Oatmeal", price: 650, currency: "KES", deliveryTime: "25-35 min", rating: 4.6, specialOffer: "Free Delivery" },
    { partnerName: "Glovo", mealName: "Hearty Oats with Banana", price: 600, currency: "KES", deliveryTime: "30-40 min", rating: 4.4 },
    { partnerName: "EldoFresh Meals", mealName: "Local Honey Oatmeal", price: 550, currency: "KES", deliveryTime: "20-30 min", rating: 4.8 },
    // Chicken Salad Options
    { partnerName: "Uber Eats", mealName: "Grilled Chicken Caesar Salad", price: 950, currency: "KES", deliveryTime: "30-40 min", rating: 4.7 },
    { partnerName: "Nairobi Bites", mealName: "Kuku Salad Bowl", price: 850, currency: "KES", deliveryTime: "25-35 min", rating: 4.9, specialOffer: "10% Off" },
    { partnerName: "Glovo", mealName: "Healthy Chicken Greens", price: 900, currency: "KES", deliveryTime: "35-45 min", rating: 4.5 },
     // Salmon Options
    { partnerName: "Uber Eats", mealName: "Baked Salmon & Quinoa", price: 1400, currency: "KES", deliveryTime: "40-50 min", rating: 4.8 },
    { partnerName: "Nairobi Bites", mealName: "Mchuzi wa Samaki with Rice", price: 1250, currency: "KES", deliveryTime: "30-40 min", rating: 4.7 },
    { partnerName: "Glovo", mealName: "Salmon Fillet Dinner", price: 1450, currency: "KES", deliveryTime: "45-55 min", rating: 4.6 },
    // Pasta Options
    { partnerName: "Glovo", mealName: "Chicken & Tomato Pasta", price: 1100, currency: "KES", deliveryTime: "30-40 min", rating: 4.5 },
    { partnerName: "Uber Eats", mealName: "Whole-wheat Chicken Pasta", price: 1200, currency: "KES", deliveryTime: "25-35 min", rating: 4.7, specialOffer: "Buy 1 Get 1" },
    // Tofu Scramble Options
    { partnerName: "Uber Eats", mealName: "Spicy Tofu Scramble", price: 800, currency: "KES", deliveryTime: "25-35 min", rating: 4.5 },
    { partnerName: "Nairobi Bites", mealName: "Vegan Tofu Delight", price: 750, currency: "KES", deliveryTime: "30-40 min", rating: 4.8 },
];

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

let cachedPlans: Record<string, Record<string, NutritionPlan>> | null = null;

const getNutritionPlans = async (): Promise<Record<string, Record<string, NutritionPlan>>> => {
    if (cachedPlans) {
        return cachedPlans;
    }
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
    const sportPlans = plans[profile.sport as keyof typeof plans] || plans.default;
    const diet = profile.dietaryRestrictions.diet;
    
    // Default to 'None' if the specific diet plan doesn't exist for that sport
    const planForDiet = sportPlans[diet as keyof typeof sportPlans] || sportPlans['None'];

    return new Promise((resolve) => {
        setTimeout(() => {
            // Fallback to a top-level default plan if sport or diet plan is missing
            resolve(planForDiet || plans.default['None']);
        }, 3000);
    });
};

export const getDeliveryOptionsForMeal = async (mealName: string, area: string): Promise<MealDeliveryOption[]> => {
    // A small delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const lowerCaseArea = area.toLowerCase();
    
    const availablePartners = MOCK_DELIVERY_PARTNERS
        .filter(partner => 
            partner.area.includes('all') || 
            partner.area.some(a => lowerCaseArea.includes(a.toLowerCase()))
        )
        .map(p => p.name);

    const mealKeywords = mealName.toLowerCase().split(' ')[0]; // Use first word as keyword

    const options = MOCK_DELIVERY_OPTIONS.filter(option => {
        const partnerIsAvailable = availablePartners.includes(option.partnerName);
        const mealIsSimilar = option.mealName.toLowerCase().includes(mealKeywords);
        return partnerIsAvailable && mealIsSimilar;
    });

    return options;
};

let cachedEventRecommendations: EventRecommendations | null = null;

export const getEventRecommendations = async (): Promise<EventRecommendations> => {
    if (cachedEventRecommendations) {
        return cachedEventRecommendations;
    }
    const response = await fetch('/data/event-recommendations.json');
    if (!response.ok) {
        throw new Error('Failed to fetch event recommendations.');
    }
    const data = await response.json();
    cachedEventRecommendations = data;
    return data;
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

export const initiateMpesaPayment = async (phoneNumber: string, amount: number): Promise<{ success: boolean; message: string }> => {
  console.log(`Initiating M-PESA payment for ${phoneNumber} with amount ${amount}`);
  // IMPORTANT: Never expose API keys or secrets on the client-side.
  // This is a mock function to simulate the Daraja API STK Push.
  await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate network delay

  // In a real sandbox, you might check for specific test numbers
  if (phoneNumber.startsWith('254') && phoneNumber.length === 12) {
    return { success: true, message: "STK push sent successfully." };
  } else {
    return { success: false, message: "Invalid phone number for sandbox." };
  }
};
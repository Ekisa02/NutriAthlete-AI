
export enum SportType {
  SPRINTS = "Sprints (100m, 200m, 400m)",
  MIDDLE_DISTANCE = "Middle Distance (800m, 1500m)",
  LONG_DISTANCE = "Long Distance (3000m, 5000m, 10000m)",
  STEEPLECHASE = "Steeplechase (3000m barriers)",
  RELAYS = "Relays (4x100m, 4x400m)",
  HURDLES = "Hurdles (100m/110m, 400m)",
  MARATHON = "Marathon & Road Races",
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  geographicalArea: string;
  height: number; // in cm
  weight: number; // in kg
  sport: SportType;
  subscription: 'Basic' | 'Premium';
}

export interface Meal {
  name: string;
  description: string;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface DailyPlan {
  day: string;
  meals: {
    breakfast: Meal;
    midMorningSnack: Meal;
    lunch: Meal;
    afternoonSnack: Meal;
    dinner: Meal;
  };
  dailySummary: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  nutritionistTip: string;
}

export type NutritionPlan = DailyPlan[];

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface GroundingChunk {
    maps?: {
        uri: string;
        title: string;
    };
    web?: {
        uri: string;
        title: string;
    }
}

export interface EventRecommendationResponse {
    text: string;
    groundingChunks: GroundingChunk[];
}

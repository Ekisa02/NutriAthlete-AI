

export enum SportType {
  SPRINTS = "Sprints (100m, 200m, 400m)",
  MIDDLE_DISTANCE = "Middle Distance (800m, 1500m)",
  LONG_DISTANCE = "Long Distance (3000m, 5000m, 10000m)",
  STEEPLECHASE = "Steeplechase (3000m barriers)",
  RELAYS = "Relays (4x100m, 4x400m)",
  HURDLES = "Hurdles (100m/110m, 400m)",
  MARATHON = "Marathon & Road Races",
}

export interface DietaryRestrictions {
  diet: 'None' | 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Pescatarian' | 'Paleo' | 'Keto' | 'Low-Carb';
  allergies: string[];
  otherAllergy: string;
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
  dietaryRestrictions: DietaryRestrictions;
}

export interface Meal {
  name: string;
  description: string;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  ingredients?: string[];
  preparation?: string[];
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

export interface EventRecommendationItem {
  title: string;
  advice: string;
}

export interface EventRecommendationCategory {
  category: string;
  recommendations: EventRecommendationItem[];
}

export type EventRecommendations = EventRecommendationCategory[];

export interface DeliveryPartner {
  name: string;
  logoUrl: string; // URL to the logo image
  area: string[]; // Areas where this partner is available, e.g., ["all", "Eldoret, Kenya"]
}

export interface MealDeliveryOption {
  partnerName: string;
  mealName: string; // The name of the meal as listed by the partner
  price: number;
  currency: string;
  deliveryTime: string; // e.g., "25-35 min"
  rating: number; // e.g., 4.5
  specialOffer?: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
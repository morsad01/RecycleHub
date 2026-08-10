export interface AIProductInfo {
  productName: string;
  brand: string | null;
  model: string | null;
  category: string;
  subcategory: string | null;
  confidence: number;
}

export interface AIConditionResult {
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  conditionScore: number;
  imageQualityScore: number;
  confidence: number;
}

export interface AIPriceRecommendation {
  recommended: number;
  min: number;
  max: number;
  avgMarketPrice: number;
}

export interface AIFakeDetection {
  riskScore: number;
  confidence: number;
  reasons: string[];
}

export interface AIDescriptionResult {
  title: string;
  description: string;
  features: string[];
  keywords: string[];
  hashtags: string[];
}

import { supabase } from '../../../lib/supabase';
import type {
  AIProductInfo,
  AIConditionResult,
  AIPriceRecommendation,
  AIFakeDetection,
  AIDescriptionResult
} from '../types';

export class AIService {
  // Helper to log AI features to database
  private static async logUsage(featureName: string, confidence: number, wasAccepted = false) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('ai_logs').insert({
          user_id: user.id,
          feature_name: featureName,
          confidence_score: confidence,
          was_accepted: wasAccepted
        });
      }
    } catch {}
  }

  // AI Product Recognition & Category Suggestion
  static async recognizeProduct(title: string): Promise<AIProductInfo> {
    const cleanTitle = title.trim();
    let category = 'Electronics';
    let subcategory = 'Phones';
    let brand = null;
    let model = null;

    const lower = cleanTitle.toLowerCase();
    if (lower.includes('iphone') || lower.includes('samsung') || lower.includes('pixel') || lower.includes('phone')) {
      category = 'Electronics';
      subcategory = 'Phones';
      brand = lower.includes('iphone') ? 'Apple' : lower.includes('samsung') ? 'Samsung' : lower.includes('pixel') ? 'Google' : null;
      model = cleanTitle.match(/(iphone\s*\d+\s*(pro\s*max|pro|mini|plus)?|\d+s\s*ultra|pixel\s*\d+\s*pro)/i)?.[0] || null;
    } else if (lower.includes('laptop') || lower.includes('macbook') || lower.includes('dell') || lower.includes('hp')) {
      category = 'Electronics';
      subcategory = 'Laptops';
      brand = lower.includes('macbook') ? 'Apple' : lower.includes('dell') ? 'Dell' : lower.includes('hp') ? 'HP' : null;
      model = cleanTitle.match(/(macbook\s*(air|pro)|\d+\s*inch)/i)?.[0] || null;
    } else if (lower.includes('shirt') || lower.includes('pant') || lower.includes('jacket') || lower.includes('shoe')) {
      category = 'Fashion';
      subcategory = lower.includes('shoe') ? 'Shoes' : 'Clothing';
      brand = lower.includes('nike') ? 'Nike' : lower.includes('adidas') ? 'Adidas' : null;
    } else if (lower.includes('chair') || lower.includes('table') || lower.includes('sofa') || lower.includes('bed')) {
      category = 'Home & Living';
      subcategory = 'Furniture';
    } else if (lower.includes('book') || lower.includes('novel') || lower.includes('textbook')) {
      category = 'Books';
      subcategory = 'Education';
    }

    const confidence = 0.85 + Math.random() * 0.14;
    await this.logUsage('product_recognition', confidence, true);

    return {
      productName: cleanTitle,
      brand,
      model,
      category,
      subcategory,
      confidence
    };
  }

  // AI Condition & Image Quality Detector
  static async detectCondition(imageUrl: string): Promise<AIConditionResult> {
    // Basic mock logic based on url hash
    const scoreSeed = imageUrl.length % 5;
    const conditions: AIConditionResult['condition'][] = ['excellent', 'good', 'new', 'fair', 'poor'];
    const condition = conditions[scoreSeed];
    
    const conditionScore = 50 + (imageUrl.length % 45); // 50-95
    const imageQualityScore = 75 + (imageUrl.length % 25); // 75-99
    const confidence = 0.88 + (imageUrl.length % 11) / 100; // 0.88-0.99

    await this.logUsage('condition_detection', confidence, true);

    return {
      condition,
      conditionScore,
      imageQualityScore,
      confidence
    };
  }

  // AI Price Recommendation
  static async recommendPrice(category: string, brand: string | null, condition: string | null): Promise<AIPriceRecommendation> {
    let basePrice = 2500;
    if (category.toLowerCase() === 'electronics') {
      basePrice = brand ? (brand.toLowerCase() === 'apple' ? 45000 : 25000) : 15000;
    } else if (category.toLowerCase() === 'fashion') {
      basePrice = 2000;
    } else if (category.toLowerCase() === 'home & living') {
      basePrice = 8000;
    }

    // Multiply by condition
    let multiplier = 0.6;
    if (condition === 'new') multiplier = 0.95;
    else if (condition === 'excellent') multiplier = 0.85;
    else if (condition === 'good') multiplier = 0.70;
    else if (condition === 'fair') multiplier = 0.50;
    else if (condition === 'poor') multiplier = 0.30;

    const recommended = Math.round(basePrice * multiplier);
    const min = Math.round(recommended * 0.85);
    const max = Math.round(recommended * 1.15);
    const avgMarketPrice = Math.round(basePrice * 0.75);

    await this.logUsage('price_recommendation', 0.94, true);

    return {
      recommended,
      min,
      max,
      avgMarketPrice
    };
  }

  // AI Fake Listing & Risk detector
  static async detectRisk(title: string, description: string, price: number, brand: string | null): Promise<AIFakeDetection> {
    const text = `${title} ${description}`.toLowerCase();
    const reasons: string[] = [];
    let riskScore = 0.05;

    // Check suspicious price for premium brands
    if (brand && brand.toLowerCase() === 'apple' && price < 8000) {
      riskScore += 0.45;
      reasons.push('Price is significantly lower than average market value for premium brand Apple');
    }

    if (text.includes('replica') || text.includes('clone') || text.includes('copy') || text.includes('fake')) {
      riskScore += 0.6;
      reasons.push('Product description contains keywords suggesting counterfeit or copy');
    }

    if (text.includes('scam') || text.includes('suspicious')) {
      riskScore += 0.2;
      reasons.push('Text contains suspicious keywords');
    }

    riskScore = Math.min(0.99, riskScore);
    const confidence = 0.91;

    await this.logUsage('fake_detection', confidence, true);

    return {
      riskScore,
      confidence,
      reasons
    };
  }

  // AI Description Generator
  static async generateDescription(title: string, category: string, condition: string): Promise<AIDescriptionResult> {
    const cleanTitle = title.trim();
    const features: string[] = [
      'Stunning build quality with premium materials',
      'Extremely durable design built for second-life reuse',
      'Inspected and sanitized by RecycleHub verified standards'
    ];

    if (category.toLowerCase().includes('elect')) {
      features.push('Tested fully functional hardware & battery life');
      features.push('Unlocked and ready for any carrier network');
    } else if (category.toLowerCase().includes('fash')) {
      features.push('Premium fabrics with clean stitching');
      features.push('Sizing matches international retail guidelines');
    }

    const description = `This pre-loved ${cleanTitle} is in ${condition} condition. It has been thoroughly checked to ensure full usability. Perfect choice for eco-conscious buyers looking to grab quality goods at an affordable budget. Includes original elements or package where available.`;
    const keywords = [category.toLowerCase(), cleanTitle.toLowerCase().replace(/\s+/g, '-'), condition];
    const hashtags = [`#recycle`, `#resale`, `#ecoFriendly`, `#${category.replace(/\s+/g, '')}`];

    await this.logUsage('description_generation', 0.95, true);

    return {
      title: `${condition.toUpperCase()} | ${cleanTitle}`,
      description,
      features,
      keywords,
      hashtags
    };
  }

  // AI Chatbot Response
  static async askChatbot(message: string): Promise<string> {
    const lower = message.toLowerCase();
    await this.logUsage('chatbot_assistant', 0.98, true);

    if (lower.includes('return') || lower.includes('refund') || lower.includes('policy')) {
      return 'RecycleHub acts as a smart peer-to-peer resale platform. Return and refund policies depend on individual negotiations between the buyer and the seller. However, if you receive a counterfeit or fake product, you can report the listing immediately, and our admin team will review it for buyer protection.';
    }

    if (lower.includes('verify') || lower.includes('verification') || lower.includes('badge')) {
      return 'Sellers can get a Verified Seller badge by going to the Verification tab inside their Seller Central. You will need to upload your NID document, selfie, and optionally a Business License. Once approved, the badge is automatically added to your profile to build buyer trust.';
    }

    if (lower.includes('buy') || lower.includes('payment') || lower.includes('order')) {
      return 'To purchase an item, browse listings on our Marketplace page. Click on the listing card, then choose "Chat with Seller" to arrange delivery and confirm payment details. We recommend cash on delivery (COD) for optimal security.';
    }

    if (lower.includes('sell') || lower.includes('list') || lower.includes('add')) {
      return 'To sell an item, click on "Start Selling" in the top bar. You can upload photos of your item, and RecycleHub\'s AI will automatically suggest the category, condition estimates, and recommended price!';
    }

    return 'Hello! I am your RecycleHub Smart AI Assistant. I can guide you on buying and selling pre-loved items, verifying your seller account, resolving order disputes, or analyzing listing prices. What would you like to explore?';
  }
}

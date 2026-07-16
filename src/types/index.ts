export type UserRole = 'user' | 'admin' | 'super_admin';
export type LanguagePref = 'en' | 'bn';
export type ProductCondition = 'new' | 'excellent' | 'good' | 'fair' | 'poor';
export type ProductStatus = 'draft' | 'pending' | 'active' | 'sold' | 'rejected' | 'flagged';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_seller_verified: boolean;
  bio: string | null;
  address: string | null;
  city: string | null;
  rating_avg: number;
  rating_count: number;
  language_pref: LanguagePref;
  is_banned: boolean;
  cover_image_url: string | null;
  business_name: string | null;
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  business_hours: string | null;
  response_time: string;
  response_rate: string;
  total_sales: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  price: number;
  ai_suggested_price: number | null;
  condition: ProductCondition | null;
  ai_condition: string | null;
  ai_category_confidence: number | null;
  status: ProductStatus;
  risk_score: number;
  is_flagged: boolean;
  location: string | null;
  division?: string | null;
  district?: string | null;
  upazila?: string | null;
  area?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  views_count: number;
  brand: string | null;
  original_price: number | null;
  is_negotiable: boolean;
  stock_status: 'in_stock' | 'out_of_stock';
  stock_quantity: number;
  specifications: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductWithRelations extends Product {
  seller: Profile;
  category: Category | null;
  product_images: ProductImage[];
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string | null;
  last_message_at: string;
  created_at: string;
  buyer?: Profile;
  seller?: Profile;
  product?: Product;
  is_pinned_buyer?: boolean;
  is_pinned_seller?: boolean;
  is_archived_buyer?: boolean;
  is_archived_seller?: boolean;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  reply_to_message_id?: string | null;
  image_url?: string | null;
  is_deleted?: boolean;
  is_reported?: boolean;
  report_reason?: string | null;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  full_address: string;
  division?: string | null;
  district?: string | null;
  upazila?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  is_default: boolean;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  delivery_charge: number;
  delivery_address_id: string | null;
  delivery_method: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  buyer?: Profile;
  seller?: Profile;
  product?: Product;
  addresses?: Address;
}

export interface Review {
  id: string;
  order_id: string | null;
  reviewer_id: string;
  reviewee_id: string;
  product_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Profile;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_product_id: string | null;
  reason: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
  reporter?: Profile;
  reported_user?: Profile;
  reported_product?: Product;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SellerVerification {
  id: string;
  seller_id: string;
  nid_number: string | null;
  nid_image_url: string | null;
  business_info: string | null;
  status: VerificationStatus;
  reviewed_by: string | null;
  selfie_image_url: string | null;
  license_image_url: string | null;
  admin_feedback: string | null;
  created_at: string;
}

export interface ChatbotMessage {
  id: string;
  user_id: string | null;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface PlatformContent {
  key: string;
  content: string | null;
  updated_at: string;
}

// --- New Types for Bangladesh Production Marketplace ---

export interface Location {
  division: string | null;
  district: string | null;
  upazila: string | null;
  area: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type PlanType = 'free' | 'basic' | 'professional' | 'business' | 'enterprise';

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  price_monthly: number;
  price_yearly: number;
  max_products: number;
  featured_listings_count: number;
  has_analytics: boolean;
  has_priority_support: boolean;
  ai_usage_limit: number;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface FeaturedListing {
  id: string;
  product_id: string;
  user_id: string;
  type: 'homepage' | 'category' | 'search';
  status: 'active' | 'expired' | 'pending_payment';
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  reward_amount: number;
  usage_count: number;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: 'flash_sale' | 'seasonal' | 'discount';
  banner_image_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Advertisement {
  id: string;
  title: string;
  target_url: string;
  image_url: string;
  type: 'homepage_banner' | 'sidebar' | 'category_banner' | 'popup';
  position: number;
  status: 'active' | 'paused' | 'completed' | 'scheduled';
  start_date: string;
  end_date: string;
  budget: number | null;
  spend: number;
  impressions_limit: number | null;
  clicks_limit: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RevenueLog {
  id: string;
  type: 'commission' | 'subscription' | 'advertisement' | 'featured_listing' | 'payment_fee';
  amount: number;
  source_id: string | null;
  description: string | null;
  created_at: string;
}

export interface LoginHistory {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  location: string | null;
  status: 'success' | 'failed';
  created_at: string;
}

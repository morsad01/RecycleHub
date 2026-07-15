import { supabase } from './supabase';
import type {
  Profile, Product, ProductWithRelations, Conversation,
  Message, Order, Review, Report, Notification
} from '../types';

// ==========================================
// 1. PROFILES API
// ==========================================
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(userId: string, profile: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

// ==========================================
// 2. PRODUCTS API
// ==========================================
export interface ListProductsFilters {
  q?: string;
  categorySlug?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  sellerId?: string;
  limit?: number;
}

export async function listProducts(filters: ListProductsFilters): Promise<ProductWithRelations[]> {
  let query = supabase
    .from('products')
    .select('*, seller:profiles(*), category:categories(*), product_images(*)')
    .eq('status', 'active');

  if (filters.q) {
    query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
  }

  if (filters.categorySlug) {
    // First get the category id
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', filters.categorySlug)
      .maybeSingle();
    if (category) {
      query = query.eq('category_id', category.id);
    }
  }

  if (filters.minPrice) {
    query = query.gte('price', parseFloat(filters.minPrice));
  }
  if (filters.maxPrice) {
    query = query.lte('price', parseFloat(filters.maxPrice));
  }
  if (filters.condition) {
    query = query.eq('condition', filters.condition);
  }
  if (filters.sellerId) {
    query = query.eq('seller_id', filters.sellerId);
  }

  switch (filters.sort) {
    case 'priceLow':
      query = query.order('price', { ascending: true });
      break;
    case 'priceHigh':
      query = query.order('price', { ascending: false });
      break;
    case 'popular':
      query = query.order('views_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.limit(filters.limit ?? 24);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ProductWithRelations[];
}

export async function getProduct(productId: string): Promise<ProductWithRelations | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, seller:profiles(*), category:categories(*), product_images(*)')
    .eq('id', productId)
    .maybeSingle();
  if (error) throw error;
  return data as ProductWithRelations | null;
}

export async function createProduct(product: Partial<Product>, images: string[]): Promise<Product> {
  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (productError) throw productError;

  if (images.length > 0) {
    const { error: imageError } = await supabase
      .from('product_images')
      .insert(
        images.map((url, i) => ({
          product_id: newProduct.id,
          url,
          is_primary: i === 0,
          sort_order: i,
        }))
      );
    if (imageError) throw imageError;
  }

  return newProduct as Product;
}

export async function updateProduct(productId: string, product: Partial<Product>, images?: string[]): Promise<Product> {
  const { data: updatedProduct, error: productError } = await supabase
    .from('products')
    .update(product)
    .eq('id', productId)
    .select()
    .single();

  if (productError) throw productError;

  if (images !== undefined) {
    // Delete existing
    await supabase.from('product_images').delete().eq('product_id', productId);
    // Insert new
    if (images.length > 0) {
      const { error: imageError } = await supabase
        .from('product_images')
        .insert(
          images.map((url, i) => ({
            product_id: productId,
            url,
            is_primary: i === 0,
            sort_order: i,
          }))
        );
      if (imageError) throw imageError;
    }
  }

  return updatedProduct as Product;
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}

export async function incrementProductViews(productId: string): Promise<void> {
  await supabase.rpc('increment_product_views', { product_id: productId });
}

// ==========================================
// 3. WISHLIST API
// ==========================================
export async function getWishlist(userId: string): Promise<ProductWithRelations[]> {
  const { data, error } = await supabase
    .from('wishlists')
    .select('product:products(*, seller:profiles(*), category:categories(*), product_images(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((w: any) => w.product) as ProductWithRelations[];
}

export async function checkWishlist(userId: string, productId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function toggleWishlist(userId: string, productId: string, isWishlisted: boolean): Promise<void> {
  if (isWishlisted) {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('wishlists')
      .insert({ user_id: userId, product_id: productId });
    if (error) throw error;
  }
}

// ==========================================
// 4. CART API
// ==========================================
export async function getCart(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, product:products(*, seller:profiles(*), product_images(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addToCart(userId: string, productId: string, quantity = 1): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: userId, product_id: productId, quantity },
      { onConflict: 'user_id,product_id' }
    );
  if (error) throw error;
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId);
  if (error) throw error;
}

export async function removeFromCart(cartItemId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);
  if (error) throw error;
}

// ==========================================
// 5. ORDERS API
// ==========================================
export async function listOrders(userId: string, tab: 'buying' | 'selling'): Promise<Order[]> {
  const col = tab === 'buying' ? 'buyer_id' : 'seller_id';
  const { data, error } = await supabase
    .from('orders')
    .select('*, buyer:profiles!buyer_id(*), seller:profiles!seller_id(*), product:products(*)')
    .eq(col, userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function createOrder(order: Partial<Order>): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  if (error) throw error;
}

// ==========================================
// 6. MESSAGING API
// ==========================================
export async function listConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, buyer:profiles!buyer_id(*), seller:profiles!seller_id(*), product:products(*)')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Conversation[];
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();
  if (error) throw error;

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data as Message;
}

export async function getOrCreateConversation(buyerId: string, sellerId: string, productId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: newConvo, error } = await supabase
    .from('conversations')
    .insert({ buyer_id: buyerId, seller_id: sellerId, product_id: productId })
    .select('id')
    .single();

  if (error) throw error;
  return newConvo.id;
}

// ==========================================
// 7. REVIEWS API
// ==========================================
export async function listReviews(sellerId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles(*)')
    .eq('reviewee_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function createReview(review: Partial<Review>): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}

// ==========================================
// 8. REPORTS API
// ==========================================
export async function createReport(report: Partial<Report>): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .insert(report)
    .select()
    .single();
  if (error) throw error;
  return data as Report;
}

// ==========================================
// 9. NOTIFICATIONS API
// ==========================================
export async function listNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

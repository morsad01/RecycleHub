import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Heart, MapPin, Shield, Sparkles, MessageCircle, Flag, Eye,
  ChevronLeft, ChevronRight, Package, Share2, Copy, Facebook,
  Send, Twitter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Button, Badge, Avatar, StarRating, Modal, Textarea } from '../components/ui';
import { EmptyState } from '../components/ui/EmptyState';
import { ProductCard } from '../components/ProductCard';
import { formatPrice, formatDate, conditionColors, toDirectGoogleDriveUrl } from '../lib/utils';
import type { ProductWithRelations, Review } from '../types';
import { AiBuyerAssistant } from '../features/ai/components/AiBuyerAssistant';
import { SEO } from '../components/SEO';
import { VerifiedIdentityBadge } from '../components/trust/VerifiedIdentityBadge';
import { TrustScoreCard } from '../components/trust/TrustScoreCard';
import { DealScoreBadge } from '../components/trust/DealScoreBadge';
import { SafeMeetupModal } from '../components/chat/SafeMeetupModal';
import { MakeOfferModal } from '../components/chat/MakeOfferModal';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeImage, setActiveImage] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [showSafeMeetup, setShowSafeMeetup] = useState(false);
  const [showMakeOffer, setShowMakeOffer] = useState(false);

  // Review submission state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch product
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, seller:profiles(*), category:categories(*), product_images(*)')
        .eq('id', id!)
        .maybeSingle();
      return data as ProductWithRelations | null;
    },
    enabled: !!id,
  });

  // Track recently viewed products in LocalStorage
  useEffect(() => {
    if (id) {
      try {
        const history: string[] = JSON.parse(localStorage.getItem('recently_viewed') ?? '[]');
        const updated = [id, ...history.filter((x) => x !== id)].slice(0, 10);
        localStorage.setItem('recently_viewed', JSON.stringify(updated));
      } catch {}
    }
  }, [id]);

  // Log product view in database
  useQuery({
    queryKey: ['product-view-log', id],
    queryFn: async () => {
      await supabase.rpc('increment_product_views', { product_id: id }).then(() => {});
      // Create analytical view log entry
      supabase.from('product_views').insert({ product_id: id }).then();
      return null;
    },
    enabled: !!id && !!product,
    staleTime: Infinity,
  });

  // Check if item is in wishlist
  const { data: isWishlisted } = useQuery({
    queryKey: ['wishlist-check', id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id!)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  // Check if the current user is a verified buyer (has a delivered order for this product)
  const { data: isVerifiedBuyer } = useQuery({
    queryKey: ['verified-buyer-check', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return false;
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('product_id', id)
        .eq('status', 'delivered')
        .limit(1);
      return (data ?? []).length > 0;
    },
    enabled: !!user && !!id,
  });

  // Fetch reviews for the seller
  const { data: reviews } = useQuery({
    queryKey: ['product-reviews', product?.seller_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles(*)')
        .eq('reviewee_id', product!.seller_id)
        .order('created_at', { ascending: false })
        .limit(5);
      return (data ?? []) as Review[];
    },
    enabled: !!product?.seller_id,
  });

  // Fetch similar products (same category/brand, excluding current product)
  const { data: similarProducts } = useQuery({
    queryKey: ['similar-products', product?.category_id, product?.brand, id],
    queryFn: async () => {
      if (!product) return [];
      let query = supabase
        .from('products')
        .select('*, seller:profiles(*), category:categories(*), product_images(*)')
        .eq('status', 'active')
        .neq('id', product.id);

      if (product.brand) {
        query = query.or(`category_id.eq.${product.category_id},brand.eq.${product.brand}`);
      } else {
        query = query.eq('category_id', product.category_id);
      }

      const { data } = await query.limit(4);
      return (data ?? []) as ProductWithRelations[];
    },
    enabled: !!product,
  });

  // Toggle wishlist item
  const toggleWishlist = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isWishlisted) {
        await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', id!);
      } else {
        await supabase.from('wishlists').insert({ user_id: user.id, product_id: id! });
        // Increment analytical wishlist counters
        supabase.from('analytics').insert({ metric_name: 'wishlist_adds', metric_value: 1, dimension: id }).then();
      }
    },
    onMutate: () => {
      queryClient.setQueryData(['wishlist-check', id], !isWishlisted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const startChat = async () => {
    if (!user || !product) return;
    if (user.id === product.seller_id) {
      toast('You can\'t chat with yourself', 'info');
      return;
    }
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('seller_id', product.seller_id)
      .eq('product_id', product.id)
      .maybeSingle();

    let conversationId = existing?.id;
    if (!conversationId) {
      const { data: newConvo } = await supabase
        .from('conversations')
        .insert({ buyer_id: user.id, seller_id: product.seller_id, product_id: product.id })
        .select('id')
        .single();
      conversationId = newConvo?.id;
    }
    if (conversationId) navigate(`/messages/${conversationId}`);
  };

  const submitReport = async () => {
    if (!user || !reportReason.trim()) return;
    await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_product_id: id,
      reason: reportReason.trim(),
    });
    toast('Report submitted. Thank you!', 'success');
    setShowReport(false);
    setReportReason('');
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast('Link copied to clipboard!', 'success');
  };

  const handleReviewSubmit = async () => {
    if (!user || !product) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      reviewee_id: product.seller_id,
      product_id: product.id,
      rating,
      comment: reviewComment.trim(),
    });
    setSubmittingReview(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      toast('Review submitted successfully!', 'success');
      setShowReviewModal(false);
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['product-reviews', product.seller_id] });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-neutral-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-neutral-200 rounded w-3/4" />
              <div className="h-6 bg-neutral-200 rounded w-1/3" />
              <div className="h-32 bg-neutral-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <EmptyState icon={<Package size={48} />} title="Product not found" />
      </div>
    );
  }

  const images = product.product_images ?? [];
  const isOwner = user?.id === product.seller_id;
  const conditionKey = product.condition ? `condition.${product.condition}` : null;
  const isNegotiable = (product as any).is_negotiable;
  const originalPrice = (product as any).original_price;
  const brandName = (product as any).brand;
  
  let specifications: Record<string, string> = {};
  try {
    const specs = (product as any).specifications;
    if (specs) {
      specifications = typeof specs === 'string' ? JSON.parse(specs) : specs;
    }
  } catch {}

  const activeImageUrl = toDirectGoogleDriveUrl(images[activeImage]?.url);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <SEO
        title={product.title}
        description={product.description ?? `Buy ${product.title} on ResellBD. Condition: ${product.condition}. Price: ৳${product.price}.`}
        image={images[0]?.url ? toDirectGoogleDriveUrl(images[0]?.url) : undefined}
        canonical={`https://resellbd.app/products/${product.id}`}
        schema={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.title,
          "description": product.description ?? '',
          "image": images[0]?.url ? toDirectGoogleDriveUrl(images[0]?.url) : '',
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "BDT",
            "availability": product.stock_status === 'in_stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }}
      />
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
        <Link to="/" className="hover:text-primary-600">{t('nav.home')}</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">{t('nav.browse')}</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-primary-600">{product.category.name}</Link>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <div
            onClick={() => activeImageUrl && setZoomOpen(true)}
            className="relative aspect-square bg-neutral-100 rounded-2xl overflow-hidden mb-3 cursor-zoom-in group"
          >
            {activeImageUrl ? (
              <img src={activeImageUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                <Package size={48} />
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev + 1) % images.length);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${i === activeImage ? 'border-primary-500' : 'border-transparent'}`}
                >
                  <img src={toDirectGoogleDriveUrl(img.url)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {conditionKey && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${conditionColors[product.condition!] || 'bg-neutral-100 text-neutral-700'}`}>
                  {t(conditionKey as any)}
                </span>
              )}
              {isNegotiable && (
                <Badge variant="accent">Negotiable</Badge>
              )}
              {product.ai_category_confidence && (
                <Badge variant="success"><Sparkles size={10} /> {t('product.aiSuggested')}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">{product.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-500">
              {brandName && (
                <span className="font-semibold text-neutral-700">Brand: {brandName}</span>
              )}
              {product.location && (
                <span className="flex items-center gap-1"><MapPin size={14} /> {product.location}</span>
              )}
              <span className="flex items-center gap-1"><Eye size={14} /> {product.views_count} {t('product.views')}</span>
              <span>{t('product.postedOn')} {formatDate(product.created_at)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900">{formatPrice(product.price)}</span>
            {originalPrice && (
              <span className="text-sm text-neutral-500 line-through">
                Org: {formatPrice(originalPrice)}
              </span>
            )}
            <DealScoreBadge
              price={product.price}
              estimatedValue={product.ai_suggested_price || undefined}
              condition={product.condition}
              brand={brandName}
            />
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">{t('product.description')}</h3>
              <p className="text-sm text-neutral-600 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Specifications list */}
          {Object.keys(specifications).length > 0 && (
            <div className="border-t border-neutral-100 pt-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Specifications</h3>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-neutral-50 p-4 rounded-2xl">
                {Object.entries(specifications).map(([k, v]) => (
                  <div key={k} className="text-sm flex flex-col">
                    <span className="text-neutral-400 font-medium">{k}</span>
                    <span className="text-neutral-700 font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Advisor Panel */}
          <AiBuyerAssistant product={product} />

          {/* Seller Trust Profile & Verification Badges */}
          <div className="p-4 bg-white rounded-2xl shadow-card border border-neutral-100 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar src={product.seller?.avatar_url} name={product.seller?.full_name} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/products?seller=${product.seller_id}`} className="font-semibold text-neutral-900 hover:text-primary-600 truncate block">
                    {product.seller?.full_name}
                  </Link>
                  <VerifiedIdentityBadge
                    level="level_3"
                    isSellerVerified={product.seller?.is_seller_verified}
                    size="sm"
                  />
                </div>
                <p className="text-2xs text-neutral-400 mt-0.5">Member since {formatDate(product.seller?.created_at ?? '')}</p>
                <div className="mt-1">
                  <StarRating rating={product.seller?.rating_avg ?? 0} count={product.seller?.rating_count} size={13} />
                </div>
              </div>
            </div>

            <TrustScoreCard profile={product.seller} />
          </div>

          {/* Actions */}
          {!isOwner && (
            <div className="flex flex-wrap gap-2.5">
              {user ? (
                <Button onClick={startChat} size="lg" className="flex-1 min-w-[140px]">
                  <MessageCircle size={18} /> {t('product.chatWithSeller')}
                </Button>
              ) : (
                <Link to="/login" className="flex-1 min-w-[140px]">
                  <Button size="lg" className="w-full">
                    <MessageCircle size={18} /> {t('product.chatWithSeller')}
                  </Button>
                </Link>
              )}
              {product.is_negotiable && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowMakeOffer(true)}
                  className="px-3 text-xs font-semibold text-primary-700 border-primary-300 hover:bg-primary-50"
                  title="Submit a bargaining offer"
                >
                  <Tag size={16} className="mr-1 text-primary-600" /> Make Offer
                </Button>
              )}

              {user && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => toggleWishlist.mutate()}
                  className="px-3"
                >
                  <Heart size={18} className={isWishlisted ? 'fill-error-500 text-error-500' : ''} />
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={() => setShowShare(true)} className="px-3">
                <Share2 size={18} />
              </Button>
              {user && (
                <Button variant="ghost" size="lg" onClick={() => setShowReport(true)} className="px-3 text-neutral-400 hover:text-error-500">
                  <Flag size={18} />
                </Button>
              )}
            </div>
          )}

          {isOwner && (
            <div className="flex gap-3">
              <Link to={`/sell/${product.id}/edit`} className="flex-1">
                <Button variant="outline" size="lg" className="w-full">{t('common.edit')}</Button>
              </Link>
              <Link to="/my-listings" className="flex-1">
                <Button variant="ghost" size="lg" className="w-full">{t('nav.myListings')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Similar products block */}
      {similarProducts && similarProducts.length > 0 && (
        <div className="mt-16 border-t border-neutral-100 pt-10">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Similar Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews section */}
      <div className="mt-12 border-t border-neutral-100 pt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-900">{t('reviews.title')} ({product.seller?.rating_count ?? 0})</h2>
          {isVerifiedBuyer && (
            <Button size="sm" onClick={() => setShowReviewModal(true)}>
              Write a Review
            </Button>
          )}
        </div>
        {reviews && reviews.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-white rounded-2xl shadow-card border border-neutral-50">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar src={review.reviewer?.avatar_url} name={review.reviewer?.full_name} size={36} />
                  <div>
                    <p className="font-medium text-sm text-neutral-900">{review.reviewer?.full_name}</p>
                    <StarRating rating={review.rating} size={12} showCount={false} />
                  </div>
                </div>
                {review.comment && <p className="text-sm text-neutral-600 mt-1">{review.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">{t('reviews.noReviews')}</p>
        )}
      </div>

      {/* Fullscreen Zoom Modal */}
      {zoomOpen && activeImageUrl && (
        <div
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={activeImageUrl} alt="" className="max-w-full max-h-[90vh] rounded-xl object-contain animate-scale-in" />
        </div>
      )}

      {/* Share Modal */}
      <Modal open={showShare} onClose={() => setShowShare(false)} title="Share Product">
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">Share this pre-loved item with friends:</p>
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => {
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(window.location.href)}`, '_blank');
              }}
              className="flex flex-col items-center gap-1.5 p-2 hover:bg-neutral-50 rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-success-50 text-success-600 flex items-center justify-center">
                <Send size={18} />
              </div>
              <span className="text-xs text-neutral-600">WhatsApp</span>
            </button>
            <button
              onClick={() => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
              }}
              className="flex flex-col items-center gap-1.5 p-2 hover:bg-neutral-50 rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                <Facebook size={18} />
              </div>
              <span className="text-xs text-neutral-600">Facebook</span>
            </button>
            <button
              onClick={() => {
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank');
              }}
              className="flex flex-col items-center gap-1.5 p-2 hover:bg-neutral-50 rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <Twitter size={18} />
              </div>
              <span className="text-xs text-neutral-600">Twitter</span>
            </button>
            <button
              onClick={copyShareLink}
              className="flex flex-col items-center gap-1.5 p-2 hover:bg-neutral-50 rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center">
                <Copy size={18} />
              </div>
              <span className="text-xs text-neutral-600">Copy Link</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Report modal */}
      <Modal open={showReport} onClose={() => setShowReport(false)} title={t('product.reportListing')}>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Select a Reason</label>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">Choose reason...</option>
            <option value="spam">Spam</option>
            <option value="counterfeit">Counterfeit / Fake</option>
            <option value="illegal">Illegal Item</option>
            <option value="wrong_category">Wrong Category</option>
            <option value="inappropriate">Inappropriate Content</option>
            <option value="scam">Scam / Fraud</option>
            <option value="duplicate">Duplicate Listing</option>
          </select>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowReport(false)}>{t('common.cancel')}</Button>
            <Button onClick={submitReport} disabled={!reportReason}>{t('product.reportListing')}</Button>
          </div>
        </div>
      </Modal>

      {/* Review input modal */}
      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title="Write a Review">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('reviews.rating')}</label>
            <StarRating rating={rating} size={28} interactive showCount={false} onChange={setRating} />
          </div>
          <Textarea
            label={t('reviews.comment')}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={4}
            placeholder="Share your buying experience with this seller..."
            required
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowReviewModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleReviewSubmit} loading={submittingReview} disabled={!reviewComment.trim()}>
              Submit Review
            </Button>
          </div>
        </div>
      </Modal>

      {/* Make Offer Bargaining Modal */}
      <MakeOfferModal
        open={showMakeOffer}
        onClose={() => setShowMakeOffer(false)}
        product={product}
      />
    </div>
  );
}

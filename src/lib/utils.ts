import type { ProductCondition, ProductStatus, OrderStatus } from '../types';

export function formatPrice(price: number): string {
  return `৳${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export const conditionColors: Record<ProductCondition, string> = {
  new: 'bg-success-100 text-success-700',
  excellent: 'bg-primary-100 text-primary-700',
  good: 'bg-blue-100 text-blue-700',
  fair: 'bg-warning-100 text-warning-700',
  poor: 'bg-neutral-200 text-neutral-600',
};

export const statusColors: Record<ProductStatus, string> = {
  draft: 'bg-neutral-200 text-neutral-600',
  pending: 'bg-warning-100 text-warning-700',
  active: 'bg-success-100 text-success-700',
  sold: 'bg-blue-100 text-blue-700',
  rejected: 'bg-error-100 text-error-700',
  flagged: 'bg-error-100 text-error-700',
};

export const orderStatusColors: Record<OrderStatus, string> = {
  pending: 'bg-warning-100 text-warning-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-accent-100 text-accent-700',
  delivered: 'bg-success-100 text-success-700',
  cancelled: 'bg-error-100 text-error-700',
};

export const orderTimeline: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

export function getStockPhotoUrl(query: string, w = 800, h = 600): string {
  return `https://picsum.photos/seed/${encodeURIComponent(query)}/${w}/${h}`;
}

/**
 * Transforms any Google Drive view/open/share URL into a direct, embeddable image CDN URL.
 * Handles /file/d/{id}, id={id}, drive.google.com, etc.
 */
export function toDirectGoogleDriveUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.includes('googleusercontent.com') || url.includes('thumbnail?id=')) return url;

  // Extract file ID from /file/d/{id}/...
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
  }

  // Extract file ID from id={id} or open?id={id} or uc?id={id}
  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
  }

  return url;
}

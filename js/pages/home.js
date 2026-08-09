// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — HOME PAGE CONTROLLER
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from '../supabase-client.js';
import { auth } from '../auth.js';
import { UIEngine, formatPrice } from '../ui.js';
import { toDirectGoogleDriveUrl } from '../upload.js';

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  UIEngine.init();

  loadCategories();
  loadFeaturedProducts();
});

async function loadCategories() {
  const container = document.getElementById('categories-grid');
  if (!container) return;

  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
      .limit(8);

    if (error) throw error;

    if (!categories || categories.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1;text-align:center;color:var(--neutral-400);padding:2rem;">No categories found</div>`;
      return;
    }

    const icons = {
      'phones': '📱',
      'laptops': '💻',
      'electronics': '⚡',
      'fashion': '👕',
      'home': '🏠',
      'vehicles': '🚗',
      'sports': '⚽',
      'books': '📚'
    };

    container.innerHTML = categories.map((cat) => {
      const slugKey = Object.keys(icons).find((k) => cat.slug?.includes(k)) || 'electronics';
      const icon = icons[slugKey] || '📦';

      return `
        <a href="/products.html?category=${encodeURIComponent(cat.slug || cat.id)}" class="card card-hover" style="display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;background:#fff;text-decoration:none;">
          <div style="width:2.25rem;height:2.25rem;border-radius:0.75rem;background:var(--primary-50);display:flex;align-items:center;justify-content:center;font-size:1.125rem;flex-shrink:0;">
            ${icon}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:0.875rem;color:var(--neutral-900);" class="truncate">${cat.name}</div>
            <div style="font-size:0.6875rem;color:var(--neutral-400);">Verified Deals</div>
          </div>
        </a>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products-grid');
  if (!container) return;

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, product_images(*), seller:profiles(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;

    if (!products || products.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1;text-align:center;color:var(--neutral-500);padding:3rem;background:#fff;border-radius:1rem;border:1px solid var(--neutral-100);">
          <div style="font-size:2.5rem;margin-bottom:0.5rem;">🛍️</div>
          <div style="font-weight:700;font-size:1.125rem;">No active listings yet</div>
          <div style="font-size:0.875rem;color:var(--neutral-400);margin-top:0.25rem;">Be the first to list a pre-loved item for sale!</div>
          <a href="/sell.html" class="btn btn-primary btn-sm" style="margin-top:1rem;">+ Start Selling</a>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map((p) => {
      const primaryImg = p.product_images?.find((img) => img.is_primary) || p.product_images?.[0];
      const imgUrl = toDirectGoogleDriveUrl(primaryImg?.url) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';
      const isSellerVerified = p.seller?.is_seller_verified;

      return `
        <div class="product-card">
          <a href="/product-detail.html?id=${p.id}" class="product-card-img-wrap" style="display:block;">
            <img src="${imgUrl}" alt="${p.title}" class="product-card-img" loading="lazy" />
            <div style="position:absolute;top:0.75rem;left:0.75rem;display:flex;flex-direction:column;gap:0.375rem;">
              ${p.condition ? `<span class="badge badge-primary">${p.condition.toUpperCase()}</span>` : ''}
              ${isSellerVerified ? `<span class="badge badge-success">ID Verified ✓</span>` : ''}
            </div>
          </a>

          <div class="product-card-body">
            <a href="/product-detail.html?id=${p.id}" style="font-weight:700;font-size:0.9375rem;color:var(--neutral-900);line-height:1.3;margin-bottom:0.375rem;" class="truncate">
              ${p.title}
            </a>

            <div style="font-size:0.75rem;color:var(--neutral-400);margin-bottom:0.75rem;display:flex;align-items:center;gap:0.375rem;">
              <span>📍 ${p.location || 'Dhaka, Bangladesh'}</span>
            </div>

            <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:0.75rem;border-top:1px solid var(--neutral-100);">
              <div class="product-price">${formatPrice(p.price)}</div>
              <a href="/product-detail.html?id=${p.id}" class="btn btn-outline btn-sm" style="padding:0.375rem 0.625rem;">View</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading featured products:', err);
  }
}

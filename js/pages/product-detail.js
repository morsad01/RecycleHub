// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — PRODUCT DETAILS CONTROLLER
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from '../supabase-client.js';
import { auth } from '../auth.js';
import { UIEngine, formatPrice } from '../ui.js';
import { toDirectGoogleDriveUrl } from '../upload.js';
import { toast } from '../toast.js';

let currentProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  UIEngine.init();

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    window.location.href = '/products.html';
    return;
  }

  await loadProduct(productId);
});

async function loadProduct(id) {
  const loadingEl = document.getElementById('product-loading');
  const containerEl = document.getElementById('product-container');

  try {
    const { data: p, error } = await supabase
      .from('products')
      .select('*, product_images(*), seller:profiles(*), category:categories(*)')
      .eq('id', id)
      .single();

    if (error || !p) throw (error || new Error('Product not found'));

    currentProduct = p;

    // Increment view count
    try {
      await supabase.from('products').update({ views_count: (p.views_count || 0) + 1 }).eq('id', id);
    } catch {}

    // Render Data
    document.title = `${p.title} — ResellBD`;
    document.getElementById('product-title').textContent = p.title;
    document.getElementById('product-price').textContent = formatPrice(p.price);
    document.getElementById('product-location').textContent = `📍 ${p.location || 'Dhaka, Bangladesh'}`;
    document.getElementById('product-views').textContent = `👁️ ${(p.views_count || 0) + 1} views`;
    document.getElementById('product-desc').textContent = p.description || 'No description provided.';

    document.getElementById('category-badge').textContent = p.category?.name || 'Electronics';
    document.getElementById('condition-badge').textContent = (p.condition || 'Good').toUpperCase();

    // Seller Info
    const seller = p.seller;
    const sName = seller?.full_name || 'Verified Seller';
    document.getElementById('seller-name').textContent = sName;
    document.getElementById('seller-avatar').textContent = sName.charAt(0).toUpperCase();

    // Images
    const images = p.product_images || [];
    const mainImg = document.getElementById('main-product-img');
    const firstUrl = toDirectGoogleDriveUrl(images[0]?.url) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
    mainImg.src = firstUrl;

    const thumbList = document.getElementById('thumbnails-list');
    if (images.length > 1) {
      thumbList.innerHTML = images.map((img, idx) => {
        const cdnUrl = toDirectGoogleDriveUrl(img.url);
        return `
          <button type="button" style="width:4.5rem;height:4.5rem;border-radius:0.75rem;overflow:hidden;border:2px solid ${idx === 0 ? 'var(--primary-500)' : 'var(--neutral-200)'};background:#fff;cursor:pointer;flex-shrink:0;padding:0;" class="thumb-btn" data-url="${cdnUrl}">
            <img src="${cdnUrl}" style="width:100%;height:100%;object-fit:cover;" />
          </button>
        `;
      }).join('');

      thumbList.querySelectorAll('.thumb-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          mainImg.src = btn.getAttribute('data-url');
          thumbList.querySelectorAll('.thumb-btn').forEach((b) => b.style.borderColor = 'var(--neutral-200)');
          btn.style.borderColor = 'var(--primary-500)';
        });
      });
    }

    // Add to cart action
    document.getElementById('add-to-cart-btn')?.addEventListener('click', async () => {
      if (!auth.requireAuth()) return;
      try {
        await supabase.from('cart_items').upsert({
          user_id: auth.user.id,
          product_id: currentProduct.id,
          quantity: 1
        });
        toast.success('Added to your cart!');
      } catch (err) {
        toast.error('Could not add to cart');
      }
    });

    // Buy Now
    document.getElementById('buy-now-btn')?.addEventListener('click', async () => {
      if (!auth.requireAuth()) return;
      window.location.href = `/checkout.html?product_id=${currentProduct.id}`;
    });

    // Chat
    document.getElementById('chat-seller-btn')?.addEventListener('click', async () => {
      if (!auth.requireAuth()) return;
      window.location.href = `/messages.html?seller_id=${currentProduct.seller_id}&product_id=${currentProduct.id}`;
    });

    loadingEl.style.display = 'none';
    containerEl.style.display = 'block';
  } catch (err) {
    console.error('Error loading product detail:', err);
    loadingEl.innerHTML = `
      <div style="color:var(--error-500);font-weight:700;margin-bottom:1rem;">Product not found or has been removed.</div>
      <a href="/products.html" class="btn btn-outline btn-sm">Back to Marketplace</a>
    `;
  }
}

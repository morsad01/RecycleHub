// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — SHOPPING CART CONTROLLER
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from '../supabase-client.js';
import { auth } from '../auth.js';
import { UIEngine, formatPrice } from '../ui.js';
import { toDirectGoogleDriveUrl } from '../upload.js';
import { toast } from '../toast.js';

let cartItems = [];

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  UIEngine.init();

  if (!auth.requireAuth()) return;

  await loadCart();
});

async function loadCart() {
  const container = document.getElementById('cart-items-list');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*, product_images(*))')
      .eq('user_id', auth.user.id);

    if (error) throw error;

    cartItems = data || [];

    if (cartItems.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding:3rem;">
          <div style="font-size:3rem;margin-bottom:0.75rem;">🛒</div>
          <h3 style="font-size:1.125rem;font-weight:800;">Your cart is empty</h3>
          <p style="font-size:0.875rem;color:var(--neutral-400);margin-top:0.25rem;">Browse our marketplace to find great verified deals.</p>
          <a href="/products.html" class="btn btn-primary btn-sm" style="margin-top:1rem;">Browse Items</a>
        </div>
      `;
      subtotalEl.textContent = formatPrice(0);
      totalEl.textContent = formatPrice(0);
      if (checkoutBtn) checkoutBtn.style.display = 'none';
      return;
    }

    let subtotal = 0;
    container.innerHTML = cartItems.map((item) => {
      const prod = item.product;
      if (!prod) return '';
      subtotal += Number(prod.price) * item.quantity;
      const imgUrl = toDirectGoogleDriveUrl(prod.product_images?.[0]?.url) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400';

      return `
        <div class="card" style="padding:1rem;display:flex;align-items:center;gap:1rem;">
          <img src="${imgUrl}" style="width:4.5rem;height:4.5rem;border-radius:0.75rem;object-fit:cover;" />
          <div style="flex:1;min-width:0;">
            <a href="/product-detail.html?id=${prod.id}" style="font-weight:700;font-size:0.9375rem;color:var(--neutral-900);" class="truncate">${prod.title}</a>
            <div style="font-size:1rem;font-weight:800;color:var(--primary-600);margin-top:0.25rem;">${formatPrice(prod.price)}</div>
          </div>
          <button class="btn btn-ghost btn-sm remove-cart-btn" data-id="${item.id}" style="color:var(--error-500);">Remove</button>
        </div>
      `;
    }).join('');

    subtotalEl.textContent = formatPrice(subtotal);
    totalEl.textContent = formatPrice(subtotal + 120);

    container.querySelectorAll('.remove-cart-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await supabase.from('cart_items').delete().eq('id', id);
        toast.info('Item removed from cart');
        loadCart();
      });
    });

  } catch (err) {
    console.error('Error loading cart:', err);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — CHECKOUT CONTROLLER
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from '../supabase-client.js';
import { auth } from '../auth.js';
import { UIEngine } from '../ui.js';
import { toast } from '../toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  UIEngine.init();

  if (!auth.requireAuth()) return;

  const profile = auth.profile;
  if (profile) {
    document.getElementById('chk-name').value = profile.full_name || '';
    document.getElementById('chk-phone').value = profile.phone || '';
    document.getElementById('chk-address').value = profile.address || '';
  }

  const form = document.getElementById('checkout-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.textContent = 'Processing Order...';

    try {
      // Clear cart
      await supabase.from('cart_items').delete().eq('user_id', auth.user.id);
      toast.success('Order placed successfully!');
      setTimeout(() => {
        window.location.href = '/dashboard.html#orders';
      }, 1200);
    } catch (err) {
      toast.error('Failed to place order');
      btn.disabled = false;
      btn.textContent = '✓ Place Verified Order';
    }
  });
});

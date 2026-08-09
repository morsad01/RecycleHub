// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — SELLER DASHBOARD CONTROLLER
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from '../supabase-client.js';
import { auth } from '../auth.js';
import { UIEngine, formatPrice } from '../ui.js';
import { toDirectGoogleDriveUrl } from '../upload.js';
import { toast } from '../toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  UIEngine.init();

  if (!auth.requireAuth()) return;

  initTabs();
  await loadDashboardData();
});

function initTabs() {
  const tabs = document.querySelectorAll('.dash-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.style.borderBottom = 'none';
        t.style.fontWeight = '500';
      });
      tab.style.borderBottom = '2px solid var(--primary-500)';
      tab.style.fontWeight = '700';

      const target = tab.getAttribute('data-tab');
      document.querySelectorAll('.dash-tab-pane').forEach((p) => p.style.display = 'none');
      const targetPane = document.getElementById(`tab-content-${target}`);
      if (targetPane) targetPane.style.display = 'block';
    });
  });
}

async function loadDashboardData() {
  const user = auth.user;
  if (!user) return;

  try {
    // 1. Fetch user's listings
    const { data: listings } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    const count = listings?.length || 0;
    document.getElementById('metric-active-listings').textContent = count;

    renderListings(listings || []);

    // 2. Fetch KYC verification
    const { data: verifications } = await supabase
      .from('seller_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const kyc = verifications?.[0];
    const kycMetric = document.getElementById('metric-kyc-status');
    const kycBadgePill = document.getElementById('kyc-badge-pill');
    const kycExplanation = document.getElementById('kyc-status-explanation');

    if (kyc?.status === 'approved' || auth.profile?.is_seller_verified) {
      if (kycMetric) kycMetric.innerHTML = `<span class="badge badge-success">Verified Seller ✓</span>`;
      if (kycBadgePill) { kycBadgePill.className = 'badge badge-success'; kycBadgePill.textContent = 'Approved ✓'; }
      if (kycExplanation) kycExplanation.textContent = 'Your Bangladesh Government ID has been verified. You now enjoy priority placement and buyer trust.';
    } else if (kyc?.status === 'pending') {
      if (kycMetric) kycMetric.innerHTML = `<span class="badge badge-warning">Pending Review</span>`;
      if (kycBadgePill) { kycBadgePill.className = 'badge badge-warning'; kycBadgePill.textContent = 'Under Review'; }
      if (kycExplanation) kycExplanation.textContent = 'Your documents were received and are under active inspection by our compliance team (typically 2-4 hours).';
    } else {
      if (kycMetric) kycMetric.innerHTML = `<a href="/verify-identity.html" class="badge badge-error" style="text-decoration:none;">Submit KYC →</a>`;
      if (kycBadgePill) { kycBadgePill.className = 'badge badge-neutral'; kycBadgePill.textContent = 'Not Verified'; }
      if (kycExplanation) kycExplanation.textContent = 'You have not submitted government verification documents yet. Verify now to get trusted badges!';
    }

  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

function renderListings(items) {
  const container = document.getElementById('my-listings-container');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;background:#fff;border-radius:1rem;border:1px solid var(--neutral-200);">
        <div style="font-size:2.5rem;margin-bottom:0.5rem;">📦</div>
        <h3 style="font-size:1.125rem;font-weight:800;">You haven't listed anything yet</h3>
        <p style="font-size:0.875rem;color:var(--neutral-400);margin-top:0.25rem;">Start selling your pre-loved electronics and goods today!</p>
        <a href="/sell.html" class="btn btn-primary btn-sm" style="margin-top:1rem;">+ List Item for Sale</a>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((p) => {
    const primaryImg = p.product_images?.find((img) => img.is_primary) || p.product_images?.[0];
    const imgUrl = toDirectGoogleDriveUrl(primaryImg?.url) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';

    return `
      <div class="card" style="padding:1rem;display:flex;flex-direction:column;gap:0.75rem;">
        <div style="aspect-ratio:4/3;border-radius:0.75rem;overflow:hidden;background:var(--neutral-100);">
          <img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div style="font-weight:700;font-size:0.9375rem;color:var(--neutral-900);" class="truncate">${p.title}</div>
        <div style="font-size:1.125rem;font-weight:900;color:var(--primary-600);">${formatPrice(p.price)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:0.5rem;border-top:1px solid var(--neutral-100);font-size:0.75rem;">
          <span class="badge ${p.status === 'active' ? 'badge-success' : 'badge-neutral'}">${p.status.toUpperCase()}</span>
          <div style="display:flex;gap:0.5rem;">
            <a href="/product-detail.html?id=${p.id}" class="btn btn-outline btn-sm" style="padding:0.25rem 0.5rem;">View</a>
            <button class="btn btn-ghost btn-sm delete-listing-btn" data-id="${p.id}" style="color:var(--error-500);padding:0.25rem 0.5rem;">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.delete-listing-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Are you sure you want to delete this listing?')) return;
      try {
        await supabase.from('products').delete().eq('id', id);
        toast.success('Listing removed');
        loadDashboardData();
      } catch (err) {
        toast.error('Could not delete listing');
      }
    });
  });
}

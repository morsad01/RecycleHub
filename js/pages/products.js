// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — PRODUCTS MARKETPLACE CONTROLLER
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from '../supabase-client.js';
import { auth } from '../auth.js';
import { UIEngine, formatPrice } from '../ui.js';
import { toDirectGoogleDriveUrl } from '../upload.js';

let allProducts = [];
let categoriesList = [];

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  UIEngine.init();

  // Read URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get('q') || '';
  const initialCategory = urlParams.get('category') || '';

  const searchInput = document.getElementById('search-input');
  if (searchInput && initialSearch) {
    searchInput.value = initialSearch;
  }

  await loadCategories(initialCategory);
  await fetchProducts();

  // Event Listeners
  searchInput?.addEventListener('input', () => filterAndRender());
  document.getElementById('sort-select')?.addEventListener('change', () => filterAndRender());
  document.getElementById('apply-filters-btn')?.addEventListener('click', () => filterAndRender());
  document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    const maxPrice = document.getElementById('max-price-input');
    if (maxPrice) maxPrice.value = '';
    document.querySelectorAll('input[name="category"]').forEach((r, i) => { r.checked = i === 0; });
    document.querySelectorAll('input[name="condition"]').forEach((c) => { c.checked = false; });
    filterAndRender();
  });
});

async function loadCategories(selectedCategory = '') {
  const container = document.getElementById('filter-categories');
  if (!container) return;

  try {
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('sort_order', { ascending: true });

    categoriesList = categories || [];

    const categoryHtml = categoriesList.map((cat) => {
      const isChecked = selectedCategory === cat.slug || selectedCategory === cat.id;
      return `
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
          <input type="radio" name="category" value="${cat.id}" ${isChecked ? 'checked' : ''} />
          <span>${cat.name}</span>
        </label>
      `;
    }).join('');

    container.innerHTML = `
      <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
        <input type="radio" name="category" value="" ${!selectedCategory ? 'checked' : ''} />
        <span>All Categories</span>
      </label>
      ${categoryHtml}
    `;

    // Listen to category radio changes
    container.querySelectorAll('input[name="category"]').forEach((radio) => {
      radio.addEventListener('change', () => filterAndRender());
    });
  } catch (err) {
    console.error('Error loading filter categories:', err);
  }
}

async function fetchProducts() {
  const grid = document.getElementById('marketplace-grid');
  if (!grid) return;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), seller:profiles(*), category:categories(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allProducts = data || [];
    filterAndRender();
  } catch (err) {
    console.error('Error fetching marketplace products:', err);
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--error-500);padding:2rem;">Failed to load marketplace products.</div>`;
  }
}

function filterAndRender() {
  const grid = document.getElementById('marketplace-grid');
  const countEl = document.getElementById('products-count');
  if (!grid) return;

  const searchVal = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
  const selectedCategory = document.querySelector('input[name="category"]:checked')?.value || '';
  const selectedConditions = Array.from(document.querySelectorAll('input[name="condition"]:checked')).map((c) => c.value);
  const maxPriceVal = Number(document.getElementById('max-price-input')?.value) || 0;
  const sortVal = document.getElementById('sort-select')?.value || 'newest';

  let filtered = allProducts.filter((p) => {
    // Search match
    if (searchVal) {
      const matchTitle = p.title?.toLowerCase().includes(searchVal);
      const matchDesc = p.description?.toLowerCase().includes(searchVal);
      const matchBrand = p.brand?.toLowerCase().includes(searchVal);
      if (!matchTitle && !matchDesc && !matchBrand) return false;
    }

    // Category match
    if (selectedCategory) {
      if (p.category_id !== selectedCategory && p.category?.parent_id !== selectedCategory) {
        return false;
      }
    }

    // Condition match
    if (selectedConditions.length > 0) {
      if (!selectedConditions.includes(p.condition)) return false;
    }

    // Max price match
    if (maxPriceVal > 0) {
      if (p.price > maxPriceVal) return false;
    }

    return true;
  });

  // Sort
  if (sortVal === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortVal === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} verified listings`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1;text-align:center;padding:4rem 2rem;background:#fff;border-radius:1.5rem;border:1px solid var(--neutral-100);">
        <div style="font-size:3rem;margin-bottom:0.75rem;">🔍</div>
        <h3 style="font-size:1.125rem;font-weight:800;color:var(--neutral-900);">No listings found</h3>
        <p style="font-size:0.875rem;color:var(--neutral-500);margin-top:0.25rem;">Try relaxing your search terms or filters.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((p) => {
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
}

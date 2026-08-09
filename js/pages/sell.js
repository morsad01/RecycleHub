// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — SELL NEW ITEM CONTROLLER
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from '../supabase-client.js';
import { auth } from '../auth.js';
import { UIEngine, formatPrice } from '../ui.js';
import { uploadToGoogleDrive, toDirectGoogleDriveUrl } from '../upload.js';
import { AIEngine } from '../ai-engine.js';
import { toast } from '../toast.js';

let uploadedImages = []; // { file, previewUrl, cloudUrl, isUploading }
let currentStep = 1;
let categoriesList = [];

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  UIEngine.init();

  if (!auth.requireAuth()) return;

  await loadCategories();
  initStep1();
  initStep2();
  initStep3();
});

async function loadCategories() {
  try {
    const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    categoriesList = data || [];
    const selectEl = document.getElementById('category-select');
    if (selectEl) {
      selectEl.innerHTML = `
        <option value="">Select Category</option>
        ${categoriesList.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
      `;
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

function setStep(step) {
  currentStep = step;
  document.getElementById('step-content-1').style.display = step === 1 ? 'block' : 'none';
  document.getElementById('step-content-2').style.display = step === 2 ? 'block' : 'none';
  document.getElementById('step-content-3').style.display = step === 3 ? 'block' : 'none';

  // Update Stepper UI
  for (let i = 1; i <= 3; i++) {
    const circle = document.getElementById(`step-circle-${i}`);
    if (i < step) {
      circle.className = 'stepper-circle completed';
      circle.textContent = '✓';
    } else if (i === step) {
      circle.className = 'stepper-circle active';
      circle.textContent = i;
    } else {
      circle.className = 'stepper-circle pending';
      circle.textContent = i;
    }

    if (i < 3) {
      const line = document.getElementById(`step-line-${i}`);
      if (line) line.className = i < step ? 'stepper-line active' : 'stepper-line';
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Step 1: Photos & Upload ──────────────────────────────────────────────────
function initStep1() {
  const dropzone = document.getElementById('sell-dropzone');
  const fileInput = document.getElementById('file-input');
  const nextBtn = document.getElementById('step-1-next-btn');

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-active');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-active');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-active');
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files) handleFiles(fileInput.files);
  });

  nextBtn.addEventListener('click', () => setStep(2));
}

async function handleFiles(files) {
  const newItems = Array.from(files).map((file) => ({
    file,
    previewUrl: URL.createObjectURL(file),
    cloudUrl: null,
    isUploading: true,
  }));

  uploadedImages.push(...newItems);
  renderImagePreviews();

  // Upload in background to Google Drive
  for (const item of newItems) {
    try {
      const cdnUrl = await uploadToGoogleDrive(item.file);
      item.cloudUrl = cdnUrl;
      item.isUploading = false;
      toast.success('Photo uploaded to cloud!');
    } catch (err) {
      item.isUploading = false;
      item.cloudUrl = item.previewUrl; // Fallback to local
      toast.warning('Photo attached (local preview).');
    }
    renderImagePreviews();
  }
}

function renderImagePreviews() {
  const grid = document.getElementById('images-preview-grid');
  const nextBtn = document.getElementById('step-1-next-btn');
  if (!grid) return;

  grid.innerHTML = uploadedImages.map((img, idx) => `
    <div style="position:relative;aspect-ratio:1;border-radius:0.75rem;overflow:hidden;border:2px solid ${idx === 0 ? 'var(--primary-500)' : 'var(--neutral-200)'};background:#fff;">
      <img src="${img.cloudUrl || img.previewUrl}" style="width:100%;height:100%;object-fit:cover;" />
      ${idx === 0 ? `<span style="position:absolute;top:4px;left:4px;background:var(--primary-500);color:#fff;font-size:0.625rem;font-weight:700;padding:2px 6px;border-radius:4px;">Cover</span>` : ''}
      ${img.isUploading ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;">Uploading...</div>` : ''}
      <button type="button" class="remove-img-btn" data-index="${idx}" style="position:absolute;top:4px;right:4px;width:1.25rem;height:1.25rem;border-radius:9999px;background:rgba(0,0,0,0.6);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.75rem;">✕</button>
    </div>
  `).join('');

  grid.querySelectorAll('.remove-img-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.getAttribute('data-index'));
      uploadedImages.splice(idx, 1);
      renderImagePreviews();
    });
  });

  if (nextBtn) {
    nextBtn.disabled = uploadedImages.length === 0;
  }
}

// ── Step 2: Details & AI Generators ──────────────────────────────────────────
function initStep2() {
  const form = document.getElementById('details-form');
  const aiDescBtn = document.getElementById('ai-desc-btn');
  const aiPricingBtn = document.getElementById('ai-pricing-btn');
  const matrixBox = document.getElementById('ai-price-matrix');
  const priceInput = document.getElementById('price-input');
  const backBtn = document.getElementById('step-2-back-btn');

  backBtn.addEventListener('click', () => setStep(1));

  // AI Description Generator
  aiDescBtn.addEventListener('click', () => {
    const title = document.getElementById('title-input').value.trim();
    const catId = document.getElementById('category-select').value;
    const cond = document.getElementById('condition-select').value;

    if (!title) {
      toast.warning('Please enter a product title first!');
      return;
    }

    const catName = categoriesList.find((c) => c.id === catId)?.name || 'Electronics';
    const aiResult = AIEngine.generateDescription(title, catName, cond);

    document.getElementById('desc-input').value = aiResult.description;
    toast.success('Smart AI Description generated!');
  });

  // AI Price Suggestion
  aiPricingBtn.addEventListener('click', () => {
    const title = document.getElementById('title-input').value.trim();
    const catId = document.getElementById('category-select').value;
    const cond = document.getElementById('condition-select').value;

    const catName = categoriesList.find((c) => c.id === catId)?.name || 'Electronics';
    const matrix = AIEngine.getPriceMatrix(catName, title, cond);

    document.getElementById('val-quick-sale').textContent = formatPrice(matrix.quickSalePrice);
    document.getElementById('val-recommended').textContent = formatPrice(matrix.recommendedPrice);
    document.getElementById('val-max-target').textContent = formatPrice(matrix.maxTargetPrice);

    matrixBox.style.display = 'block';

    document.getElementById('btn-quick-sale').onclick = () => { priceInput.value = matrix.quickSalePrice; };
    document.getElementById('btn-recommended').onclick = () => { priceInput.value = matrix.recommendedPrice; };
    document.getElementById('btn-max-target').onclick = () => { priceInput.value = matrix.maxTargetPrice; };

    toast.success('AI Price Matrix calculated!');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    populateReview();
    setStep(3);
  });
}

function populateReview() {
  const title = document.getElementById('title-input').value.trim();
  const price = document.getElementById('price-input').value;
  const location = document.getElementById('location-input').value;
  const catId = document.getElementById('category-select').value;
  const catName = categoriesList.find((c) => c.id === catId)?.name || 'General';

  document.getElementById('review-title').textContent = title;
  document.getElementById('review-price').textContent = formatPrice(price);
  document.getElementById('review-meta').textContent = `${catName} · ${location}`;

  const coverImg = uploadedImages[0]?.cloudUrl || uploadedImages[0]?.previewUrl;
  if (coverImg) {
    document.getElementById('review-cover-img').src = coverImg;
  }
}

// ── Step 3: Publish ──────────────────────────────────────────────────────────
function initStep3() {
  const backBtn = document.getElementById('step-3-back-btn');
  const publishBtn = document.getElementById('publish-listing-btn');

  backBtn.addEventListener('click', () => setStep(2));

  publishBtn.addEventListener('click', async () => {
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publishing...';

    try {
      const title = document.getElementById('title-input').value.trim();
      const description = document.getElementById('desc-input').value.trim();
      const category_id = document.getElementById('category-select').value;
      const condition = document.getElementById('condition-select').value;
      const price = Number(document.getElementById('price-input').value);
      const location = document.getElementById('location-input').value;

      // 1. Insert product
      const { data: newProd, error: prodErr } = await supabase
        .from('products')
        .insert({
          seller_id: auth.user.id,
          title,
          description,
          category_id,
          condition,
          price,
          location,
          status: 'active'
        })
        .select()
        .single();

      if (prodErr) throw prodErr;

      // 2. Insert images
      const imageInserts = uploadedImages.map((img, idx) => ({
        product_id: newProd.id,
        url: img.cloudUrl || img.previewUrl,
        is_primary: idx === 0,
        sort_order: idx
      }));

      await supabase.from('product_images').insert(imageInserts);

      toast.success('Your listing is live on ResellBD! 🎉');
      setTimeout(() => {
        window.location.href = `/product-detail.html?id=${newProd.id}`;
      }, 1200);

    } catch (err) {
      console.error('Publish error:', err);
      toast.error('Failed to publish listing: ' + (err.message || 'Error'));
      publishBtn.disabled = false;
      publishBtn.textContent = '🚀 Publish Listing Now';
    }
  });
}

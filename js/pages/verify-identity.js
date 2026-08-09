// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — BANGLADESH IDENTITY VERIFICATION (KYC) CONTROLLER
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from '../supabase-client.js';
import { auth } from '../auth.js';
import { UIEngine } from '../ui.js';
import { i18n } from '../i18n.js';
import { uploadToGoogleDrive } from '../upload.js';
import { toast } from '../toast.js';

let selectedDocType = 'nid';
let frontFile = null;
let frontUrl = null;
let backFile = null;
let backUrl = null;
let selfieFile = null;
let selfieUrl = null;
let currentStep = 1;

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  UIEngine.init();

  if (!auth.requireAuth()) return;

  initDocSelection();
  initUploads();
  initStepNavigation();
});

function setKycStep(step) {
  currentStep = step;
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`kyc-step-${i}`);
    if (el) el.style.display = i === step ? 'block' : 'none';

    const circle = document.getElementById(`kyc-step-circle-${i}`);
    if (circle) {
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
    }

    if (i < 4) {
      const line = document.getElementById(`kyc-step-line-${i}`);
      if (line) line.className = i < step ? 'stepper-line active' : 'stepper-line';
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initDocSelection() {
  const options = document.querySelectorAll('.doc-option');
  options.forEach((opt) => {
    opt.addEventListener('click', () => {
      options.forEach((o) => {
        o.style.borderColor = 'var(--neutral-200)';
        o.style.backgroundColor = '#fff';
        o.querySelector('input').checked = false;
      });
      opt.style.borderColor = 'var(--primary-500)';
      opt.style.backgroundColor = 'var(--primary-50)';
      opt.querySelector('input').checked = true;

      selectedDocType = opt.getAttribute('data-type');
      updateDocUploadFields();
    });
  });
}

function updateDocUploadFields() {
  const backContainer = document.getElementById('back-upload-container');
  const frontLabel = document.getElementById('doc-front-label');
  const numLabel = document.getElementById('doc-number-label');
  const numInput = document.getElementById('doc-number-input');

  if (selectedDocType === 'passport') {
    if (backContainer) backContainer.style.display = 'none';
    if (frontLabel) frontLabel.textContent = 'Passport Bio-Data Page *';
    if (numLabel) numLabel.textContent = 'Bangladesh Passport Number *';
    if (numInput) numInput.placeholder = 'e.g. A01234567';
  } else if (selectedDocType === 'driving_license') {
    if (backContainer) backContainer.style.display = 'block';
    if (frontLabel) frontLabel.textContent = 'Driving License Front Photo *';
    if (numLabel) numLabel.textContent = 'BRTA Driving License Number *';
    if (numInput) numInput.placeholder = 'e.g. DK1234567';
  } else {
    if (backContainer) backContainer.style.display = 'block';
    if (frontLabel) frontLabel.textContent = 'NID Front Photo *';
    if (numLabel) numLabel.textContent = 'Bangladesh NID Number (10, 13 or 17 digits) *';
    if (numInput) numInput.placeholder = 'e.g. 19951234567890';
  }
}

function initUploads() {
  // Front upload
  setupSingleUpload('front-dropzone', 'front-file-input', 'front-preview-box', (f, u) => {
    frontFile = f;
    frontUrl = u;
  });

  // Back upload
  setupSingleUpload('back-dropzone', 'back-file-input', 'back-preview-box', (f, u) => {
    backFile = f;
    backUrl = u;
  });

  // Selfie upload
  setupSingleUpload('selfie-dropzone', 'selfie-file-input', 'selfie-preview-box', (f, u) => {
    selfieFile = f;
    selfieUrl = u;
  });
}

function setupSingleUpload(dropzoneId, inputId, previewBoxId, onFileLoaded) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  const previewBox = document.getElementById(previewBoxId);

  if (!dropzone || !input || !previewBox) return;

  dropzone.addEventListener('click', () => input.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-active');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-active'));

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-active');
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  });

  input.addEventListener('change', () => {
    if (input.files?.[0]) processFile(input.files[0]);
  });

  async function processFile(file) {
    const localUrl = URL.createObjectURL(file);
    previewBox.innerHTML = `
      <div style="position:relative;width:100%;height:10rem;border-radius:0.75rem;overflow:hidden;">
        <img src="${localUrl}" style="width:100%;height:100%;object-fit:cover;" />
        <div style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.7);color:#fff;font-size:0.6875rem;padding:2px 6px;border-radius:4px;">Ready</div>
      </div>
    `;
    onFileLoaded(file, localUrl);
    toast.success('Document photo attached!');

    // Upload to cloud in background
    try {
      const cdn = await uploadToGoogleDrive(file);
      onFileLoaded(file, cdn);
    } catch {}
  }
}

function initStepNavigation() {
  document.getElementById('kyc-next-1')?.addEventListener('click', () => setKycStep(2));
  document.getElementById('kyc-back-2')?.addEventListener('click', () => setKycStep(1));

  document.getElementById('kyc-next-2')?.addEventListener('click', () => {
    const num = document.getElementById('doc-number-input')?.value.trim();
    if (!frontFile) {
      toast.warning('Please upload the front photo of your document.');
      return;
    }
    if (selectedDocType !== 'passport' && !backFile) {
      toast.warning('Please upload the back photo of your document.');
      return;
    }
    if (!num) {
      toast.warning('Please enter your official document number.');
      return;
    }
    setKycStep(3);
  });

  document.getElementById('kyc-back-3')?.addEventListener('click', () => setKycStep(2));

  document.getElementById('kyc-next-3')?.addEventListener('click', () => {
    if (!selfieFile) {
      toast.warning('Please take or upload your face verification selfie.');
      return;
    }
    // Populate review
    const num = document.getElementById('doc-number-input')?.value.trim();
    document.getElementById('review-doc-type').textContent = selectedDocType.toUpperCase();
    document.getElementById('review-doc-number').textContent = num;
    setKycStep(4);
  });

  document.getElementById('kyc-back-4')?.addEventListener('click', () => setKycStep(3));

  document.getElementById('kyc-submit-btn')?.addEventListener('click', async () => {
    const consent = document.getElementById('consent-check')?.checked;
    if (!consent) {
      toast.warning('You must accept the legal authenticity consent.');
      return;
    }

    const submitBtn = document.getElementById('kyc-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const docNumber = document.getElementById('doc-number-input')?.value.trim();

      const { error } = await supabase.from('seller_verifications').insert({
        user_id: auth.user.id,
        verification_type: selectedDocType,
        document_number: docNumber,
        document_front_url: frontUrl || 'verified_doc_front',
        document_back_url: backUrl || 'verified_doc_back',
        selfie_url: selfieUrl || 'verified_selfie',
        status: 'pending',
      });

      if (error) throw error;

      document.getElementById('kyc-step-4').style.display = 'none';
      document.getElementById('kyc-success').style.display = 'block';
      toast.success('KYC Verification Submitted Successfully!');

    } catch (err) {
      console.error('KYC submission error:', err);
      toast.error('Submission failed: ' + (err.message || 'Error'));
      submitBtn.disabled = false;
      submitBtn.textContent = '🛡️ Submit Verification Request';
    }
  });
}

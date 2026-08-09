// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — MESSAGES & DIRECT CHAT CONTROLLER
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from '../supabase-client.js';
import { auth } from '../auth.js';
import { UIEngine } from '../ui.js';
import { toast } from '../toast.js';

let activeRecipientId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  UIEngine.init();

  if (!auth.requireAuth()) return;

  const urlParams = new URLSearchParams(window.location.search);
  const sellerId = urlParams.get('seller_id');
  if (sellerId) {
    activeRecipientId = sellerId;
    document.getElementById('chat-peer-name').textContent = 'Verified Seller';
  }

  const form = document.getElementById('send-msg-form');
  const input = document.getElementById('chat-msg-input');
  const thread = document.getElementById('chat-thread');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    const msgEl = document.createElement('div');
    msgEl.style.cssText = 'align-self:flex-end;background:var(--primary-500);color:#fff;padding:0.625rem 1rem;border-radius:1rem;max-width:80%;font-size:0.875rem;';
    msgEl.textContent = text;
    thread.appendChild(msgEl);
    thread.scrollTop = thread.scrollHeight;

    toast.success('Message sent');
  });
});

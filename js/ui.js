// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — REUSABLE UI ENGINE (NAVBAR, FOOTER, CHATBOT & MODALS)
// ════════════════════════════════════════════════════════════════════════════════

import { auth } from './auth.js';
import { i18n } from './i18n.js';
import { supabase } from './supabase-client.js';

export function formatPrice(num) {
  const val = Number(num) || 0;
  return `৳${val.toLocaleString('en-US')}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export class UIEngine {
  static init() {
    this.renderHeader();
    this.renderFooter();
    this.renderChatbot();
    i18n.updateDOM();

    // Listen to auth changes and update header
    auth.subscribe(() => {
      this.renderHeader();
      i18n.updateDOM();
    });

    window.addEventListener('langchange', () => {
      this.renderHeader();
      this.renderFooter();
      i18n.updateDOM();
    });
  }

  static renderHeader() {
    const headerEl = document.getElementById('app-header');
    if (!headerEl) return;

    const user = auth.user;
    const profile = auth.profile;
    const isBn = i18n.currentLang === 'bn';

    headerEl.innerHTML = `
      <header style="position:sticky;top:0;z-index:50;background:#ffffff;border-bottom:1px solid var(--neutral-100);box-shadow:var(--shadow-xs);">
        <div class="container-custom" style="display:flex;align-items:center;justify-content:space-between;height:4.25rem;gap:1rem;">
          
          <!-- Logo -->
          <a href="/index.html" style="display:flex;align-items:center;gap:0.625rem;text-decoration:none;flex-shrink:0;">
            <div style="width:2.5rem;height:2.5rem;border-radius:0.75rem;background:linear-gradient(135deg,var(--primary-500),var(--primary-700));display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 10px rgba(15,122,92,0.3);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div>
              <span style="font-family:var(--font-display);font-size:1.375rem;font-weight:900;color:var(--neutral-900);letter-spacing:-0.03em;display:block;line-height:1;">Resell<span style="color:var(--primary-500);">BD</span></span>
              <span style="font-size:0.625rem;font-weight:700;color:var(--neutral-400);text-transform:uppercase;letter-spacing:0.08em;">Verified ReCommerce</span>
            </div>
          </a>

          <!-- Live Search Bar -->
          <div style="flex:1;max-width:32rem;display:none;" class="search-bar-desktop">
            <form action="/products.html" method="GET" style="position:relative;width:100%;">
              <input
                type="text"
                name="q"
                placeholder="${isBn ? 'ফোন, ল্যাপটপ বা পণ্য খুঁজুন...' : 'Search for phones, laptops, electronics...'}"
                style="width:100%;padding:0.625rem 1rem 0.625rem 2.5rem;border-radius:9999px;border:1.5px solid var(--neutral-200);background:var(--neutral-50);font-size:0.875rem;outline:none;transition:all 0.2s;"
              />
              <svg style="position:absolute;left:0.875rem;top:50%;transform:translateY(-50%);color:var(--neutral-400);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </form>
          </div>

          <!-- Nav Actions -->
          <div style="display:flex;align-items:center;gap:0.75rem;">
            
            <!-- + Sell Button -->
            <a href="/sell.html" class="btn btn-accent btn-sm" style="box-shadow:0 2px 6px rgba(244,163,64,0.3);">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>${isBn ? 'বিক্রি করুন' : '+ Sell'}</span>
            </a>

            <!-- Language Switcher -->
            <button id="lang-toggle-btn" class="btn btn-ghost btn-sm lang-toggle-btn" style="border:1px solid var(--neutral-200);padding:0.375rem 0.625rem;" title="Switch Language">
              <span>🌐 <strong>${isBn ? 'বাং' : 'EN'}</strong></span>
            </button>

            ${user ? `
              <!-- Logged-in User Links -->
              <a href="/cart.html" class="btn btn-ghost btn-sm" title="Cart" style="position:relative;padding:0.5rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
              </a>

              <a href="/messages.html" class="btn btn-ghost btn-sm" title="Messages" style="padding:0.5rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </a>

              <!-- User Menu Dropdown -->
              <div style="position:relative;" id="user-menu-wrap">
                <button id="user-menu-btn" style="display:flex;align-items:center;gap:0.5rem;background:none;border:none;cursor:pointer;padding:0.25rem;">
                  <div style="width:2.25rem;height:2.25rem;border-radius:9999px;background:var(--primary-100);color:var(--primary-800);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;border:2px solid var(--primary-300);">
                    ${(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </button>
                <div id="user-menu-dropdown" style="display:none;position:absolute;right:0;top:calc(100% + 0.5rem);width:14rem;background:#fff;border-radius:1rem;box-shadow:var(--shadow-xl);border:1px solid var(--neutral-100);padding:0.5rem;z-index:100;" class="animate-scale-in">
                  <div style="padding:0.75rem;border-bottom:1px solid var(--neutral-100);margin-bottom:0.25rem;">
                    <div style="font-weight:700;font-size:0.875rem;color:var(--neutral-900);" class="truncate">${profile?.full_name || 'My Account'}</div>
                    <div style="font-size:0.75rem;color:var(--neutral-400);" class="truncate">${user.email}</div>
                  </div>
                  <a href="/dashboard.html" class="btn btn-ghost btn-sm" style="width:100%;justify-content:flex-start;">📊 Dashboard</a>
                  <a href="/dashboard.html#listings" class="btn btn-ghost btn-sm" style="width:100%;justify-content:flex-start;">📦 My Listings</a>
                  <a href="/verify-identity.html" class="btn btn-ghost btn-sm" style="width:100%;justify-content:flex-start;color:var(--primary-600);font-weight:700;">🛡️ Verify Identity (KYC)</a>
                  <a href="/profile.html" class="btn btn-ghost btn-sm" style="width:100%;justify-content:flex-start;">👤 Profile & Address</a>
                  <div style="border-top:1px solid var(--neutral-100);margin-top:0.25rem;padding-top:0.25rem;">
                    <button id="logout-btn" class="btn btn-ghost btn-sm" style="width:100%;justify-content:flex-start;color:var(--error-500);">🚪 Logout</button>
                  </div>
                </div>
              </div>
            ` : `
              <!-- Guest Links -->
              <a href="/login.html" class="btn btn-ghost btn-sm">${isBn ? 'লগইন' : 'Login'}</a>
              <a href="/signup.html" class="btn btn-primary btn-sm">${isBn ? 'রেজিস্ট্রেশন' : 'Sign Up'}</a>
            `}
          </div>

        </div>
      </header>
    `;

    // Add media query show search
    if (window.innerWidth >= 768) {
      const searchBox = headerEl.querySelector('.search-bar-desktop');
      if (searchBox) searchBox.style.display = 'block';
    }

    // Toggle language button
    const langBtn = headerEl.querySelector('#lang-toggle-btn');
    if (langBtn) {
      langBtn.addEventListener('click', () => i18n.toggle());
    }

    // User dropdown toggle
    const userBtn = headerEl.querySelector('#user-menu-btn');
    const userDropdown = headerEl.querySelector('#user-menu-dropdown');
    if (userBtn && userDropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
      });
      document.addEventListener('click', () => {
        userDropdown.style.display = 'none';
      });
    }

    // Logout button
    const logoutBtn = headerEl.querySelector('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => auth.signOut());
    }
  }

  static renderFooter() {
    const footerEl = document.getElementById('app-footer');
    if (!footerEl) return;

    const isBn = i18n.currentLang === 'bn';

    footerEl.innerHTML = `
      <footer style="background:var(--neutral-900);color:#ffffff;padding-top:4rem;padding-bottom:3rem;margin-top:5rem;">
        <div class="container-custom">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2.5rem;padding-bottom:3rem;border-bottom:1px solid rgba(255,255,255,0.1);">
            
            <!-- Brand Column -->
            <div>
              <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
                <div style="width:2.25rem;height:2.25rem;border-radius:0.75rem;background:var(--primary-500);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;">R</div>
                <span style="font-size:1.25rem;font-weight:900;letter-spacing:-0.02em;">Resell<span style="color:var(--primary-400);">BD</span></span>
              </div>
              <p style="font-size:0.875rem;color:var(--neutral-400);line-height:1.6;margin-bottom:1.25rem;">
                ${isBn ? 'বাংলাদেশের সবচেয়ে বিশ্বস্ত সেকেন্ড-হ্যান্ড মার্কেটপ্লেস। স্মার্ট এআই ভেরিফিকেশন এবং নিরাপদ কেনাবেচা।' : 'Bangladesh\'s premier sustainable secondary marketplace. AI-powered condition checks and verified seller identity.'}
              </p>
              <div style="display:inline-flex;align-items:center;gap:0.5rem;background:rgba(255,255,255,0.06);padding:0.375rem 0.75rem;border-radius:0.5rem;font-size:0.75rem;color:var(--primary-300);">
                <span>🛡️ Safe Public Meetups Protected</span>
              </div>
            </div>

            <!-- Quick Links -->
            <div>
              <h4 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--neutral-300);margin-bottom:1rem;">Marketplace</h4>
              <ul style="list-style:none;display:flex;flex-direction:column;gap:0.625rem;font-size:0.875rem;color:var(--neutral-400);">
                <li><a href="/products.html" style="color:var(--neutral-400);hover:color:#fff;">Browse All Items</a></li>
                <li><a href="/sell.html" style="color:var(--neutral-400);">Start Selling</a></li>
                <li><a href="/verify-identity.html" style="color:var(--primary-400);font-weight:600;">Become a Verified Seller ✓</a></li>
                <li><a href="/dashboard.html" style="color:var(--neutral-400);">Seller Dashboard</a></li>
              </ul>
            </div>

            <!-- Trust & Policies -->
            <div>
              <h4 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--neutral-300);margin-bottom:1rem;">Safety & Policies</h4>
              <ul style="list-style:none;display:flex;flex-direction:column;gap:0.625rem;font-size:0.875rem;color:var(--neutral-400);">
                <li><a href="/safety.html" style="color:var(--neutral-400);">Safety Center</a></li>
                <li><a href="/buyer-policy.html" style="color:var(--neutral-400);">Buyer Protection</a></li>
                <li><a href="/seller-policy.html" style="color:var(--neutral-400);">Seller Standards</a></li>
                <li><a href="/privacy.html" style="color:var(--neutral-400);">Privacy Policy</a></li>
                <li><a href="/terms.html" style="color:var(--neutral-400);">Terms of Service</a></li>
              </ul>
            </div>

            <!-- Support -->
            <div>
              <h4 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--neutral-300);margin-bottom:1rem;">Support</h4>
              <p style="font-size:0.875rem;color:var(--neutral-400);margin-bottom:0.75rem;">Need help with an order or verification?</p>
              <a href="/support.html" class="btn btn-outline btn-sm" style="background:transparent;color:#fff;border-color:rgba(255,255,255,0.2);">Contact Help Center</a>
            </div>

          </div>

          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;padding-top:2rem;font-size:0.8125rem;color:var(--neutral-500);gap:1rem;">
            <div>© 2026 ResellBD Inc. All rights reserved. Built for Bangladesh.</div>
            <div style="display:flex;gap:1.5rem;">
              <a href="/privacy.html" style="color:var(--neutral-500);">Privacy</a>
              <a href="/terms.html" style="color:var(--neutral-500);">Terms</a>
              <a href="/refund-policy.html" style="color:var(--neutral-500);">Refunds</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  static renderChatbot() {
    let chatbotEl = document.getElementById('floating-chatbot');
    if (!chatbotEl) {
      chatbotEl = document.createElement('div');
      chatbotEl.id = 'floating-chatbot';
      document.body.appendChild(chatbotEl);
    }

    chatbotEl.innerHTML = `
      <div style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:90;">
        <!-- Chatbot Open Button -->
        <button id="chatbot-toggle-btn" style="width:3.5rem;height:3.5rem;border-radius:9999px;background:linear-gradient(135deg,var(--primary-500),var(--primary-700));color:#fff;border:none;box-shadow:0 10px 25px rgba(15,122,92,0.4);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.2s;" class="card-hover">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </button>

        <!-- Chatbot Window -->
        <div id="chatbot-window" style="display:none;position:absolute;bottom:4.25rem;right:0;width:22rem;height:30rem;background:#ffffff;border-radius:1.5rem;box-shadow:var(--shadow-xl);border:1px solid var(--neutral-200);overflow:hidden;flex-direction:column;" class="animate-scale-in">
          <div style="background:linear-gradient(135deg,var(--primary-500),var(--primary-700));color:#fff;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <div style="width:2rem;height:2rem;border-radius:0.5rem;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;">🤖</div>
              <div>
                <div style="font-weight:700;font-size:0.875rem;">ResellBD AI Assistant</div>
                <div style="font-size:0.6875rem;opacity:0.8;">Online · Instant Answers</div>
              </div>
            </div>
            <button id="chatbot-close-btn" style="background:none;border:none;color:#fff;cursor:pointer;font-size:1.25rem;">✕</button>
          </div>

          <div id="chatbot-messages" style="flex:1;padding:1rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.75rem;background:var(--neutral-50);font-size:0.8125rem;">
            <div style="align-self:flex-start;background:#fff;padding:0.75rem 1rem;border-radius:1rem;box-shadow:var(--shadow-xs);max-width:85%;color:var(--neutral-800);border:1px solid var(--neutral-200);">
              Hello! 👋 I'm your ResellBD assistant. How can I help you find or sell items safely today?
            </div>
          </div>

          <form id="chatbot-form" style="padding:0.75rem;background:#fff;border-top:1px solid var(--neutral-100);display:flex;gap:0.5rem;">
            <input
              type="text"
              id="chatbot-input"
              placeholder="Ask anything..."
              style="flex:1;padding:0.5rem 0.75rem;border-radius:9999px;border:1px solid var(--neutral-300);outline:none;font-size:0.8125rem;"
            />
            <button type="submit" class="btn btn-primary btn-sm" style="border-radius:9999px;padding:0.5rem 0.875rem;">Send</button>
          </form>
        </div>
      </div>
    `;

    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const chatWindow = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');
    const messages = document.getElementById('chatbot-messages');

    if (toggleBtn && chatWindow) {
      toggleBtn.addEventListener('click', () => {
        chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
      });
      closeBtn?.addEventListener('click', () => { chatWindow.style.display = 'none'; });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = '';

        // Add user msg
        const userMsg = document.createElement('div');
        userMsg.style.cssText = 'align-self:flex-end;background:var(--primary-500);color:#fff;padding:0.625rem 0.875rem;border-radius:1rem;max-width:85%;';
        userMsg.textContent = text;
        messages.appendChild(userMsg);
        messages.scrollTop = messages.scrollHeight;

        // Bot response
        const botMsg = document.createElement('div');
        botMsg.style.cssText = 'align-self:flex-start;background:#fff;padding:0.625rem 0.875rem;border-radius:1rem;max-width:85%;color:var(--neutral-800);border:1px solid var(--neutral-200);';
        botMsg.textContent = 'Thinking...';
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;

        try {
          const { AIEngine } = await import('./ai-engine.js');
          const lower = text.toLowerCase();
          let reply = 'I can help you search for verified electronics, calculate fair market prices, or guide you on safe meetup zones in Bangladesh.';
          if (lower.includes('price') || lower.includes('cost') || lower.includes('sell')) {
            reply = 'To get the best price for your pre-loved item, use our 3-Step Sell Flow on the Sell page. Our AI analyzes condition and secondary market data automatically!';
          } else if (lower.includes('verify') || lower.includes('kyc') || lower.includes('nid')) {
            reply = 'You can verify your identity using your Bangladesh NID, Passport, or Driving License on our Identity Verification page to get the verified seller badge!';
          }
          botMsg.textContent = reply;
        } catch {
          botMsg.textContent = 'Feel free to browse our listings or start selling with AI!';
        }
        messages.scrollTop = messages.scrollHeight;
      });
    }
  }
}

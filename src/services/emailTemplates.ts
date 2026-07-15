/**
 * Email template generators for transactional notifications.
 * These produce HTML strings ready for Supabase Edge Function / external email service.
 */

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f9fafb; padding: 40px 20px; color: #111827;
`;

const CARD_STYLES = `
  background: #ffffff; border-radius: 16px; padding: 32px;
  max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb;
`;

const BUTTON_STYLES = `
  display: inline-block; padding: 12px 28px; background: #10b981;
  color: #ffffff; border-radius: 10px; text-decoration: none;
  font-weight: 700; font-size: 14px;
`;

function logoHeader(): string {
  return `
    <div style="text-align:center; margin-bottom:24px;">
      <span style="background:#10b981; color:#fff; padding:10px 18px; border-radius:10px; font-weight:800; font-size:18px;">
        🌿 RecycleHub
      </span>
    </div>
  `;
}

function footer(): string {
  return `
    <div style="text-align:center; margin-top:32px; font-size:12px; color:#9ca3af;">
      © ${new Date().getFullYear()} RecycleHub. All rights reserved.<br/>
      AI-Powered Smart Resale Marketplace
    </div>
  `;
}

export function welcomeEmailTemplate(name: string): string {
  return `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        ${logoHeader()}
        <h2 style="font-size:22px; font-weight:800; margin:0 0 12px;">Welcome to RecycleHub, ${name}! 🎉</h2>
        <p style="color:#6b7280; line-height:1.6; margin:0 0 24px;">
          Thank you for joining the smarter way to buy and sell. Start listing your items today and discover amazing deals from verified sellers near you.
        </p>
        <a href="https://recyclehub.app/products" style="${BUTTON_STYLES}">Browse Marketplace</a>
        ${footer()}
      </div>
    </div>
  `;
}

export function orderConfirmationTemplate(name: string, orderId: string, items: string[], total: string): string {
  return `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        ${logoHeader()}
        <h2 style="font-size:22px; font-weight:800; margin:0 0 8px;">Order Confirmed! ✅</h2>
        <p style="color:#6b7280; margin:0 0 20px;">Hi ${name}, your order has been placed successfully.</p>
        <div style="background:#f3f4f6; border-radius:10px; padding:16px; margin:0 0 20px;">
          <p style="font-size:12px; color:#9ca3af; margin:0 0 8px;">ORDER ID</p>
          <p style="font-weight:700; font-size:14px; margin:0;">#${orderId.slice(0, 8).toUpperCase()}</p>
        </div>
        <ul style="list-style:none; padding:0; margin:0 0 20px;">
          ${items.map((item) => `<li style="padding:8px 0; border-bottom:1px solid #f3f4f6; font-size:14px;">📦 ${item}</li>`).join('')}
        </ul>
        <div style="font-weight:800; font-size:16px; text-align:right;">Total: ${total}</div>
        <br/>
        <a href="https://recyclehub.app/orders" style="${BUTTON_STYLES}">Track Your Order</a>
        ${footer()}
      </div>
    </div>
  `;
}

export function shipmentEmailTemplate(name: string, orderId: string, trackingNumber: string): string {
  return `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        ${logoHeader()}
        <h2 style="font-size:22px; font-weight:800; margin:0 0 8px;">Your Order is On the Way! 🚚</h2>
        <p style="color:#6b7280; margin:0 0 20px;">Hi ${name}, great news! Your order is on its way.</p>
        <div style="background:#ecfdf5; border-radius:10px; padding:16px; margin:0 0 24px; border:1px solid #d1fae5;">
          <p style="font-size:12px; color:#6b7280; margin:0 0 4px;">TRACKING NUMBER</p>
          <p style="font-weight:800; font-size:18px; color:#10b981; margin:0;">${trackingNumber}</p>
        </div>
        <a href="https://recyclehub.app/orders" style="${BUTTON_STYLES}">View Order #${orderId.slice(0,8).toUpperCase()}</a>
        ${footer()}
      </div>
    </div>
  `;
}

export function deliveryEmailTemplate(name: string, orderId: string): string {
  const shortId = orderId.slice(0, 8).toUpperCase();
  return `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        ${logoHeader()}
        <h2 style="font-size:22px; font-weight:800; margin:0 0 8px;">Order Delivered! 🎉</h2>
        <p style="color:#6b7280; margin:0 0 20px;">Hi ${name}, your order #${shortId} has been delivered successfully. We hope you love it!</p>
        <p style="color:#6b7280; font-size:14px; margin:0 0 24px;">Please leave a review to help other buyers make informed decisions.</p>
        <a href="https://recyclehub.app/orders" style="${BUTTON_STYLES}">Leave a Review</a>
        ${footer()}
      </div>
    </div>
  `;
}

export function passwordResetEmailTemplate(name: string, resetLink: string): string {
  return `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        ${logoHeader()}
        <h2 style="font-size:22px; font-weight:800; margin:0 0 8px;">Password Reset Request 🔑</h2>
        <p style="color:#6b7280; margin:0 0 20px;">Hi ${name}, we received a request to reset your password. Click the button below to set a new password.</p>
        <a href="${resetLink}" style="${BUTTON_STYLES}">Reset Password</a>
        <p style="color:#9ca3af; font-size:12px; margin:24px 0 0;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        ${footer()}
      </div>
    </div>
  `;
}

export function verificationApprovedTemplate(name: string): string {
  return `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        ${logoHeader()}
        <h2 style="font-size:22px; font-weight:800; margin:0 0 8px;">Seller Verified! ✅</h2>
        <p style="color:#6b7280; margin:0 0 20px;">Congratulations ${name}! Your seller account has been verified. You can now list products on RecycleHub with a verified badge.</p>
        <a href="https://recyclehub.app/sell/new" style="${BUTTON_STYLES}">Start Selling</a>
        ${footer()}
      </div>
    </div>
  `;
}

export function verificationRejectedTemplate(name: string, reason: string): string {
  return `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        ${logoHeader()}
        <h2 style="font-size:22px; font-weight:800; margin:0 0 8px;">Verification Update</h2>
        <p style="color:#6b7280; margin:0 0 16px;">Hi ${name}, unfortunately your seller verification was not approved at this time.</p>
        <div style="background:#fef2f2; border-radius:10px; padding:16px; margin:0 0 24px; border:1px solid #fecaca;">
          <p style="font-size:12px; color:#9ca3af; margin:0 0 4px;">REASON</p>
          <p style="font-size:14px; color:#dc2626; margin:0;">${reason}</p>
        </div>
        <p style="color:#6b7280; font-size:14px; margin:0 0 24px;">Please update your documents and resubmit for verification.</p>
        <a href="https://recyclehub.app/dashboard" style="${BUTTON_STYLES}">Go to Dashboard</a>
        ${footer()}
      </div>
    </div>
  `;
}

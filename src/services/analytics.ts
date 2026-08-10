export class AnalyticsService {
  private static isDev = import.meta.env.DEV;

  // Track Page Views
  static trackPageView(url: string) {
    if (this.isDev) {
      console.log(`[Analytics] Page View: ${url}`);
    }
    // Integrate production triggers (e.g. window.gtag('config', '...', { page_path: url }))
  }

  // Track Custom Events
  static trackEvent(category: string, action: string, label?: string, value?: number) {
    if (this.isDev) {
      console.log(`[Analytics] Event: ${category} | ${action} | ${label || ''} | ${value ?? ''}`);
    }
    // Integrate window.gtag('event', action, { event_category: category, event_label: label, value })
  }

  // Track Product view conversion metrics
  static trackProductView(productId: string, title: string, price: number) {
    this.trackEvent('Product', 'View', `${title} (${productId})`, price);
  }

  // Track Cart additions
  static trackCartAddition(productId: string, title: string, price: number) {
    this.trackEvent('Cart', 'Add', `${title} (${productId})`, price);
  }

  // Track Sales Conversions
  static trackSale(orderId: string, totalAmount: number, paymentMethod: string) {
    this.trackEvent('Conversion', 'Purchase', `Order #${orderId} via ${paymentMethod}`, totalAmount);
  }
}

/**
 * Security Service
 * Implements client-side rate limiting and XSS sanitization helpers.
 */
class SecurityService {
  private requestCounts = new Map<string, { count: number; timestamp: number }>();

  /**
   * Client-side rate limiter to prevent aggressive spamming of API calls (e.g., auth endpoints).
   * @param key Unique identifier for the action (e.g., 'login', 'signup')
   * @param limit Max requests allowed in the window
   * @param windowMs Time window in milliseconds
   * @returns boolean true if allowed, false if rate limited
   */
  checkRateLimit(key: string, limit: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.requestCounts.get(key);

    if (!record || (now - record.timestamp > windowMs)) {
      this.requestCounts.set(key, { count: 1, timestamp: now });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count += 1;
    this.requestCounts.set(key, record);
    return true;
  }

  /**
   * Basic string sanitizer to strip script tags.
   * Note: In a real enterprise app, use DOMPurify for HTML sanitization.
   * @param input Raw string
   * @returns Sanitized string
   */
  sanitizeInput(input: string): string {
    if (!input) return input;
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/onerror=/gi, '')
      .replace(/onload=/gi, '');
  }
}

export const security = new SecurityService();

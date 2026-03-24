import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SecurityService {
  constructor(private sanitizer: DomSanitizer) {}

  /** Strip dangerous HTML tags and attributes */
  sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/<object[\s\S]*?<\/object>/gi, '')
      .replace(/<embed[\s\S]*?>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  /** Safe HTML for innerHTML use */
  sanitizeHtml(html: string): SafeHtml {
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  }

  /** Safe URL validation */
  sanitizeUrl(url: string): SafeUrl | null {
    if (!url || typeof url !== 'string') return null;
    const dangerousPatterns = /^(javascript|vbscript|data:text\/html)/i;
    if (dangerousPatterns.test(url.trim())) return null;
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  /** Validate and sanitize phone number */
  sanitizePhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[^0-9+\-\s]/g, '').trim().substring(0, 15);
  }

  /** Validate email format */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email?.trim() || '');
  }

  /** Rate limiter - returns false if too many calls within timeWindow */
  private rateLimitMap = new Map<string, number[]>();

  checkRateLimit(key: string, maxCalls: number = 5, timeWindowMs: number = 60000): boolean {
    const now = Date.now();
    const calls = (this.rateLimitMap.get(key) || []).filter(t => now - t < timeWindowMs);
    if (calls.length >= maxCalls) return false;
    calls.push(now);
    this.rateLimitMap.set(key, calls);
    return true;
  }
}

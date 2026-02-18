import { NextRequest } from 'next/server';
import { logger } from './logger';

/**
 * Simple in-memory rate limiting
 * 
 * For production, consider using:
 * - Upstash Redis (@upstash/ratelimit)
 * - Vercel Edge Config
 * - External rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store: IP -> RateLimitEntry
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom identifier (default: IP address) */
  identifier?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Time until reset (ms) */
  resetIn?: number;
  /** Current count */
  count: number;
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Check if request should be rate limited
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs, identifier } = config;
  const key = identifier || getClientIP(request);
  const now = Date.now();
  
  // Get or create entry
  let entry = rateLimitStore.get(key);
  
  // Reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: limit - 1,
      count: 1,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= limit) {
    const resetIn = entry.resetTime - now;
    
    logger.warn('Rate limit exceeded', {
      ip: key,
      count: entry.count,
      limit,
      resetIn,
    });
    
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      count: entry.count,
    };
  }
  
  // Increment counter
  entry.count++;
  
  return {
    allowed: true,
    remaining: limit - entry.count,
    count: entry.count,
  };
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  /** Very strict: 5 requests per hour (for sensitive operations) */
  STRICT: { limit: 5, windowMs: 60 * 60 * 1000 },
  
  /** Standard: 10 requests per hour */
  STANDARD: { limit: 10, windowMs: 60 * 60 * 1000 },
  
  /** Moderate: 30 requests per hour */
  MODERATE: { limit: 30, windowMs: 60 * 60 * 1000 },
  
  /** Lenient: 100 requests per hour */
  LENIENT: { limit: 100, windowMs: 60 * 60 * 1000 },
  
  /** Per minute: 10 requests per minute */
  PER_MINUTE: { limit: 10, windowMs: 60 * 1000 },
} as const;

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.count + result.remaining),
    'X-RateLimit-Remaining': String(result.remaining),
  };
  
  if (result.resetIn) {
    headers['X-RateLimit-Reset'] = String(Math.ceil(result.resetIn / 1000));
    headers['Retry-After'] = String(Math.ceil(result.resetIn / 1000));
  }
  
  return headers;
}

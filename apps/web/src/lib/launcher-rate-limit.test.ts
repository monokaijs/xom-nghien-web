import { describe, expect, it } from 'vitest';
import { FixedWindowRateLimiter } from './launcher-rate-limit';

describe('FixedWindowRateLimiter', () => {
  it('blocks requests over the limit and resets the bucket', () => {
    const limiter = new FixedWindowRateLimiter(2, 1_000);
    expect(limiter.consume('client', 100).allowed).toBe(true);
    expect(limiter.consume('client', 200).allowed).toBe(true);
    expect(limiter.consume('client', 300)).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(limiter.consume('client', 1_100).allowed).toBe(true);
  });
});

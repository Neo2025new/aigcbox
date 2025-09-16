import { rateLimiter, getClientIdentifier } from '../rateLimit';

describe('RateLimit', () => {
  describe('rateLimiter', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user-1';
      const result = rateLimiter.check(identifier);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should track request counts', () => {
      const identifier = 'test-user-2';

      // 第一次请求
      const result1 = rateLimiter.check(identifier);
      const initialRemaining = result1.remaining;

      // 第二次请求
      const result2 = rateLimiter.check(identifier);

      expect(result2.remaining).toBe(initialRemaining - 1);
    });

    it('should provide stats', () => {
      const stats = rateLimiter.getStats();

      expect(stats).toHaveProperty('activeClients');
      expect(stats).toHaveProperty('maxRequests');
      expect(stats).toHaveProperty('windowMs');
      expect(stats.windowMs).toBe(60000);
    });
  });

  describe('getClientIdentifier', () => {
    it('should generate identifier from request headers', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1';
            if (name === 'user-agent') return 'Mozilla/5.0';
            return null;
          }
        }
      } as unknown as Request;

      const identifier = getClientIdentifier(mockRequest);

      expect(identifier).toContain('192.168.1.1');
      expect(identifier).toMatch(/^[\w\.\-]+$/);
    });

    it('should handle missing headers', () => {
      const mockRequest = {
        headers: {
          get: () => null
        }
      } as unknown as Request;

      const identifier = getClientIdentifier(mockRequest);

      expect(identifier).toContain('unknown');
    });
  });
});
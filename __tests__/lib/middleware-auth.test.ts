import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';

// Helper to create a mock NextRequest with cookies
function createMockRequest(cookieValue?: string): NextRequest {
  const url = 'http://localhost:3000/api/test';
  const request = new NextRequest(url);
  if (cookieValue) {
    request.cookies.set('auth_user', cookieValue);
  }
  return request;
}

const mockUser = {
  id: 'user-1',
  email: 'admin@test.com',
  name: 'Admin',
  role: 'admin',
};

const mockNonAdminUser = {
  id: 'user-2',
  email: 'user@test.com',
  name: 'User',
  role: 'user',
};

describe('withAuth Middleware', () => {
  describe('Simple handler (no dynamic params)', () => {
    const mockHandler = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    beforeEach(() => {
      mockHandler.mockClear();
    });

    it('should return 401 when no auth cookie is present', async () => {
      const wrappedHandler = withAuth(mockHandler);
      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should call handler with user when auth cookie is valid', async () => {
      const wrappedHandler = withAuth(mockHandler);
      const request = createMockRequest(JSON.stringify(mockUser));
      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request, mockUser);
    });

    it('should return 401 when auth cookie has invalid JSON', async () => {
      const wrappedHandler = withAuth(mockHandler);
      const request = createMockRequest('invalid-json');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Invalid session');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Admin requirement', () => {
    const mockHandler = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    beforeEach(() => {
      mockHandler.mockClear();
    });

    it('should allow admin users when requireAdmin is true', async () => {
      const wrappedHandler = withAuth(mockHandler, true);
      const request = createMockRequest(JSON.stringify(mockUser));
      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request, mockUser);
    });

    it('should return 403 for non-admin users when requireAdmin is true', async () => {
      const wrappedHandler = withAuth(mockHandler, true);
      const request = createMockRequest(JSON.stringify(mockNonAdminUser));
      const response = await wrappedHandler(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Forbidden - Admin access required');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow non-admin users when requireAdmin is false', async () => {
      const wrappedHandler = withAuth(mockHandler, false);
      const request = createMockRequest(JSON.stringify(mockNonAdminUser));
      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request, mockNonAdminUser);
    });
  });

  describe('Dynamic handler (with route params)', () => {
    const mockDynamicHandler = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    beforeEach(() => {
      mockDynamicHandler.mockClear();
    });

    it('should pass context to dynamic handler', async () => {
      const wrappedHandler = withAuth(mockDynamicHandler);
      const request = createMockRequest(JSON.stringify(mockUser));
      const context = { params: Promise.resolve({ id: 'post-1' }) };

      await wrappedHandler(request, context);

      expect(mockDynamicHandler).toHaveBeenCalledWith(request, mockUser, context);
    });

    it('should return 401 for unauthenticated dynamic route', async () => {
      const wrappedHandler = withAuth(mockDynamicHandler);
      const request = createMockRequest();
      const context = { params: Promise.resolve({ id: 'post-1' }) };

      const response = await wrappedHandler(request, context);
      expect(response.status).toBe(401);
    });
  });
});

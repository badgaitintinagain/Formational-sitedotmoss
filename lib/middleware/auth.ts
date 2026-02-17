import { NextRequest, NextResponse } from 'next/server';

type AuthHandler = (request: NextRequest, user: { id: string; email: string; name: string; role: string }) => Promise<Response>;

export function withAuth(handler: AuthHandler, requireAdmin = false) {
  return async (request: NextRequest) => {
    try {
      const authCookie = request.cookies.get('auth_user');
      
      if (!authCookie) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const user = JSON.parse(authCookie.value);

      if (requireAdmin && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }

      // Pass user to handler
      return handler(request, user);
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
  };
}

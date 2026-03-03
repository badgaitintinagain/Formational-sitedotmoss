import { NextRequest } from 'next/server';
import { GET } from '@/app/api/auth/me/route';

describe('GET /api/auth/me', () => {
  it('should return null user when no auth cookie', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/me');
    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.user).toBeNull();
  });

  it('should return user data when auth cookie is valid', async () => {
    const userData = {
      id: 'user-1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/me');
    request.cookies.set('auth_user', JSON.stringify(userData));

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.user).toEqual(userData);
  });

  it('should return null user when auth cookie has invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/me');
    request.cookies.set('auth_user', 'not-valid-json');

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.user).toBeNull();
  });
});

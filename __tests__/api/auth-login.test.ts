import { NextRequest } from 'next/server';

// Mock the database module before importing the route
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn(),
  },
  users: { email: 'email' },
}));

jest.mock('@/lib/auth/utils', () => ({
  verifyPassword: jest.fn(),
}));

import { POST } from '@/app/api/auth/login/route';
import { verifyPassword } from '@/lib/auth/utils';
import { db } from '@/lib/db';

const mockedVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>;

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Email and password are required');
  });

  it('should return 400 when password is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Email and password are required');
  });

  it('should return 401 when user is not found', async () => {
    (db.select().from('').where('').limit as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@test.com', password: 'test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('Invalid credentials');
  });

  it('should return 401 when password is incorrect', async () => {
    const fakeUser = {
      id: 'user-1',
      email: 'admin@test.com',
      name: 'Admin',
      passwordHash: '$2a$12$fakeHash',
      role: 'admin',
      avatar: null,
    };

    (db.select().from('').where('').limit as jest.Mock).mockResolvedValue([fakeUser]);
    mockedVerifyPassword.mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@test.com', password: 'wrong' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('Invalid credentials');
  });

  it('should return success and set cookie when credentials are valid', async () => {
    const fakeUser = {
      id: 'user-1',
      email: 'admin@test.com',
      name: 'Admin',
      passwordHash: '$2a$12$fakeHash',
      role: 'admin',
      avatar: '/avatar.png',
    };

    (db.select().from('').where('').limit as jest.Mock).mockResolvedValue([fakeUser]);
    mockedVerifyPassword.mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@test.com', password: 'correct' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user).toEqual({
      id: 'user-1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
      avatar: '/avatar.png',
    });

    // Check that auth cookie is set
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('auth_user=');
  });
});

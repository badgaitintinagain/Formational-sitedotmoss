import { NextRequest } from 'next/server';

// Mock db before importing the module
const mockInsert = jest.fn().mockReturnThis();
const mockValues = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
  },
  comments: {},
}));

// Mock generateId
jest.mock('@/lib/auth/utils', () => ({
  generateId: jest.fn().mockReturnValue('test-comment-id'),
}));

import { POST } from '@/app/api/blog/comments/route';

describe('POST /api/blog/comments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsert.mockReturnValue({ values: mockValues });
  });

  it('should return 400 when postSlug is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/blog/comments', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', content: 'Hello' }),
      headers: { 'x-forwarded-for': '100.0.0.1' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Name and content are required');
  });

  it('should return 400 when name is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/blog/comments', {
      method: 'POST',
      body: JSON.stringify({ postSlug: 'test-post', content: 'Hello' }),
      headers: { 'x-forwarded-for': '100.0.0.2' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Name and content are required');
  });

  it('should return 400 when content is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/blog/comments', {
      method: 'POST',
      body: JSON.stringify({ postSlug: 'test-post', name: 'Test' }),
      headers: { 'x-forwarded-for': '100.0.0.3' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Name and content are required');
  });

  it('should return 400 when content exceeds 500 characters', async () => {
    const longContent = 'a'.repeat(501);
    const request = new NextRequest('http://localhost:3000/api/blog/comments', {
      method: 'POST',
      body: JSON.stringify({ postSlug: 'test-post', name: 'Test', content: longContent }),
      headers: { 'x-forwarded-for': '10.10.10.10' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Comment too long (max 500 characters)');
  });

  it('should strip HTML tags from content', async () => {
    const request = new NextRequest('http://localhost:3000/api/blog/comments', {
      method: 'POST',
      body: JSON.stringify({
        postSlug: 'test-post',
        name: 'Test',
        content: '<script>alert("xss")</script>Hello',
      }),
      headers: { 'x-forwarded-for': '1.1.1.1' },
    });

    await POST(request);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'alert("xss")Hello',
      })
    );
  });

  it('should create comment successfully with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/blog/comments', {
      method: 'POST',
      body: JSON.stringify({
        postSlug: 'test-post',
        name: 'John',
        email: 'john@test.com',
        content: 'Great post!',
      }),
      headers: { 'x-forwarded-for': '2.2.2.2' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-comment-id',
        postSlug: 'test-post',
        authorName: 'John',
        authorEmail: 'john@test.com',
        content: 'Great post!',
        status: 'approved',
      })
    );
  });

  it('should set parentId when provided for threaded replies', async () => {
    const request = new NextRequest('http://localhost:3000/api/blog/comments', {
      method: 'POST',
      body: JSON.stringify({
        postSlug: 'test-post',
        name: 'Jane',
        content: 'Reply!',
        parentId: 'parent-comment-id',
      }),
      headers: { 'x-forwarded-for': '3.3.3.3' },
    });

    await POST(request);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        parentId: 'parent-comment-id',
      })
    );
  });

  it('should set authorEmail to null when not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/blog/comments', {
      method: 'POST',
      body: JSON.stringify({
        postSlug: 'test-post',
        name: 'Anonymous',
        content: 'No email',
      }),
      headers: { 'x-forwarded-for': '4.4.4.4' },
    });

    await POST(request);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        authorEmail: null,
      })
    );
  });
});

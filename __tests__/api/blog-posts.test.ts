import { NextRequest } from 'next/server';

// We need to mock the drizzle sql tagged template to return an object with .as()
const mockSqlResult = { as: jest.fn().mockReturnThis() };

// Mock db with a select that returns a proper chain builder
const mockSelectResult = {
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn(),
};

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn().mockReturnValue(mockSelectResult),
  },
  posts: {
    id: 'id',
    title: 'title',
    slug: 'slug',
    excerpt: 'excerpt',
    content: 'content',
    coverImage: 'coverImage',
    images: 'images',
    authorId: 'authorId',
    authorName: 'authorName',
    tags: 'tags',
    published: 'published',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  postLikes: {},
  comments: {},
}));

jest.mock('drizzle-orm', () => ({
  desc: jest.fn(),
  eq: jest.fn(),
  sql: jest.fn().mockReturnValue(mockSqlResult),
  count: jest.fn(),
}));

import { GET } from '@/app/api/blog/posts/route';

describe('GET /api/blog/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup chain for each test
    mockSelectResult.from.mockReturnThis();
    mockSelectResult.where.mockReturnThis();
    mockSelectResult.orderBy.mockReturnThis();
    mockSqlResult.as.mockReturnValue(mockSqlResult);
  });

  it('should return posts with default limit of 10', async () => {
    const mockPosts = [
      {
        id: 'post-1',
        title: 'Test Post',
        slug: 'test-post',
        excerpt: 'Test excerpt',
        content: 'Test content',
        coverImage: null,
        images: null,
        authorId: 'user-1',
        authorName: 'Admin',
        tags: '["tech"]',
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likesCount: 5,
        commentsCount: 3,
      },
    ];

    mockSelectResult.limit.mockResolvedValue(mockPosts);

    const request = new NextRequest('http://localhost:3000/api/blog/posts');
    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.posts).toHaveLength(1);
    expect(body.posts[0].tags).toEqual(['tech']);
    expect(body.posts[0].images).toEqual([]);
    expect(body.total).toBe(1);
  });

  it('should parse tags and images from JSON strings', async () => {
    const mockPosts = [
      {
        id: 'post-1',
        title: 'Test',
        slug: 'test',
        tags: '["tag1","tag2"]',
        images: '["img1.jpg","img2.jpg"]',
        excerpt: '',
        content: '',
        coverImage: null,
        authorId: 'user-1',
        authorName: 'Admin',
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
      },
    ];

    mockSelectResult.limit.mockResolvedValue(mockPosts);

    const request = new NextRequest('http://localhost:3000/api/blog/posts');
    const response = await GET(request);
    const body = await response.json();

    expect(body.posts[0].tags).toEqual(['tag1', 'tag2']);
    expect(body.posts[0].images).toEqual(['img1.jpg', 'img2.jpg']);
  });

  it('should respect custom limit parameter', async () => {
    mockSelectResult.limit.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/blog/posts?limit=5');
    await GET(request);

    expect(mockSelectResult.limit).toHaveBeenCalledWith(5);
  });

  it('should return 500 when database query fails', async () => {
    mockSelectResult.limit.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/blog/posts');
    const response = await GET(request);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toBe('Failed to fetch posts');
  });

  it('should return empty array when no posts exist', async () => {
    mockSelectResult.limit.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/blog/posts');
    const response = await GET(request);
    const body = await response.json();

    expect(body.posts).toEqual([]);
    expect(body.total).toBe(0);
  });
});

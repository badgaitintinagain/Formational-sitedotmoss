import { NextRequest, NextResponse } from 'next/server';
import { db, posts } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const allPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    // Parse tags from JSON string
    const postsWithParsedTags = allPosts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
    }));

    return NextResponse.json({ 
      posts: postsWithParsedTags,
      total: allPosts.length 
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

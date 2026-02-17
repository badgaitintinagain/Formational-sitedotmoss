import { NextRequest, NextResponse } from 'next/server';
import { db, posts, postLikes, comments } from '@/lib/db';
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

    // Get likes and comments counts for each post
    const postsWithCounts = await Promise.all(
      allPosts.map(async (post) => {
        const [likesData, commentsData] = await Promise.all([
          db.select().from(postLikes).where(eq(postLikes.postId, post.id)),
          db.select().from(comments).where(eq(comments.postSlug, post.slug)),
        ]);

        return {
          ...post,
          tags: post.tags ? JSON.parse(post.tags) : [],
          likesCount: likesData.length,
          commentsCount: commentsData.length,
        };
      })
    );

    return NextResponse.json({ 
      posts: postsWithCounts,
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

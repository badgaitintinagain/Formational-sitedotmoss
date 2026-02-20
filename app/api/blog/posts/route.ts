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
    // Handle gracefully if tables don't exist yet
    const postsWithCounts = await Promise.all(
      allPosts.map(async (post) => {
        let likesCount = 0;
        let commentsCount = 0;

        try {
          const [likesData, commentsData] = await Promise.all([
            db.select().from(postLikes).where(eq(postLikes.postId, post.id)).catch(() => []),
            db.select().from(comments).where(eq(comments.postSlug, post.slug)).catch(() => []),
          ]);

          likesCount = likesData.length;
          commentsCount = commentsData.length;
        } catch (error) {
          // If tables don't exist yet, just return 0
          console.log('Could not fetch counts:', error);
        }

        return {
          ...post,
          tags: post.tags ? JSON.parse(post.tags) : [],
          images: post.images ? JSON.parse(post.images) : [],
          likesCount,
          commentsCount,
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

import { NextRequest, NextResponse } from 'next/server';
import { db, posts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware/auth';

// GET - Fetch a single post by ID (for admin edit)
async function getPostHandler(
  request: NextRequest,
  user: { id: string; email: string; name: string; role: string },
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const postList = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    const post = postList[0];

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      post: {
        ...post,
        tags: post.tags ? JSON.parse(post.tags) : [],
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PATCH - Update a post
async function updatePostHandler(
  request: NextRequest,
  user: { id: string; email: string; name: string; role: string },
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { title, content, excerpt, coverImage, tags, published } = body;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    await db
      .update(posts)
      .set({
        title,
        slug,
        content,
        excerpt,
        coverImage: coverImage || null,
        tags: JSON.stringify(tags || []),
        published: published ?? false,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a post
async function deletePostHandler(
  request: NextRequest, 
  user: { id: string; email: string; name: string; role: string },
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await db.delete(posts).where(eq(posts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getPostHandler, true);
export const PATCH = withAuth(updatePostHandler, true);
export const DELETE = withAuth(deletePostHandler, true);

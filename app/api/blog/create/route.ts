import { NextRequest, NextResponse } from 'next/server';
import { db, posts } from '@/lib/db';
import { generateId, generateSlug } from '@/lib/auth/utils';
import { withAuth } from '@/lib/middleware/auth';

async function createPostHandler(request: NextRequest, user: any) {
  try {
    const body = await request.json();
    const { title, content, excerpt, coverImage, tags, published } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const postId = generateId();
    const slug = generateSlug(title);

    await db.insert(posts).values({
      id: postId,
      title,
      slug,
      excerpt: excerpt || content.substring(0, 150) + '...',
      content,
      coverImage,
      authorId: user.id,
      authorName: user.name,
      tags: JSON.stringify(tags || []),
      published: published || false,
    });

    return NextResponse.json({ 
      success: true,
      post: {
        id: postId,
        slug,
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createPostHandler, true);

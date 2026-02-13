"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Tag, User, Send } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  authorName: string;
  tags: string[];
  createdAt: Date;
}

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date;
  status: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/posts/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      }
    } catch {
      console.error('Failed to fetch post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/blog/comments/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch {
      console.error('Failed to fetch comments');
    }
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postSlug: slug,
          ...commentForm,
        }),
      });

      if (response.ok) {
        setCommentForm({ name: '', email: '', content: '' });
        alert('Comment submitted! It will appear after approval.');
        fetchComments();
      }
    } catch {
      console.error('Failed to comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/60">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/60 mb-4">Post not found</p>
          <button
            onClick={() => router.push('/')}
            className="text-accent-primary hover:underline"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 py-6">
        <div className="max-w-4xl mx-auto px-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-6 py-12">
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full aspect-video object-cover rounded-2xl mb-8"
          />
        )}

        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/60 mb-8 pb-8 border-b border-foreground/10">
          <div className="flex items-center gap-2">
            <User size={16} />
            <span>{post.authorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          {post.tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag size={16} />
              <span>{post.tags.join(', ')}</span>
            </div>
          )}
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {post.content.split('\n').map((paragraph, i) => (
            <p key={i} className="text-foreground/80 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Comments Section */}
        <div className="mt-16 pt-12 border-t border-foreground/10">
          <h2 className="text-2xl font-light text-foreground mb-8">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-12 bg-foreground/5 rounded-xl p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Leave a comment</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                required
                placeholder="Your name *"
                value={commentForm.name}
                onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                className="bg-background border border-foreground/10 rounded-lg py-2 px-4 text-sm text-foreground focus:outline-none focus:border-accent-primary/50"
              />
              <input
                type="email"
                required
                placeholder="Your email *"
                value={commentForm.email}
                onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                className="bg-background border border-foreground/10 rounded-lg py-2 px-4 text-sm text-foreground focus:outline-none focus:border-accent-primary/50"
              />
            </div>
            <textarea
              required
              placeholder="Your comment *"
              value={commentForm.content}
              onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
              className="w-full bg-background border border-foreground/10 rounded-lg py-2 px-4 text-sm text-foreground focus:outline-none focus:border-accent-primary/50 resize-none"
              rows={4}
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 disabled:opacity-50 text-accent-primary rounded-lg transition-all"
            >
              <Send size={16} />
              <span>{submitting ? 'Submitting...' : 'Submit Comment'}</span>
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-foreground/5 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
                      <User size={16} className="text-accent-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{comment.authorName}</p>
                      <p className="text-xs text-foreground/60">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-foreground/80 leading-relaxed">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

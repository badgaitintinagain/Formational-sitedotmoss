"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  createdAt: Date;
  tags: string[];
}

export default function AdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await fetchPosts();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (!data.user || data.user.role !== 'admin') {
        router.push('/');
      } else {
        setUser(data.user);
      }
    } catch {
      router.push('/');
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog/posts/all');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/blog/posts/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentStatus }),
      });
      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to toggle publish:', error);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const response = await fetch(`/api/blog/posts/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-foreground/10 rounded-lg transition-colors text-foreground"
              title="Back to home"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <h1 className="text-4xl font-light tracking-tight text-foreground">Admin Panel</h1>
              <p className="text-sm text-foreground/60 mt-2">Manage your blog content</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/admin/new')}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary rounded-lg transition-all"
            >
              <Plus size={18} />
              <span>New Post</span>
            </button>
            <button
              onClick={() => router.push('/admin/comments')}
              className="flex items-center gap-2 px-4 py-2 bg-foreground/10 hover:bg-foreground/20 text-foreground rounded-lg transition-all"
            >
              <span>Manage Comments</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="text-center text-foreground/60">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground/60 mb-4">No posts yet</p>
            <button
              onClick={() => router.push('/admin/new')}
              className="text-accent-primary hover:underline"
            >
              Create your first post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 hover:bg-foreground/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-medium text-foreground">{post.title}</h2>
                      {post.published ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-full">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/60 mb-3">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-foreground/40">
                      <span>/{post.slug}</span>
                      {post.tags.length > 0 && (
                        <span>Tags: {post.tags.join(', ')}</span>
                      )}
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => togglePublish(post.id, post.published)}
                      className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                      title={post.published ? 'Unpublish' : 'Publish'}
                    >
                      {post.published ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => router.push(`/admin/edit/${post.id}`)}
                      className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

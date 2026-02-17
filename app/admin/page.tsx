"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, Search, Calendar, Tag, User, MessageSquare } from 'lucide-react';
import Image from 'next/image';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  createdAt: Date;
  tags: string[];
  coverImage?: string;
  authorName: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await fetchPosts();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filtered = [...posts];
    
    // Filter by status
    if (filterStatus === 'published') {
      filtered = filtered.filter(p => p.published);
    } else if (filterStatus === 'draft') {
      filtered = filtered.filter(p => !p.published);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredPosts(filtered);
  }, [posts, searchQuery, filterStatus]);

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
    if (!confirm('แน่ใจหรือว่าต้องการลบโพสต์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
    try {
      const response = await fetch(`/api/blog/posts/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('ลบโพสต์สำเร็จ!');
        fetchPosts();
      } else {
        alert('ไม่สามารถลบโพสต์ได้');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('เกิดข้อผิดพลาดในการลบโพสต์');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-foreground/60">Checking authentication...</div>
        </div>
      </div>
    );
  }

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.published).length,
    draft: posts.filter(p => !p.published).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-foreground/10 rounded-lg transition-colors text-foreground"
                title="Back to home"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Admin Console</h1>
                <p className="text-xs text-foreground/40">Welcome back, {user.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/admin/comments')}
                className="flex items-center gap-2 px-4 py-2 bg-foreground/10 hover:bg-foreground/20 text-foreground rounded-lg transition-all text-sm"
              >
                <MessageSquare size={16} />
                <span className="hidden md:inline">Comments</span>
              </button>
              <button
                onClick={() => router.push('/admin/new')}
                className="flex items-center gap-2 px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary font-medium rounded-lg transition-all text-sm"
              >
                <Plus size={16} />
                <span>New Post</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-foreground/5 rounded-lg p-3 border border-foreground/10">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-foreground/40">Total Posts</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.published}</p>
              <p className="text-xs text-green-600/60 dark:text-green-400/60">Published</p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.draft}</p>
              <p className="text-xs text-yellow-600/60 dark:text-yellow-400/60">Drafts</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-sm text-foreground focus:outline-none focus:border-accent-primary/50 transition-all"
              />
            </div>
            <div className="flex gap-1 bg-foreground/5 rounded-lg p-1 border border-foreground/10">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterStatus === 'all'
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('published')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterStatus === 'published'
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterStatus === 'draft'
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Drafts
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-foreground/60">Loading posts...</div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-foreground/5 flex items-center justify-center">
              <Search size={32} className="text-foreground/20" />
            </div>
            <p className="text-foreground/60 mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No posts found' : 'No posts yet'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => router.push('/admin/new')}
                className="text-accent-primary hover:underline text-sm"
              >
                Create your first post
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="group bg-foreground/5 border border-foreground/10 rounded-xl overflow-hidden hover:border-accent-primary/30 hover:shadow-lg transition-all"
              >
                <div className="md:flex">
                  {/* Cover Image */}
                  <div className="md:w-72 md:h-48 h-56 bg-foreground/10 relative flex-shrink-0">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 288px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-accent-primary/10 flex items-center justify-center">
                            <Calendar size={28} className="text-accent-primary/40" />
                          </div>
                          <p className="text-xs text-foreground/30">No cover image</p>
                        </div>
                      </div>
                    )}
                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      {post.published ? (
                        <span className="px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium flex items-center gap-1.5">
                          <Eye size={12} />
                          Published
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium flex items-center gap-1.5">
                          <EyeOff size={12} />
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col">
                    {/* Title */}
                    <h2 className="text-xl font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-accent-primary transition-colors">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-sm text-foreground/60 line-clamp-2 mb-4 flex-1">
                      {post.excerpt || 'No excerpt available'}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/40 mb-4">
                      <div className="flex items-center gap-1.5">
                        <User size={12} />
                        <span>{post.authorName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{new Date(post.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Tag size={12} />
                          <span>{post.tags.length} tags</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.tags.slice(0, 4).map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-1 bg-accent-primary/10 text-accent-primary rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                        {post.tags.length > 4 && (
                          <span className="text-[10px] px-2 py-1 bg-foreground/10 text-foreground/40 rounded-full">
                            +{post.tags.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-foreground/10">
                      <button
                        onClick={() => togglePublish(post.id, post.published)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 hover:bg-foreground/10 rounded-lg transition-colors text-xs font-medium"
                        title={post.published ? 'Unpublish' : 'Publish'}
                      >
                        {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span>{post.published ? 'Unpublish' : 'Publish'}</span>
                      </button>
                      <button
                        onClick={() => router.push(`/admin/edit/${post.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-lg transition-colors text-xs font-medium"
                        title="Edit"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="px-3 py-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

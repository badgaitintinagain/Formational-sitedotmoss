"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, Search,
  MessageSquare, Layers, Grid, List
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  createdAt: Date;
  tags: string[];
  coverImage?: string;
  images: string[];
  authorName: string;
  likesCount?: number;
  commentsCount?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    if (filterStatus === 'published') filtered = filtered.filter(p => p.published);
    else if (filterStatus === 'draft') filtered = filtered.filter(p => !p.published);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    setFilteredPosts(filtered);
  }, [posts, searchQuery, filterStatus]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.user || data.user.role !== 'admin') router.push('/');
      else setUser(data.user);
    } catch { router.push('/'); }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blog/posts/all');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/blog/posts/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !current }),
      });
      if (res.ok) fetchPosts();
    } catch (err) { console.error(err); }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/blog/posts/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPosts();
      else alert('Failed to delete post');
    } catch (err) { console.error(err); }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-foreground/50">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.published).length,
    draft: posts.filter(p => !p.published).length,
  };

  // Get thumbnail for a post
  const getThumbnail = (post: Post) =>
    post.images?.[0] || post.coverImage || null;

  return (
    <div className="min-h-screen bg-background flex">

      {/* ─── Sidebar ─── */}
      <aside className="w-60 bg-background border-r border-foreground/10 hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto z-40">
        {/* Logo area */}
        <div className="p-5 pb-3 border-b border-foreground/10">
          <p className="font-bold text-lg text-foreground">Admin</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-7 h-7 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <span className="text-accent-primary font-bold text-xs">{user.name.charAt(0)}</span>
            </div>
            <p className="text-xs text-foreground/60 truncate">{user.name}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {/* Filter buttons */}
          {([
            { label: 'All Posts', value: 'all', count: stats.total },
            { label: 'Published', value: 'published', count: stats.published },
            { label: 'Drafts', value: 'draft', count: stats.draft },
          ] as const).map(item => (
            <button
              key={item.value}
              onClick={() => setFilterStatus(item.value)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                filterStatus === item.value
                  ? 'bg-accent-primary/10 text-accent-primary font-semibold'
                  : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <span>{item.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                filterStatus === item.value ? 'bg-accent-primary/20' : 'bg-foreground/10'
              }`}>{item.count}</span>
            </button>
          ))}

          <div className="pt-3 mt-3 border-t border-foreground/10 space-y-1">
            <button
              onClick={() => router.push('/admin/comments')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-all"
            >
              <MessageSquare size={16} />
              <span>Comments</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-all"
            >
              <ArrowLeft size={16} />
              <span>Back to Site</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-foreground/10 px-4 md:px-6 py-3">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            {/* Mobile back */}
            <button onClick={() => router.push('/')} className="md:hidden p-2 hover:bg-foreground/10 rounded-lg">
              <ArrowLeft size={18} className="text-foreground" />
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-foreground/5 border border-foreground/10 rounded-xl text-sm focus:outline-none focus:border-accent-primary/40 text-foreground transition-colors placeholder:text-foreground/40"
              />
            </div>

            {/* Mobile filter pills */}
            <div className="md:hidden flex gap-1.5 overflow-x-auto">
              {(['all', 'published', 'draft'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    filterStatus === f ? 'bg-accent-primary/15 text-accent-primary' : 'bg-foreground/8 text-foreground/60'
                  }`}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* View toggle */}
              <div className="hidden sm:flex bg-foreground/8 rounded-lg p-0.5">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background shadow text-foreground' : 'text-foreground/40'}`}>
                  <Grid size={15} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow text-foreground' : 'text-foreground/40'}`}>
                  <List size={15} />
                </button>
              </div>

              <button
                onClick={() => router.push('/admin/new')}
                className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-xl hover:opacity-85 transition-opacity"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">New Post</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Posts', value: stats.total, color: 'text-foreground' },
              { label: 'Published', value: stats.published, color: 'text-green-600 dark:text-green-400' },
              { label: 'Drafts', value: stats.draft, color: 'text-yellow-500 dark:text-yellow-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-foreground/6 border border-foreground/12 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Post grid/list */}
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
              <p className="text-sm text-foreground/40">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search size={22} className="text-foreground/30" />
              </div>
              <p className="font-semibold text-foreground">No posts found</p>
              <p className="text-sm text-foreground/40 mt-1">Try different filters or create a new post</p>
              <button onClick={() => router.push('/admin/new')} className="mt-4 px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-xl hover:opacity-85 transition-opacity">
                Create Post
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── Grid View (Instagram-style) ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {filteredPosts.map(post => {
                const thumb = getThumbnail(post);
                const hasMultiple = (post.images?.length ?? 0) > 1;
                return (
                  <div key={post.id} className="relative aspect-square bg-foreground/5 overflow-hidden rounded-sm">
                    {thumb ? (
                      <Image src={thumb} alt={post.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10">
                        <span className="text-2xl font-bold text-foreground/20">{post.title.charAt(0)}</span>
                      </div>
                    )}

                    {/* Multi-image indicator */}
                    {hasMultiple && (
                      <div className="absolute top-2 right-2">
                        <Layers size={16} className="text-white drop-shadow-lg" />
                      </div>
                    )}

                    {/* Status dot */}
                    <div className={`absolute top-2 left-2 w-2 h-2 rounded-full shadow ${post.published ? 'bg-green-400' : 'bg-yellow-400'}`} />

                    {/* Always-visible action bar */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent pt-10 px-2 pb-2">
                      <p className="text-white text-[10px] font-medium truncate mb-1.5 px-0.5">{post.title}</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/admin/edit/${post.id}`)}
                          className="flex-1 py-1.5 bg-white/25 hover:bg-white/35 active:bg-white/45 rounded-lg text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Edit size={11} /> Edit
                        </button>
                        <button
                          onClick={() => togglePublish(post.id, post.published)}
                          className="p-1.5 bg-white/25 hover:bg-white/35 active:bg-white/45 rounded-lg text-white transition-colors"
                          title={post.published ? 'Unpublish' : 'Publish'}
                        >
                          {post.published ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-1.5 bg-red-500/70 hover:bg-red-500 active:bg-red-600 rounded-lg text-white transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── List View ── */
            <div className="space-y-2">
              {filteredPosts.map(post => {
                const thumb = getThumbnail(post);
                const hasMultiple = (post.images?.length ?? 0) > 1;
                return (
                  <div key={post.id} className="flex items-center gap-4 bg-foreground/6 hover:bg-foreground/8 border border-foreground/12 rounded-2xl p-3 transition-all">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-foreground/5">
                      {thumb ? (
                        <Image src={thumb} alt={post.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xl font-bold text-foreground/20">{post.title.charAt(0)}</span>
                        </div>
                      )}
                      {hasMultiple && (
                        <div className="absolute top-1 right-1">
                          <Layers size={11} className="text-white drop-shadow" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-foreground text-sm truncate">{post.title || 'Untitled'}</p>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          post.published ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {post.published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/50 truncate">{post.excerpt || 'No description'}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-foreground/40">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-accent-primary">#{tag}</span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => router.push(`/admin/edit/${post.id}`)}
                        className="p-2 text-foreground/60 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => togglePublish(post.id, post.published)}
                        className={`p-2 rounded-lg transition-colors ${post.published ? 'text-green-500 hover:bg-green-500/10' : 'text-foreground/60 hover:bg-foreground/10 hover:text-foreground'}`}
                        title={post.published ? 'Unpublish' : 'Publish'}
                      >
                        {post.published ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-2 text-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


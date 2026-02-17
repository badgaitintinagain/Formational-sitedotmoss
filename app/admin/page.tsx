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
    <div className="min-h-screen bg-background flex">
      {/* LEFT: Sidebar Menu */}
      <aside className="w-64 bg-foreground/5 border-r border-foreground/10 hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Admin</h1>
          <p className="text-xs text-foreground/40">Console</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${filterStatus === 'all' ? 'bg-accent-primary/10 text-accent-primary font-medium' : 'text-foreground/60 hover:bg-foreground/5'}`}
          >
            <div className="p-2 bg-white/50 rounded-lg shadow-sm">
              <User size={18} />
            </div>
            <span>All Posts</span>
            <span className="ml-auto text-xs bg-foreground/10 px-2 py-0.5 rounded-full">{stats.total}</span>
          </button>

          <button
            onClick={() => setFilterStatus('published')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${filterStatus === 'published' ? 'bg-green-500/10 text-green-600 font-medium' : 'text-foreground/60 hover:bg-foreground/5'}`}
          >
            <div className="p-2 bg-white/50 rounded-lg shadow-sm">
              <Eye size={18} />
            </div>
            <span>Published</span>
            <span className="ml-auto text-xs bg-foreground/10 px-2 py-0.5 rounded-full">{stats.published}</span>
          </button>

          <button
            onClick={() => setFilterStatus('draft')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${filterStatus === 'draft' ? 'bg-yellow-500/10 text-yellow-600 font-medium' : 'text-foreground/60 hover:bg-foreground/5'}`}
          >
            <div className="p-2 bg-white/50 rounded-lg shadow-sm">
              <EyeOff size={18} />
            </div>
            <span>Drafts</span>
            <span className="ml-auto text-xs bg-foreground/10 px-2 py-0.5 rounded-full">{stats.draft}</span>
          </button>

          <div className="pt-6 mt-6 border-t border-foreground/10">
            <button
              onClick={() => router.push('/admin/comments')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/60 hover:bg-foreground/5 transition-all"
            >
              <div className="p-2 bg-white/50 rounded-lg shadow-sm">
                <MessageSquare size={18} />
              </div>
              <span>Comments</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/60 hover:bg-foreground/5 transition-all"
            >
              <div className="p-2 bg-white/50 rounded-lg shadow-sm">
                <ArrowLeft size={18} />
              </div>
              <span>Back to Site</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-foreground/10">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-foreground/40 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT: Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-background/50">
        <div className="max-w-5xl mx-auto p-8">
          
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Posts</h2>
              <p className="text-foreground/60 mt-1">Manage and create new content</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white border border-foreground/10 rounded-xl text-sm focus:outline-none focus:ring-2 ring-accent-primary/20 shadow-sm w-64"
                />
              </div>
              <button
                onClick={() => router.push('/admin/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white hover:bg-black/80 rounded-xl transition-all text-sm font-medium shadow-lg shadow-black/20"
              >
                <Plus size={18} />
                <span>Create Post</span>
              </button>
            </div>
          </div>

          {/* Post List */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-foreground/20 border-t-accent-primary rounded-full mx-auto mb-4"/>
              <p className="text-foreground/40 text-sm">Loading content...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white border border-foreground/10 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No posts found</h3>
              <p className="text-foreground/40 text-sm mb-6">Try adjusting your search or filters</p>
              <button onClick={() => router.push('/admin/new')} className="text-accent-primary text-sm font-medium hover:underline">
                Create new post
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPosts.map((post) => (
                <div 
                  key={post.id}
                  className="group bg-white border border-foreground/10 hover:border-accent-primary/30 rounded-2xl p-4 flex gap-6 transition-all hover:shadow-md items-start"
                >
                  {/* Thumbnail */}
                  <div className="w-32 h-24 bg-foreground/5 rounded-lg flex-shrink-0 overflow-hidden relative border border-foreground/5">
                    {post.coverImage ? (
                      <Image 
                        src={post.coverImage} 
                        alt="Cover" 
                        fill 
                        className="object-cover transition-transform group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar size={20} className="text-foreground/20" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="text-lg font-bold text-foreground truncate group-hover:text-accent-primary m-0 p-0 leading-tight">
                        {post.title || 'Untitled Post'}
                      </h3>
                      {post.published ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-md flex-shrink-0">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded-md flex-shrink-0">
                          Draft
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-foreground/50 line-clamp-2 mb-3 h-10">
                      {post.excerpt || 'No description available for this post...'}
                    </p>

                    <div className="flex items-center justify-between border-t border-foreground/5 pt-3 mt-auto">
                      <div className="flex items-center gap-4 text-xs text-foreground/40">
                        <span className="flex items-center gap-1.5">
                          <User size={12} />
                          {post.authorName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => router.push(`/admin/edit/${post.id}`)}
                          className="p-1.5 text-foreground/40 hover:text-accent-primary hover:bg-accent-primary/10 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => deletePost(post.id)}
                          className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FileText, ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import BlogModal from '@/components/BlogModal';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  authorName: string;
  tags: string[];
  createdAt: Date;
  likesCount?: number;
  commentsCount?: number;
}

export default function BlogListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog/posts');
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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-white/5 backdrop-blur-xl py-3">
        <div className="max-w-[935px] mx-auto px-3 md:px-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-base font-medium text-foreground">Blog</h1>
            <div className="w-8" />
          </div>
        </div>
      </header>

      <main className="max-w-[935px] mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-foreground/60">Loading...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={48} className="text-foreground/20 mb-3" />
            <p className="text-foreground/60">No posts yet</p>
            <p className="text-xs text-foreground/40 mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                onClick={() => setSelectedSlug(post.slug)}
                className="group cursor-pointer flex flex-col gap-3"
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-foreground/5 overflow-hidden relative rounded-xl border border-white/20 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 935px) 50vw, 450px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20">
                      <FileText size={32} className="text-foreground/20" />
                    </div>
                  )}
                  {/* Stats Overlay */}
                  <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 text-white text-xs">
                      <Heart size={12} fill="white" />
                      <span>{post.likesCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white text-xs">
                      <MessageCircle size={12} fill="white" />
                      <span>{post.commentsCount || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1 px-1">
                  <div className="flex items-center justify-between text-xs text-foreground/50 uppercase tracking-wider font-medium">
                     <span>{new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  
                  <h2 className="text-lg font-bold text-foreground leading-snug group-hover:text-accent-primary transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-sm text-foreground/70 line-clamp-2 leading-relaxed">
                    {post.excerpt || "No summary available."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Blog Modal */}
      {selectedSlug && (
        <BlogModal
          slug={selectedSlug}
          isOpen={!!selectedSlug}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}

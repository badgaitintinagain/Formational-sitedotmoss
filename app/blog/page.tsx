"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FileText, ArrowLeft, Heart, MessageCircle, Layers } from 'lucide-react';
import BlogModal from '@/components/BlogModal';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  images: string[];
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

      <main className="max-w-[935px] mx-auto px-1 md:px-2 py-4 md:py-6">
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
          <div className="grid grid-cols-3 gap-0.5 md:gap-1">
            {posts.map((post) => {
              const thumbnail = post.images?.[0] || post.coverImage || null;
              const hasMultiple = (post.images?.length ?? 0) > 1;
              return (
                <article
                  key={post.id}
                  onClick={() => setSelectedSlug(post.slug)}
                  className="group cursor-pointer bg-foreground/5 relative overflow-hidden transition-all duration-200 aspect-square"
                >
                  {/* Square thumbnail */}
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 935px) 33vw, 300px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20">
                      <FileText size={32} className="text-foreground/20" />
                    </div>
                  )}

                  {/* Multi-image indicator */}
                  {hasMultiple && (
                    <div className="absolute top-2 right-2 z-10 drop-shadow-lg">
                      <Layers size={16} className="text-white" />
                    </div>
                  )}

                  {/* Hover overlay (Instagram-style) */}
                  <div className="absolute inset-0 bg-black/55 transition-all duration-200 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-3 text-center gap-2">
                    <div className="flex items-center gap-4 text-white">
                      <span className="flex items-center gap-1.5 font-bold text-sm">
                        <Heart size={18} fill="white" />
                        {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-sm">
                        <MessageCircle size={18} fill="white" />
                        {post.commentsCount || 0}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-xs line-clamp-2 leading-snug">{post.title}</h3>
                  </div>
                </article>
              );
            })}
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

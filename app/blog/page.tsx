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
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <article
                key={post.id}
                onClick={() => setSelectedSlug(post.slug)}
                className="group cursor-pointer bg-background relative overflow-hidden transition-all duration-200 aspect-square"
              >
                {/* รูปแบบ IG - รูปสี่เหลี่ยมจัตุรัส */}
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
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
                
                {/* Hover overlay แบบ IG */}
                <div className="absolute inset-0 bg-black/50 transition-all duration-200 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-4 text-center">
                  <div className="text-white flex gap-6 mb-3">
                    <div className="flex items-center gap-2">
                      <Heart size={20} fill="white" />
                      <span className="font-bold">{post.likesCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle size={20} fill="white" />
                      <span className="font-bold">{post.commentsCount || 0}</span>
                    </div>
                  </div>
                  
                  {/* เพิ่ม Title และ Date ใน Overlay ตามที่ขอ แต่คง format IG ไว้ */}
                  <h3 className="text-white font-bold text-sm line-clamp-2 mb-1">{post.title}</h3>
                  <p className="text-white/80 text-xs text-center line-clamp-2 mb-2">
                    {post.excerpt || "No summary available."}
                  </p>
                  <p className="text-white/60 text-[10px] uppercase tracking-wider">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
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

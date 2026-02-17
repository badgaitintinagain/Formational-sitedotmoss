"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FileText, Tag, ArrowLeft } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  authorName: string;
  tags: string[];
  createdAt: Date;
}

export default function BlogListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-xl py-4">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-light text-foreground">Blog</h1>
            <div className="w-8" />
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-2 md:px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-foreground/60">Loading...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText size={64} className="text-foreground/20 mb-4" />
            <p className="text-foreground/60 text-lg">No posts yet</p>
            <p className="text-sm text-foreground/40 mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2">
            {posts.map((post) => (
              <article
                key={post.id}
                onClick={() => router.push(`/blog/${post.slug}`)}
                className="group cursor-pointer bg-background border border-foreground/10 overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                {/* รูปแบบ IG - รูปสี่เหลี่ยมจัตุรัส */}
                <div className="aspect-square bg-foreground/5 overflow-hidden relative">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20">
                      <FileText size={48} className="text-foreground/20" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                {/* เนื้อหาด้านล่าง */}
                <div className="p-4">
                  <h2 className="text-base md:text-lg font-medium text-foreground mb-2 line-clamp-2 group-hover:text-accent-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-xs md:text-sm text-foreground/60 mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-foreground/40">
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    {post.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag size={12} />
                        {post.tags[0]}
                      </span>
                    )}
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

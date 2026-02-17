"use client";
import React, { useState, useRef, useEffect } from 'react';
import Tile from './Tile';
import Image from 'next/image';
import Link from 'next/link';
import { FileText, X, Calendar, Tag } from 'lucide-react';
import gsap from 'gsap';

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

interface BlogTileProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const BlogTile: React.FC<BlogTileProps> = ({ size = '2x2', accent = 'primary', opacity = 40 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch recent posts when modal opens
  useEffect(() => {
    if (isOpen && posts.length === 0) {
      fetchPosts();
    }
  }, [isOpen, posts]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/blog/posts?limit=10');
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

  // Animation
  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(modalRef.current, 
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  return (
    <>
      <Tile 
        size={size} 
        label="Blog" 
        icon={FileText} 
        accentType={accent}
        opacity={opacity}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col items-center justify-center">
        
        </div>
      </Tile>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Blog Window */}
          <div 
            ref={modalRef}
            className="relative w-full max-w-5xl h-[85vh] bg-background border border-foreground/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-foreground/5 bg-foreground/5">
              <div className="flex items-center gap-3">
                <FileText className="text-accent-primary" size={24} />
                <div>
                  <h2 className="text-2xl font-light tracking-tight text-foreground">Blog</h2>
                  <p className="text-[10px] uppercase tracking-widest opacity-50 text-foreground">
                    Thoughts & Stories
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-foreground"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-[10px] uppercase tracking-widest opacity-40 text-foreground">
                    Loading posts...
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText size={48} className="text-foreground/20 mb-4" />
                  <p className="text-foreground/60">No posts yet</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 text-foreground mt-2">
                    Check back soon!
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {posts.map((post) => (
                    <article 
                      key={post.id}
                      onClick={() => window.location.href = `/blog/${post.slug}`}
                      className="group cursor-pointer bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-xl overflow-hidden transition-all duration-300"
                    >
                      {post.coverImage && (
                        <div className="aspect-video bg-foreground/5 overflow-hidden relative">
                          <Image 
                            src={post.coverImage} 
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="text-lg font-medium text-foreground mb-2 group-hover:text-accent-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-foreground/60 mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest opacity-50">
                          <div className="flex items-center gap-2">
                            <Calendar size={12} />
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                          {post.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag size={12} />
                              <span>{post.tags[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-foreground/5 bg-foreground/5 text-center">
              <Link 
                href="/blog" 
                className="text-sm text-accent-primary hover:underline"
              >
                View all posts →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlogTile;

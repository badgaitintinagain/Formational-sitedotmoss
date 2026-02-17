"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Heart, Send, Trash2, MessageCircle, CornerDownRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

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
  parentId?: string | null;
}

interface BlogModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlogModal({ slug, isOpen, onClose }: BlogModalProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [userId, setUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    // Generate or retrieve user ID
    let uid = localStorage.getItem('userId');
    if (!uid) {
      uid = crypto.randomUUID();
      localStorage.setItem('userId', uid);
    }
    setUserId(uid);

    // Check if admin
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isOpen && slug) {
      fetchPost(); // This will also fetch likes
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, slug, userId]);

  const checkAdmin = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setIsAdmin(data.user?.role === 'admin');
    } catch {
      setIsAdmin(false);
    }
  };

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/posts/by-slug?slug=${encodeURIComponent(slug)}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
        // Fetch likes after we have the post
        if (data.post?.id) {
          const likesResponse = await fetch(`/api/blog/posts/${data.post.id}/like?userId=${userId}`);
          if (likesResponse.ok) {
            const likesData = await likesResponse.json();
            setLikesCount(likesData.likesCount);
            setIsLiked(likesData.isLiked);
          }
        }
      }
    } catch {
      console.error('Failed to fetch post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/blog/comments/by-post?slug=${encodeURIComponent(slug)}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch {
      console.error('Failed to fetch comments');
    }
  };

  const handleLike = async () => {
    if (!post?.id) return;
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/blog/posts/${post.id}/like`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikesCount(data.likesCount);
        setIsLiked(data.isLiked);
      }
    } catch {
      console.error('Failed to like post');
    }
  };

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
          name: commentForm.name,
          email: commentForm.email,
          content: commentForm.content,
          parentId: replyingTo,
        }),
      });

      if (response.ok) {
        setCommentForm({ name: '', email: '', content: '' });
        setReplyingTo(null);
        fetchComments();
      }
    } catch {
      console.error('Failed to comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('ต้องการลบคอมเมนท์นี้หรือไม่?')) return;

    try {
      const response = await fetch(`/api/blog/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchComments();
      }
    } catch {
      console.error('Failed to delete comment');
    }
  };

  const getReplies = (parentId: string) => {
    return comments.filter(c => c.parentId === parentId);
  };

  const topLevelComments = comments.filter(c => !c.parentId);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl h-[90vh] bg-background rounded-lg overflow-hidden flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Left: Image */}
        {post.coverImage && (
          <div className="md:w-3/5 bg-black flex items-center justify-center relative">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-contain"
              priority
            />
          </div>
        )}

        {/* Right: Content & Comments */}
        <div className={`${post.coverImage ? 'md:w-2/5' : 'w-full'} flex flex-col bg-background`}>
          {/* Header */}
          <div className="border-b border-foreground/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <span className="text-accent-primary font-medium text-sm">
                  {post.authorName[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">{post.authorName}</p>
                <p className="text-xs text-foreground/60">
                  {new Date(post.createdAt).toLocaleDateString('th-TH')}
                </p>
              </div>
            </div>
          </div>

          {/* Content & Comments - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Post Title & Content */}
            <div className="space-y-2">
              <h1 className="text-xl font-medium text-foreground">{post.title}</h1>
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none 
                prose-headings:text-foreground prose-p:text-foreground/80 
                prose-a:text-accent-primary prose-strong:text-foreground
                prose-img:rounded-lg prose-img:w-full">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: ({...props}) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        {...props} 
                        alt={props.alt || 'Blog image'}
                        className="w-full h-auto rounded-lg my-2"
                        loading="lazy"
                      />
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-3 pt-4 border-t border-foreground/10">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <MessageCircle size={16} />
                Comments ({comments.length})
              </h3>
              
              {topLevelComments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-accent-primary font-medium">
                        {comment.authorName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground text-sm">{comment.authorName}</p>
                        <span className="text-xs text-foreground/40">
                          {new Date(comment.createdAt).toLocaleDateString('th-TH')}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="ml-auto text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-xs text-accent-primary hover:underline mt-1 flex items-center gap-1"
                      >
                        <CornerDownRight size={12} />
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Nested Replies */}
                  {getReplies(comment.id).map((reply) => (
                    <div key={reply.id} className="ml-8 flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-accent-primary font-medium">
                          {reply.authorName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground text-xs">{reply.authorName}</p>
                          <span className="text-[10px] text-foreground/40">
                            {new Date(reply.createdAt).toLocaleDateString('th-TH')}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteComment(reply.id)}
                              className="ml-auto text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Like & Comment Form */}
          <div className="border-t border-foreground/10 p-4 space-y-3 bg-background">
            {/* Like Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-all ${
                  isLiked ? 'text-red-500' : 'text-foreground/60 hover:text-red-500'
                }`}
              >
                <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              <span className="text-sm text-foreground/80 font-medium">
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </span>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-2">
              {replyingTo && (
                <div className="flex items-center justify-between bg-accent-primary/10 p-2 rounded text-xs">
                  <span className="text-accent-primary">
                    Replying to comment...
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-foreground/60 hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={commentForm.name}
                  onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                  className="bg-foreground/5 border border-foreground/10 rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-accent-primary/50"
                />
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  value={commentForm.email}
                  onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                  className="bg-foreground/5 border border-foreground/10 rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-accent-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Add a comment..."
                  value={commentForm.content}
                  onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                  className="flex-1 bg-foreground/5 border border-foreground/10 rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:border-accent-primary/50"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 disabled:opacity-50 text-accent-primary rounded-lg transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

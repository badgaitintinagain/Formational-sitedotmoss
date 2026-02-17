"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, Upload, ImageIcon, Eye, EyeOff, ArrowLeft, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  published: boolean;
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    coverImage: '',
    tags: '',
    published: false,
  });

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await fetchPost();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (!data.user || data.user.role !== 'admin') {
        router.push('/');
      }
    } catch {
      router.push('/');
    }
  };

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/posts/${postId}`);
      if (response.ok) {
        const data = await response.json();
        const post: Post = data.post;
        setFormData({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || '',
          coverImage: post.coverImage || '',
          tags: post.tags.join(', '),
          published: post.published,
        });
      } else {
        alert('Post not found');
        router.push('/admin');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Error fetching post');
      router.push('/admin');
    } finally {
      setFetching(false);
    }
  };

  const handleImageUpload = async (file: File, isCover: boolean = true) => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/blog/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (isCover) {
          setFormData(prev => ({ ...prev, coverImage: data.url }));
        } else {
          const markdownImage = `\n![Image](${data.url})\n`;
          setFormData(prev => ({ 
            ...prev, 
            content: prev.content + markdownImage 
          }));
        }
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // สำหรับการแก้ไข ใช้ API route ที่มีอยู่แล้ว (ต้องสร้าง PATCH handler)
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        alert('Post updated successfully!');
        router.push('/admin');
      } else {
        alert('Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Error updating post');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-foreground/60">Loading post...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-foreground/10 rounded-lg transition-colors text-foreground"
                title="Back to admin"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-medium text-foreground">Edit Post</h1>
                <p className="text-xs text-foreground/40">Make your changes and save</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                  showPreview 
                    ? 'bg-accent-primary/20 text-accent-primary' 
                    : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
                }`}
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                <span className="hidden md:inline">{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 disabled:opacity-50 text-accent-primary font-medium rounded-lg transition-all text-sm"
              >
                <Save size={16} />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className={`grid ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
          {/* Edit Form */}
          <div className="space-y-4">
            {/* Title */}
            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4">
              <label className="block text-xs font-medium text-foreground/60 mb-2 uppercase tracking-wide">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-transparent border-0 text-2xl font-semibold text-foreground focus:outline-none placeholder:text-foreground/30"
                placeholder="Enter your post title..."
              />
            </div>

            {/* Cover Image */}
            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4">
              <label className="block text-xs font-medium text-foreground/60 mb-3 uppercase tracking-wide">
                Cover Image
              </label>
              {formData.coverImage ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.coverImage}
                    alt="Cover"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImage: '' })}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-64 border-2 border-dashed border-foreground/20 rounded-lg hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload size={28} className="text-accent-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {uploading ? 'Uploading...' : 'Click to upload cover image'}
                    </p>
                    <p className="text-xs text-foreground/40 mt-1">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, true);
                }}
                className="hidden"
              />
            </div>

            {/* Excerpt */}
            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4">
              <label className="block text-xs font-medium text-foreground/60 mb-2 uppercase tracking-wide">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full bg-transparent border-0 text-sm text-foreground focus:outline-none placeholder:text-foreground/30 resize-none"
                rows={2}
                placeholder="Brief description of your post..."
              />
            </div>

            {/* Content */}
            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">
                  Content * (Markdown)
                </label>
                <button
                  type="button"
                  onClick={() => contentFileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary/10 hover:bg-accent-primary/20 disabled:opacity-50 text-accent-primary rounded-lg transition-all text-xs font-medium"
                >
                  <ImageIcon size={14} />
                  <span>Insert Image</span>
                </button>
                <input
                  ref={contentFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, false);
                  }}
                  className="hidden"
                />
              </div>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full bg-transparent border-0 text-sm text-foreground focus:outline-none placeholder:text-foreground/30 resize-none font-mono"
                rows={20}
                placeholder="# Write your content here&#10;&#10;Use **Markdown** formatting:&#10;- **bold**, *italic*&#10;- ## Headings&#10;- [Links](url)&#10;- ![Images](url)"
              />
            </div>

            {/* Tags */}
            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4">
              <label className="block text-xs font-medium text-foreground/60 mb-2 uppercase tracking-wide">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-transparent border-0 text-sm text-foreground focus:outline-none placeholder:text-foreground/30"
                placeholder="tech, design, tutorial (comma separated)"
              />
              {formData.tags && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.split(',').map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-accent-primary/10 text-accent-primary text-xs rounded-full"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Published Toggle */}
            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">
                    Publish Status
                  </label>
                  <p className="text-xs text-foreground/40 mt-1">
                    {formData.published ? 'Post is visible to everyone' : 'Post is hidden (draft)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, published: !formData.published })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    formData.published ? 'bg-green-500' : 'bg-foreground/20'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      formData.published ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto">
              <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-foreground/10">
                  <Eye size={16} className="text-accent-primary" />
                  <h2 className="text-sm font-medium text-foreground">Live Preview</h2>
                </div>
                
                {/* Preview Content */}
                <article>
                  {formData.coverImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={formData.coverImage}
                      alt="Cover"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    {formData.title || 'Untitled Post'}
                  </h1>
                  
                  {formData.excerpt && (
                    <p className="text-sm text-foreground/60 mb-4 italic">
                      {formData.excerpt}
                    </p>
                  )}
                  
                  {formData.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.tags.split(',').map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-accent-primary/10 text-accent-primary rounded-full"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:text-foreground prose-p:text-foreground/80 
                    prose-a:text-accent-primary prose-strong:text-foreground
                    prose-code:text-accent-primary prose-code:bg-accent-primary/10
                    prose-img:rounded-lg prose-img:w-full prose-img:h-auto">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        img: ({...props}) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            {...props} 
                            alt={props.alt || 'Blog image'}
                            className="w-full h-auto rounded-lg my-4"
                            loading="lazy"
                          />
                        ),
                      }}
                    >
                      {formData.content || '*No content yet...*'}
                    </ReactMarkdown>
                  </div>
                </article>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

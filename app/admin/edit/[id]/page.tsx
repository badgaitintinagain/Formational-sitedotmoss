"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, X, Upload, ImageIcon } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <div className="text-foreground">Loading post...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-light tracking-tight text-foreground">Edit Post</h1>
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 px-4 py-2 hover:bg-foreground/10 rounded-lg transition-colors text-foreground"
          >
            <X size={18} />
            <span>Cancel</span>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-lg py-3 px-4 text-foreground focus:outline-none focus:border-accent-primary/50 transition-all"
              placeholder="My Awesome Blog Post"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-lg py-3 px-4 text-foreground focus:outline-none focus:border-accent-primary/50 transition-all resize-none"
              rows={3}
              placeholder="Short description of your post..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Content * (Markdown supported)
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-lg py-3 px-4 text-foreground focus:outline-none focus:border-accent-primary/50 transition-all resize-none font-mono text-sm"
              rows={15}
              placeholder="# Your Content Here&#10;&#10;Write your post in **Markdown** format...&#10;&#10;You can use:&#10;- ![alt text](image-url) for images&#10;- **bold**, *italic*&#10;- ## Headings&#10;- [Links](url)"
            />
            <div className="mt-2">
              <button
                type="button"
                onClick={() => contentFileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-foreground/10 hover:bg-foreground/20 disabled:opacity-50 text-foreground rounded-lg transition-all text-sm"
              >
                <ImageIcon size={16} />
                <span>{uploading ? 'Uploading...' : 'Insert Image to Content'}</span>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cover Image URL
            </label>
            <div className="space-y-2">
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-lg py-3 px-4 text-foreground focus:outline-none focus:border-accent-primary/50 transition-all"
                placeholder="https://images.unsplash.com/..."
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 disabled:opacity-50 text-accent-primary rounded-lg transition-all text-sm"
                >
                  <Upload size={16} />
                  <span>{uploading ? 'Uploading...' : 'Upload Cover Image'}</span>
                </button>
                {formData.coverImage && (
                  <div className="flex-1 flex items-center gap-2 text-xs text-foreground/60">
                    <ImageIcon size={14} />
                    <span className="truncate">Image uploaded</span>
                  </div>
                )}
              </div>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-lg py-3 px-4 text-foreground focus:outline-none focus:border-accent-primary/50 transition-all"
              placeholder="tech, design, tutorial"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="w-4 h-4 rounded border-foreground/20"
            />
            <label htmlFor="published" className="text-sm text-foreground">
              Published
            </label>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-foreground/10">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-accent-primary/20 hover:bg-accent-primary/30 disabled:opacity-50 text-accent-primary font-medium rounded-lg transition-all"
            >
              <Save size={18} />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-6 py-3 hover:bg-foreground/10 text-foreground rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

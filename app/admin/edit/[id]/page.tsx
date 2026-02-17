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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-foreground/60">Loading post...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-foreground"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Edit Post</h1>
              <p className="text-xs text-foreground/50">Changes are saved automatically to draft</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-medium uppercase tracking-wider ${
                showPreview 
                  ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20' 
                  : 'bg-white/5 hover:bg-white/10 text-foreground border border-white/10'
              }`}
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden md:inline">{showPreview ? 'Hide' : 'Show'} Preview</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:opacity-90 disabled:opacity-50 font-bold rounded-xl transition-all text-xs uppercase tracking-wider shadow-lg"
            >
              <Save size={14} />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </header>

        <div className={`grid ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-3'} gap-6 transition-all duration-300`}>
          {/* Main Content Area */}
          <div className={`${showPreview ? 'col-span-1' : 'col-span-2'} space-y-6`}>
             <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
                {/* Title Input */}
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-transparent border-b border-foreground/10 text-3xl md:text-4xl font-bold text-foreground focus:outline-none focus:border-accent-primary/50 placeholder:text-foreground/20 pb-4 mb-6 transition-colors"
                  placeholder="Post Title"
                />

                {/* Content Editor */}
                <div className="relative min-h-[500px]">
                  <div className="absolute top-0 right-0 z-10">
                     <button
                        type="button"
                        onClick={() => contentFileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-2 text-foreground/40 hover:text-accent-primary transition-colors"
                        title="Insert Image"
                      >
                        <ImageIcon size={18} />
                      </button>
                  </div>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full h-full min-h-[500px] bg-transparent border-0 text-base text-foreground focus:outline-none placeholder:text-foreground/20 resize-none font-mono leading-relaxed"
                    placeholder="Tell your story..."
                  />
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
          </div>

          {/* Sidebar / Settings */}
          <div className="col-span-1 space-y-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-6 sticky top-24">
               {/* Publish Toggle */}
               <div className="flex items-center justify-between pb-6 border-b border-foreground/5">
                  <span className="text-sm font-medium text-foreground">Published</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, published: !formData.published })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.published ? 'bg-accent-primary' : 'bg-foreground/10'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.published ? 'translate-x-6' : ''}`} />
                  </button>
               </div>

               {/* Cover Image */}
               <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Cover Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative aspect-video rounded-2xl overflow-hidden bg-foreground/5 border-2 border-dashed border-foreground/10 hover:border-accent-primary/30 transition-all cursor-pointer"
                  >
                    {formData.coverImage ? (
                      <>
                        <div className="relative w-full h-full group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, coverImage: '' });
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remove Cover"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs">
                          Change Image
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-foreground/30">
                        <Upload size={24} className="mb-2" />
                        <span className="text-xs">Upload Cover</span>
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

               {/* Excerpt */}
               <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Excerpt</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full bg-foreground/5 border-0 rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent-primary/30 resize-none h-24"
                    placeholder="Short summary..."
                  />
               </div>

                {/* Tags */}
               <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-foreground/5 border-0 rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent-primary/30"
                    placeholder="Comma separated tags..."
                  />
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.split(',').filter(Boolean).map((tag, i) => (
                      <span key={i} className="text-[10px] bg-accent-primary/10 text-accent-primary px-2 py-1 rounded-md font-medium">#{tag.trim()}</span>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Preview Panel (Shows when showPreview is true) */}
          {showPreview && (
            <div className="col-span-1 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl">
               <div className="prose prose-sm dark:prose-invert max-w-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {formData.coverImage && <img src={formData.coverImage} className="w-full rounded-2xl mb-6" alt="Cover" />}
                  <h1 className="text-3xl font-bold mb-4">{formData.title}</h1>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {formData.content}
                  </ReactMarkdown>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Plus, Layers, ImageIcon } from 'lucide-react';

export default function NewPostPage() {
  const router = useRouter();
  const [step, setStep] = useState<'images' | 'edit'>('images');
  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.user || data.user.role !== 'admin') {
        router.push('/');
      } else {
        setUser(data.user);
      }
    } catch {
      router.push('/');
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 5 - images.length;
    if (remaining <= 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of toUpload) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/blog/upload-image', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          uploaded.push(data.url);
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
    setImages(prev => [...prev, ...uploaded].slice(0, 5));
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (activeIndex >= next.length) setActiveIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  const handleSubmit = async (publishNow: boolean) => {
    if (!title.trim()) { alert('Please enter a title'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/blog/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim() || ' ',
          excerpt: content.trim().substring(0, 150) || title.trim(),
          coverImage: images[0] || '',
          images,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          published: publishNow,
        }),
      });
      if (res.ok) {
        router.push('/admin');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create post');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating post');
    } finally {
      setLoading(false);
    }
  };

  const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/95 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto w-full">
          <button
            onClick={() => step === 'edit' ? setStep('images') : router.push('/admin')}
            className="p-2 hover:bg-foreground/10 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <span className="font-semibold text-foreground">New Post</span>
          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              {step === 'images' ? (
                <button onClick={() => setStep('edit')} className="text-sm font-semibold text-accent-primary px-2 py-1">
                  Next →
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => handleSubmit(false)} disabled={loading} className="px-3 py-1.5 text-xs font-medium bg-foreground/10 text-foreground rounded-lg disabled:opacity-50">
                    {loading ? '...' : 'Draft'}
                  </button>
                  <button onClick={() => handleSubmit(true)} disabled={loading} className="px-3 py-1.5 text-xs font-semibold bg-accent-primary text-white rounded-lg disabled:opacity-50">
                    {loading ? '...' : 'Share'}
                  </button>
                </div>
              )}
            </div>
            <div className="hidden lg:flex gap-2">
              <button onClick={() => handleSubmit(false)} disabled={loading} className="px-4 py-1.5 text-sm font-medium bg-foreground/10 text-foreground rounded-lg disabled:opacity-50 hover:bg-foreground/15 transition-colors">
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={() => handleSubmit(true)} disabled={loading} className="px-4 py-1.5 text-sm font-semibold bg-accent-primary text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity">
                {loading ? 'Posting...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row lg:max-w-5xl lg:mx-auto lg:w-full lg:border-x lg:border-foreground/10">

        {/* LEFT: Image Section */}
        <div className={`lg:w-[60%] bg-black flex flex-col flex-shrink-0 ${step === 'edit' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Main Preview */}
          <div className="relative aspect-square w-full">
            {images.length > 0 ? (
              <>
                <Image src={images[activeIndex]} alt="Preview" fill className="object-contain" priority />
                {activeIndex > 0 && (
                  <button onClick={() => setActiveIndex(i => i - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white z-10 transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                )}
                {activeIndex < images.length - 1 && (
                  <button onClick={() => setActiveIndex(i => i + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white z-10 transition-colors">
                    <ChevronRight size={18} />
                  </button>
                )}
                {images.length > 1 && (
                  <>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {images.map((_, i) => (
                        <button key={i} onClick={() => setActiveIndex(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-accent-primary scale-125' : 'bg-white/60'}`} />
                      ))}
                    </div>
                    <div className="absolute top-3 right-3 z-10 bg-black/50 rounded-full p-1.5">
                      <Layers size={16} className="text-white" />
                    </div>
                    <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                      {activeIndex + 1}/{images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/50 hover:text-white/80 transition-colors group">
                <div className="w-20 h-20 border-2 border-white/25 group-hover:border-white/50 rounded-full flex items-center justify-center transition-colors">
                  <ImageIcon size={30} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Select Photos'}</p>
                  <p className="text-xs text-white/35 mt-1">Up to 5 images per post</p>
                </div>
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="flex items-center gap-2 p-3 bg-black/80 overflow-x-auto min-h-[84px]">
            {images.map((img, i) => (
              <div key={i} onClick={() => setActiveIndex(i)} className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${i === activeIndex ? 'border-white opacity-100' : 'border-transparent opacity-55 hover:opacity-80'}`}>
                <Image src={img} alt="" fill className="object-cover" />
                <button onClick={(e) => { e.stopPropagation(); removeImage(i); }} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/75 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors">
                  <X size={10} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-shrink-0 w-16 h-16 border-2 border-dashed border-white/25 rounded-lg flex flex-col items-center justify-center gap-1 text-white/50 hover:text-white/80 hover:border-white/50 transition-all disabled:opacity-40">
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={18} />
                    <span className="text-[9px]">{images.length}/5</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
        </div>

        {/* RIGHT: Form Section */}
        <div className={`lg:w-[40%] border-l border-foreground/10 bg-background flex flex-col ${step === 'images' ? 'hidden lg:flex' : 'flex'}`}>
          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-foreground/10 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-primary/30 to-accent-secondary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-accent-primary font-bold text-sm">{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
            </div>
            <span className="font-semibold text-sm text-foreground">{user?.name || 'Admin'}</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Title */}
            <div className="border-b border-foreground/10">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title..."
                className="w-full px-4 py-3.5 bg-transparent text-foreground font-semibold text-lg focus:outline-none placeholder:text-foreground/30"
              />
            </div>

            {/* Caption / Content */}
            <div className="border-b border-foreground/10 relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a caption... (Markdown supported)"
                className="w-full px-4 py-3.5 min-h-[200px] bg-transparent text-sm text-foreground focus:outline-none placeholder:text-foreground/35 resize-none leading-relaxed"
              />
              {content.length > 0 && (
                <span className="absolute bottom-2 right-3 text-[10px] text-foreground/30">{content.length} chars</span>
              )}
            </div>

            {/* Tags */}
            <div className="border-b border-foreground/10 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="text-foreground/40 text-sm">#</span>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Add tags (comma-separated)"
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-foreground/30"
                />
              </div>
              {parsedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {parsedTags.map((tag, i) => (
                    <span key={i} className="text-xs text-accent-primary font-medium bg-accent-primary/10 px-2.5 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Photo count */}
            {images.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/10 text-sm text-foreground/50">
                <Layers size={14} />
                <span>{images.length} photo{images.length > 1 ? 's' : ''} selected</span>
                <button onClick={() => setStep('images')} className="ml-auto text-accent-primary text-xs hover:underline lg:hidden">Edit photos</button>
              </div>
            )}
          </div>

          {/* Mobile bottom buttons */}
          <div className="lg:hidden border-t border-foreground/10 p-4 flex gap-3 flex-shrink-0">
            <button onClick={() => handleSubmit(false)} disabled={loading} className="flex-1 py-2.5 text-sm font-medium bg-foreground/10 text-foreground rounded-xl disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={() => handleSubmit(true)} disabled={loading} className="flex-1 py-2.5 text-sm font-semibold bg-accent-primary text-white rounded-xl disabled:opacity-50 hover:opacity-90">
              {loading ? 'Posting...' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



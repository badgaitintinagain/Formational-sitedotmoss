"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Tile from './Tile';
import { FolderOpen, X, Upload, Trash2, Download, Loader2 } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string | null;
  uploadedBy: string;
  createdAt: string;
}

interface ResourceTileProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const CATEGORIES = ['general', 'cell', 'microscopy', 'dataset', 'model'];

const ResourceTile: React.FC<ResourceTileProps> = ({ size = '1x1', accent = 'primary', opacity = 25 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [preview, setPreview] = useState<Resource | null>(null);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedCategory
        ? `/api/resources?category=${encodeURIComponent(selectedCategory)}`
        : '/api/resources';
      const res = await fetch(url);
      const data = await res.json();
      setResources(data.resources || []);
    } catch {
      console.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (isOpen) {
      fetchResources();
      checkAdmin();
    }
  }, [isOpen, fetchResources]);

  const checkAdmin = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setIsAdmin(data.user?.role === 'admin');
    } catch {
      setIsAdmin(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle.trim());
      if (uploadDesc.trim()) formData.append('description', uploadDesc.trim());
      formData.append('category', uploadCategory);

      const res = await fetch('/api/resources', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');

      // Reset form & refresh
      setUploadTitle('');
      setUploadDesc('');
      setUploadCategory('general');
      setUploadFile(null);
      setShowUploadForm(false);
      fetchResources();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    try {
      const res = await fetch(`/api/resources/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setResources(prev => prev.filter(r => r.id !== id));
        if (preview?.id === id) setPreview(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSave = async (resource: Resource) => {
    try {
      const response = await fetch(resource.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resource.title.replace(/[^a-zA-Z0-9]/g, '_')}.${blob.type.split('/')[1] || 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(resource.imageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <Tile
        size={size}
        label="Resources"
        icon={FolderOpen}
        accentType={accent}
        opacity={opacity}
        onClick={() => setIsOpen(true)}
      />

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => { setIsOpen(false); setPreview(null); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-[#F2EBE3] dark:bg-[#1A1410] rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">Resources</h2>
                <p className="text-[10px] uppercase tracking-widest opacity-50 text-foreground">Save & use in AI Lab</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-foreground"
                  >
                    <Upload size={16} />
                  </button>
                )}
                <button
                  onClick={() => { setIsOpen(false); setPreview(null); }}
                  className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Admin Upload Form */}
            {isAdmin && showUploadForm && (
              <form onSubmit={handleUpload} className="p-4 border-b border-black/10 dark:border-white/10 flex flex-col gap-3 flex-shrink-0">
                <input
                  type="text"
                  placeholder="Title *"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-foreground placeholder:opacity-40 outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                  required
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-foreground placeholder:opacity-40 outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                />
                <div className="flex gap-2">
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-foreground outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="flex-1 text-sm text-foreground file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black/10 dark:file:bg-white/10 file:text-foreground hover:file:bg-black/20 dark:hover:file:bg-white/20"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile || !uploadTitle.trim()}
                  className="self-end px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-30"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : 'Upload'}
                </button>
              </form>
            )}

            {/* Category Filter */}
            <div className="flex gap-1.5 p-3 overflow-x-auto flex-shrink-0 no-scrollbar">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full border transition-colors whitespace-nowrap ${
                  !selectedCategory
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-foreground border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full border transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent text-foreground border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin opacity-40 text-foreground" />
                </div>
              ) : resources.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen size={32} className="mx-auto mb-2 opacity-20 text-foreground" />
                  <p className="text-xs opacity-40 text-foreground">No resources yet</p>
                </div>
              ) : preview ? (
                /* Preview Mode */
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => setPreview(null)}
                    className="self-start text-[10px] uppercase tracking-widest font-bold opacity-50 hover:opacity-100 transition-opacity text-foreground"
                  >
                    ← Back
                  </button>
                  <div className="relative w-full aspect-square max-w-sm rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                    <Image
                      src={preview.imageUrl}
                      alt={preview.title}
                      fill
                      className="object-contain bg-black/5 dark:bg-white/5"
                      sizes="(max-width: 640px) 100vw, 384px"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-foreground">{preview.title}</h3>
                    {preview.description && (
                      <p className="text-xs opacity-60 text-foreground mt-1">{preview.description}</p>
                    )}
                    <p className="text-[10px] uppercase tracking-widest opacity-30 mt-2 text-foreground">
                      {preview.category} · by {preview.uploadedBy}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(preview)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-foreground text-background hover:opacity-80 transition-opacity"
                    >
                      <Download size={14} /> Save
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(preview.id)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Grid View */
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {resources.map((resource) => (
                    <button
                      key={resource.id}
                      onClick={() => setPreview(resource)}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all hover:shadow-lg"
                    >
                      <Image
                        src={resource.imageUrl}
                        alt={resource.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="absolute bottom-1 left-1 right-1 text-[8px] font-bold text-white uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity truncate">
                        {resource.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceTile;

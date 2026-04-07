"use client";
import React, { useRef, useEffect, useState, memo, useMemo } from 'react';
import { X, Sun, Moon, Palette, Check, Ghost, Image as ImageIcon, Wind, Zap, Pipette } from 'lucide-react';
import Image from 'next/image';
import gsap from 'gsap';
import { useTheme, PaletteId } from './ThemeProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = memo(({ isOpen, onClose }: SettingsModalProps) => {
  const { 
    theme, toggleTheme, paletteId, setPaletteId, isGrayscale, setGrayscale,
    bgValue, setBgValue, glassBlur, setGlassBlur, setBgType,
    customPrimary, setCustomPrimary, customSecondary, setCustomSecondary
  } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const palettes: { id: PaletteId; name: string; primary: string; secondary: string }[] = useMemo(() => [
    { id: 'serene', name: 'Serene', primary: '#949B7B', secondary: '#B6A691' },
    { id: 'clay', name: 'Clay', primary: '#CB997E', secondary: '#DDBEA9' },
    { id: 'moss', name: 'Moss', primary: '#6B705C', secondary: '#A5A58D' },
    { id: 'desert', name: 'Desert', primary: '#E6CCB2', secondary: '#EDE0D4' },
    { id: 'ocean', name: 'Ocean', primary: '#A8DADC', secondary: '#F1FAEE' },
    { id: 'spring', name: 'Spring', primary: '#FFB4A2', secondary: '#FFCDB2' },
    { id: 'sunset', name: 'Sunset', primary: '#B5838D', secondary: '#E5989B' },
    { id: 'vintage', name: 'Vintage', primary: '#A68A64', secondary: '#DEAB48' },
  ], []);

  const bgPresets = useMemo(() => [
    { id: 'beige', type: 'color' as const, value: '#F2EBE3', name: 'Default Light' },
    { id: 'charcoal', type: 'color' as const, value: '#1A1A1A', name: 'Deep Dark' },
    { id: 'nature', type: 'image' as const, value: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1600&q=80', name: 'Nature' },
    { id: 'abstract', type: 'image' as const, value: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&w=1600&q=80', name: 'Abstract' },
    { id: 'city', type: 'image' as const, value: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80', name: 'City' },
    { id: 'aurora', type: 'image' as const, value: 'https://images.unsplash.com/photo-1579033462043-0f11a7862f8d?auto=format&fit=crop&w=1600&q=80', name: 'Aurora' },
    { id: 'ocean-drive', type: 'image' as const, value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80', name: 'Ocean Drive' },
    { id: 'mountain-fog', type: 'image' as const, value: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80', name: 'Mountain Fog' },
    { id: 'neon-night', type: 'image' as const, value: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80', name: 'Neon Night' },
    { id: 'desert-dunes', type: 'image' as const, value: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&q=80', name: 'Desert Dunes' },
  ], []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isOpen && modalRef.current) {
        gsap.fromTo(modalRef.current, 
          { opacity: 0, scale: 0.9, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" }
        );
      }
    });
    return () => ctx.revert();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 transition-colors duration-500 ${isDragging ? 'bg-black/10' : 'bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_35%,rgba(0,0,0,0.18)_100%)]'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 backdrop-blur-lg transition-all duration-500 ${isDragging ? 'opacity-0' : 'opacity-100'}`}
        onClick={onClose}
      />
      
      {/* App Window */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg h-[81vh] rounded-[4px] border border-foreground/20 bg-background/24 text-foreground overflow-hidden flex flex-col shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500"
        style={{ 
          opacity: isDragging ? 0.15 : 1,
          transform: isDragging ? 'scale(0.98)' : 'scale(1)',
          pointerEvents: isDragging ? 'none' : 'auto'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-foreground/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.20)_0%,rgba(255,255,255,0.04)_100%)] backdrop-blur-xl backdrop-saturate-150 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Zap className="text-accent-primary animate-pulse" />
            <div>
              <h2 className="text-xl font-light tracking-tight text-foreground">Setting</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-[4px] border border-foreground/20 bg-background/20 text-foreground/75 transition-all duration-200 hover:bg-background/35 hover:text-foreground backdrop-blur-md backdrop-saturate-150"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
          {/* Theme Mode */}
          <section className="space-y-4 rounded-[4px] border border-foreground/20 bg-background/16 p-4 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <div className="flex items-center gap-2 mb-2">
              <Sun size={16} className="text-foreground opacity-40" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Interface</h3>
            </div>
            <div className="flex bg-background/18 border border-foreground/15 p-1 rounded-[4px] backdrop-blur-md">
              <button 
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`flex-1 flex items-center justify-center gap-3 py-2.5 rounded-[3px] transition-all ${theme === 'light' ? 'bg-background/55 border border-foreground/20 text-foreground font-bold backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'text-foreground/45'}`}
              >
                <Sun size={18} className={theme === 'light' ? 'text-amber-500' : ''} />
                <span className="text-sm">Day</span>
              </button>
              <button 
                onClick={() => theme === 'light' && toggleTheme()}
                className={`flex-1 flex items-center justify-center gap-3 py-2.5 rounded-[3px] transition-all ${theme === 'dark' ? 'bg-background/55 border border-foreground/20 text-foreground font-bold backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'text-foreground/45'}`}
              >
                <Moon size={18} className={theme === 'dark' ? 'text-indigo-400' : ''} />
                <span className="text-sm">Night</span>
              </button>
            </div>
          </section>

          {/* Canvas */}
          <section className="space-y-4 rounded-[4px] border border-foreground/20 bg-background/16 p-4 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={16} className="text-foreground opacity-40" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Canvas</h3>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {bgPresets.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    setBgType(bg.type as 'color' | 'image');
                    setBgValue(bg.value);
                  }}
                  className={`relative aspect-square rounded-[4px] overflow-hidden border transition-all ${
                    bgValue === bg.value ? 'border-accent-primary scale-[0.97] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'border-foreground/15 opacity-80 hover:opacity-100'
                  }`}
                >
                  {bg.type === 'color' ? (
                    <div className="w-full h-full" style={{ backgroundColor: bg.value }} />
                  ) : (
                    <Image src={bg.value} className="object-cover" alt={bg.name} fill sizes="100px" />
                  )}
                  {bgValue === bg.value && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Liquid Glass Blur */}
          <section className="space-y-4 rounded-[4px] border border-foreground/20 bg-background/16 p-4 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wind size={16} className="text-foreground opacity-40" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Glass Intensity</h3>
              </div>
              <span className="text-[10px] font-mono opacity-40 text-foreground">{glassBlur}px</span>
            </div>
            <div className="relative pt-2 pb-6">
              <input 
                type="range" 
                min="0" 
                max="40" 
                value={glassBlur}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                onChange={(e) => setGlassBlur(Number(e.target.value))}
                className="w-full h-1.5 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-accent-primary"
              />
              {isDragging && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground animate-bounce whitespace-nowrap">
                  Previewing Dashboard...
                </div>
              )}
            </div>
          </section>

          {/* Accent Color Palette */}
          <section className="space-y-4 rounded-[4px] border border-foreground/20 bg-background/16 p-4 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <div className="flex items-center gap-2 mb-2">
              <Palette size={16} className="text-foreground opacity-40" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Pastel Pairs</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {palettes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPaletteId(p.id)}
                  className={`group relative aspect-square rounded-[4px] overflow-hidden flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-md border ${paletteId === p.id ? 'border-accent-primary scale-105' : 'border-foreground/15 opacity-85'}`}
                  title={p.name}
                >
                  <div className="absolute inset-0 flex rotate-45">
                    <div className="flex-1 h-full" style={{ backgroundColor: p.primary }} />
                    <div className="flex-1 h-full" style={{ backgroundColor: p.secondary }} />
                  </div>
                  {paletteId === p.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                      <Check size={16} className="text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              ))}

              {/* Custom color picker */}
              <button
                onClick={() => setPaletteId('custom')}
                className={`group relative aspect-square rounded-[4px] overflow-hidden flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-md border ${paletteId === 'custom' ? 'border-accent-primary scale-105' : 'border-foreground/15 opacity-85'}`}
                title="Custom"
              >
                <div className="absolute inset-0 flex rotate-45">
                  <div className="flex-1 h-full" style={{ backgroundColor: customPrimary }} />
                  <div className="flex-1 h-full" style={{ backgroundColor: customSecondary }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/15 z-10">
                  {paletteId === 'custom' ? (
                    <Check size={16} className="text-white drop-shadow-md" />
                  ) : (
                    <Pipette size={14} className="text-white drop-shadow-md" />
                  )}
                </div>
              </button>
            </div>

            {/* Custom color pickers - shown when custom is selected */}
            {paletteId === 'custom' && (
              <div className="flex gap-4 mt-3 p-3 bg-background/20 border border-foreground/15 rounded-[4px] backdrop-blur-md">
                <div className="flex-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest opacity-50 text-foreground mb-1.5 block">Primary</label>
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-[4px] overflow-hidden border border-foreground/15 flex-shrink-0">
                      <input
                        type="color"
                        value={customPrimary}
                        onChange={(e) => setCustomPrimary(e.target.value)}
                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                      />
                      <div className="w-full h-full pointer-events-none" style={{ backgroundColor: customPrimary }} />
                    </div>
                    <input
                      type="text"
                      value={customPrimary}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setCustomPrimary(v);
                      }}
                      maxLength={7}
                      className="w-full bg-background/25 border border-foreground/15 rounded-[4px] px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent-primary/50"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest opacity-50 text-foreground mb-1.5 block">Secondary</label>
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-[4px] overflow-hidden border border-foreground/15 flex-shrink-0">
                      <input
                        type="color"
                        value={customSecondary}
                        onChange={(e) => setCustomSecondary(e.target.value)}
                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                      />
                      <div className="w-full h-full pointer-events-none" style={{ backgroundColor: customSecondary }} />
                    </div>
                    <input
                      type="text"
                      value={customSecondary}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setCustomSecondary(v);
                      }}
                      maxLength={7}
                      className="w-full bg-background/25 border border-foreground/15 rounded-[4px] px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}

            <p className="text-[9px] opacity-40 text-foreground italic text-center">Choose a preset pair or pick your own colors</p>
          </section>

          {/* Grayscale Toggle */}
          <section className="space-y-4 rounded-[4px] border border-foreground/20 bg-background/16 p-4 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <div className="flex items-center gap-2 mb-2">
              <Ghost size={16} className="text-foreground opacity-40" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Accessibility</h3>
            </div>
            <button 
              onClick={() => setGrayscale(!isGrayscale)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                isGrayscale 
                  ? 'bg-accent-primary/18 border-accent-primary/45 text-accent-primary font-bold' 
                  : 'bg-background/22 border-foreground/15 text-foreground opacity-85'
              }`}
            >
              <div className="flex items-center gap-3">
                <Ghost size={18} />
                <span className="text-sm">Force to Grayscale</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${isGrayscale ? 'bg-accent-primary' : 'bg-gray-400/30'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isGrayscale ? 'left-6' : 'left-1'}`} />
              </div>
            </button>
          </section>
        </div>

        {/* Footer */}
        <div className="p-5 text-center border-t border-foreground/15 opacity-35 mt-auto flex-shrink-0 bg-background/14 backdrop-blur-md">
          <p className="text-[8px] uppercase tracking-[0.3em] text-foreground">site(.)moss, Built by Moss. Refined by Claude. (NextJS, React, Turso SQLite and Huggingface)</p>
        </div>
      </div>
      
      {/* Slider Helper (External to modal so it doesn't fade) */}
      {isDragging && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-[200px] bg-white/10 backdrop-blur-md px-6 py-3 rounded-[4px] border border-white/20 pointer-events-none animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 text-white">
            <Wind size={20} className="animate-spin" />
            <span className="text-lg font-light tracking-widest uppercase">Adjusting Blur</span>
          </div>
        </div>
      )}
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';

export default SettingsModal;

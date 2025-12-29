"use client";
import React, { useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import gsap from 'gsap';

interface TileProps {
  size: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  label?: string;
  className?: string;
  children?: React.ReactNode;
  bgClass?: string;
  bgImage?: string;
  icon?: LucideIcon;
}

const Tile: React.FC<TileProps> = ({ size, label, className = '', children, bgClass = 'bg-blue-600/70 border-blue-400/50', bgImage, icon: Icon }) => {
  const tileRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    '1x1': 'tile-1x1 row-span-1 col-span-1',
    '2x1': 'tile-2x1 row-span-1 col-span-2',
    '2x2': 'tile-2x2 row-span-2 col-span-2',
    '2x3': 'tile-2x3 row-span-3 col-span-2',
    '3x2': 'tile-3x2 row-span-2 col-span-3',
  };

  const isSmall = size === '1x1' || size === '2x1';

  useEffect(() => {
    const tile = tileRef.current;
    const glow = glowRef.current;
    if (!tile || !glow) return;

    const onMouseEnter = () => {
      gsap.to(glow, {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out'
      });
      gsap.to(tile, {
        filter: 'brightness(1.05)',
        duration: 0.4,
        ease: 'power2.out',
        borderColor: 'rgba(255,255,255,0.8)',
      });
    };

    const onMouseLeave = () => {
      gsap.to(glow, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.inOut'
      });
      gsap.to(tile, {
        filter: 'brightness(1)',
        duration: 0.4,
        ease: 'power2.inOut',
        borderColor: 'rgba(255,255,255,0.4)',
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = tile.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      tile.style.setProperty('--mouse-x', `${x}px`);
      tile.style.setProperty('--mouse-y', `${y}px`);
    };

    tile.addEventListener('mouseenter', onMouseEnter);
    tile.addEventListener('mouseleave', onMouseLeave);
    tile.addEventListener('mousemove', onMouseMove);

    return () => {
      tile.removeEventListener('mouseenter', onMouseEnter);
      tile.removeEventListener('mouseleave', onMouseLeave);
      tile.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div 
      ref={tileRef}
      className={`tile relative overflow-hidden group ${sizeClasses[size]} ${bgClass} flex flex-col ${isSmall ? 'justify-center items-center' : 'justify-end items-start'} p-2 text-left border cursor-pointer text-tile-text ${className}`}
    >
      {/* Background Image */}
      {bgImage && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 blur-[2px]"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      {/* Dark Overlay for Image */}
      {bgImage && <div className="absolute inset-0 z-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />}

      {/* Gradient Blur Overlay */}
      <div 
        ref={glowRef}
        className="pointer-events-none absolute inset-0 opacity-0 z-0"
        style={{
          background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.4) 0%, transparent 60%)',
          filter: 'blur(20px)',
        }}
      />
      
      <div className={`relative z-10 flex-1 w-full flex items-center justify-center ${isSmall ? 'gap-2' : ''}`}>
        {Icon && <Icon size={isSmall ? 24 : 32} strokeWidth={1.5} className="opacity-90 flex-shrink-0" />}
        {children}
      </div>
      {!isSmall && label && (
        <span className="relative z-10 text-[7px] uppercase tracking-widest font-bold mt-auto opacity-80">
          {label}
        </span>
      )}
    </div>
  );
};

export default Tile;

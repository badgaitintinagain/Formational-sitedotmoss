"use client";
import React, { useState, useRef, useEffect } from 'react';
import Tile from './Tile';
import { X, Footprints } from 'lucide-react';
import gsap from 'gsap';

interface ShoeDemoProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const ShoeDemoTile: React.FC<ShoeDemoProps> = ({ size = '2x2', accent = 'secondary', opacity = 40 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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
        label="Shoe Demo"
        icon={Footprints}
        accentType={accent}
        opacity={opacity}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-40 mt-2"></div>
        </div>
      </Tile>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={modalRef}
            className="relative w-full max-w-4xl h-[80vh] bg-background border border-foreground/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-foreground/5 bg-foreground/5">
              <div className="flex items-center gap-3">
                <Footprints className="text-accent-primary" />
                <div>
                  <h2 className="text-xl font-light tracking-tight text-foreground">Shoe Demo</h2>
                  <p className="text-[10px] uppercase tracking-widest opacity-50 text-foreground">
                    AI-Powered Shoe Visualization
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
            <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Footprints size={48} className="mx-auto text-accent-primary opacity-40" />
                <p className="text-sm text-foreground/60 tracking-wide">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShoeDemoTile;

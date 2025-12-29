"use client";
import React, { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';
import gsap from 'gsap';

const Background: React.FC = () => {
  const { theme } = useTheme();
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bgRef.current) return;

    if (theme === 'dark') {
      gsap.to(bgRef.current, {
        backgroundColor: '#2D241E', // Dark Brown
        duration: 0.8,
        ease: 'power2.inOut'
      });
    } else {
      gsap.to(bgRef.current, {
        backgroundColor: '#F2EBE3', // Beige
        duration: 0.8,
        ease: 'power2.inOut'
      });
    }
  }, [theme]);

  return (
    <div ref={bgRef} className="fixed inset-0 z-0 overflow-hidden transition-colors duration-500">
      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Very subtle gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200/20 dark:from-indigo-900/10 to-transparent" />
    </div>
  );
};

export default Background;

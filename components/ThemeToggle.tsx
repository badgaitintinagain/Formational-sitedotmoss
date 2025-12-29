"use client";
import React, { useRef, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import gsap from 'gsap';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (iconRef.current) {
      gsap.fromTo(iconRef.current, 
        { rotation: -90, opacity: 0, scale: 0.5 },
        { rotation: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-8 right-12 z-50 p-2 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-md border border-zinc-900/10 dark:border-white/10 hover:scale-110 transition-all duration-300 cursor-pointer group"
      aria-label="Toggle Theme"
    >
      <div ref={iconRef}>
        {theme === 'light' ? (
          <Moon size={20} className="text-zinc-800 group-hover:text-indigo-600 transition-colors" />
        ) : (
          <Sun size={20} className="text-zinc-200 group-hover:text-amber-400 transition-colors" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;

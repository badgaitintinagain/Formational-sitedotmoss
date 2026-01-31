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
        { rotation: theme === 'dark' ? -180 : 0, opacity: 0, scale: 0.5 },
        { rotation: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }
      );
    }
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-8 right-12 z-50 p-3 rounded-xl bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group shadow-lg"
      aria-label="Toggle Theme"
    >
      <div ref={iconRef} className="flex items-center justify-center">
        {theme === 'light' ? (
          <Sun size={20} className="text-amber-600 transition-colors" />
        ) : (
          <Moon size={20} className="text-indigo-400 transition-colors" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;

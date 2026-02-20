"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
export type PaletteId = 'serene' | 'clay' | 'moss' | 'desert' | 'ocean' | 'spring' | 'sunset' | 'vintage';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  paletteId: PaletteId;
  setPaletteId: (id: PaletteId) => void;
  isGrayscale: boolean;
  setGrayscale: (value: boolean) => void;
  bgType: 'color' | 'image';
  setBgType: (type: 'color' | 'image') => void;
  bgValue: string;
  setBgValue: (value: string) => void;
  glassBlur: number;
  setGlassBlur: (value: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [paletteId, setPaletteIdState] = useState<PaletteId>('serene');
  const [isGrayscale, setGrayscaleState] = useState<boolean>(false);
  const [bgType, setBgTypeState] = useState<'color' | 'image'>('color');
  const [bgValue, setBgValueState] = useState<string>('');
  const [glassBlur, setGlassBlurState] = useState<number>(0);

  // Sync with LocalStorage once on mount
  useEffect(() => {
    const initTheme = () => {
      try {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) setTheme(savedTheme);
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

        const savedPalette = localStorage.getItem('palette') as PaletteId;
        if (savedPalette) setPaletteIdState(savedPalette);

        const savedGrayscale = localStorage.getItem('grayscale') === 'true';
        setGrayscaleState(savedGrayscale);

        const savedBgType = localStorage.getItem('bgType') as 'color' | 'image';
        if (savedBgType) setBgTypeState(savedBgType);

        const savedBgValue = localStorage.getItem('bgValue');
        if (savedBgValue) setBgValueState(savedBgValue);

        const savedBlur = localStorage.getItem('glassBlur');
        if (savedBlur) setGlassBlurState(Number(savedBlur));
      } catch (e) {
        console.warn("Could not load settings from localStorage", e);
      }
    };

    const timeout = setTimeout(initTheme, 0);
    return () => clearTimeout(timeout);
  }, []);

  // Update DOM and LocalStorage when states change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', paletteId);
    localStorage.setItem('palette', paletteId);
  }, [paletteId]);

  useEffect(() => {
    document.documentElement.classList.toggle('force-grayscale', isGrayscale);
    localStorage.setItem('grayscale', String(isGrayscale));
  }, [isGrayscale]);

  useEffect(() => {
    localStorage.setItem('bgType', bgType);
    localStorage.setItem('bgValue', bgValue);
    localStorage.setItem('glassBlur', String(glassBlur));
  }, [bgType, bgValue, glassBlur]);

  // Use useMemo to prevent unnecessary re-renders of consuming components
  const value = React.useMemo(() => ({
    theme,
    toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light'),
    paletteId,
    setPaletteId: (id: PaletteId) => setPaletteIdState(id),
    isGrayscale,
    setGrayscale: (value: boolean) => setGrayscaleState(value),
    bgType,
    setBgType: (type: 'color' | 'image') => setBgTypeState(type),
    bgValue,
    setBgValue: (value: string) => setBgValueState(value),
    glassBlur,
    setGlassBlur: (value: number) => setGlassBlurState(value)
  }), [theme, paletteId, isGrayscale, bgType, bgValue, glassBlur]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

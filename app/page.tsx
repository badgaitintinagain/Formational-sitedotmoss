"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Tile from "@/components/Tile";
import WeatherTile from "@/components/WeatherTile";
import AdTile from "@/components/AdTile";
import CalendarTile from "@/components/CalendarTile";
import ClockTile from "@/components/ClockTile";
import Background from "@/components/Background";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import gsap from "gsap";
import { 
  ShoppingBag, Clock as ClockIcon, Calendar, Mail, Settings, Sun, Cloud, Package, Users,
  Monitor, Music, Video as VideoIcon, Image as ImageIcon, MapPin, Gamepad2, 
  Camera, Mic, PenTool, Newspaper, TrendingUp as TrendingUpIcon, Plane, 
  Gamepad, Heart, Dribbble, TrendingDown, Utensils, Search, User, 
  MessageSquare, Navigation, Bell, Battery, Wifi, Bluetooth, Cpu, Quote, Megaphone
} from "lucide-react";

export default function Home() {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", image: "https://images.unsplash.com/photo-1485872232694-217b2ad2303e?auto=format&fit=crop&w=800&q=80" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", image: "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=800&q=80" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80" }
  ];

  const randomQuote = useMemo(() => {
    if (!mounted) return { text: "", author: "", image: "" };
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const elements = containerRef.current.querySelectorAll('.theme-text');
    if (theme === 'dark') {
      gsap.to(elements, {
        color: '#F2EBE3', // Beige text in Dark Mode
        duration: 0.8,
        ease: 'power2.inOut'
      });
    } else {
      gsap.to(elements, {
        color: '#2D241E', // Dark Brown text in Light Mode
        duration: 0.8,
        ease: 'power2.inOut'
      });
    }
  }, [theme, mounted]);

  return (
    <div ref={containerRef} className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto font-sans flex items-center justify-center transition-colors duration-500">
      <Background />
      <ThemeToggle />

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/5 dark:bg-black/10 z-10 backdrop-blur-[1px]" />

      <div className="relative z-20 w-full flex flex-col items-center justify-center py-12 min-h-screen">
        <div className="w-fit max-w-full px-6 md:px-12 lg:px-16 flex flex-col items-start">
          <header className="mb-8 text-left flex-shrink-0">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight theme-text drop-shadow-sm">Formational</h1>
          </header>

          <main className="dashboard-main w-fit max-w-full gap-x-8 gap-y-10 no-scrollbar pb-8">
            {/* Group 1: Life at a glance */}
            <div className="flex flex-col gap-3 w-fit items-start flex-shrink-0">
              <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-60 ml-1 theme-text">Life at a glance</h2>
              <div className="grid grid-rows-5 grid-flow-col gap-1.5 h-[21.5rem] w-max">
                <ClockTile />
                <CalendarTile />
                <Tile size="1x1" label="Settings" icon={Settings} bgClass="bg-palette-sage/70 border-white/20" />
                
                <Tile 
                  size="3x2" 
                  bgImage={randomQuote.image}
                  bgClass="bg-black/40 border-white/20"
                  className="text-white"
                >
                  <div className="flex flex-col items-center justify-center w-full h-full px-6 text-center">
                    <p className="text-sm italic font-medium leading-tight mb-2">"{randomQuote.text}"</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">— {randomQuote.author}</p>
                  </div>
                </Tile>
                <AdTile 
                  title="New Collection 2025" 
                  description="Discover the future of design with our latest premium release."
                />
                
                <WeatherTile />
              </div>
            </div>

            {/* Group 2: Work & Focus (Demo) */}
            <div className="flex flex-col gap-3 w-fit items-start flex-shrink-0">
              <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-60 ml-1 theme-text">Work & Focus</h2>
              <div className="grid grid-rows-5 grid-flow-col gap-1.5 h-[21.5rem] w-max">
                <Tile size="2x2" label="Mail" icon={Mail} bgClass="bg-palette-brown/60 border-white/20" />
                <Tile size="2x2" label="Tasks" icon={PenTool} bgClass="bg-palette-taupe/60 border-white/20" />
                <Tile size="1x1" label="Files" icon={Package} bgClass="bg-palette-gray/60 border-white/20" />
                
                <Tile size="2x3" label="Project Alpha" bgClass="bg-palette-sage/50 border-white/20">
                  <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center">
                    <div className="w-10 h-10 rounded-full border-2 border-tile-text/30 flex items-center justify-center mb-1">
                      <span className="text-sm font-bold text-tile-text">75%</span>
                    </div>
                    <p className="text-[8px] font-bold uppercase tracking-tighter text-tile-text">In Progress</p>
                  </div>
                </Tile>
                <Tile size="2x2" label="Team" icon={Users} bgClass="bg-palette-beige/60 border-white/20" />
              </div>
            </div>

            {/* Group 3: Entertainment (Demo) */}
            <div className="flex flex-col gap-3 w-fit items-start flex-shrink-0">
              <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-60 ml-1 theme-text">Entertainment</h2>
              <div className="grid grid-rows-5 grid-flow-col gap-1.5 h-[21.5rem] w-max">
                <Tile size="3x2" label="Music" icon={Music} bgClass="bg-palette-sage/60 border-white/20" />
                <Tile size="2x2" label="Videos" icon={VideoIcon} bgClass="bg-palette-taupe/60 border-white/20" />
                <Tile size="1x1" label="Photos" icon={ImageIcon} bgClass="bg-palette-gray/60 border-white/20" />
                
                <Tile size="2x3" label="Trending" icon={TrendingUpIcon} bgClass="bg-palette-beige/60 border-white/20" />
                <Tile size="2x2" label="Gaming" icon={Gamepad2} bgClass="bg-palette-brown/60 border-white/20" />
              </div>
            </div>

            {/* Group 4: Next Chapter */}
            <div className="flex flex-col gap-3 w-fit items-start flex-shrink-0">
              <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-60 ml-1 theme-text">Next Chapter</h2>
              <div className="flex h-[21.5rem] w-[21.5rem]">
                <div className="tile w-full h-full bg-palette-taupe/10 border-white/5 flex items-center justify-center group">
                  <div className="text-center px-8">
                    <h3 className="text-3xl md:text-4xl font-thin tracking-tighter theme-text opacity-60 group-hover:scale-110 transition-transform duration-700">Coming Soon</h3>
                    <p className="text-[7px] md:text-[8px] uppercase tracking-[0.5em] theme-text opacity-30 mt-4">New experiences are being crafted</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

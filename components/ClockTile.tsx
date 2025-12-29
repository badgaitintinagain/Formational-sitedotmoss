"use client";
import React, { useEffect, useRef, useState } from "react";
import Tile from "./Tile";

const ClockTile: React.FC = () => {
  const minutesRef = useRef<HTMLSpanElement>(null);
  const hoursRef = useRef<HTMLSpanElement>(null);
  const [digitalTime, setDigitalTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    function setTime() {
      const now = new Date();

      // Analog logic
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      const minutesDegrees = (minutes / 60) * 360 + (seconds / 60) * 6 + 90;
      if (minutesRef.current) {
        minutesRef.current.style.transform = `rotate(${minutesDegrees}deg)`;
      }

      const hours = now.getHours();
      const hoursDegrees = (hours / 12) * 360 + (minutes / 60) * 30 + 90;
      if (hoursRef.current) {
        hoursRef.current.style.transform = `rotate(${hoursDegrees}deg)`;
      }

      // Digital logic
      setDigitalTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }

    const intervalId = setInterval(setTime, 1000);
    setTime(); // Initial call

    return () => clearInterval(intervalId);
  }, []);

  if (!mounted) {
    return (
      <Tile size="2x2" bgClass="bg-palette-sage/70 border-white/20">
        <div className="animate-pulse bg-white/10 w-full h-full rounded-lg" />
      </Tile>
    );
  }

  return (
    <Tile size="2x2" bgClass="bg-palette-sage/70 border-white/20">
      <div className="relative w-full h-full flex flex-col items-center justify-center p-1 overflow-hidden">
        {/* Analog Clock Face */}
        <div className="clock-face relative w-20 h-20 border-2 border-tile-text/30 rounded-full flex items-center justify-center">
          <div className="center-dot w-1.5 h-1.5 bg-tile-text rounded-full z-30" />
          
          <span ref={hoursRef} className="hand hour-hand" />
          <span ref={minutesRef} className="hand min-hand" />
          
          {/* Hour Markers */}
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-full h-full" 
              style={{ transform: `rotate(${i * 30}deg)` }}
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-1 bg-tile-text/40" />
            </div>
          ))}
        </div>

        {/* Digital Clock */}
        <div className="mt-2 text-[10px] font-mono tracking-widest text-tile-text bg-white/10 dark:bg-black/20 px-2 py-0.5 rounded-none backdrop-blur-sm border border-white/10">
          {digitalTime}
        </div>
      </div>

      <style jsx>{`
        .clock-face {
          box-shadow: 0 0 15px rgba(0,0,0,0.05), inset 0 0 8px rgba(255,255,255,0.1);
        }
        .hand {
          position: absolute;
          top: 50%;
          right: 50%;
          background: currentColor;
          transform-origin: 100%;
          transform: rotate(90deg);
          transition: all 0.05s;
          transition-timing-function: cubic-bezier(0.1, 2.7, 0.58, 1);
          border-radius: 0px;
        }
        .hour-hand {
          width: 25%;
          height: 3px;
          z-index: 10;
        }
        .min-hand {
          width: 35%;
          height: 2px;
          z-index: 11;
          opacity: 0.8;
        }
      `}</style>
    </Tile>
  );
};

export default ClockTile;

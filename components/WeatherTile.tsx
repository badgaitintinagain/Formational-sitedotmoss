"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, Wind } from 'lucide-react';
import Tile from './Tile';

const LOCATIONS = [
  { name: "Bangkok", lat: 13.7563, lon: 100.5018, image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=400&q=80" },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=80" },
  { name: "London", lat: 51.5074, lon: -0.1278, image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80" },
  { name: "New York", lat: 40.7128, lon: -74.0060, image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400&q=80" },
  { name: "Paris", lat: 48.8566, lon: 2.3522, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80" },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=400&q=80" },
  { name: "Dubai", lat: 25.2048, lon: 55.2708, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=400&q=80" },
  { name: "Reykjavik", lat: 64.1466, lon: -21.9426, image: "https://images.unsplash.com/photo-1529963183134-61a90db47eaf?auto=format&fit=crop&w=400&q=80" }
];

const getWeatherIcon = (code: number) => {
  if (code === 0) return Sun;
  if (code >= 1 && code <= 3) return Cloud;
  if (code >= 45 && code <= 48) return Wind;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return Snowflake;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95 && code <= 99) return CloudLightning;
  return Cloud;
};

const WeatherTile: React.FC = () => {
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Pick a random location once on mount
  const location = useMemo(() => {
    if (!mounted) return null;
    return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  }, [mounted]);

  const fetchWeather = async () => {
    if (!location) return;
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true`
      );
      const data = await response.json();
      if (data.current_weather) {
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          code: data.current_weather.weathercode
        });
      }
    } catch (error) {
      console.error("Failed to fetch weather:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchWeather();
      // Update every 1 hour (3600000 ms)
      const interval = setInterval(fetchWeather, 3600000);
      return () => clearInterval(interval);
    }
  }, [mounted, location]);

  const Icon = weather ? getWeatherIcon(weather.code) : Cloud;

  if (!mounted || !location) return <Tile size="2x1" label="Weather" icon={Cloud} bgClass="bg-palette-sage/70 border-white/20" />;

  return (
    <Tile 
      size="2x1" 
      label={location.name} 
      icon={Icon} 
      bgClass="bg-palette-sage/70 border-white/20"
      bgImage={location.image}
      className="text-white"
    >
      {loading ? (
        <div className="animate-pulse bg-white/20 h-6 w-12 rounded" />
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-xl font-semibold leading-none">{weather?.temp}°C</p>
          <p className="text-[7px] uppercase tracking-widest opacity-90 mt-1 truncate w-full text-center">{location.name}</p>
        </div>
      )}
    </Tile>
  );
};

export default WeatherTile;

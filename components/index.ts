// Add this file to improve React components performance
import dynamic from 'next/dynamic';

// Lazy load heavy components
export const LazyBlogTile = dynamic(() => import('@/components/BlogTile'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Only load on client side
});

export const LazyMicronversationTile = dynamic(() => import('@/components/MicronversationTile'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});

// Pre-load critical components
export { default as Tile } from '@/components/Tile';
export { default as ClockTile } from '@/components/ClockTile';
export { default as WeatherTile } from '@/components/WeatherTile';
export { default as CalendarTile } from '@/components/CalendarTile';

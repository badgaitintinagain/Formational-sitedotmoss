import { LucideIcon } from 'lucide-react';

export type TileSize = '1x1' | '2x1' | '2x2' | '2x3' | '3x2';

export interface TileConfig {
  id: string;
  size: TileSize;
  label?: string;
  icon?: LucideIcon;
  component?: React.FC<any>;
  bgClass?: string;
  props?: Record<string, any>;
  group?: string;
}

export interface DashboardGroup {
  id: string;
  title: string;
  tiles: TileConfig[];
}

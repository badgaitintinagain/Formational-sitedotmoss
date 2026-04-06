"use client";
import React, { useState } from 'react';
import Tile from './Tile';
import { Music, TrendingUp, BarChart3, X } from 'lucide-react';

interface SpotifyAnalysisTileProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const SpotifyAnalysisTile: React.FC<SpotifyAnalysisTileProps> = ({ 
  size = '2x1', 
  accent = 'primary', 
  opacity = 50 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Tile
        size={size}
        accent={accent}
        opacity={opacity}
        onClick={() => setIsOpen(true)}
        className="cursor-pointer group"
      >
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
          <Music className="w-8 h-8 text-foreground/70 group-hover:text-foreground transition-colors" />
          <div>
            <p className="text-sm font-semibold text-foreground/90">Spotify Analysis</p>
            <p className="text-[10px] text-foreground/60">Madonna Data Deep-Dive</p>
          </div>
          <div className="flex gap-2 text-[10px] text-foreground/50 mt-2">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              K-Means
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              t-SNE
            </span>
          </div>
        </div>
      </Tile>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-slate-950 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-foreground/10">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-950 border-b border-foreground/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="w-6 h-6 text-foreground" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Spotify Analysis</h2>
                  <p className="text-sm text-foreground/60">Madonna Sonic Profile: K-Means & t-SNE Clustering</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground/70" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-foreground/80">
              {/* Overview */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Dataset Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-foreground/5 p-4 rounded-lg">
                    <p className="text-sm text-foreground/60">Total Tracks</p>
                    <p className="text-2xl font-bold text-foreground">250+</p>
                  </div>
                  <div className="bg-foreground/5 p-4 rounded-lg">
                    <p className="text-sm text-foreground/60">Time Span</p>
                    <p className="text-2xl font-bold text-foreground">40y</p>
                  </div>
                  <div className="bg-foreground/5 p-4 rounded-lg">
                    <p className="text-sm text-foreground/60">Features</p>
                    <p className="text-2xl font-bold text-foreground">5</p>
                  </div>
                  <div className="bg-foreground/5 p-4 rounded-lg">
                    <p className="text-sm text-foreground/60">Clusters</p>
                    <p className="text-2xl font-bold text-foreground">4</p>
                  </div>
                </div>
              </section>

              {/* Key Findings */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Key Findings
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">•</span>
                    <span><strong>K-Means Clustering:</strong> Madonna's tracks group into 4 distinct eras, each with unique sonic characteristics (danceability, energy, valence, acousticness)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">•</span>
                    <span><strong>Energy Evolution:</strong> Notable shift in energy levels across decades, with peak danceability in the 1990s</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">•</span>
                    <span><strong>Dimensionality Reduction:</strong> t-SNE visualization reveals clear cluster separation and sonic evolution over time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">•</span>
                    <span><strong>Diva Comparison:</strong> Madonna ranks high in danceability and energy compared to other iconic artists</span>
                  </li>
                </ul>
              </section>

              {/* Methods */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Analysis Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-foreground/5 p-4 rounded-lg space-y-2">
                    <p className="font-semibold text-foreground">K-Means Clustering</p>
                    <p className="text-foreground/70">Identified 4 optimal clusters using silhouette analysis (0.4287 score)</p>
                  </div>
                  <div className="bg-foreground/5 p-4 rounded-lg space-y-2">
                    <p className="font-semibold text-foreground">t-SNE Visualization</p>
                    <p className="text-foreground/70">Non-linear dimensionality reduction for pattern discovery (1000 iterations, perplexity=30)</p>
                  </div>
                  <div className="bg-foreground/5 p-4 rounded-lg space-y-2">
                    <p className="font-semibold text-foreground">PCA</p>
                    <p className="text-foreground/70">First 2 PCs explain 60.1% of variance in audio features</p>
                  </div>
                  <div className="bg-foreground/5 p-4 rounded-lg space-y-2">
                    <p className="font-semibold text-foreground">HDBSCAN</p>
                    <p className="text-foreground/70">Density-based clustering for outlier detection (7.8% outliers)</p>
                  </div>
                </div>
              </section>

              {/* Audio Features */}
              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Average Audio Profile</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { name: 'Danceability', value: 0.658, color: '#FF1493' },
                    { name: 'Energy', value: 0.634, color: '#1DB954' },
                    { name: 'Valence', value: 0.562, color: '#FFD700' },
                    { name: 'Acousticness', value: 0.124, color: '#1ed760' },
                  ].map(feature => (
                    <div key={feature.name} className="space-y-1">
                      <div className="flex justify-between text-foreground/70">
                        <span>{feature.name}</span>
                        <span className="font-semibold text-foreground">{(feature.value * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-foreground/10 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ 
                            width: `${feature.value * 100}%`,
                            backgroundColor: feature.color 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Data Source */}
              <section className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
                <p className="text-foreground/80">
                  <strong>Data Source:</strong> Spotify Dataset (1921-2020, 600k+ tracks) | 
                  <strong className="ml-2">Artist:</strong> Madonna | 
                  <strong className="ml-2">Tracks Analyzed:</strong> 250+ after cleaning
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SpotifyAnalysisTile;

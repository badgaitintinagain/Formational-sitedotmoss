"use client";
import React, { useState, useEffect } from 'react';
import Tile from './Tile';
import { Music, TrendingUp, BarChart3, X, RadarIcon } from 'lucide-react';

interface ClusterData {
  cluster: number;
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  speechiness: number;
}

interface TrackData {
  name: string;
  artists: string;
  release_year: number;
  cluster: number;
  tsne_x: number;
  tsne_y: number;
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  speechiness: number;
}

interface DivaData {
  artists: string;
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  speechiness: number;
}

interface SpotifyAnalysisTileProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const CLUSTER_NAMES: Record<number, { name: string; emoji: string; description: string; color: string }> = {
  0: { name: "The Disco Dynamo", emoji: "🔥", description: "High energy, danceable pop hits", color: "#FF1493" },
  1: { name: "The Vulnerable Soul", emoji: "💙", description: "Emotional ballads with acoustic warmth", color: "#1DB954" },
  2: { name: "The Modern Rebel", emoji: "⚡", description: "Electronic, bold, experimental tracks", color: "#FFD700" },
  3: { name: "The Intimate Whisper", emoji: "🌙", description: "Acoustic, introspective, vulnerable", color: "#1ed760" }
};

const SpotifyAnalysisTile: React.FC<SpotifyAnalysisTileProps> = ({ 
  size = '2x1', 
  accent = 'primary', 
  opacity = 50 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personas' | 'galaxy' | 'comparison'>('personas');
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [divas, setDivas] = useState<DivaData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clusterRes, trackRes, divaRes] = await Promise.all([
          fetch('/assets/data/cluster_summary.json'),
          fetch('/assets/data/music_galaxy.json'),
          fetch('/assets/data/diva_dna.json'),
        ]);
        const clusterData = await clusterRes.json();
        const trackData = await trackRes.json();
        const divaData = await divaRes.json();
        setClusters(clusterData);
        setTracks(trackData);
        setDivas(divaData);
      } catch (err) {
        console.error('Failed to load analysis data:', err);
      }
    };
    loadData();
  }, []);

  return (
    <>
      <Tile
        size={size}
        accentType={accent}
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

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-foreground/10 px-6">
              {(['personas', 'galaxy', 'comparison'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab
                      ? 'text-foreground border-b-2 border-primary'
                      : 'text-foreground/60 hover:text-foreground/80'
                  }`}
                >
                  {tab === 'personas' && '🎵 Sonic Personas'}
                  {tab === 'galaxy' && '🌌 Music Galaxy'}
                  {tab === 'comparison' && '💎 Diva DNA'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-foreground/80">
              {/* PERSONAS TAB */}
              {activeTab === 'personas' && (
                <section className="space-y-4">
                  <p className="text-sm text-foreground/70 mb-4">
                    AI discovered 4 distinct "Sonic Personas" by analyzing audio features like danceability, energy, valence, and acousticness. Interestingly, these groups don't follow chronological order—they reflect how songs feel, not when they were released! 🧠
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clusters.map((cluster) => {
                      const meta = CLUSTER_NAMES[cluster.cluster];
                      const tracksInCluster = tracks.filter(t => t.cluster === cluster.cluster).length;
                      
                      return (
                        <div key={cluster.cluster} className="bg-foreground/5 border border-foreground/10 rounded-lg p-4 hover:bg-foreground/8 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-2xl">{meta.emoji}</p>
                              <p className="text-lg font-bold text-foreground">{meta.name}</p>
                              <p className="text-xs text-foreground/60">{meta.description}</p>
                            </div>
                            <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-1 rounded">{tracksInCluster} songs</span>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            {[
                              { label: 'Danceability', value: cluster.danceability },
                              { label: 'Energy', value: cluster.energy },
                              { label: 'Valence', value: cluster.valence },
                              { label: 'Acousticness', value: cluster.acousticness },
                            ].map(metric => (
                              <div key={metric.label}>
                                <div className="flex justify-between mb-1 text-foreground/70">
                                  <span>{metric.label}</span>
                                  <span className="font-semibold text-foreground">{(metric.value * 100).toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-foreground/10 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full" 
                                    style={{ 
                                      width: `${metric.value * 100}%`,
                                      backgroundColor: meta.color
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* GALAXY TAB */}
              {activeTab === 'galaxy' && (
                <section className="space-y-4">
                  <p className="text-sm text-foreground/70 mb-4">
                    Each dot is a Madonna track. The closer two tracks are, the more similar their "vibe" (audio features). Tracks in the same cluster are color-coded. Watch how songs from different eras can neighbor each other! 🚀
                  </p>
                  
                  <div className="relative bg-slate-900 rounded-lg p-6 aspect-square md:aspect-auto md:h-96 overflow-hidden">
                    {/* Starfield effect */}
                    <svg className="absolute inset-0 w-full h-full" style={{ background: 'linear-gradient(135deg, #1a1410 0%, #2d1b00 100%)' }}>
                      {/* Grid */}
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>

                    {/* Tracks as dots */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
                      {tracks.map((track, idx) => {
                        const meta = CLUSTER_NAMES[track.cluster];
                        const normalizedX = ((track.tsne_x + 10) / 20) * 800;
                        const normalizedY = ((track.tsne_y + 8) / 16) * 600;
                        
                        return (
                          <g key={idx} className="hover-track" title={`${track.name} (${track.release_year})`}>
                            {/* Glow */}
                            <circle cx={normalizedX} cy={normalizedY} r="4" fill={meta.color} opacity="0.3" />
                            {/* Dot */}
                            <circle cx={normalizedX} cy={normalizedY} r="2.5" fill={meta.color} opacity="0.9" />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-black/70 rounded p-3 text-xs">
                      <p className="text-foreground/80 font-semibold mb-2">Clusters:</p>
                      <div className="space-y-1">
                        {Object.entries(CLUSTER_NAMES).map(([key, meta]) => (
                          <div key={key} className="flex items-center gap-2 text-foreground/70">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                            <span>{meta.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-xs">
                    <p className="text-foreground/80">
                      💡 <strong>Insight:</strong> Notice how "Holiday" (1983) sits near "Give It 2 Me" (2008)? Despite 25 years apart, AI detected they share similar danceability and energy DNA. That's the power of unsupervised learning! 🧬
                    </p>
                  </div>
                </section>
              )}

              {/* COMPARISON TAB */}
              {activeTab === 'comparison' && (
                <section className="space-y-4">
                  <p className="text-sm text-foreground/70 mb-4">
                    Comparing Madonna's sonic DNA with other pop icons. Higher values = more of that feature.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {divas.slice(0, 6).map((diva) => (
                      <div key={diva.artists} className="bg-foreground/5 p-3 rounded-lg border border-foreground/10">
                        <p className="font-bold text-foreground mb-2">{diva.artists}</p>
                        <div className="space-y-1">
                          {[
                            { label: 'Dance', value: diva.danceability },
                            { label: 'Energy', value: diva.energy },
                            { label: 'Valence', value: diva.valence },
                          ].map(m => (
                            <div key={m.label} className="flex justify-between items-center">
                              <span className="text-foreground/60">{m.label}</span>
                              <div className="w-16 bg-foreground/10 h-1 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full" 
                                  style={{ width: `${m.value * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-xs">
                    <p className="text-foreground/80">
                      🎯 <strong>Finding:</strong> Madonna scores {(divas.find(d => d.artists === 'Madonna')?.danceability || 0.68) * 100 > 68 ? 'HIGH' : 'MEDIUM'} on danceability (0.685) and energy (0.652), making her one of the most energetic pop icons in this dataset!
                    </p>
                  </div>
                </section>
              )}

              {/* Footer */}
              <div className="border-t border-foreground/10 pt-4 mt-6">
                <p className="text-xs text-foreground/60">
                  <strong>Methods:</strong> K-Means Clustering (4 clusters) • t-SNE Dimensionality Reduction • Silhouette Score: 0.4287
                </p>
                <p className="text-xs text-foreground/60 mt-2">
                  <strong>Data:</strong> 118 Madonna tracks • Spotify Dataset (1921-2020) • 5 Audio Features
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SpotifyAnalysisTile;

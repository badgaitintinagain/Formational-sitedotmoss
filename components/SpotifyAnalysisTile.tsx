"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Tile from './Tile';
import gsap from 'gsap';
import { Activity, BarChart3, ChevronRight, Disc3, MapPinned, Music2, Radar, Sparkles, TrendingUp, X } from 'lucide-react';
import clusterSummaryData from '../assets/data/cluster_summary.json';
import divaDnaData from '../assets/data/diva_dna.json';
import musicGalaxyData from '../assets/data/music_galaxy.json';

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

const CLUSTER_NAMES: Record<number, { name: string; description: string; color: string }> = {
  0: { name: 'The Disco Dynamo', description: 'High energy, danceable pop hits', color: '#FF4D8D' },
  1: { name: 'The Vulnerable Soul', description: 'Emotional ballads with acoustic warmth', color: '#22C55E' },
  2: { name: 'The Modern Rebel', description: 'Electronic, bold, experimental tracks', color: '#FACC15' },
  3: { name: 'The Intimate Whisper', description: 'Acoustic, introspective, vulnerable', color: '#38BDF8' }
};

const TAB_META = {
  personas: {
    title: 'Sonic Personas',
    icon: Sparkles,
    blurb: 'AI groups tracks by feel, not by release year.'
  },
  galaxy: {
    title: 'Music Galaxy',
    icon: MapPinned,
    blurb: 't-SNE turns five audio dimensions into a 2D star map.'
  },
  comparison: {
    title: 'Diva DNA',
    icon: Radar,
    blurb: 'Compare Madonna with other pop icons through shared audio traits.'
  }
} as const;

const SpotifyAnalysisTile: React.FC<SpotifyAnalysisTileProps> = ({
  size = '2x1',
  accent = 'primary',
  opacity = 50
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personas' | 'galaxy' | 'comparison'>('personas');
  const [selectedCluster, setSelectedCluster] = useState(0);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const clusters = clusterSummaryData as ClusterData[];
  const tracks = musicGalaxyData as TrackData[];
  const divas = divaDnaData as DivaData[];

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    gsap.fromTo(
      modalRef.current,
      { opacity: 0, y: 20, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' }
    );
  }, [isOpen]);

  const madonnaTracks = useMemo(() => tracks.filter(track => String(track.artists).includes('Madonna')), [tracks]);
  const selectedTrack = tracks[selectedTrackIndex] ?? tracks[0];
  const selectedClusterMeta = CLUSTER_NAMES[selectedCluster];
  const clusterTrackCounts = useMemo(() => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    tracks.forEach(track => {
      counts[track.cluster] = (counts[track.cluster] ?? 0) + 1;
    });
    return counts;
  }, [tracks]);
  const selectedClusterTracks = useMemo(
    () => tracks.filter(track => track.cluster === selectedCluster).sort((left, right) => right.release_year - left.release_year),
    [tracks, selectedCluster]
  );
  const diva = useMemo(() => divas.find(item => item.artists === 'Madonna') ?? divas[0], [divas]);
  const closestDivaNeighbors = useMemo(
    () => divas
      .filter(item => item.artists !== 'Madonna')
      .sort((left, right) => Math.abs(right.energy - (diva?.energy ?? 0)) - Math.abs(left.energy - (diva?.energy ?? 0)))
      .slice(0, 6),
    [diva, divas]
  );

  const handleClusterSelect = useCallback((cluster: number) => {
    setSelectedCluster(cluster);
    const dominantTrackIndex = tracks.findIndex(track => track.cluster === cluster);
    if (dominantTrackIndex >= 0) {
      setSelectedTrackIndex(dominantTrackIndex);
    }
  }, [tracks]);

  return (
    <>
      <Tile
        size={size}
        accentType={accent}
        opacity={opacity}
        onClick={() => setIsOpen(true)}
        className="group cursor-pointer overflow-hidden"
      >
        <div className="relative flex h-full w-full flex-col justify-between p-4 text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground/80">
              <Music2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em]">AI Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-foreground/50">
              <span className="rounded-full border border-foreground/10 px-2 py-1">118 tracks</span>
            </div>
          </div>

          <div className="relative space-y-2">
            <div>
              <p className="text-lg font-semibold text-foreground">Spotify Analysis</p>
              <p className="text-xs text-foreground/60">Open the cluster map and persona explorer</p>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] text-foreground/60">
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-1">
                <Activity className="h-3 w-3" /> K-Means
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-1">
                <TrendingUp className="h-3 w-3" /> t-SNE
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-1">
                <BarChart3 className="h-3 w-3" /> Radar
              </span>
            </div>
          </div>

          <div className="relative flex items-center justify-between text-[10px] text-foreground/50">
            <span>Madonna deep-dive</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </Tile>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/70 p-3 backdrop-blur-md sm:p-4">
          <div ref={modalRef} className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-background/95 text-foreground shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:h-[calc(100vh-2rem)]">
            <div className="border-b border-foreground/10 bg-gradient-to-r from-background via-background/95 to-background px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-foreground/60">
                    <Sparkles className="h-3 w-3" /> Unsupervised learning showcase
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Madonna Sonic Atlas</h2>
                    <p className="max-w-2xl text-sm text-foreground/65">
                      Explore how AI finds structure in the music: clusters become personas, and t-SNE becomes a galaxy map.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full border border-foreground/10 bg-foreground/5 p-2 text-foreground/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-foreground/10 hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: 'tracks', value: tracks.length.toString() },
                      { label: 'clusters', value: clusters.length.toString() },
                      { label: 'madonna', value: madonnaTracks.length.toString() }
                    ].map(item => (
                      <div key={item.label} className="min-w-[72px] rounded-lg border border-foreground/10 bg-foreground/5 px-2 py-1.5 text-right">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-foreground/45">{item.label}</p>
                        <p className="text-sm font-semibold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-foreground/10 px-3 py-2 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                {(['personas', 'galaxy', 'comparison'] as const).map(tab => {
                  const meta = TAB_META[tab];
                  const Icon = meta.icon;
                  const active = activeTab === tab;

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left transition-all duration-200 ${active ? 'border-foreground/40 bg-foreground/10 text-foreground' : 'border-foreground/10 bg-foreground/5 text-foreground/70 hover:border-foreground/20 hover:bg-foreground/8'}`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${active ? 'bg-foreground/15 text-foreground' : 'bg-foreground/10 text-foreground/70'}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-medium">{meta.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {activeTab === 'personas' && (
                <section className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                    <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Persona Finder</p>
                          <h3 className="mt-2 text-xl font-semibold text-foreground">AI groups tracks by sonic behavior</h3>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/65">
                            These clusters are not sorted by year. They are sorted by feel: energy, warmth, brightness, and tension. Click a cluster to inspect its profile.
                          </p>
                        </div>
                        <div className="hidden rounded-full border border-foreground/10 bg-foreground/5 p-3 text-foreground/80 md:block">
                          <Disc3 className="h-6 w-6" />
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {clusters.map(cluster => {
                          const meta = CLUSTER_NAMES[cluster.cluster];
                          const isSelected = selectedCluster === cluster.cluster;
                          const trackCount = clusterTrackCounts[cluster.cluster] ?? 0;

                          return (
                            <button
                              key={cluster.cluster}
                              onClick={() => {
                                handleClusterSelect(cluster.cluster);
                              }}
                              className={`group rounded-2xl border p-4 text-left transition-all duration-200 ${isSelected ? 'border-foreground/30 bg-foreground/10 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]' : 'border-foreground/10 bg-background/50 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-foreground/6'}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.color }} />
                                    <span className="text-sm font-semibold text-foreground">{meta.name}</span>
                                  </div>
                                  <p className="mt-2 text-xs leading-5 text-foreground/60">{meta.description}</p>
                                </div>
                                <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                                  {trackCount}
                                </span>
                              </div>

                              <div className="mt-4 space-y-2 text-xs">
                                {[
                                  { label: 'Danceability', value: cluster.danceability },
                                  { label: 'Energy', value: cluster.energy },
                                  { label: 'Valence', value: cluster.valence },
                                  { label: 'Acousticness', value: cluster.acousticness }
                                ].map(metric => (
                                  <div key={metric.label}>
                                    <div className="mb-1 flex items-center justify-between text-foreground/60">
                                      <span>{metric.label}</span>
                                      <span className="font-medium text-foreground">{Math.round(metric.value * 100)}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                                      <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${metric.value * 100}%`, background: `linear-gradient(90deg, ${meta.color}, rgba(255,255,255,0.3))` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Current persona</p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedClusterMeta.color }} />
                          <h4 className="text-lg font-semibold text-foreground">{selectedClusterMeta.name}</h4>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-foreground/65">{selectedClusterMeta.description}</p>

                        <div className="mt-4 rounded-xl border border-foreground/10 bg-background/70 p-4">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">Top tracks in this cluster</p>
                          <div className="mt-3 space-y-2">
                            {selectedClusterTracks.slice(0, 3).map(track => (
                              <button
                                key={`${track.name}-${track.release_year}`}
                                onClick={() => setSelectedTrackIndex(tracks.findIndex(item => item.name === track.name && item.release_year === track.release_year))}
                                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${selectedTrack?.name === track.name ? 'border-foreground/35 bg-foreground/12' : 'border-foreground/10 bg-foreground/5 hover:bg-foreground/8'}`}
                              >
                                <span className="min-w-0 truncate text-sm text-foreground">{track.name}</span>
                                <span className="ml-3 shrink-0 text-xs text-foreground/50">{track.release_year}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-foreground/8 to-foreground/3 p-5">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Why it matters</p>
                        <p className="mt-2 text-sm leading-6 text-foreground/70">
                          This is the part where the model stops being a chart and starts becoming a lens: it reveals the music’s internal structure without being told what structure to expect.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'galaxy' && (
                <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-foreground/10 bg-background/80 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">2D manifold</p>
                        <h3 className="mt-1 text-xl font-semibold text-foreground">Music Galaxy Map</h3>
                      </div>
                      <div className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/55">
                        Click a dot to inspect
                      </div>
                    </div>

                    <div className="relative h-[420px] overflow-hidden rounded-2xl border border-foreground/10 bg-[radial-gradient(circle_at_center,rgba(120,120,120,0.14),transparent_55%),linear-gradient(180deg,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.02)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(220,220,220,0.06),transparent_55%),linear-gradient(180deg,rgba(0,0,0,0.30)_0%,rgba(0,0,0,0.12)_100%)]">
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 600" preserveAspectRatio="none">
                        <defs>
                          <pattern id="grid-lines" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.7" />
                          </pattern>
                          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                          </radialGradient>
                        </defs>
                        <rect width="800" height="600" fill="url(#grid-lines)" />
                        <circle cx="400" cy="300" r="130" fill="url(#glow)" opacity="0.3" />

                        {tracks.map((track, index) => {
                          const meta = CLUSTER_NAMES[track.cluster];
                          const x = ((track.tsne_x + 10) / 20) * 800;
                          const y = ((track.tsne_y + 8) / 16) * 600;
                          const isActive = selectedTrack?.name === track.name && selectedTrack?.release_year === track.release_year;
                          const isDimmed = selectedCluster !== track.cluster;

                          return (
                            <g
                              key={`${track.name}-${index}`}
                              className="cursor-pointer"
                              onMouseEnter={() => setSelectedTrackIndex(index)}
                              onClick={() => setSelectedTrackIndex(index)}
                              style={{ opacity: isDimmed ? 0.25 : 1 }}
                            >
                              <title>{`${track.name} (${track.release_year})`}</title>
                              <circle cx={x} cy={y} r={isActive ? 12 : 7} fill={meta.color} opacity={isActive ? 0.22 : 0.12} />
                              <circle cx={x} cy={y} r={isActive ? 5.5 : 3.5} fill={meta.color} stroke="rgba(255,255,255,0.7)" strokeWidth={isActive ? 1.6 : 0.7} />
                            </g>
                          );
                        })}
                      </svg>

                      <div className="absolute left-4 top-4 rounded-2xl border border-foreground/10 bg-background/70 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-foreground/55 backdrop-blur">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-foreground/70" />
                          t-SNE projection
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-4 rounded-2xl border border-foreground/10 bg-background/75 p-3 text-xs backdrop-blur">
                        <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-foreground/50">Cluster palette</p>
                        <div className="space-y-1.5">
                          {Object.entries(CLUSTER_NAMES).map(([key, meta]) => (
                            <button
                              key={key}
                              onClick={() => handleClusterSelect(Number(key))}
                              className="flex items-center gap-2 text-left text-foreground/70 transition-colors hover:text-foreground"
                            >
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                              <span>{meta.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Selected track</p>
                      <div className="mt-3 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">{selectedTrack?.name}</h4>
                          <p className="mt-1 text-sm text-foreground/60">{selectedTrack?.release_year}</p>
                        </div>
                        <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/55">
                          {CLUSTER_NAMES[selectedTrack?.cluster ?? 0]?.name}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs">
                        {[
                          { label: 'Danceability', value: selectedTrack?.danceability ?? 0 },
                          { label: 'Energy', value: selectedTrack?.energy ?? 0 },
                          { label: 'Valence', value: selectedTrack?.valence ?? 0 },
                          { label: 'Acousticness', value: selectedTrack?.acousticness ?? 0 }
                        ].map(metric => (
                          <div key={metric.label}>
                            <div className="mb-1 flex items-center justify-between text-foreground/60">
                              <span>{metric.label}</span>
                              <span className="text-foreground">{Math.round(metric.value * 100)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-fuchsia-400 transition-all duration-500" style={{ width: `${metric.value * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-foreground/8 to-foreground/3 p-5">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Map takeaway</p>
                      <p className="mt-2 text-sm leading-6 text-foreground/70">
                        Tracks that sit close together in this space are statistically similar, even if they were released years apart. That is the useful part of manifold learning: it reveals neighbors the release chronology hides.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'comparison' && (
                <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Reference profile</p>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">Madonna versus the pop field</h3>
                    <p className="mt-2 text-sm leading-6 text-foreground/65">
                      This panel compares Madonna with other artists using the same five audio features. The bars animate on render and keep the focus on relative shape, not just raw numbers.
                    </p>

                    <div className="mt-5 space-y-3">
                      {[
                        { label: 'Danceability', value: diva?.danceability ?? 0 },
                        { label: 'Energy', value: diva?.energy ?? 0 },
                        { label: 'Valence', value: diva?.valence ?? 0 },
                        { label: 'Acousticness', value: diva?.acousticness ?? 0 },
                        { label: 'Speechiness', value: diva?.speechiness ?? 0 }
                      ].map(metric => (
                        <div key={metric.label}>
                          <div className="mb-1 flex items-center justify-between text-xs text-foreground/60">
                            <span>{metric.label}</span>
                            <span className="text-foreground">{metric.value.toFixed(3)}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-cyan-300 to-fuchsia-400 transition-all duration-700" style={{ width: `${metric.value * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Diva DNA</p>
                        <h3 className="mt-2 text-xl font-semibold text-foreground">Closest pop neighbors</h3>
                      </div>
                      <div className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/55">
                        interactive list
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {closestDivaNeighbors
                        .map(item => (
                          <div key={item.artists} className="rounded-xl border border-foreground/10 bg-background/50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-foreground/8">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">{item.artists}</p>
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground/5 text-foreground/50">
                                <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                            <div className="mt-3 space-y-2 text-[10px] uppercase tracking-[0.2em] text-foreground/45">
                              <div className="flex items-center justify-between"><span>Dance</span><span>{item.danceability.toFixed(3)}</span></div>
                              <div className="flex items-center justify-between"><span>Energy</span><span>{item.energy.toFixed(3)}</span></div>
                              <div className="flex items-center justify-between"><span>Valence</span><span>{item.valence.toFixed(3)}</span></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="border-t border-foreground/10 px-5 py-3 text-xs text-foreground/45 sm:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p>K-Means clustering, t-SNE projection, and diva comparison are all precomputed and served from JSON.</p>
                <p>Madonna tracks analyzed: {madonnaTracks.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SpotifyAnalysisTile;

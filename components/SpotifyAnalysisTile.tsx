"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Tile from './Tile';
import gsap from 'gsap';
import { ChevronRight, Disc3, MapPinned, Radar, Sparkles, X } from 'lucide-react';
import clusterSummaryData from '../assets/data/cluster_summary.json';
import divaDnaData from '../assets/data/diva_dna.json';
import musicGalaxyData from '../assets/data/music_galaxy.json';
import mdnaTourImage from '../assets/image/MDNATour-1.jpg';
import discoDynamoImage from '../assets/image/thediscodynamo-1.jpg';
import discoDynamoImage2 from '../assets/image/thediscodynamo-2.png';
import discoDynamoImage3 from '../assets/image/thediscodynamo-3.jpg';

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

interface SimilarTrack {
  index: number;
  similarity: number;
}

interface EraProfile {
  label: string;
  years: string;
  count: number;
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

const AUDIO_FEATURE_KEYS: Array<keyof TrackData> = [
  'danceability',
  'energy',
  'valence',
  'acousticness',
  'speechiness'
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const DISCO_DYNAMO_IMAGES = [discoDynamoImage, discoDynamoImage2, discoDynamoImage3] as const;

const projectTsnePoint = (
  value: number,
  min: number,
  max: number,
  size: number,
  padding = 36
) => {
  if (max === min) return size / 2;
  const normalized = (value - min) / (max - min);
  return padding + normalized * (size - padding * 2);
};

const cosineSimilarity = (left: TrackData, right: TrackData) => {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  AUDIO_FEATURE_KEYS.forEach(key => {
    const leftValue = Number(left[key]);
    const rightValue = Number(right[key]);
    dot += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  });

  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
};

const SpotifyAnalysisTile: React.FC<SpotifyAnalysisTileProps> = ({
  size = '2x1',
  accent = 'primary',
  opacity = 50
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personas' | 'galaxy' | 'comparison'>('personas');
  const [selectedCluster, setSelectedCluster] = useState(0);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [selectedEraIndex, setSelectedEraIndex] = useState(0);
  const [discoImageIndex, setDiscoImageIndex] = useState(() => Math.floor(Math.random() * DISCO_DYNAMO_IMAGES.length));
  const modalRef = useRef<HTMLDivElement>(null);

  const clusters = clusterSummaryData as ClusterData[];
  const tracks = useMemo(
    () => (musicGalaxyData as TrackData[]).filter(track => track.release_year <= 2020),
    []
  );
  const divas = divaDnaData as DivaData[];

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    gsap.fromTo(
      modalRef.current,
      { opacity: 0, y: 20, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' }
    );
  }, [isOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDiscoImageIndex(previous => {
        if (DISCO_DYNAMO_IMAGES.length <= 1) return previous;
        let next = previous;
        while (next === previous) {
          next = Math.floor(Math.random() * DISCO_DYNAMO_IMAGES.length);
        }
        return next;
      });
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const madonnaTracks = useMemo(() => tracks.filter(track => String(track.artists).includes('Madonna')), [tracks]);
  const selectedTrack = tracks[selectedTrackIndex] ?? tracks[0];
  const selectedClusterMeta = CLUSTER_NAMES[selectedCluster];
  const tsneBounds = useMemo(() => {
    const xValues = tracks.map(track => track.tsne_x);
    const yValues = tracks.map(track => track.tsne_y);

    return {
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minY: Math.min(...yValues),
      maxY: Math.max(...yValues)
    };
  }, [tracks]);
  const clusterTrackCounts = useMemo(() => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    tracks.forEach(track => {
      counts[track.cluster] = (counts[track.cluster] ?? 0) + 1;
    });
    return counts;
  }, [tracks]);

  const popularityProxyByTrackIndex = useMemo(() => {
    const centrality = tracks.map((track, index) => {
      let sum = 0;
      let count = 0;
      tracks.forEach((candidate, candidateIndex) => {
        if (candidateIndex === index) return;
        sum += cosineSimilarity(track, candidate);
        count += 1;
      });
      return count > 0 ? sum / count : 0;
    });

    const min = Math.min(...centrality);
    const max = Math.max(...centrality);
    if (max === min) return centrality.map(() => 0.5);

    return centrality.map(value => clamp((value - min) / (max - min), 0, 1));
  }, [tracks]);

  const weightedClusterImpact = useMemo(() => {
    const map: Record<number, { weightedSum: number; share: number; meanWeight: number }> = {
      0: { weightedSum: 0, share: 0, meanWeight: 0 },
      1: { weightedSum: 0, share: 0, meanWeight: 0 },
      2: { weightedSum: 0, share: 0, meanWeight: 0 },
      3: { weightedSum: 0, share: 0, meanWeight: 0 }
    };
    const countMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };

    tracks.forEach((track, index) => {
      const weight = popularityProxyByTrackIndex[index] * 0.85 + 0.15;
      map[track.cluster] = {
        ...map[track.cluster],
        weightedSum: map[track.cluster].weightedSum + weight,
        meanWeight: map[track.cluster].meanWeight + weight
      };
      countMap[track.cluster] = (countMap[track.cluster] ?? 0) + 1;
    });

    const total = Object.values(map).reduce((sum, entry) => sum + entry.weightedSum, 0) || 1;

    Object.keys(map).forEach(clusterKey => {
      const cluster = Number(clusterKey);
      map[cluster].share = map[cluster].weightedSum / total;
      map[cluster].meanWeight = countMap[cluster] > 0 ? map[cluster].meanWeight / countMap[cluster] : 0;
    });

    return map;
  }, [tracks, popularityProxyByTrackIndex]);

  const selectedClusterTracks = useMemo(
    () => tracks.filter(track => track.cluster === selectedCluster).sort((left, right) => right.release_year - left.release_year),
    [tracks, selectedCluster]
  );

  const wormholeLinks = useMemo<SimilarTrack[]>(() => {
    if (!selectedTrack) return [];

    return tracks
      .map((track, index) => ({ index, similarity: cosineSimilarity(selectedTrack, track) }))
      .filter(item => item.index !== selectedTrackIndex)
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, 5);
  }, [selectedTrack, selectedTrackIndex, tracks]);

  const eraProfiles = useMemo<EraProfile[]>(() => {
    const buckets = [
      { label: '80s', min: 1980, max: 1989 },
      { label: '90s', min: 1990, max: 1999 },
      { label: '00s', min: 2000, max: 2009 },
      { label: '10s+', min: 2010, max: 2030 }
    ];

    return buckets
      .map(bucket => {
        const bucketTracks = madonnaTracks.filter(track => track.release_year >= bucket.min && track.release_year <= bucket.max);
        if (!bucketTracks.length) return null;

        const aggregate = bucketTracks.reduce(
          (accumulator, track) => {
            accumulator.danceability += track.danceability;
            accumulator.energy += track.energy;
            accumulator.valence += track.valence;
            accumulator.acousticness += track.acousticness;
            accumulator.speechiness += track.speechiness;
            return accumulator;
          },
          { danceability: 0, energy: 0, valence: 0, acousticness: 0, speechiness: 0 }
        );

        const count = bucketTracks.length;
        return {
          label: bucket.label,
          years: `${bucket.min}-${bucket.max}`,
          count,
          danceability: aggregate.danceability / count,
          energy: aggregate.energy / count,
          valence: aggregate.valence / count,
          acousticness: aggregate.acousticness / count,
          speechiness: aggregate.speechiness / count
        };
      })
      .filter((profile): profile is EraProfile => Boolean(profile));
  }, [madonnaTracks]);

  const safeSelectedEraIndex = clamp(selectedEraIndex, 0, Math.max(eraProfiles.length - 1, 0));
  const selectedEra = eraProfiles[safeSelectedEraIndex] ?? eraProfiles[0];

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
        <div className="relative h-full w-full">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${mdnaTourImage.src})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,22,0.10)_0%,rgba(8,10,22,0.36)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/12 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </Tile>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/70 p-2 backdrop-blur-md sm:p-3"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={modalRef}
            onClick={event => event.stopPropagation()}
            className="mx-auto flex h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-background/95 text-foreground shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:h-[calc(100dvh-1.5rem)]"
          >
            <div className="border-b border-foreground/10 bg-gradient-to-r from-background via-background/95 to-background px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-foreground/60">
                    <Sparkles className="h-3 w-3" /> Unsupervised learning showcase
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Madonna Sonic Atlas</h2>
                    <p className="max-w-2xl text-[11px] text-foreground/65 sm:text-xs">
                      Explore how AI finds structure in the music: clusters become personas, and t-SNE becomes a galaxy map.
                    </p>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2 sm:flex-col sm:items-end">
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
                      <div key={item.label} className="min-w-[64px] rounded-lg border border-foreground/10 bg-foreground/5 px-2 py-1 text-right sm:min-w-[72px] sm:py-1.5">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-foreground/45">{item.label}</p>
                        <p className="text-xs font-semibold text-foreground sm:text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex flex-1 flex-col overflow-hidden md:flex-row">
              <aside className="w-full flex-none border-b border-foreground/10 bg-foreground/5 p-2 md:w-[188px] md:min-w-[188px] md:max-w-[188px] md:border-b-0 md:border-r md:p-2.5">
                <div className="space-y-1.5 md:space-y-2">
                  <p className="hidden px-2 text-[10px] uppercase tracking-[0.25em] text-foreground/45 md:block">Navigation</p>
                  <div className="grid grid-cols-3 gap-1.5 md:grid-cols-1 md:gap-2">
                  {(['personas', 'galaxy', 'comparison'] as const).map(tab => {
                    const meta = TAB_META[tab];
                    const Icon = meta.icon;
                    const active = activeTab === tab;

                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`group flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all duration-200 md:px-3 ${active ? 'border-foreground/40 bg-foreground/12 text-foreground' : 'border-foreground/10 bg-background/50 text-foreground/70 hover:border-foreground/20 hover:bg-foreground/8'}`}
                      >
                        <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md md:h-6 md:w-6 ${active ? 'bg-foreground/15 text-foreground' : 'bg-foreground/10 text-foreground/70'}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate text-[11px] font-medium md:text-xs">{meta.title}</span>
                      </button>
                    );
                  })}
                  </div>
                </div>
              </aside>

              <div className="min-h-0 min-w-0 flex-1 overflow-hidden px-2.5 py-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4">
              {activeTab === 'personas' && (
                <section className="h-full overflow-y-auto pr-1">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
                    <div className="min-w-0 rounded-2xl border border-foreground/10 bg-foreground/5 p-3.5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Persona Finder</p>
                          <h3 className="mt-1.5 text-base font-semibold text-foreground sm:text-lg">AI groups tracks by sonic behavior</h3>
                          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-foreground/65">
                            These clusters are not sorted by year. They are sorted by feel: energy, warmth, brightness, and tension. Click a cluster to inspect its profile.
                          </p>
                        </div>
                        <div className="hidden rounded-full border border-foreground/10 bg-foreground/5 p-3 text-foreground/80 md:block">
                          <Disc3 className="h-6 w-6" />
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {clusters.map(cluster => {
                          const meta = CLUSTER_NAMES[cluster.cluster];
                          const isDiscoPersona = cluster.cluster === 0;
                          const isSelected = selectedCluster === cluster.cluster;
                          const trackCount = clusterTrackCounts[cluster.cluster] ?? 0;
                          const impactShare = weightedClusterImpact[cluster.cluster]?.share ?? 0;
                          const meanWeight = weightedClusterImpact[cluster.cluster]?.meanWeight ?? 0;

                          return (
                            <button
                              key={cluster.cluster}
                              onClick={() => {
                                handleClusterSelect(cluster.cluster);
                              }}
                              className={`group relative overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-200 ${isSelected ? 'border-foreground/30 bg-foreground/10 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]' : 'border-foreground/10 bg-background/50 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-foreground/6'}`}
                            >
                              {cluster.cluster === 0 && (
                                <>
                                  <div
                                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-95"
                                    style={{ backgroundImage: `url(${DISCO_DYNAMO_IMAGES[discoImageIndex].src})` }}
                                  />
                                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,22,0.97)_0%,rgba(8,10,22,0.84)_42%,rgba(8,10,22,0.58)_68%,rgba(8,10,22,0.42)_100%)]" />
                                </>
                              )}

                              <div className="relative flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.color }} />
                                    <span className={`text-xs font-semibold sm:text-sm ${isDiscoPersona ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]' : 'text-foreground'}`}>{meta.name}</span>
                                  </div>
                                  <p className={`mt-1.5 text-[11px] leading-4 ${isDiscoPersona ? 'text-white/88' : 'text-foreground/60'}`}>{meta.description}</p>
                                </div>
                                <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.25em] ${isDiscoPersona ? 'border-white/25 bg-black/30 text-white/95' : 'border-foreground/10 bg-foreground/5 text-foreground/60'}`}>
                                  {Math.round(impactShare * 100)}%
                                </span>
                              </div>

                              <div className={`mt-2.5 text-[10px] uppercase tracking-[0.2em] ${isDiscoPersona ? 'text-white/78' : 'text-foreground/45'}`}>
                                Weighted impact • {trackCount} tracks
                              </div>
                              <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${isDiscoPersona ? 'bg-white/22' : 'bg-foreground/10'}`}>
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${clamp(meanWeight * 100, 8, 100)}%`,
                                    background: `linear-gradient(90deg, ${meta.color}, rgba(255,255,255,0.35))`
                                  }}
                                />
                              </div>

                              <div className="relative mt-3 space-y-1.5 text-xs">
                                {[
                                  { label: 'Danceability', value: cluster.danceability },
                                  { label: 'Energy', value: cluster.energy },
                                  { label: 'Valence', value: cluster.valence }
                                ].map(metric => (
                                  <div key={metric.label}>
                                    <div className={`mb-1 flex items-center justify-between ${isDiscoPersona ? 'text-white/84' : 'text-foreground/60'}`}>
                                      <span>{metric.label}</span>
                                      <span className={`font-medium ${isDiscoPersona ? 'text-white' : 'text-foreground'}`}>{Math.round(metric.value * 100)}%</span>
                                    </div>
                                    <div className={`h-1.5 overflow-hidden rounded-full ${isDiscoPersona ? 'bg-white/22' : 'bg-foreground/10'}`}>
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

                    <div className="min-w-0 space-y-3">
                      <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-3.5">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Current persona</p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedClusterMeta.color }} />
                          <h4 className="text-lg font-semibold text-foreground">{selectedClusterMeta.name}</h4>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-foreground/65">{selectedClusterMeta.description}</p>

                        <div className="mt-2.5 rounded-xl border border-foreground/10 bg-background/70 p-2.5">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">Feature weighting 2.0</p>
                          <p className="mt-1.5 text-xs text-foreground/60">
                            Vibe-central tracks receive higher influence, surfacing personas that feel most mainstream inside this sonic network.
                          </p>
                          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(weightedClusterImpact[selectedCluster]?.share ?? 0) * 100}%`,
                                background: `linear-gradient(90deg, ${selectedClusterMeta.color}, rgba(255,255,255,0.35))`
                              }}
                            />
                          </div>
                          <p className="mt-1.5 text-[11px] text-foreground/65">
                            Share of weighted popularity: {Math.round((weightedClusterImpact[selectedCluster]?.share ?? 0) * 100)}%
                          </p>
                        </div>

                        <div className="mt-2.5 rounded-xl border border-foreground/10 bg-background/70 p-2.5">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">Top tracks in this cluster</p>
                          <div className="mt-2.5 space-y-1.5">
                            {selectedClusterTracks.slice(0, 2).map(track => (
                              <button
                                key={`${track.name}-${track.release_year}`}
                                onClick={() => setSelectedTrackIndex(tracks.findIndex(item => item.name === track.name && item.release_year === track.release_year))}
                                className={`flex min-w-0 w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${selectedTrack?.name === track.name ? 'border-foreground/35 bg-foreground/12' : 'border-foreground/10 bg-foreground/5 hover:bg-foreground/8'}`}
                              >
                                <span className="min-w-0 flex-1 truncate pr-2 text-xs text-foreground sm:text-sm" title={track.name}>{track.name}</span>
                                <span className="ml-3 shrink-0 text-xs text-foreground/50">{track.release_year}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-foreground/8 to-foreground/3 p-3.5">
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
                <section className="grid h-full gap-3 overflow-y-auto pr-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
                  <div className="min-w-0 rounded-2xl border border-foreground/10 bg-background/80 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">2D manifold</p>
                        <h3 className="mt-1 text-xl font-semibold text-foreground">Music Galaxy 2.0: Wormhole Edition</h3>
                      </div>
                      <div className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/55">
                        Click a dot to inspect
                      </div>
                    </div>

                    <div className="relative h-[min(35vh,300px)] min-h-[235px] overflow-hidden rounded-2xl border border-foreground/10 bg-[radial-gradient(circle_at_center,rgba(120,120,120,0.14),transparent_55%),linear-gradient(180deg,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.02)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(220,220,220,0.06),transparent_55%),linear-gradient(180deg,rgba(0,0,0,0.30)_0%,rgba(0,0,0,0.12)_100%)]">
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <pattern id="grid-lines" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.7" />
                          </pattern>
                          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                          </radialGradient>
                        </defs>
                        <rect width="1000" height="620" fill="url(#grid-lines)" />
                        <circle cx="500" cy="310" r="150" fill="url(#glow)" opacity="0.3" />

                        {selectedTrack && wormholeLinks.map(link => {
                          const selectedX = projectTsnePoint(selectedTrack.tsne_x, tsneBounds.minX, tsneBounds.maxX, 1000);
                          const selectedY = projectTsnePoint(selectedTrack.tsne_y, tsneBounds.minY, tsneBounds.maxY, 620);
                          const targetTrack = tracks[link.index];
                          if (!targetTrack) return null;

                          const targetX = projectTsnePoint(targetTrack.tsne_x, tsneBounds.minX, tsneBounds.maxX, 1000);
                          const targetY = projectTsnePoint(targetTrack.tsne_y, tsneBounds.minY, tsneBounds.maxY, 620);
                          const opacity = clamp((link.similarity - 0.85) / 0.15, 0.2, 0.95);

                          return (
                            <line
                              key={`wormhole-${selectedTrackIndex}-${link.index}`}
                              x1={selectedX}
                              y1={selectedY}
                              x2={targetX}
                              y2={targetY}
                              stroke="rgba(125,211,252,0.9)"
                              strokeWidth={1 + opacity * 2.5}
                              strokeOpacity={opacity}
                              strokeDasharray="3 4"
                            />
                          );
                        })}

                        {tracks.map((track, index) => {
                          const meta = CLUSTER_NAMES[track.cluster];
                          const x = projectTsnePoint(track.tsne_x, tsneBounds.minX, tsneBounds.maxX, 1000);
                          const y = projectTsnePoint(track.tsne_y, tsneBounds.minY, tsneBounds.maxY, 620);
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
                          t-SNE projection + cosine wormholes
                        </span>
                      </div>

                    </div>

                    <div className="mt-2.5 rounded-2xl border border-foreground/10 bg-background/60 p-3 text-xs">
                      <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-foreground/50">Cluster palette</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(CLUSTER_NAMES).map(([key, meta]) => (
                          <button
                            key={key}
                            onClick={() => handleClusterSelect(Number(key))}
                            className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-left text-foreground/75 transition-colors hover:bg-foreground/10 hover:text-foreground"
                          >
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                            <span>{meta.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-3">
                    <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Selected track</p>
                      <div className="mt-3 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="max-w-[240px] truncate text-lg font-semibold text-foreground sm:max-w-[300px]" title={selectedTrack?.name}>{selectedTrack?.name}</h4>
                          <p className="mt-1 text-sm text-foreground/60">{selectedTrack?.release_year}</p>
                        </div>
                        <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/55">
                          {CLUSTER_NAMES[selectedTrack?.cluster ?? 0]?.name}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
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
                            <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-fuchsia-400 transition-all duration-500" style={{ width: `${metric.value * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 rounded-xl border border-foreground/10 bg-background/60 p-2.5">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">Closest vibe wormholes</p>
                        <div className="mt-2 space-y-1.5">
                          {wormholeLinks.map(link => {
                            const track = tracks[link.index];
                            if (!track) return null;

                            return (
                              <button
                                key={`${track.name}-${track.release_year}`}
                                onClick={() => setSelectedTrackIndex(link.index)}
                                className="flex min-w-0 w-full items-center justify-between rounded-lg border border-foreground/10 bg-foreground/5 px-2 py-1.5 text-left text-xs text-foreground/70 transition-colors hover:bg-foreground/10"
                              >
                                <span className="truncate">{track.name}</span>
                                <span className="ml-2 shrink-0 text-foreground/50">{Math.round(link.similarity * 100)}%</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-foreground/8 to-foreground/3 p-4">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Map takeaway</p>
                      <p className="mt-2 text-sm leading-6 text-foreground/70">
                        Tracks that sit close together in this space are statistically similar, even if they were released years apart. That is the useful part of manifold learning: it reveals neighbors the release chronology hides.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'comparison' && (
                <section className="grid h-full gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Evolution map</p>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">Diva DNA 2.0: Timeline mutation</h3>
                    <p className="mt-2 text-sm leading-6 text-foreground/65">
                      Slide across decades to see how Madonna&apos;s sonic DNA mutates over time, then compare each era with her all-time baseline.
                    </p>

                    <div className="mt-4 rounded-xl border border-foreground/10 bg-background/60 p-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-foreground/65">
                        <span>{selectedEra?.label ?? 'N/A'} ({selectedEra?.years ?? '-'})</span>
                        <span>{selectedEra?.count ?? 0} tracks</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(eraProfiles.length - 1, 0)}
                        value={safeSelectedEraIndex}
                        onChange={event => setSelectedEraIndex(Number(event.target.value))}
                        className="mt-2 w-full accent-cyan-400"
                        disabled={eraProfiles.length <= 1}
                      />
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-[0.18em] text-foreground/45">
                        {eraProfiles.map((era, index) => (
                          <button
                            key={era.label}
                            onClick={() => setSelectedEraIndex(index)}
                            className={`rounded-full border px-2 py-0.5 transition-colors ${index === safeSelectedEraIndex ? 'border-foreground/35 bg-foreground/12 text-foreground' : 'border-foreground/10 bg-foreground/5 hover:bg-foreground/10'}`}
                          >
                            {era.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      {[
                        { label: 'Danceability', value: selectedEra?.danceability ?? 0, baseline: diva?.danceability ?? 0 },
                        { label: 'Energy', value: selectedEra?.energy ?? 0, baseline: diva?.energy ?? 0 },
                        { label: 'Valence', value: selectedEra?.valence ?? 0, baseline: diva?.valence ?? 0 },
                        { label: 'Acousticness', value: selectedEra?.acousticness ?? 0, baseline: diva?.acousticness ?? 0 },
                        { label: 'Speechiness', value: selectedEra?.speechiness ?? 0, baseline: diva?.speechiness ?? 0 }
                      ].map(metric => (
                        <div key={metric.label}>
                          <div className="mb-1 flex items-center justify-between text-xs text-foreground/60">
                            <span>{metric.label}</span>
                            <span className="text-foreground">{metric.value.toFixed(3)} ({metric.value >= metric.baseline ? '+' : ''}{(metric.value - metric.baseline).toFixed(3)})</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-cyan-300 to-fuchsia-400 transition-all duration-700" style={{ width: `${metric.value * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">Diva DNA baseline</p>
                        <h3 className="mt-2 text-xl font-semibold text-foreground">Closest pop neighbors</h3>
                      </div>
                      <div className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/55">
                        interactive list
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
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
            </div>

            <div className="border-t border-foreground/10 px-4 py-2.5 text-[11px] text-foreground/50 sm:px-5 sm:text-xs">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p>K-Means clustering, t-SNE projection, and diva comparison are all precomputed and served from JSON.</p>
                <p className="sm:text-right">Madonna tracks analyzed: {madonnaTracks.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SpotifyAnalysisTile;

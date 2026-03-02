"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Tile from './Tile';
import { X, Footprints, Upload, Loader2, ImageIcon, BarChart3, Eye, Layers, RotateCcw } from 'lucide-react';
import gsap from 'gsap';

// --- Types ---
interface ShoeResult {
  side: string;
  brand: string;
  confidence: number;
  pose_score: number;
  blur_score: number;
  depth_score: number;
  probs: {
    swin: number[];
    marqo: number[];
    google: number[];
    weighted_avg: number[];
    weights: number[];
  };
  relabel_info: string;
  crop_base64: string;
  pose_base64: string;
}

interface PersonResult {
  rank: number;
  shoes: ShoeResult[];
  person_crop_base64: string;
}

interface InferenceResult {
  annotated_image: string;
  depth_map: string;
  persons: PersonResult[];
}

interface GradioClient {
  predict: (endpoint: string, data: unknown[]) => Promise<{ data: unknown[] }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submit: (endpoint: string, data: unknown[]) => AsyncIterable<any>;
}

interface ShoeDemoProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const BRANDS = ['adidas', 'nike', 'asics', 'other'];
const BRAND_COLORS: Record<string, string> = {
  adidas: '#00CED1',
  nike: '#FF4444',
  asics: '#4488FF',
  other: '#888888'
};

// --- Probability Bar Chart ---
const ProbChart: React.FC<{ probs: ShoeResult['probs'] }> = ({ probs }) => {
  const maxVal = Math.max(
    ...probs.swin, ...probs.marqo, ...probs.google, ...probs.weighted_avg
  );
  const scale = maxVal > 0 ? 1 / Math.max(maxVal, 1) : 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap text-[8px] uppercase tracking-widest opacity-50">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-400 inline-block" /> Swin({probs.weights[0]?.toFixed(2)})</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-400 inline-block" /> Marqo({probs.weights[1]?.toFixed(2)})</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> Google({probs.weights[2]?.toFixed(2)})</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-white/80 inline-block border border-foreground/20" /> Avg</span>
      </div>
      {BRANDS.map((brand, i) => (
        <div key={brand} className="space-y-0.5">
          <div className="text-[9px] font-bold uppercase tracking-wider opacity-70 text-foreground">{brand}</div>
          <div className="flex gap-0.5 h-3">
            <div className="bg-sky-400/80 rounded-sm transition-all duration-500" style={{ width: `${(probs.swin[i] ?? 0) * scale * 100}%`, minWidth: '2px' }} />
            <div className="bg-green-400/80 rounded-sm transition-all duration-500" style={{ width: `${(probs.marqo[i] ?? 0) * scale * 100}%`, minWidth: '2px' }} />
            <div className="bg-red-400/80 rounded-sm transition-all duration-500" style={{ width: `${(probs.google[i] ?? 0) * scale * 100}%`, minWidth: '2px' }} />
            <div className="bg-white/60 border border-foreground/10 rounded-sm transition-all duration-500" style={{ width: `${(probs.weighted_avg[i] ?? 0) * scale * 100}%`, minWidth: '2px' }} />
          </div>
          <div className="text-[8px] opacity-40 text-foreground">
            {((probs.weighted_avg[i] ?? 0) * 100).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Quality Metrics ---
const QualityMetrics: React.FC<{ shoe: ShoeResult }> = ({ shoe }) => (
  <div className="grid grid-cols-3 gap-2">
    {[
      { label: 'Pose', value: shoe.pose_score, icon: Eye },
      { label: 'Blur', value: shoe.blur_score, icon: Layers },
      { label: 'Depth', value: shoe.depth_score, icon: BarChart3 },
    ].map(({ label, value, icon: Icon }) => (
      <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-foreground/5 border border-foreground/5">
        <Icon size={12} className="opacity-40 text-foreground" />
        <div className="text-[10px] font-bold text-foreground">{(value * 100).toFixed(0)}%</div>
        <div className="text-[8px] uppercase tracking-widest opacity-40 text-foreground">{label}</div>
      </div>
    ))}
  </div>
);

// --- Shoe Card ---
const ShoeCard: React.FC<{ shoe: ShoeResult; personRank: number }> = ({ shoe, personRank }) => {
  const brandColor = BRAND_COLORS[shoe.brand] || BRAND_COLORS.other;
  
  return (
    <div className="border border-foreground/10 rounded-xl overflow-hidden bg-foreground/[0.02]">
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-foreground/5" style={{ backgroundColor: `${brandColor}15` }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brandColor }} />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            P{personRank} {shoe.side}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase" style={{ color: brandColor }}>{shoe.brand}</span>
          <span className="text-[10px] opacity-50 text-foreground">{(shoe.confidence * 100).toFixed(1)}%</span>
          {shoe.relabel_info && (
            <span className="text-[9px] text-amber-400 italic">{shoe.relabel_info}</span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shoe Images */}
        <div className="space-y-2">
          {shoe.crop_base64 && (
            <div className="relative rounded-lg overflow-hidden border border-foreground/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shoe.crop_base64} alt="Shoe crop" className="w-full h-auto object-contain bg-black/20" />
              <div className="absolute top-1 left-1 text-[8px] bg-black/60 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Crop</div>
            </div>
          )}
          {shoe.pose_base64 && (
            <div className="relative rounded-lg overflow-hidden border border-foreground/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shoe.pose_base64} alt="Pose keypoints" className="w-full h-auto object-contain bg-black/20" />
              <div className="absolute top-1 left-1 text-[8px] bg-black/60 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Pose</div>
            </div>
          )}
        </div>

        {/* Probability Chart */}
        <div className="md:col-span-1">
          <ProbChart probs={shoe.probs} />
        </div>

        {/* Quality Metrics */}
        <div>
          <QualityMetrics shoe={shoe} />
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const ShoeDemoTile: React.FC<ShoeDemoProps> = ({ size = '2x2', accent = 'secondary', opacity = 40 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientRef = useRef<GradioClient | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const HF_REPO_ID = "badgaitintin/shoedetclss";

  const getClient = async () => {
    if (clientRef.current) return clientRef.current;
    setStatusText('Connecting to Hugging Face...');
    const { Client } = await import("@gradio/client");
    clientRef.current = await Client.connect(HF_REPO_ID);
    return clientRef.current;
  };

  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  const [pipelineProgress, setPipelineProgress] = useState(0);

  const resetState = useCallback(() => {
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setStatusText('');
    setLoading(false);
    setPipelineProgress(0);
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Image too large. Maximum 20MB.');
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);
    setPipelineProgress(0);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      setStatusText('Connecting to model...');
      const client = await getClient();

      setStatusText('Starting pipeline...');
      const job = client!.submit("/predict", [file]);

      let gotResult = false;
      for await (const event of job) {
        if (event.type === "status") {
          if (event.stage === "error") {
            throw new Error("Pipeline failed");
          }
          if (event.progress_data && event.progress_data.length > 0) {
            const p = event.progress_data[0];
            setPipelineProgress(Math.round(p.progress * 100));
            if (p.desc) {
              setStatusText(p.desc);
            }
          }
        } else if (event.type === "data" && event.data) {
          if (event.data[0]) {
            const data = event.data[0] as InferenceResult;
            setResult(data);
            setStatusText('');
            setPipelineProgress(100);
            gotResult = true;
          }
        }
      }

      if (!gotResult) {
        throw new Error('No result returned from model');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Inference failed: ${msg}`);
      setStatusText('');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const totalShoes = result?.persons?.reduce((sum, p) => sum + (p.shoes?.length || 0), 0) || 0;

  return (
    <>
      <Tile
        size={size}
        label="Shoe Demo"
        icon={Footprints}
        accentType={accent}
        opacity={opacity}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-40 mt-2"></div>
        </div>
      </Tile>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={modalRef}
            className="relative w-full max-w-5xl h-[85vh] bg-background border border-foreground/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-foreground/5 bg-foreground/5">
              <div className="flex items-center gap-3">
                <Footprints className="text-accent-primary" />
                <div>
                  <h2 className="text-xl font-light tracking-tight text-foreground">Shoe Demo</h2>
                  <p className="text-[10px] uppercase tracking-widest opacity-50 text-foreground">
                    Multi-Model Shoe Brand Classification Pipeline
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(result || previewUrl) && (
                  <button
                    onClick={resetState}
                    className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-foreground/60 hover:text-foreground"
                    title="Reset"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-foreground"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
              
              {/* Upload Area */}
              {!result && (
                <div
                  ref={dropzoneRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => !loading && fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer
                    ${isDragging 
                      ? 'border-accent-primary bg-accent-primary/10' 
                      : 'border-foreground/15 hover:border-foreground/30 hover:bg-foreground/[0.02]'}
                    ${loading ? 'pointer-events-none opacity-60' : ''}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="p-4 flex flex-col items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg object-contain" />
                      {loading && (
                        <div className="w-full max-w-md space-y-2">
                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-primary rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${pipelineProgress}%` }}
                            />
                          </div>
                          {/* Stage label */}
                          <div className="flex items-center justify-center gap-2 text-accent-primary">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-xs tracking-wide">{statusText || 'Processing...'}</span>
                            <span className="text-[10px] opacity-50 tabular-nums">{pipelineProgress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-12 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
                        <Upload size={24} className="text-foreground/30" />
                      </div>
                      <p className="text-sm text-foreground/50">Drop an image here or click to upload</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-30 text-foreground">
                        JPG, PNG — Max 20MB
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
                  
                  {/* Overview Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Annotated Image */}
                    {result.annotated_image && (
                      <div className="rounded-xl overflow-hidden border border-foreground/10 relative">
                        <div className="absolute top-2 left-2 z-10 text-[8px] bg-black/70 text-white px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                          <ImageIcon size={10} /> Annotated
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={result.annotated_image} alt="Annotated" className="w-full h-auto object-contain bg-black/30" />
                      </div>
                    )}

                    {/* Depth Map */}
                    {result.depth_map && (
                      <div className="rounded-xl overflow-hidden border border-foreground/10 relative">
                        <div className="absolute top-2 left-2 z-10 text-[8px] bg-black/70 text-white px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                          <Layers size={10} /> Depth Map
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={result.depth_map} alt="Depth map" className="w-full h-auto object-contain bg-black/30" />
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="flex items-center gap-4 px-1">
                    <div className="text-[10px] uppercase tracking-widest opacity-50 text-foreground">
                      {result.persons?.length || 0} person{(result.persons?.length || 0) !== 1 ? 's' : ''} • {totalShoes} shoe{totalShoes !== 1 ? 's' : ''} detected
                    </div>
                  </div>

                  {/* Per-Shoe Details */}
                  {result.persons?.map((person) => (
                    <div key={person.rank} className="space-y-3">
                      {person.shoes?.map((shoe, shoeIdx) => (
                        <ShoeCard key={`${person.rank}-${shoeIdx}`} shoe={shoe} personRank={person.rank} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pipeline Info Footer */}
            <div className="px-5 py-3 border-t border-foreground/5 bg-foreground/[0.03]">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-widest opacity-30 text-foreground">
                  YOLO → Depth (MiDaS) → Pose (YOLOv8) → Swin-T + FashionSigLIP + SigLIP2 → Consensus Voting
                </p>
                <p className="text-[9px] uppercase tracking-widest opacity-30 text-foreground">
                  Running on HF Space
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShoeDemoTile;

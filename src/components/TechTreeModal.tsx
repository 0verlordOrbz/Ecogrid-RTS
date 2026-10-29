/**
 * TechTreeModal Component — Command & Conquer: Red Alert Style Technology Matrix
 * Military-industrial aesthetic, interactive schematic graph with SVG power wires,
 * prerequisite validation, live research queue with countdown telemetry,
 * and comprehensive tactical engineering dossiers.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Zap,
  Check,
  Lock,
  Clock,
  Sparkles,
  Shield,
  Layers,
  Cpu,
  Flame,
  Droplets,
  Sun,
  Wind,
  BatteryCharging,
  Activity,
  Boxes,
  Radio,
  Bot,
  Radar,
  Coins,
  FileText,
  Globe,
  Crosshair,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Terminal,
  Compass,
  ArrowRight,
  FastForward,
} from 'lucide-react';
import { TechUpgrade, TechCategory } from '../game/types';
import { sound } from '../game/audio';
import { TECH_TO_TARGET_BUILDINGS } from '../game/buildingTechs';
import { BUILDING_DEFS } from '../game/buildingDefs';

interface TechTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  techs: TechUpgrade[];
  funds: number;
  onUnlockTech: (techId: string) => void;
  initialSelectedTechId?: string | null;
}

export type TechStatus = 'locked' | 'available' | 'researching' | 'unlocked';

interface ResearchTask {
  techId: string;
  totalSeconds: number;
  remainingSeconds: number;
  progressPct: number;
}

const CATEGORY_METADATA: Record<string, { label: string; icon: React.ReactNode; color: string; badge: string }> = {
  all: { label: 'ALL DISCIPLINES', icon: <Compass className="w-4 h-4" />, color: '#ef4444', badge: 'ALL' },
  power_systems: { label: 'POWER SYSTEMS', icon: <Sun className="w-4 h-4" />, color: '#f59e0b', badge: 'PWR' },
  efficiency: { label: 'POWER SYSTEMS', icon: <Sun className="w-4 h-4" />, color: '#f59e0b', badge: 'PWR' },
  resource_management: { label: 'STORAGE & BUFFER', icon: <BatteryCharging className="w-4 h-4" />, color: '#10b981', badge: 'STR' },
  storage: { label: 'STORAGE & BUFFER', icon: <BatteryCharging className="w-4 h-4" />, color: '#10b981', badge: 'STR' },
  infrastructure: { label: 'INFRASTRUCTURE', icon: <Activity className="w-4 h-4" />, color: '#06b6d4', badge: 'INF' },
  grid: { label: 'INFRASTRUCTURE', icon: <Activity className="w-4 h-4" />, color: '#06b6d4', badge: 'INF' },
  defense_systems: { label: 'DEFENSE & SECURITY', icon: <Shield className="w-4 h-4" />, color: '#ef4444', badge: 'DEF' },
  advanced_tech: { label: 'ADVANCED AI & R&D', icon: <Cpu className="w-4 h-4" />, color: '#a855f7', badge: 'ADV' },
  special_projects: { label: 'SPECIAL DIRECTIVES', icon: <Coins className="w-4 h-4" />, color: '#ec4899', badge: 'DIR' },
  policy: { label: 'SPECIAL DIRECTIVES', icon: <Coins className="w-4 h-4" />, color: '#ec4899', badge: 'DIR' },
};

export const TechTreeModal: React.FC<TechTreeModalProps> = ({
  isOpen,
  onClose,
  techs,
  funds,
  onUnlockTech,
  initialSelectedTechId,
}) => {
  const [selectedTechId, setSelectedTechId] = useState<string>('perovskite_tandem');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'schematic' | 'dossier'>('schematic');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [researchTasks, setResearchTasks] = useState<Map<string, ResearchTask>>(new Map());
  const canvasRef = useRef<HTMLDivElement>(null);

  // Default selection or initial target on open
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedTechId) {
        setSelectedTechId(initialSelectedTechId);
      } else if (!selectedTechId && techs.length > 0) {
        setSelectedTechId(techs[0].id);
      }
    }
  }, [isOpen, initialSelectedTechId, selectedTechId, techs]);

  // Real-time research tick loop (persists and notifies even when minimized)
  useEffect(() => {
    if (researchTasks.size === 0) return;

    const interval = setInterval(() => {
      setResearchTasks((prev) => {
        const next = new Map(prev);
        let changed = false;

        next.forEach((task, id) => {
          const newRemaining = Math.max(0, task.remainingSeconds - 0.2);
          const progress = Math.min(100, Math.round(((task.totalSeconds - newRemaining) / task.totalSeconds) * 100));

          if (newRemaining <= 0) {
            next.delete(id);
            changed = true;
            sound.playTechUnlocked();
            onUnlockTech(id);
          } else {
            next.set(id, {
              ...task,
              remainingSeconds: newRemaining,
              progressPct: progress,
            });
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [researchTasks, onUnlockTech]);

  // Compute status for a technology
  const getTechStatus = (tech: TechUpgrade): TechStatus => {
    if (tech.unlocked) return 'unlocked';
    if (researchTasks.has(tech.id)) return 'researching';

    const prereqs = tech.prerequisites || [];
    const prereqsMet = prereqs.every((reqId) => {
      const found = techs.find((t) => t.id === reqId);
      return found?.unlocked;
    });

    if (!prereqsMet) return 'locked';
    return 'available';
  };

  const selectedTech = useMemo(() => {
    return techs.find((t) => t.id === selectedTechId) || techs[0];
  }, [techs, selectedTechId]);

  // Filtered techs
  const displayedTechs = useMemo(() => {
    if (activeCategory === 'all') return techs;
    return techs.filter((t) => {
      const cat = t.category;
      if (activeCategory === 'power_systems') return cat === 'power_systems' || cat === 'efficiency';
      if (activeCategory === 'resource_management') return cat === 'resource_management' || cat === 'storage';
      if (activeCategory === 'infrastructure') return cat === 'infrastructure' || cat === 'grid';
      if (activeCategory === 'special_projects') return cat === 'special_projects' || cat === 'policy';
      return cat === activeCategory;
    });
  }, [techs, activeCategory]);

  // Handle Initiating Research
  const handleStartResearch = (tech: TechUpgrade, instant: boolean = false) => {
    const status = getTechStatus(tech);
    if (status === 'locked' || status === 'unlocked' || status === 'researching') {
      sound.playCannotDeploy();
      return;
    }

    if (funds < tech.cost) {
      sound.playCannotDeploy();
      return;
    }

    if (instant) {
      sound.playTechUnlocked();
      onUnlockTech(tech.id);
      return;
    }

    sound.playTechResearch();
    const duration = tech.researchDurationSeconds || 8;
    setResearchTasks((prev) => {
      const next = new Map(prev);
      next.set(tech.id, {
        techId: tech.id,
        totalSeconds: duration,
        remainingSeconds: duration,
        progressPct: 0,
      });
      return next;
    });
  };

  const handleCancelResearch = (techId: string) => {
    sound.playClick();
    setResearchTasks((prev) => {
      const next = new Map(prev);
      next.delete(techId);
      return next;
    });
  };

  // Helper for dynamic icons
  const renderTechIcon = (iconName?: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'Sun': return <Sun className={className} />;
      case 'Wind': return <Wind className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Droplets': return <Droplets className={className} />;
      case 'BatteryCharging': return <BatteryCharging className={className} />;
      case 'Boxes': return <Boxes className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'Lock': return <Shield className={className} />;
      case 'Radio': return <Radio className={className} />;
      case 'Bot': return <Bot className={className} />;
      case 'Radar': return <Radar className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Coins': return <Coins className={className} />;
      case 'FileText': return <FileText className={className} />;
      case 'Globe': return <Globe className={className} />;
      default: return <Zap className={className} />;
    }
  };

  if (!isOpen) {
    if (researchTasks.size === 0) return null;
    return <div className="hidden" aria-hidden="true" />;
  }

  const unlockedCount = techs.filter((t) => t.unlocked).length;
  const researchingCount = researchTasks.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-200">
      {/* Main Red Alert Tactical Chassis */}
      <div className="w-full max-w-7xl h-[94vh] bg-[#090b10] border-2 border-red-700/80 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.25)] flex flex-col overflow-hidden relative font-sans text-slate-200">
        
        {/* CRT Scanline & Radar Overlay Texture */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-40 z-30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />

        {/* Tactical Header Bar */}
        <div className="relative z-40 flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-red-950/90 via-zinc-950 to-zinc-950 border-b-2 border-red-700/60 shadow-lg">
          <div className="flex items-center gap-3">
            {/* Blinking Red Alert Beacon */}
            <div className="relative flex items-center justify-center">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping absolute opacity-75" />
              <span className="w-3 h-3 rounded-full bg-red-600 border border-red-400 relative z-10" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest font-black text-red-500 uppercase px-1.5 py-0.5 rounded bg-red-950/80 border border-red-700/60">
                  RED ALERT // R&D MATRIX
                </span>
                <span className="hidden sm:inline text-xs font-mono text-zinc-500">
                  SEC-CLR: LEVEL 4
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-wide font-display flex items-center gap-2">
                <span>COMMAND TECHNOLOGY MATRIX</span>
                <span className="text-xs font-mono font-normal text-emerald-400">
                  [{unlockedCount}/{techs.length} OPERATIONAL]
                </span>
              </h1>
            </div>
          </div>

          {/* Central Telemetry Chips */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 flex items-center gap-2">
              <span className="text-zinc-500 text-[10px] uppercase">R&D Pipeline:</span>
              <span className={`font-bold ${researchingCount > 0 ? 'text-amber-400 animate-pulse' : 'text-zinc-400'}`}>
                {researchingCount > 0 ? `${researchingCount} IN PROGRESS` : 'STANDBY'}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 flex items-center gap-2">
              <span className="text-zinc-500 text-[10px] uppercase">Treasury:</span>
              <span className="font-bold text-emerald-400 font-mono">
                ₱{funds.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Controls & Close */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => {
                  sound.playClick();
                  setViewMode('schematic');
                }}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-all cursor-pointer ${
                  viewMode === 'schematic'
                    ? 'bg-red-600 text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Tactical Blueprint Schematic"
              >
                SCHEMATIC
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setViewMode('dossier');
                }}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-all cursor-pointer ${
                  viewMode === 'dossier'
                    ? 'bg-red-600 text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Field Intelligence Dossier"
              >
                DOSSIER
              </button>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-600/50 transition-colors cursor-pointer"
              title="Close R&D Command"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Navigation Ribbon */}
        <div className="relative z-40 px-4 sm:px-6 py-2 bg-zinc-950/95 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto touch-scroll">
          {[
            { id: 'all', label: 'ALL DISCIPLINES' },
            { id: 'power_systems', label: 'POWER SYSTEMS' },
            { id: 'resource_management', label: 'STORAGE & BUFFER' },
            { id: 'infrastructure', label: 'INFRASTRUCTURE' },
            { id: 'defense_systems', label: 'DEFENSE & SECURITY' },
            { id: 'advanced_tech', label: 'ADVANCED AI' },
            { id: 'special_projects', label: 'SPECIAL DIRECTIVES' },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playClick();
                  setActiveCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded text-[11px] font-mono tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-red-600/20 text-red-400 border border-red-500/80 font-bold shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                    : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/60'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Workspace (Schematic Graph + Dossier Inspector) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-20">
          
          {/* Main Visual Matrix Area */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-[#06080c]">
            {/* Viewport Zoom Dock (Schematic Mode) */}
            {viewMode === 'schematic' && (
              <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md p-1 rounded-lg border border-zinc-800 shadow-xl">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                  className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-zinc-400 px-1">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.1))}
                  className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer text-[10px] font-mono"
                  title="Reset Zoom"
                >
                  RESET
                </button>
              </div>
            )}

            {/* Matrix View Content */}
            {viewMode === 'schematic' ? (
              <div
                ref={canvasRef}
                className="flex-1 overflow-auto p-4 sm:p-8 touch-scroll relative"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
              >
                {/* SVG Connecting Prerequisite Wires */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
                  <defs>
                    <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="grad-locked" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7f1d1d" />
                      <stop offset="100%" stopColor="#3f3f46" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Tier Columns Header */}
                <div className="grid grid-cols-4 gap-6 min-w-[980px] mb-4 text-xs font-mono">
                  <div className="px-3 py-1 bg-zinc-900/80 border-l-2 border-red-500 text-zinc-300 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>TIER 1 // FOUNDATION</span>
                    <span className="text-[10px] text-zinc-500">NO PREREQS</span>
                  </div>
                  <div className="px-3 py-1 bg-zinc-900/80 border-l-2 border-amber-500 text-zinc-300 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>TIER 2 // INTERMEDIATE</span>
                    <span className="text-[10px] text-zinc-500">TIER 1 REQUIRED</span>
                  </div>
                  <div className="px-3 py-1 bg-zinc-900/80 border-l-2 border-cyan-500 text-zinc-300 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>TIER 3 // ADVANCED</span>
                    <span className="text-[10px] text-zinc-500">TIER 2 REQUIRED</span>
                  </div>
                  <div className="px-3 py-1 bg-zinc-900/80 border-l-2 border-purple-500 text-zinc-300 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>TIER 4 // EXPERIMENTAL</span>
                    <span className="text-[10px] text-zinc-500">TIER 3 REQUIRED</span>
                  </div>
                </div>

                {/* Tactical Nodes Matrix */}
                <div className="grid grid-cols-4 gap-6 min-w-[980px] relative z-20">
                  {[1, 2, 3, 4].map((tierCol) => {
                    const tierNodes = displayedTechs.filter((t) => (t.tier || 1) === tierCol);

                    return (
                      <div key={tierCol} className="space-y-4">
                        {tierNodes.map((tech) => {
                          const status = getTechStatus(tech);
                          const isSelected = tech.id === selectedTechId;
                          const task = researchTasks.get(tech.id);
                          const catInfo = CATEGORY_METADATA[tech.category] || CATEGORY_METADATA.all;

                          // Military status styling
                          let borderClass = 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700';
                          let glowBadge = 'bg-zinc-800 text-zinc-400';

                          if (status === 'unlocked') {
                            borderClass = 'border-emerald-500/80 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
                            glowBadge = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50';
                          } else if (status === 'researching') {
                            borderClass = 'border-amber-500 bg-amber-950/25 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.25)]';
                            glowBadge = 'bg-amber-500/20 text-amber-300 border border-amber-500/60';
                          } else if (status === 'available') {
                            borderClass = isSelected
                              ? 'border-red-500 bg-red-950/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                              : 'border-zinc-700 bg-zinc-900/80 hover:border-red-600/60';
                            glowBadge = 'bg-red-500/20 text-red-400 border border-red-500/40';
                          } else if (status === 'locked') {
                            borderClass = 'border-red-950/60 bg-black/80 opacity-70 hover:opacity-90';
                            glowBadge = 'bg-red-950 text-red-600 border border-red-900/60';
                          }

                          return (
                            <div
                              key={tech.id}
                              onClick={() => {
                                sound.playClick();
                                setSelectedTechId(tech.id);
                              }}
                              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative group ${borderClass} ${
                                isSelected ? 'ring-2 ring-red-500' : ''
                              }`}
                            >
                              {/* Corner Rivet Accents */}
                              <span className="absolute top-1 left-1 w-1 h-1 rounded-full bg-zinc-600" />
                              <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-zinc-600" />
                              <span className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-zinc-600" />
                              <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-zinc-600" />

                              {/* Card Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono font-bold text-red-500">
                                    {tech.tacticalCode || 'RA-TECH'}
                                  </span>
                                  <span className="text-[9px] font-mono text-zinc-500 uppercase">
                                    {catInfo.badge}
                                  </span>
                                </div>

                                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${glowBadge}`}>
                                  {status === 'unlocked' && 'ACTIVE'}
                                  {status === 'researching' && 'R&D...'}
                                  {status === 'available' && 'READY'}
                                  {status === 'locked' && 'LOCKED'}
                                </span>
                              </div>

                              {/* Title & Icon */}
                              <div className="flex items-start gap-2.5 mb-2">
                                <div className={`p-2 rounded-lg shrink-0 ${
                                  status === 'unlocked'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : status === 'researching'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : status === 'available'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                  {renderTechIcon(tech.iconName, 'w-4 h-4')}
                                </div>

                                <div className="min-w-0">
                                  <h3 className="text-xs font-bold text-white tracking-tight leading-snug line-clamp-2">
                                    {tech.name}
                                  </h3>
                                  <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                                    ₱{tech.cost.toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {/* Effect Brief */}
                              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-2 font-sans">
                                {tech.effectDescription}
                              </p>

                              {/* Research Progress Bar if Active */}
                              {status === 'researching' && task && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-amber-400 font-bold">R&D TRANSMISSION</span>
                                    <span className="text-amber-300 tabular-nums">{task.progressPct}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-amber-500/40">
                                    <div
                                      className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-200"
                                      style={{ width: `${task.progressPct}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Prerequisites Warning if Locked */}
                              {status === 'locked' && tech.prerequisites && tech.prerequisites.length > 0 && (
                                <div className="mt-2 text-[10px] font-mono text-red-400/90 flex items-center gap-1">
                                  <Lock className="w-3 h-3 shrink-0 text-red-500" />
                                  <span className="truncate">Req: {tech.prerequisites[0]}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Linear Dossier Mode */
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 touch-scroll">
                {displayedTechs.map((tech) => {
                  const status = getTechStatus(tech);
                  const isSelected = tech.id === selectedTechId;
                  const catInfo = CATEGORY_METADATA[tech.category] || CATEGORY_METADATA.all;

                  return (
                    <div
                      key={tech.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedTechId(tech.id);
                      }}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        status === 'unlocked'
                          ? 'border-emerald-500/60 bg-emerald-950/20'
                          : status === 'researching'
                          ? 'border-amber-500 bg-amber-950/30'
                          : status === 'available'
                          ? 'border-zinc-700 bg-zinc-900/80 hover:border-red-600/60'
                          : 'border-red-950/50 bg-black/80 opacity-75'
                      } ${isSelected ? 'ring-2 ring-red-500' : ''}`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          status === 'unlocked'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : status === 'available'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {renderTechIcon(tech.iconName, 'w-5 h-5')}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-red-500">
                              {tech.tacticalCode || 'RA-TECH'}
                            </span>
                            <span className="text-sm font-bold text-white">
                              {tech.name}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">
                              [{catInfo.label}]
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                            {tech.description}
                          </p>

                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{tech.effectDescription}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Chip */}
                      <div className="shrink-0 flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-zinc-300">
                          ₱{tech.cost.toLocaleString()}
                        </span>

                        {status === 'unlocked' && (
                          <div className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/40 rounded-lg text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            <span>OPERATIONAL</span>
                          </div>
                        )}

                        {status === 'researching' && (
                          <div className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                            <Clock className="w-4 h-4" />
                            <span>R&D ACTIVE</span>
                          </div>
                        )}

                        {status === 'available' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartResearch(tech);
                            }}
                            disabled={funds < tech.cost}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                              funds >= tech.cost
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                          >
                            RESEARCH
                          </button>
                        )}

                        {status === 'locked' && (
                          <div className="px-3 py-1.5 bg-red-950/80 border border-red-900/60 rounded-lg text-red-500 text-xs font-bold flex items-center gap-1.5">
                            <Lock className="w-4 h-4" />
                            <span>LOCKED</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Tactical Command Dossier Panel */}
          <div className="w-full lg:w-96 bg-[#0c0e14] border-t-2 lg:border-t-0 lg:border-l-2 border-red-700/60 flex flex-col justify-between overflow-y-auto p-4 sm:p-5 relative z-30">
            {selectedTech ? (
              <div className="space-y-4">
                {/* Dossier Header */}
                <div className="pb-3 border-b border-zinc-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase px-2 py-0.5 rounded bg-red-950 border border-red-800/80">
                      {selectedTech.tacticalCode || 'RA-TECH-01'} // CLASSIFIED
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      TIER {selectedTech.tier || 1}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white font-display leading-tight">
                    {selectedTech.name}
                  </h2>
                  <span className="text-xs font-mono text-zinc-400 block mt-0.5">
                    Classification: <strong className="text-amber-400">{selectedTech.classifiedLevel || 'Secret'}</strong>
                  </span>
                </div>

                {/* Doctrine Lore Quote */}
                {selectedTech.quote && (
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border-l-2 border-red-600 text-xs font-mono italic text-zinc-300">
                    {selectedTech.quote}
                  </div>
                )}

                {/* Description */}
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    System Technical Overview:
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {selectedTech.description}
                  </p>
                </div>

                {/* Operational Grid Effect */}
                <div className="p-3 rounded-xl bg-zinc-950/90 border border-emerald-500/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Operational Grid Telemetry Impact</span>
                  </div>
                  <p className="text-xs font-mono text-emerald-300">
                    {selectedTech.effectDescription}
                  </p>
                </div>

                {/* Affected Structures & Deployments */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                    Target Assets & Infrastructure Deployments:
                  </span>
                  {(() => {
                    const targets = TECH_TO_TARGET_BUILDINGS[selectedTech.id] || [];
                    if (targets.length === 0) {
                      return (
                        <div className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                          Regional grid infrastructure & municipal policy effect.
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-1.5">
                        {targets.map((tgt) => {
                          const bDef = BUILDING_DEFS[tgt.buildingType];
                          return (
                            <div
                              key={tgt.buildingType}
                              className="p-2 rounded-lg bg-zinc-950/90 border border-red-900/40 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                <div>
                                  <span className="font-bold text-white block">
                                    {bDef?.name || tgt.buildingType}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-mono block">
                                    {tgt.role}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono font-bold text-amber-400 uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 shrink-0">
                                COMPATIBLE
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Prerequisite Chain Status */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                    Prerequisite Validation Chain:
                  </span>
                  {selectedTech.prerequisites && selectedTech.prerequisites.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedTech.prerequisites.map((reqId) => {
                        const reqTech = techs.find((t) => t.id === reqId);
                        const isMet = reqTech?.unlocked;

                        return (
                          <div
                            key={reqId}
                            onClick={() => {
                              if (reqTech) {
                                sound.playClick();
                                setSelectedTechId(reqTech.id);
                              }
                            }}
                            className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                              isMet
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                                : 'bg-red-950/30 border-red-600/40 text-red-300 hover:border-red-500'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isMet ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                              <span className="truncate">{reqTech?.name || reqId}</span>
                            </div>
                            <span className="text-[10px] font-mono uppercase font-bold shrink-0">
                              {isMet ? 'MET' : 'REQUIRED'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Foundational Tier 1 technology (No prerequisites).</span>
                    </div>
                  )}
                </div>

                {/* Dependent Technologies Unlocked by this Node */}
                {(() => {
                  const dependents = techs.filter((t) => t.prerequisites?.includes(selectedTech.id));
                  if (dependents.length === 0) return null;
                  return (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                        Unlocks Next-Tier Upgrades:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {dependents.map((dep) => (
                          <button
                            key={dep.id}
                            onClick={() => {
                              sound.playClick();
                              setSelectedTechId(dep.id);
                            }}
                            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono text-zinc-300 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{dep.name}</span>
                            <ArrowRight className="w-3 h-3 text-red-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Research Action Button & Telemetry */}
                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">R&D Appropriation:</span>
                    <span className="font-bold text-white">₱{selectedTech.cost.toLocaleString()}</span>
                  </div>

                  {(() => {
                    const status = getTechStatus(selectedTech);
                    const task = researchTasks.get(selectedTech.id);
                    const canAfford = funds >= selectedTech.cost;

                    if (status === 'unlocked') {
                      return (
                        <div className="w-full py-3 rounded-xl bg-emerald-600/20 border-2 border-emerald-500/80 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                          <Check className="w-4 h-4" />
                          <span>OPERATIONAL ON ACTIVE GRID</span>
                        </div>
                      );
                    }

                    if (status === 'researching' && task) {
                      return (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleCancelResearch(selectedTech.id)}
                            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                          >
                            <Clock className="w-4 h-4 animate-spin" />
                            <span>R&D ACTIVE ({Math.ceil(task.remainingSeconds)}s) — ABORT</span>
                          </button>
                          <button
                            onClick={() => handleStartResearch(selectedTech, true)}
                            className="w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono text-amber-400 border border-amber-500/40 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FastForward className="w-3 h-3" />
                            <span>INSTANT DEPLOY NOW</span>
                          </button>
                        </div>
                      );
                    }

                    if (status === 'locked') {
                      return (
                        <button
                          disabled
                          className="w-full py-3 rounded-xl bg-red-950/60 border border-red-900/80 text-red-500 font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <Lock className="w-4 h-4" />
                          <span>PREREQUISITES UNFULFILLED</span>
                        </button>
                      );
                    }

                    // Available
                    return (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleStartResearch(selectedTech)}
                          disabled={!canAfford}
                          className={`w-full py-3 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                          <span>
                            {canAfford ? `INITIATE RESEARCH (₱${selectedTech.cost.toLocaleString()})` : `INSUFFICIENT CAPITAL (₱${selectedTech.cost.toLocaleString()})`}
                          </span>
                        </button>

                        {canAfford && (
                          <button
                            onClick={() => handleStartResearch(selectedTech, true)}
                            className="w-full py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <FastForward className="w-3 h-3 text-amber-400" />
                            <span>Fast-Track Immediate Commissioning</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-500 space-y-2 font-mono text-xs">
                <Crosshair className="w-8 h-8 text-zinc-700 animate-pulse" />
                <span>SELECT A TECHNOLOGY NODE TO ACCESS TACTICAL DOSSIER</span>
              </div>
            )}
          </div>
        </div>

        {/* Tactical Footer Strip */}
        <div className="px-4 sm:px-6 py-2.5 bg-zinc-950 border-t border-zinc-800/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-zinc-400 relative z-40">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Operational: <strong className="text-white">{unlockedCount}</strong></span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>In R&D: <strong className="text-amber-400">{researchingCount}</strong></span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
              <span>Available Treasury: <strong className="text-emerald-400">₱{funds.toLocaleString()}</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-500">
              MIL-SPEC // TECH INTEGRATION VERIFIED
            </span>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-mono text-xs border border-zinc-800 transition-colors cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

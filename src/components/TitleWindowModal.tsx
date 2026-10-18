/**
 * TitleWindowModal Component
 * Main Title Screen & Mission Briefing Window for EcoGrid: Clean Energy Transition.
 * Provides game lore, scenario selection, gameplay controls guide, and mission launch.
 */

import React, { useState } from 'react';
import {
  Zap,
  Play,
  Award,
  Layers,
  BookOpen,
  ShieldAlert,
  Volume2,
  VolumeX,
  Compass,
  TrendingUp,
  RotateCcw,
  MousePointer,
  Keyboard,
  Sun,
  Wind,
  BatteryCharging,
  Leaf,
  X,
  Sparkles,
} from 'lucide-react';
import { Scenario, EconomicEngine, PeakDemandProfile } from '../game/types';
import { SCENARIOS } from '../game/scenarios';
import { sound } from '../game/audio';

interface TitleWindowModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  economicEngine: EconomicEngine;
  demandProfile: PeakDemandProfile;
  onOpenCodex: () => void;
  onOpenTechTree: () => void;
}

export const TitleWindowModal: React.FC<TitleWindowModalProps> = ({
  isOpen,
  onClose,
  currentScenario,
  onSelectScenario,
  economicEngine,
  demandProfile,
  onOpenCodex,
  onOpenTechTree,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'scenarios' | 'controls'>('overview');
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);

  if (!isOpen) return null;

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
  };

  const handleLaunch = () => {
    sound.playDeploy();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-950 border-2 border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Decorative Grid Line Accents */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400" />

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white font-display tracking-tight">
                  EcoGrid
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Clean Energy Transition
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Regional Power Grid Strategy, Decarbonization & Climate Resilience Simulator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>
            <button
              onClick={handleLaunch}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800/80 bg-slate-900/40 px-6 text-xs font-semibold">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('overview');
            }}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-emerald-400 text-white font-bold bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Mission Overview
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('scenarios');
            }}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'scenarios'
                ? 'border-emerald-400 text-white font-bold bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Select Scenario ({SCENARIOS.length})
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('controls');
            }}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'controls'
                ? 'border-emerald-400 text-white font-bold bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Directives & Controls Guide
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Active Mission Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                      Active Campaign Assignment
                    </span>
                    <h2 className="text-xl font-bold text-white font-display">
                      {currentScenario.name}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      {currentScenario.description}
                    </p>
                  </div>

                  <button
                    onClick={handleLaunch}
                    className="self-start sm:self-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch Mission</span>
                  </button>
                </div>

                {/* Scenario Parameter Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase block">Starting Capital</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ₱{currentScenario.startingFunds.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase block">Target Clean Pct</span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {currentScenario.targetCleanPct}% Clean
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase block">Market Regime</span>
                    <span className="font-mono text-purple-300 font-bold truncate block">
                      {economicEngine.shortName}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase block">Load Profile</span>
                    <span className="font-mono text-sky-300 font-bold truncate block">
                      {demandProfile.shortName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Pillars Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-display">Generation & Storage</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Balance intermittent solar and onshore/offshore wind with Megapack BESS batteries, geothermal baseload, and hydro dams.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-display">Severe Climate Hazards</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Endure realistic Category 4 heatwaves, violent typhoons with wind turbine cutoffs, and Dunkelflaute wind/solar droughts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-display">Economic Regulation</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Monetize clean generation premiums, carbon sink eco-parks, and cross-border clean exports while preventing municipal insolvency.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Select a geographical sector to launch your clean energy deployment:</span>
                <span className="font-mono">{SCENARIOS.length} Regional Biomes</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {SCENARIOS.map((sc) => {
                  const isSelected = sc.id === currentScenario.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => {
                        sound.playClick();
                        onSelectScenario(sc);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-400 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white font-display">
                          {sc.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {sc.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {sc.tagline}
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>₱{sc.startingFunds.toLocaleString()} Starting</span>
                        <span className="text-emerald-400 font-semibold">{sc.targetCleanPct}% Target</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-5 text-xs text-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <MousePointer className="w-4 h-4 text-emerald-400" />
                    <span>Mouse & Touch Navigation</span>
                  </div>
                  <ul className="space-y-2 text-slate-300 text-[11px]">
                    <li>• <strong>Left-Click / Tap</strong>: Select and inspect terrain tiles or deploy active structure.</li>
                    <li>• <strong>Right-Click / ESC</strong>: Instantly cancel building placement or clear selection.</li>
                    <li>• <strong>Left-Drag / Touch Drag</strong>: Orbit and rotate the 3D diorama camera.</li>
                    <li>• <strong>Scroll Wheel / Pinch</strong>: Zoom in and out smoothly on the power grid.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Keyboard className="w-4 h-4 text-cyan-400" />
                    <span>Tactical Keyboard Shortcuts</span>
                  </div>
                  <ul className="space-y-2 text-slate-300 text-[11px] font-mono">
                    <li>• <strong>Spacebar</strong>: Toggle Simulation Pause / Play</li>
                    <li>• <strong>[S]</strong>: Quick Sell / Decommission Tool</li>
                    <li>• <strong>[R]</strong>: Quick Upgrade Tool (+35% output)</li>
                    <li>• <strong>[1 - 8]</strong>: Direct Building Deployment Hotkeys</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Detailed Technical Codex</h4>
                  <p className="text-[11px] text-slate-400">
                    Review LCOE economics, battery cycling physics, and renewable capacity factors.
                  </p>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenCodex();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Open Codex
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Target: Achieve Net Zero emissions without exhausting municipal reserves.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleLaunch}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Enter Grid Simulation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

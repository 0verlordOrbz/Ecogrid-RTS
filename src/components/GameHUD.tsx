/**
 * GameHUD Component
 * Responsive top command console, real-time power grid telemetry strip,
 * active climate alerts status bar, and mobile navigation drawer.
 */

import React, { useState } from 'react';
import {
  Zap,
  Leaf,
  BatteryCharging,
  Wind,
  Sun,
  Clock,
  Play,
  Pause,
  BookOpen,
  Award,
  Layers,
  Volume2,
  VolumeX,
  Dices,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  X,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  ShieldAlert,
  Menu,
  Radio,
  Thermometer,
} from 'lucide-react';
import { WeatherState, EconomicEngine, PeakDemandProfile } from '../game/types';
import { sound } from '../game/audio';
import { ScenarioEvaluation } from '../game/objectiveEvaluator';
import { DeviceInfo } from '../game/useDeviceType';

interface GameHUDProps {
  totalDemandMW: number;
  totalCleanMW: number;
  totalFossilMW: number;
  cleanPercentage: number;
  co2PerDay: number;
  gridStabilityPct: number;
  funds: number;
  cashDelta: number;
  weather: WeatherState;
  storageMWh: number;
  storageCapacityMWh: number;
  simSpeed: number; // 0 = pause, 1 = normal, 2 = fast, 4 = ultra
  hasBlackout: boolean;
  onSpeedChange: (speed: number) => void;
  onOpenScenarios: () => void;
  onOpenTechTree: () => void;
  onOpenCodex: () => void;
  onOpenClimateRadar?: () => void;
  onOpenTitleWindow?: () => void;
  onRandomizeGrid?: () => void;
  onRandomizeConditions?: () => void;
  onRandomizeAlert?: () => void;
  economicEngine?: EconomicEngine;
  demandProfile?: PeakDemandProfile;
  onOpenEconomicModal?: () => void;
  activeScenarioName: string;
  scenarioEvaluation?: ScenarioEvaluation;
  isObjectivesOpen?: boolean;
  onToggleObjectives?: (open: boolean) => void;
  isClockStartedForScenario?: boolean;
  deviceInfo?: DeviceInfo;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  totalDemandMW,
  totalCleanMW,
  totalFossilMW,
  cleanPercentage,
  co2PerDay,
  gridStabilityPct,
  funds,
  cashDelta,
  weather,
  storageMWh,
  storageCapacityMWh,
  simSpeed,
  hasBlackout,
  onSpeedChange,
  onOpenScenarios,
  onOpenTechTree,
  onOpenCodex,
  onOpenClimateRadar,
  onOpenTitleWindow,
  onRandomizeGrid,
  onRandomizeConditions,
  onRandomizeAlert,
  economicEngine,
  demandProfile,
  onOpenEconomicModal,
  activeScenarioName,
  scenarioEvaluation,
  isObjectivesOpen,
  onToggleObjectives,
  isClockStartedForScenario = false,
  deviceInfo,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [internalDirectivesOpen, setInternalDirectivesOpen] = useState(false);
  const [showScaleMenu, setShowScaleMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDirectivesOpen = isObjectivesOpen !== undefined ? isObjectivesOpen : internalDirectivesOpen;

  const setDirectivesOpen = (open: boolean) => {
    setInternalDirectivesOpen(open);
    if (onToggleObjectives) {
      onToggleObjectives(open);
    }
  };

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
  };

  const totalGenerationMW = totalCleanMW + totalFossilMW;

  // Format time of day
  const hours = Math.floor(weather.timeOfDay) % 24;
  const minutes = Math.floor((weather.timeOfDay - Math.floor(weather.timeOfDay)) * 60 + 0.0001);
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  const activeAlert = weather.activeAlert;
  const upcomingAlert = weather.upcomingAlert;

  return (
    <header className="absolute top-0 left-0 right-0 z-40 flex flex-col pointer-events-none select-none">
      {/* 1. Primary Header Bar */}
      <div className="w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4 pointer-events-auto">
        {/* Left: Brand & Mobile Menu Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            title="Open Mobile Navigation Menu"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white md:hidden cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenTitleWindow?.();
            }}
            title="Open Title Window & Mission Briefing"
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group text-left"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4" />
            </div>

            <div className="hidden min-[380px]:block">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white font-display whitespace-nowrap block leading-tight">
                EcoGrid
              </span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-wider block leading-none">
                Title Menu ▾
              </span>
            </div>
          </button>
        </div>

        {/* Time of Day & Sim Speed Controls */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2 py-1 shadow-sm shrink-0">
          <div className="flex items-center gap-1 text-slate-300 pr-0.5" title="In-Game Time">
            <Clock className={`w-3.5 h-3.5 ${!isClockStartedForScenario && simSpeed === 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'} shrink-0`} />
            <span className="font-mono tabular-nums font-semibold text-white text-xs">{timeFormatted}</span>
            <span className="text-slate-500 text-xs hidden min-[480px]:inline">·</span>
            <span className="font-mono tabular-nums text-slate-400 text-xs hidden min-[480px]:inline">Day {weather.day}</span>
            {!isClockStartedForScenario && simSpeed === 0 && (
              <span className="ml-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 animate-pulse hidden min-[360px]:inline-block">
                PAUSED
              </span>
            )}
          </div>

          <div className="h-3.5 w-px bg-slate-700/80 mx-0.5" />

          {/* Speed Buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onSpeedChange(simSpeed === 0 ? 1 : 0)}
              title={
                !isClockStartedForScenario
                  ? 'Start Simulation (or close Objectives overlay)'
                  : simSpeed === 0
                  ? 'Resume Simulation (Spacebar)'
                  : 'Pause Simulation (Spacebar)'
              }
              className={`p-1 rounded transition-colors cursor-pointer ${
                simSpeed === 0
                  ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {simSpeed === 0 ? (
                <Play className={`w-3 h-3 text-amber-400 fill-amber-400 ${!isClockStartedForScenario ? 'animate-pulse' : ''}`} />
              ) : (
                <Pause className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={() => onSpeedChange(1)}
              title="Normal Pace (1x)"
              className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono font-medium rounded transition-colors cursor-pointer ${
                simSpeed === 1 ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => onSpeedChange(2)}
              title="Fast Pace (2x)"
              className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono font-medium rounded transition-colors cursor-pointer ${
                simSpeed === 2 ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2x
            </button>
            <button
              onClick={() => onSpeedChange(4)}
              title="Ultra Pace (4x)"
              className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono font-medium rounded transition-colors cursor-pointer hidden min-[480px]:inline-block ${
                simSpeed === 4 ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4x
            </button>
          </div>
        </div>

        {/* Desktop Navigation Modals */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5 text-xs font-medium text-slate-300 overflow-x-auto no-scrollbar py-0.5">
          {/* Title Window Button */}
          {onOpenTitleWindow && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenTitleWindow();
              }}
              title="Open Title Window & Mission Briefing"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 bg-emerald-950/20 transition-colors whitespace-nowrap cursor-pointer shrink-0 font-medium"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Title Window</span>
            </button>
          )}

          {/* Active Scenario */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenScenarios();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{activeScenarioName}</span>
          </button>

          {/* Objectives Quick Toggle */}
          {scenarioEvaluation && (
            <button
              onClick={() => {
                sound.playClick();
                setDirectivesOpen(!isDirectivesOpen);
              }}
              title={isDirectivesOpen ? 'Hide Objectives' : 'Show Objectives'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer border shrink-0 ${
                scenarioEvaluation.allCompleted
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-200 shadow-md shadow-amber-500/10 animate-pulse'
                  : isDirectivesOpen
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-200'
              }`}
            >
              {scenarioEvaluation.allCompleted ? (
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : (
                <Target className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>
                Objectives: <strong className="font-mono text-emerald-400">{scenarioEvaluation.completedCount}/{scenarioEvaluation.totalCount}</strong>
              </span>
              {isDirectivesOpen ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
            </button>
          )}

          {/* Climate Radar & Alerts Button */}
          {onOpenClimateRadar && (
            <div className="flex items-center rounded-md border border-slate-700/80 bg-slate-900/80 shadow-sm overflow-hidden shrink-0">
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenClimateRadar();
                }}
                title="Open Climate Hazard Radar & Early Warning Center"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  activeAlert
                    ? 'bg-red-950/80 text-red-200 shadow-md animate-pulse'
                    : upcomingAlert
                    ? 'bg-amber-950/80 text-amber-200'
                    : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <ShieldAlert className={`w-3.5 h-3.5 ${activeAlert ? 'text-red-400' : upcomingAlert ? 'text-amber-400' : 'text-orange-400'}`} />
                <span>Climate Radar</span>
                {activeAlert && (
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping ml-0.5" />
                )}
              </button>
              {onRandomizeAlert && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onRandomizeAlert();
                  }}
                  title="Randomize Climate & Emergency Alerts (Roll Procedural Hazard)"
                  className="px-2 py-1.5 border-l border-slate-700/80 hover:bg-orange-900/50 text-orange-400 transition-colors cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Technology Upgrades */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenTechTree();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Upgrades</span>
          </button>

          {/* Energy Codex */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenCodex();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Codex</span>
          </button>

          {/* Regulatory Market & Demand Curve Pill */}
          {economicEngine && demandProfile && (
            <div className="flex items-center rounded-md border border-slate-700/80 bg-slate-900/80 shadow-sm overflow-hidden shrink-0">
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenEconomicModal?.();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="font-semibold text-xs" style={{ color: economicEngine.color }}>
                  {economicEngine.shortName}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-xs text-sky-300 font-medium">
                  {demandProfile.shortName}
                </span>
              </button>
              {onRandomizeConditions && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onRandomizeConditions();
                  }}
                  title="Randomize Market & Demand"
                  className="px-2 py-1.5 border-l border-slate-700/80 hover:bg-purple-900/50 text-purple-300 transition-colors cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Randomize Grid */}
          {onRandomizeGrid && (
            <button
              onClick={() => {
                sound.playClick();
                onRandomizeGrid();
              }}
              title="Randomize procedural geography"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-purple-900/40 text-purple-200 border border-purple-500/30 bg-purple-950/20 transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              <Dices className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Randomize</span>
            </button>
          )}
        </nav>

        {/* Right Actions: UI Scale & Audio */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          {/* Climate Alert Active Badge on Small/Medium Screens */}
          {(activeAlert || upcomingAlert) && onOpenClimateRadar && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenClimateRadar();
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border transition-all md:hidden cursor-pointer ${
                activeAlert
                  ? 'bg-red-950/90 border-red-500/70 text-red-200 animate-pulse'
                  : 'bg-amber-950/90 border-amber-500/70 text-amber-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="font-mono text-[10px]">
                {activeAlert ? `${activeAlert.shortName} (${Math.round(activeAlert.remainingHours)}h)` : `WATCH`}
              </span>
            </button>
          )}

          {/* UI Sizing Selector */}
          {deviceInfo && (
            <div className="relative">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowScaleMenu(!showScaleMenu);
                }}
                title={`Interface Scale: ${deviceInfo.effectiveScale.toUpperCase()}`}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 bg-slate-900/60 transition-colors cursor-pointer text-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[10px] hidden xl:inline">
                  {deviceInfo.interfaceScale === 'auto' ? 'Auto' : deviceInfo.interfaceScale}
                </span>
              </button>

              {showScaleMenu && (
                <>
                  {/* Backdrop to dismiss scale menu on click outside */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowScaleMenu(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-slate-950/98 border border-slate-700/90 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs backdrop-blur-md pointer-events-auto">
                    <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                      <span>UI Scale</span>
                      <span className="text-emerald-400 font-bold">{deviceInfo.deviceType}</span>
                    </div>
                    {(['auto', 'compact', 'standard', 'comfortable'] as const).map((sc) => (
                      <button
                        key={sc}
                        onClick={() => {
                          sound.playClick();
                          deviceInfo.setInterfaceScale(sc);
                          setShowScaleMenu(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                          deviceInfo.interfaceScale === sc
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="capitalize">{sc === 'auto' ? 'Auto (Device)' : sc}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {sc === 'compact' ? '85%' : sc === 'comfortable' ? '115%' : sc === 'standard' ? '100%' : `${deviceInfo.deviceType}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </div>

      {/* 2. Mobile Navigation Drawer (Visible when hamburger is clicked) */}
      {isMobileMenuOpen && (
        <div className="md:hidden w-full bg-slate-950/98 border-b border-slate-800 p-3 shadow-2xl backdrop-blur-md pointer-events-auto space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {onOpenTitleWindow && (
              <button
                onClick={() => {
                  sound.playClick();
                  setIsMobileMenuOpen(false);
                  onOpenTitleWindow();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 col-span-2 font-bold"
              >
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Title Window & Mission Briefing</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                setIsMobileMenuOpen(false);
                onOpenScenarios();
              }}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
            >
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Scenarios: {activeScenarioName}</span>
            </button>

            {onOpenClimateRadar && (
              <button
                onClick={() => {
                  sound.playClick();
                  setIsMobileMenuOpen(false);
                  onOpenClimateRadar();
                }}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left ${
                  activeAlert
                    ? 'bg-red-950/70 border-red-500/60 text-red-200'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="truncate">Climate Hazard Radar</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                setIsMobileMenuOpen(false);
                onOpenTechTree();
              }}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
            >
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Technology Upgrades</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsMobileMenuOpen(false);
                onOpenCodex();
              }}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
            >
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Energy Codex</span>
            </button>

            {economicEngine && demandProfile && (
              <button
                onClick={() => {
                  sound.playClick();
                  setIsMobileMenuOpen(false);
                  onOpenEconomicModal?.();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 col-span-2"
              >
                <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="truncate">
                  Market: {economicEngine.shortName} · Demand: {demandProfile.shortName}
                </span>
              </button>
            )}

            {onRandomizeAlert && (
              <button
                onClick={() => {
                  sound.playClick();
                  setIsMobileMenuOpen(false);
                  onRandomizeAlert();
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-orange-950/40 border border-orange-500/40 text-orange-200 col-span-2 font-bold cursor-pointer"
              >
                <Dices className="w-4 h-4 text-orange-400" />
                <span>Randomize Climate & Emergency Alert</span>
              </button>
            )}

            {onRandomizeGrid && (
              <button
                onClick={() => {
                  sound.playClick();
                  setIsMobileMenuOpen(false);
                  onRandomizeGrid();
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/40 text-purple-200 col-span-2 font-bold"
              >
                <Dices className="w-4 h-4 text-purple-400" />
                <span>Randomize Procedural Grid</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Mission Objectives Floating Overlay */}
      {isDirectivesOpen && scenarioEvaluation && (
        <div className="absolute top-13 left-2 sm:left-24 md:left-44 w-96 max-w-[94vw] bg-slate-950/95 border border-emerald-500/40 rounded-xl shadow-2xl backdrop-blur-md p-4 z-40 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  {scenarioEvaluation.allCompleted ? '🎉 Mission Accomplished!' : 'Scenario Objectives'}
                </span>
                <span className={`text-[10px] font-mono ${scenarioEvaluation.allCompleted ? 'text-amber-300 font-bold' : 'text-emerald-400'}`}>
                  {scenarioEvaluation.allCompleted
                    ? `All ${scenarioEvaluation.totalCount} Directives Achieved!`
                    : `${scenarioEvaluation.completedCount} of ${scenarioEvaluation.totalCount} completed`}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setDirectivesOpen(false);
              }}
              title="Close scenario objectives"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!isClockStartedForScenario && (
            <div className="mb-2.5 p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <Clock className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                <div>
                  <span className="font-bold text-[11px] block leading-tight text-white">Simulation Clock Paused</span>
                  <span className="text-slate-300 text-[10px]">Close this window to begin operations and start the clock</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-60 sm:max-h-72 overflow-y-auto pr-1 touch-scroll">
            {scenarioEvaluation.objectives.map((obj, i) => (
              <div
                key={obj.id || i}
                className={`p-2.5 rounded-lg border transition-all ${
                  obj.completed
                    ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900/80 border-slate-800/90 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="shrink-0 mt-0.5">
                      {obj.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[11px] font-semibold block leading-tight ${obj.completed ? 'text-white' : 'text-slate-100'}`}>
                        {obj.title}
                      </span>
                      {obj.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                          {obj.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono shrink-0 ml-1 font-semibold ${obj.completed ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {obj.formattedCurrent} / {obj.formattedTarget}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${obj.completed ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    style={{ width: `${obj.progressPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <button
              onClick={() => {
                if (!isClockStartedForScenario) {
                  sound.playDeploy();
                } else {
                  sound.playClick();
                }
                setDirectivesOpen(false);
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                !isClockStartedForScenario
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50 shadow-emerald-950/60 active:scale-[0.98]'
                  : 'bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white'
              }`}
            >
              {!isClockStartedForScenario ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Operations (Commence Simulation Clock)</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>Close Objectives</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. Telemetry & Primary Grid Metrics Strip (Responsive) */}
      <div className="w-full bg-slate-900/85 backdrop-blur-md border-b border-slate-800/70 px-3 sm:px-4 py-1.5 pr-3 lg:pr-76 flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4 text-xs text-slate-300 pointer-events-auto">
        {/* Left Block: Power Generation, Clean %, Stability */}
        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1">
          {/* Generation vs Demand */}
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${hasBlackout ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Grid Load</span>
                <span className="font-mono tabular-nums text-white font-semibold">
                  {totalGenerationMW} / {totalDemandMW} MW
                </span>
                {demandProfile?.isPeakHour(weather.timeOfDay) && (
                  <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 animate-pulse">
                    PEAK
                  </span>
                )}
              </div>
              <div className="w-24 sm:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5 flex">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalCleanMW / Math.max(1, totalDemandMW)) * 100)}%` }}
                  title={`Clean: ${totalCleanMW} MW`}
                />
                <div
                  className="h-full bg-amber-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalFossilMW / Math.max(1, totalDemandMW)) * 100)}%` }}
                  title={`Fossil: ${totalFossilMW} MW`}
                />
              </div>
            </div>
          </div>

          {/* Clean Transition % */}
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Clean Transition</div>
              <span className="font-mono tabular-nums text-emerald-400 font-bold text-xs sm:text-sm">
                {cleanPercentage}%
              </span>
            </div>
          </div>

          {/* Grid Stability */}
          <div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Stability</div>
            <span
              className={`font-mono tabular-nums font-semibold text-xs sm:text-sm ${
                gridStabilityPct >= 95
                  ? 'text-emerald-400'
                  : gridStabilityPct >= 70
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {gridStabilityPct}%
            </span>
          </div>

          {/* Active Climate Alert Callout (If active, clicking opens radar) */}
          {activeAlert && onOpenClimateRadar && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenClimateRadar();
              }}
              title="Severe Climate Hazard Active - Click for mitigation instructions"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/70 text-red-200 text-xs font-semibold animate-pulse cursor-pointer shadow-md"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="font-mono">{activeAlert.shortName}</span>
              <span className="text-[10px] text-red-300">({Math.round(activeAlert.remainingHours)}h)</span>
            </button>
          )}

          {!activeAlert && upcomingAlert && onOpenClimateRadar && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenClimateRadar();
              }}
              title="Climate Watch Forecast - Click to view early warnings"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/70 text-amber-200 text-xs font-semibold cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>WATCH: {upcomingAlert.shortName}</span>
            </button>
          )}
        </div>

        {/* Right Block: Storage, Funds, Weather */}
        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1">
          {/* Storage Capacity */}
          <div className="flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">BESS Storage</div>
              <span className="font-mono tabular-nums font-semibold text-cyan-300 text-xs">
                {storageMWh} / {storageCapacityMWh} MWh
              </span>
            </div>
          </div>

          {/* Treasury */}
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] text-emerald-400 font-mono select-none">
              ₱
            </div>
            <div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Treasury</div>
              <div className="flex items-center gap-1 font-mono tabular-nums text-xs">
                <span className="font-bold text-white">₱{funds.toLocaleString()}</span>
                <span className={`text-[10px] font-medium ${cashDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {cashDelta >= 0 ? `+₱${cashDelta.toLocaleString()}` : `-₱${Math.abs(cashDelta).toLocaleString()}`}/hr
                </span>
              </div>
            </div>
          </div>

          {/* Solar & Wind Quick Telemetry */}
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-2.5">
            <div className="flex items-center gap-1" title="Solar Irradiance">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-mono text-xs text-slate-200">{weather.solarIrradiancePct}%</span>
            </div>
            <div className="flex items-center gap-1" title="Wind Velocity">
              <Wind className="w-3.5 h-3.5 text-sky-300" />
              <span className="font-mono text-xs text-slate-200">{weather.windSpeedMs}m/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Blackout Warning Banner */}
      {hasBlackout && (
        <div className="mx-auto mt-2 max-w-xl bg-rose-950/95 border border-rose-500/70 text-rose-200 text-xs font-semibold px-4 py-1.5 rounded-full shadow-2xl flex items-center justify-center gap-2 animate-pulse pointer-events-auto">
          <Zap className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="truncate">GRID DEFICIT WARNING: Supply falling short of city demand! Blackout penalties accruing.</span>
        </div>
      )}
    </header>
  );
};

import React from 'react';
import {
  X,
  TrendingUp,
  Leaf,
  Shield,
  Zap,
  Flame,
  Activity,
  Factory,
  Server,
  Sun,
  Dices,
  Check,
  Coins,
  Clock,
  Sparkles,
} from 'lucide-react';
import { EconomicEngine, EconomicEngineId, PeakDemandProfile, PeakDemandProfileId } from '../game/types';
import { ECONOMIC_ENGINE_LIST } from '../game/economicEngines';
import { DEMAND_PROFILE_LIST } from '../game/demandProfiles';
import { sound } from '../game/audio';

interface EconomicEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEngine: EconomicEngine;
  activeProfile: PeakDemandProfile;
  onSelectEngine: (engine: EconomicEngine) => void;
  onSelectProfile: (profile: PeakDemandProfile) => void;
  onRandomizeAll: () => void;
  onRandomizeEngine?: () => void;
  onRandomizeProfile?: () => void;
  currentHour: number;
}

export const EconomicEngineModal: React.FC<EconomicEngineModalProps> = ({
  isOpen,
  onClose,
  activeEngine,
  activeProfile,
  onSelectEngine,
  onSelectProfile,
  onRandomizeAll,
  onRandomizeEngine,
  onRandomizeProfile,
  currentHour,
}) => {
  if (!isOpen) return null;

  const isPeakRightNow = activeProfile.isPeakHour(currentHour);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-wider text-purple-400">
                  Regulatory Market & Load Architecture
                </span>
                <span className="text-slate-500 hidden sm:inline">·</span>
                <span className="text-xs text-slate-400 hidden sm:inline">Dynamic Grid Physics</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Economic Engine & Peak Demand Profile
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onRandomizeAll();
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-purple-200 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 rounded-lg transition-colors cursor-pointer shadow-sm"
              title="Randomize both market regulatory engine and peak demand curve"
            >
              <Dices className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="hidden sm:inline">Randomize Both</span>
              <span className="sm:hidden">Random</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-slate-200 touch-scroll">
          {/* Active Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Economic Engine Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Active Economic Model
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded border"
                  style={{
                    color: activeEngine.color,
                    borderColor: `${activeEngine.color}50`,
                    backgroundColor: `${activeEngine.color}15`,
                  }}
                >
                  {activeEngine.shortName}
                </span>
              </div>
              <h3 className="text-base font-bold text-white font-display">
                {activeEngine.name}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeEngine.description}
              </p>
              <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-slate-800/80">
                <div>
                  <span className="text-slate-400 block">Retail Tariff:</span>
                  <span className="font-bold text-white">₱{activeEngine.tariffPerMWh}/MWh</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Clean Premium:</span>
                  <span className="font-bold text-emerald-400">+₱{activeEngine.cleanCreditPerMWh}/MWh</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Fossil Surcharge:</span>
                  <span className="font-bold text-rose-400">-₱{activeEngine.fossilSurchargePerMWh}/MWh</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Surplus Export:</span>
                  <span className="font-bold text-purple-400">+₱{activeEngine.surplusExportRatePerMWh}/MWh</span>
                </div>
              </div>
            </div>

            {/* Active Peak Demand Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Active Load Curve
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1"
                  style={{
                    color: activeProfile.color,
                    borderColor: `${activeProfile.color}50`,
                    backgroundColor: `${activeProfile.color}15`,
                  }}
                >
                  {isPeakRightNow && <Sparkles className="w-3 h-3 animate-spin" />}
                  {isPeakRightNow ? 'PEAK LOAD ACTIVE' : activeProfile.shortName}
                </span>
              </div>
              <h3 className="text-base font-bold text-white font-display">
                {activeProfile.name}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeProfile.description}
              </p>
              <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-slate-800/80">
                <div>
                  <span className="text-slate-400 block">Peak Hours:</span>
                  <span className="font-bold text-amber-300">{activeProfile.peakHoursDescription}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Peak Multiplier:</span>
                  <span className="font-bold text-rose-400">{activeProfile.peakMultiplier}x Surge</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Base Scale:</span>
                  <span className="font-bold text-slate-200">{activeProfile.baseDemandScale}x</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Status:</span>
                  <span className={`font-bold ${isPeakRightNow ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
                    {isPeakRightNow ? '⚡ Peak Hour' : 'Standard Hour'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Choose or Switch Economic Engine */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>Available Economic Engine Types:</span>
              </span>
              <div className="flex items-center gap-2">
                {onRandomizeEngine && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onRandomizeEngine();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 rounded-md transition-colors cursor-pointer"
                    title="Randomize to another market regulatory model"
                  >
                    <Dices className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Randomize Market</span>
                  </button>
                )}
                <span className="text-xs text-slate-400 hidden sm:inline">Click to activate</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ECONOMIC_ENGINE_LIST.map((engine) => {
                const isSelected = activeEngine.id === engine.id;
                return (
                  <button
                    key={engine.id}
                    onClick={() => {
                      sound.playClick();
                      onSelectEngine(engine);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-slate-900 border-2 shadow-lg ring-1 ring-purple-500/30'
                        : 'bg-slate-900/50 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                    style={{
                      borderColor: isSelected ? engine.color : undefined,
                    }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                          style={{
                            color: engine.color,
                            backgroundColor: `${engine.color}15`,
                          }}
                        >
                          {engine.shortName}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white block mt-1">
                        {engine.name}
                      </span>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {engine.tagline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[10px] font-mono grid grid-cols-2 gap-1 text-slate-300">
                      <span>Tariff: ₱{engine.tariffPerMWh}</span>
                      <span className="text-emerald-400">Green: +₱{engine.cleanCreditPerMWh}</span>
                      <span className="text-purple-400">Export: +₱{engine.surplusExportRatePerMWh}</span>
                      <span className="text-rose-400">Blackout: -₱{engine.blackoutPenaltyPerMWh}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Choose or Switch Peak Demand Profile */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Available Peak Demand Profiles:</span>
              </span>
              <div className="flex items-center gap-2">
                {onRandomizeProfile && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onRandomizeProfile();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-300 hover:text-white bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/40 rounded-md transition-colors cursor-pointer"
                    title="Randomize to another peak demand profile curve"
                  >
                    <Dices className="w-3.5 h-3.5 text-sky-400" />
                    <span>Randomize Demand</span>
                  </button>
                )}
                <span className="text-xs text-slate-400 hidden sm:inline">Click to activate</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEMAND_PROFILE_LIST.map((profile) => {
                const isSelected = activeProfile.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    onClick={() => {
                      sound.playClick();
                      onSelectProfile(profile);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-slate-900 border-2 shadow-lg ring-1 ring-sky-500/30'
                        : 'bg-slate-900/50 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                    style={{
                      borderColor: isSelected ? profile.color : undefined,
                    }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                          style={{
                            color: profile.color,
                            backgroundColor: `${profile.color}15`,
                          }}
                        >
                          {profile.shortName}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white block mt-1">
                        {profile.name}
                      </span>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {profile.tagline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[10px] font-mono flex items-center justify-between text-slate-300">
                      <span className="text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {profile.peakHoursDescription}
                      </span>
                      <span className="font-bold text-rose-400">{profile.peakMultiplier}x Peak</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ClimateAlertModal Component
 * Interactive Meteorological & Climate Hazard Command Center.
 * Displays live weather radar telemetry, active/upcoming severe climate alerts,
 * physics impact breakdowns, tactical operator checklists, 5-day forecasts,
 * and emergency drill simulation triggers.
 */

import React from 'react';
import {
  X,
  AlertTriangle,
  Flame,
  CloudOff,
  Tornado,
  CloudFog,
  Snowflake,
  Droplets,
  Wind,
  Sun,
  Thermometer,
  Cloud,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  RotateCcw,
  PlayCircle,
  Radio,
  Dices,
  SunMedium,
  Activity,
} from 'lucide-react';
import { WeatherState, ClimateAlert, ClimateAlertType } from '../game/types';
import { CLIMATE_ALERT_TEMPLATES, createClimateAlert } from '../game/climateAlerts';
import { sound } from '../game/audio';

interface ClimateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherState;
  onTriggerAlert: (type: ClimateAlertType) => void;
  onClearAlert: () => void;
  onRandomizeAlert?: (forceActive?: boolean) => void;
}

export const ClimateAlertModal: React.FC<ClimateAlertModalProps> = ({
  isOpen,
  onClose,
  weather,
  onTriggerAlert,
  onClearAlert,
  onRandomizeAlert,
}) => {
  if (!isOpen) return null;

  const activeAlert = weather.activeAlert;
  const upcomingAlert = weather.upcomingAlert;

  const getAlertIcon = (type: ClimateAlertType, className: string = 'w-6 h-6') => {
    switch (type) {
      case 'heatwave':
        return <Flame className={className} />;
      case 'dunkelflaute':
        return <CloudOff className={className} />;
      case 'typhoon':
        return <Tornado className={className} />;
      case 'wildfire_haze':
        return <CloudFog className={className} />;
      case 'polar_vortex':
        return <Snowflake className={className} />;
      case 'atmospheric_river':
        return <Droplets className={className} />;
      case 'geomagnetic_storm':
        return <Zap className={className} />;
      case 'flash_drought':
        return <SunMedium className={className} />;
      case 'grid_frequency_instability':
        return <Activity className={className} />;
      default:
        return <AlertTriangle className={className} />;
    }
  };

  const getSeverityBadge = (severity: 'advisory' | 'warning' | 'emergency') => {
    switch (severity) {
      case 'emergency':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" /> Emergency
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/50">
            <AlertTriangle className="w-3.5 h-3.5" /> Severe Warning
          </span>
        );
      case 'advisory':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/50">
            <Radio className="w-3.5 h-3.5" /> Advisory
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">
                  Climate & Weather Early Warning Center
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 uppercase">
                  Sector Radar Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Atmospheric radar monitoring, renewable volatility modeling, and grid mitigation directives.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRandomizeAlert && (
              <button
                onClick={() => {
                  sound.playClick();
                  onRandomizeAlert();
                }}
                title="Randomize Climate & Emergency Alert"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/20 cursor-pointer"
              >
                <Dices className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Randomize Hazard</span>
                <span className="sm:hidden">Randomize</span>
              </button>
            )}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 touch-scroll">
          {/* 1. Live Weather & Atmospheric Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Ambient Temp</span>
                <span className="font-mono text-base font-bold text-white">
                  {weather.temperatureC}°C
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {weather.temperatureC > 32 ? 'High Thermal Stress' : weather.temperatureC < 0 ? 'Severe Freeze' : 'Moderate'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Wind Velocity</span>
                <span className="font-mono text-base font-bold text-white">
                  {weather.windSpeedMs} m/s
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {weather.windSpeedMs >= 22 ? 'Turbine Safety Cutoff' : weather.windSpeedMs < 3 ? 'Sub-Cut-In Calm' : 'Optimal Sweep'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Solar Irradiance</span>
                <span className="font-mono text-base font-bold text-white">
                  {weather.solarIrradiancePct}%
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {weather.solarIrradiancePct > 60 ? 'Peak Photovoltaic' : weather.solarIrradiancePct > 20 ? 'Diffused Daylight' : 'Low / Dark'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-700/30 border border-slate-700/50 flex items-center justify-center text-slate-300 shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cloud Cover</span>
                <span className="font-mono text-base font-bold text-white">
                  {weather.cloudCoverPct}%
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {weather.cloudCoverPct > 80 ? 'Heavy Stratus Overcast' : 'Scattered Clouds'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Active Severe Climate Alert Banner */}
          {activeAlert && (
            <div
              className="p-4 sm:p-5 rounded-2xl border-2 space-y-3 shadow-xl backdrop-blur-md relative overflow-hidden"
              style={{
                borderColor: activeAlert.color,
                backgroundColor: `${activeAlert.color}15`,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
                    style={{ backgroundColor: `${activeAlert.color}40`, border: `1px solid ${activeAlert.color}` }}
                  >
                    {getAlertIcon(activeAlert.type, 'w-6 h-6')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white font-display">
                        {activeAlert.title}
                      </h3>
                      {getSeverityBadge(activeAlert.severity)}
                    </div>
                    <span className="text-xs text-slate-300 font-mono">
                      Meteorological Hazard Code: {activeAlert.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5 text-xs text-amber-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Duration Remaining:</span>
                    <strong>{Math.max(1, Math.round(activeAlert.remainingHours))}h</strong>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onClearAlert();
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    Resolve Alert
                  </button>
                </div>
              </div>

              {/* Description & Science Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/70 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Phenomenon Context
                  </span>
                  <p className="text-slate-200 leading-relaxed">
                    {activeAlert.description}
                  </p>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                    Grid Physics Impact
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {activeAlert.scienceNote}
                  </p>
                </div>
              </div>

              {/* Modifiers & Tactical Operator Directives */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase">Generation Impact</span>
                  <div className="space-y-0.5 mt-1 font-mono font-bold">
                    {activeAlert.effects.solarMultiplier !== undefined && (
                      <div className="text-amber-400">
                        Solar PV: {Math.round(activeAlert.effects.solarMultiplier * 100)}% of rated
                      </div>
                    )}
                    {activeAlert.effects.windTurbineCutoff ? (
                      <div className="text-red-400">
                        Onshore Wind: 0 MW (Safety Cutoff)
                      </div>
                    ) : activeAlert.effects.windMultiplier !== undefined ? (
                      <div className="text-sky-400">
                        Wind Turbines: {Math.round(activeAlert.effects.windMultiplier * 100)}% of rated
                      </div>
                    ) : null}
                    {activeAlert.effects.hydroMultiplier !== undefined && (
                      <div className="text-blue-400">
                        Hydro Dams: +{Math.round((activeAlert.effects.hydroMultiplier - 1) * 100)}% Inflow Boost
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase">Demand Load Impact</span>
                  <div className="mt-1 font-mono font-bold text-cyan-300">
                    {activeAlert.effects.demandMultiplier !== undefined
                      ? `City Demand: +${Math.round((activeAlert.effects.demandMultiplier - 1) * 100)}% surge`
                      : 'City Demand: Normal baseline curve'}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase">Tactical Mitigation</span>
                  <p className="text-emerald-300 text-[11px] mt-1 leading-snug">
                    {activeAlert.mitigationAdvice}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Upcoming Alert Watch Phase Banner */}
          {!activeAlert && upcomingAlert && (
            <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>WEATHER WATCH: {upcomingAlert.title}</span>
                </div>
                <div className="text-xs font-mono text-amber-400 font-bold">
                  Arriving in ~{Math.round(upcomingAlert.warningLeadHours)} hours
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {upcomingAlert.description} Early advisory gives you time to pre-charge BESS battery banks and commission standby generation.
              </p>
              <div className="text-xs text-amber-200/90 font-medium bg-amber-950/60 p-2 rounded-lg border border-amber-500/30">
                <strong>Recommended Pre-Emptive Action:</strong> {upcomingAlert.mitigationAdvice}
              </div>
            </div>
          )}

          {/* 4. Normal Sector Status when no alerts active */}
          {!activeAlert && !upcomingAlert && (
            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Meteorological Conditions Favorable</h4>
                  <p className="text-xs text-slate-400">
                    No active hazardous weather warnings or severe renewable droughts in the sector.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onTriggerAlert('heatwave')}
                className="px-3 py-1.5 text-xs font-semibold text-orange-300 bg-orange-950/80 hover:bg-orange-900 border border-orange-500/40 rounded-lg transition-colors cursor-pointer"
              >
                Simulate Drill
              </button>
            </div>
          )}

          {/* 5. Severe Climate Emergency Stress-Testing Drills */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Climate Hazard Drill (Sandbox / Stress Test)</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Test your grid resilience against real-world extreme meteorological events
              </span>
            </div>

            {/* Procedural Alert Randomizer Card */}
            {onRandomizeAlert && (
              <div className="p-4 rounded-xl border border-orange-500/40 bg-gradient-to-r from-orange-950/70 via-red-950/40 to-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                    <Dices className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Randomize Climate & Emergency Alert</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                        Procedural Jitter
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Instantly roll a randomized climate or grid emergency with stochastic duration, lead time, and physical modifiers.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onRandomizeAlert(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/50 hover:bg-amber-950/50 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Roll Watch Advisory
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onRandomizeAlert(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Roll Emergency Now</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(CLIMATE_ALERT_TEMPLATES) as ClimateAlertType[]).map((type) => {
                const tmpl = CLIMATE_ALERT_TEMPLATES[type];
                const isActive = activeAlert?.type === type;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      sound.playClick();
                      onTriggerAlert(type);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative group ${
                      isActive
                        ? 'border-orange-500 bg-orange-950/50 shadow-lg shadow-orange-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: `${tmpl.color}25`, border: `1px solid ${tmpl.color}60` }}
                      >
                        {getAlertIcon(type, 'w-4 h-4')}
                      </div>
                      <span
                        className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ color: tmpl.color, backgroundColor: `${tmpl.color}20` }}
                      >
                        {tmpl.severity}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      {tmpl.shortName}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Duration: {tmpl.durationHours}h</span>
                      <span className="text-amber-400 group-hover:underline">Simulate Now →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Meteorological models update every 60s. Pre-charging storage mitigates 90% of blackouts during extreme weather.
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Radar
          </button>
        </div>
      </div>
    </div>
  );
};

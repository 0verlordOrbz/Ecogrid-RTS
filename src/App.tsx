/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { AlertTriangle, Dices, Award, Sparkles } from 'lucide-react';
import { BabylonScene } from './game/babylon/BabylonScene';
import { GameHUD } from './components/GameHUD';
import { RedAlertSidebar, SidebarToolMode } from './components/RedAlertSidebar';
import { TileInspector } from './components/TileInspector';
import { TechTreeModal } from './components/TechTreeModal';
import { ScenarioModal } from './components/ScenarioModal';
import { EnergyCodexModal } from './components/EnergyCodexModal';
import { EventNotification } from './components/EventNotification';

import {
  GridTile,
  WeatherState,
  TechUpgrade,
  Scenario,
  BuildingType,
  GameEvent,
  EconomicEngine,
  PeakDemandProfile,
  ClimateAlertType,
} from './game/types';
import { SCENARIOS } from './game/scenarios';
import { TECH_UPGRADES } from './game/techTree';
import { BUILDING_DEFS } from './game/buildingDefs';
import { generateScenarioGrid } from './game/mapGenerator';
import { evaluateObjectives } from './game/objectiveEvaluator';
import { ECONOMIC_ENGINES, getRandomEconomicEngine } from './game/economicEngines';
import { DEMAND_PROFILES, getRandomDemandProfile } from './game/demandProfiles';
import { EconomicEngineModal } from './components/EconomicEngineModal';
import { ClimateAlertModal } from './components/ClimateAlertModal';
import { TitleWindowModal } from './components/TitleWindowModal';
import { createClimateAlert, getRandomClimateAlert, CLIMATE_ALERT_TEMPLATES } from './game/climateAlerts';
import { useDeviceType } from './game/useDeviceType';
import {
  createInitialWeather,
  updateWeather,
  stepSimulation,
} from './game/simulation';
import { sound } from './game/audio';

const SHORTCUT_BUILDINGS: Record<string, BuildingType> = {
  '1': 'solar_farm',
  '2': 'wind_turbine',
  '3': 'offshore_wind',
  '4': 'hydro_dam',
  '5': 'geothermal',
  '6': 'battery_bess',
  '7': 'substation',
  '8': 'remediated_park',
};

export default function App() {
  // Scenario & Grid Setup
  const [currentScenario, setCurrentScenario] = useState<Scenario>(SCENARIOS[0]);
  const [tiles, setTiles] = useState<GridTile[]>([]);
  const [weather, setWeather] = useState<WeatherState>(createInitialWeather());
  const [funds, setFunds] = useState<number>(SCENARIOS[0].startingFunds);
  const [techs, setTechs] = useState<TechUpgrade[]>(TECH_UPGRADES);

  // Simulation Pace & Grid State (Starts paused at 0 until scenario objectives are closed for the first time)
  const [simSpeed, setSimSpeed] = useState<number>(0); // 0 (pause), 0.5 (slow), 1 (normal), 2 (fast), 4 (ultra)
  const [isClockStartedForScenario, setIsClockStartedForScenario] = useState<boolean>(false);
  const isClockStartedForScenarioRef = useRef<boolean>(false);

  const [totalDemandMW, setTotalDemandMW] = useState<number>(0);
  const [totalCleanMW, setTotalCleanMW] = useState<number>(0);
  const [totalFossilMW, setTotalFossilMW] = useState<number>(0);
  const [cleanPercentage, setCleanPercentage] = useState<number>(0);
  const [co2PerDay, setCo2PerDay] = useState<number>(0);
  const [gridStabilityPct, setGridStabilityPct] = useState<number>(100);
  const [storageMWh, setStorageMWh] = useState<number>(0);
  const [storageCapacityMWh, setStorageCapacityMWh] = useState<number>(0);
  const [cashDelta, setCashDelta] = useState<number>(0);
  const [hasBlackout, setHasBlackout] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [hasFailed, setHasFailed] = useState<boolean>(false);
  const [failReason, setFailReason] = useState<string>('');

  // Red Alert RTS Tool & Selection State
  const [selectedTileCoords, setSelectedTileCoords] = useState<{ x: number; z: number } | null>(null);
  const [selectedBuildType, setSelectedBuildType] = useState<BuildingType | null>(null);
  const [toolMode, setToolMode] = useState<SidebarToolMode>('select');

  // Modals & Events
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);
  const [isTechTreeOpen, setIsTechTreeOpen] = useState<boolean>(false);
  const [isCodexOpen, setIsCodexOpen] = useState<boolean>(false);
  const [isEconomicModalOpen, setIsEconomicModalOpen] = useState<boolean>(false);
  const [isClimateModalOpen, setIsClimateModalOpen] = useState<boolean>(false);
  const [isTitleWindowOpen, setIsTitleWindowOpen] = useState<boolean>(true);
  const [isObjectivesOpen, setIsObjectivesOpen] = useState<boolean>(true);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [hudHeight, setHudHeight] = useState<number>(86);

  // Automatic Device Type & Viewport Resizing
  const deviceInfo = useDeviceType();

  // Climate Alert Sound and Notification Tracking Refs
  const prevActiveAlertRef = useRef<string | null>(null);
  const prevUpcomingAlertRef = useRef<string | null>(null);

  // Economic Regulatory Engine & Peak Demand Profile (Randomized on load & grid restart)
  const [economicEngine, setEconomicEngine] = useState<EconomicEngine>(() => getRandomEconomicEngine());
  const [demandProfile, setDemandProfile] = useState<PeakDemandProfile>(() => getRandomDemandProfile());

  const economicEngineRef = useRef(economicEngine);
  economicEngineRef.current = economicEngine;

  const demandProfileRef = useRef(demandProfile);
  demandProfileRef.current = demandProfile;

  // Initialize Map from Scenario with Procedural Randomization
  const initScenario = useCallback((scenario: Scenario) => {
    setCurrentScenario(scenario);
    setFunds(scenario.startingFunds);
    fundsRef.current = scenario.startingFunds;
    fundsFractionRef.current = 0;
    setWeather(createInitialWeather(scenario.initialAlert));
    setHasWon(false);
    setHasFailed(false);
    hasFailedRef.current = false;
    setFailReason('');
    setSelectedTileCoords(null);
    setSelectedBuildType(null);
    setToolMode('select');
    setIsObjectivesOpen(true); // Display specific scenario objectives on reload/scenario start
    setIsClockStartedForScenario(false);
    isClockStartedForScenarioRef.current = false;
    setSimSpeed(0); // Pause simulation clock until scenario objective is closed for the first time

    // Procedurally generate randomized grid every reload and scenario
    const newTiles = generateScenarioGrid(scenario);

    // Randomize Economic Engine and Peak Demand Profile on each scenario load & restart
    const newEngine = getRandomEconomicEngine();
    const newProfile = getRandomDemandProfile();
    setEconomicEngine(newEngine);
    economicEngineRef.current = newEngine;
    setDemandProfile(newProfile);
    demandProfileRef.current = newProfile;

    setTiles(newTiles);
    const initialEvents: GameEvent[] = [
      {
        id: `start_${Date.now()}`,
        title: `Mission: ${scenario.name}`,
        description: `${scenario.tagline} · Market: ${newEngine.name} · Demand: ${newProfile.name}`,
        type: 'info',
        timestamp: Date.now(),
        persistent: true,
      },
    ];

    if (scenario.initialAlert && CLIMATE_ALERT_TEMPLATES[scenario.initialAlert]) {
      const template = CLIMATE_ALERT_TEMPLATES[scenario.initialAlert];
      initialEvents.push({
        id: `hazard_${Date.now()}`,
        title: `🚨 Dedicated Climate Hazard: ${template.title}`,
        description: `${template.description} Mitigation: ${template.mitigationAdvice}`,
        type: 'critical',
        timestamp: Date.now() + 10,
        durationMs: 12000,
        isClimateAlert: true,
      });
    }

    setEvents(initialEvents);
  }, []);

  // Handle Scenario Objectives open/close; starts the clock on first close
  const handleToggleObjectives = useCallback((open: boolean) => {
    setIsObjectivesOpen(open);
    // Start the game clock when the scenario objective is closed for the first time
    if (!open && !isClockStartedForScenarioRef.current) {
      isClockStartedForScenarioRef.current = true;
      setIsClockStartedForScenario(true);
      setSimSpeed(1);
      sound.playDeploy();
      setEvents((prev) => [
        ...prev,
        {
          id: `clock_start_${Date.now()}`,
          title: '⏱ Simulation Clock Started (1x Pace)',
          description: `Directives acknowledged. Grid operations and simulation clock have commenced for ${currentScenario.name}.`,
          type: 'positive',
          timestamp: Date.now(),
          durationMs: 8000,
        },
      ]);
    }
  }, [currentScenario]);

  // Handle speed changes from UI or keyboard
  const handleSpeedChange = useCallback((speed: number) => {
    setSimSpeed(speed);
    if (speed > 0 && !isClockStartedForScenarioRef.current) {
      isClockStartedForScenarioRef.current = true;
      setIsClockStartedForScenario(true);
    }
  }, []);

  // Randomize grid, peak demand, and economic engine for current scenario
  const handleRandomizeGrid = useCallback(() => {
    sound.playClick();
    initScenario(currentScenario);
    setEvents((prev) => [
      ...prev,
      {
        id: `rand_${Date.now()}`,
        title: '🎲 Procedural Grid, Market & Peak Demand Randomized',
        description: `New geography, regulatory regime (${economicEngineRef.current.name}), and peak curve (${demandProfileRef.current.name}) active for ${currentScenario.name}.`,
        type: 'info',
        timestamp: Date.now(),
      },
    ]);
  }, [currentScenario, initScenario]);

  // Randomize Economic Engine & Peak Demand Profile on demand
  const handleRandomizeConditions = useCallback(() => {
    sound.playClick();
    const nextEngine = getRandomEconomicEngine(economicEngineRef.current.id);
    const nextProfile = getRandomDemandProfile(demandProfileRef.current.id);
    setEconomicEngine(nextEngine);
    economicEngineRef.current = nextEngine;
    setDemandProfile(nextProfile);
    demandProfileRef.current = nextProfile;
    setEvents((prev) => [
      ...prev,
      {
        id: `cond_${Date.now()}`,
        title: '📊 Market & Demand Profile Randomized',
        description: `Regime: ${nextEngine.name} (${nextEngine.tagline}) · Load Curve: ${nextProfile.name} (${nextProfile.peakHoursDescription})`,
        type: 'info',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const handleRandomizeEngine = useCallback(() => {
    sound.playClick();
    const nextEngine = getRandomEconomicEngine(economicEngineRef.current.id);
    setEconomicEngine(nextEngine);
    economicEngineRef.current = nextEngine;
    setEvents((prev) => [
      ...prev,
      {
        id: `eng_${Date.now()}`,
        title: '🏛️ Market Regulatory Model Randomized',
        description: `Now under ${nextEngine.name}: ${nextEngine.tagline}`,
        type: 'info',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const handleRandomizeDemand = useCallback(() => {
    sound.playClick();
    const nextProfile = getRandomDemandProfile(demandProfileRef.current.id);
    setDemandProfile(nextProfile);
    demandProfileRef.current = nextProfile;
    setEvents((prev) => [
      ...prev,
      {
        id: `dem_${Date.now()}`,
        title: '📈 Peak Demand Profile Randomized',
        description: `Now under ${nextProfile.name}: ${nextProfile.peakHoursDescription} (${nextProfile.peakMultiplier}x Peak)`,
        type: 'info',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  // Run on mount
  useEffect(() => {
    initScenario(SCENARIOS[0]);
  }, [initScenario]);

  // Simulation Tick Loop with Slower Time
  const simSpeedRef = useRef(simSpeed);
  simSpeedRef.current = simSpeed;

  const weatherRef = useRef(weather);
  weatherRef.current = weather;

  const tilesRef = useRef(tiles);
  tilesRef.current = tiles;

  const techsRef = useRef(techs);
  techsRef.current = techs;

  const fundsRef = useRef(funds);
  fundsRef.current = funds;

  const hasFailedRef = useRef(hasFailed);
  hasFailedRef.current = hasFailed;

  const hasWonRef = useRef(hasWon);
  hasWonRef.current = hasWon;

  const selectedBuildTypeRef = useRef(selectedBuildType);
  selectedBuildTypeRef.current = selectedBuildType;

  const toolModeRef = useRef(toolMode);
  toolModeRef.current = toolMode;

  const fundsFractionRef = useRef<number>(0);

  // Trigger Insolvency / Bankruptcy Defeat Condition when Treasury is depleted
  const triggerInsolvency = useCallback((reason?: string) => {
    if (hasWonRef.current || hasFailedRef.current) return;
    hasFailedRef.current = true;
    setHasFailed(true);
    setFailReason(
      reason ||
        'TREASURY DEPLETED (₱0): Generation costs and plant maintenance deficits depleted available capital reserves. The municipal utility is insolvent.'
    );
    setSimSpeed(0); // Pause simulation
    sound.playDefeat();
    setEvents((prev) => [
      ...prev,
      {
        id: `bankrupt_${Date.now()}`,
        title: '🚨 TREASURY INSOLVENT - SCENARIO FAILED',
        description: 'Municipal energy treasury reached ₱0. Unable to pay ongoing plant maintenance or service utility obligations.',
        type: 'critical',
        timestamp: Date.now(),
        persistent: true,
      },
    ]);
  }, []);

  // Safe deduction helper that checks for bankruptcy immediately
  const spendFunds = useCallback((amount: number, context?: string) => {
    const updated = Math.max(0, fundsRef.current - amount);
    fundsRef.current = updated;
    setFunds(updated);
    if (updated <= 0) {
      triggerInsolvency(
        context
          ? `TREASURY DEPLETED (₱0): ${context}`
          : 'TREASURY DEPLETED (₱0): Capital construction and grid investments consumed the entire municipal treasury.'
      );
    }
  }, [triggerInsolvency]);

  useEffect(() => {
    const intervalMs = 250;
    const timer = setInterval(() => {
      const speed = simSpeedRef.current;
      if (speed === 0) return; // Paused

      const deltaSeconds = (intervalMs / 1000) * speed;
      // Exact time scale requested: 1 in-game minute = 2 real seconds at 1x speed
      // 1 hour = 60 in-game minutes = 120 real seconds
      const deltaHours = deltaSeconds / 120;

      // Update weather
      const nextWeather = updateWeather(weatherRef.current, deltaHours);
      setWeather(nextWeather);

      // Climate Alert State Transitions & Audio Cues
      if (nextWeather.activeAlert && nextWeather.activeAlert.id !== prevActiveAlertRef.current) {
        prevActiveAlertRef.current = nextWeather.activeAlert.id;
        sound.playClimateAlert();
        setEvents((prev) => [
          ...prev,
          {
            id: `alert_active_${Date.now()}`,
            title: `🚨 ${nextWeather.activeAlert!.title}`,
            description: `${nextWeather.activeAlert!.description} Directives: ${nextWeather.activeAlert!.mitigationAdvice}`,
            type: 'critical',
            timestamp: Date.now(),
            durationMs: 10000,
            isClimateAlert: true,
          },
        ]);
      } else if (!nextWeather.activeAlert && prevActiveAlertRef.current) {
        prevActiveAlertRef.current = null;
        sound.playAlertResolved();
        setEvents((prev) => [
          ...prev,
          {
            id: `alert_cleared_${Date.now()}`,
            title: '✅ Climate Hazard Cleared',
            description: 'Regional atmospheric conditions have stabilized. Grid operations normalized.',
            type: 'positive',
            timestamp: Date.now(),
            durationMs: 10000,
            isClimateAlert: true,
          },
        ]);
      }

      if (nextWeather.upcomingAlert && nextWeather.upcomingAlert.id !== prevUpcomingAlertRef.current) {
        prevUpcomingAlertRef.current = nextWeather.upcomingAlert.id;
        sound.playWarning();
        setEvents((prev) => [
          ...prev,
          {
            id: `alert_watch_${Date.now()}`,
            title: `⚠️ WEATHER WATCH: ${nextWeather.upcomingAlert!.shortName}`,
            description: `${nextWeather.upcomingAlert!.description} Forecast arrival in ~${Math.round(nextWeather.upcomingAlert!.warningLeadHours)} hours.`,
            type: 'warning',
            timestamp: Date.now(),
            durationMs: 10000,
            isClimateAlert: true,
          },
        ]);
      }

      // Run simulation step
      const result = stepSimulation(
        tilesRef.current,
        nextWeather,
        techsRef.current.filter((t) => t.unlocked),
        fundsRef.current,
        deltaSeconds,
        economicEngineRef.current,
        demandProfileRef.current
      );

      setTiles(result.updatedTiles);
      setTotalDemandMW(result.totalDemandMW);
      setTotalCleanMW(result.totalCleanMW);
      setTotalFossilMW(result.totalFossilMW);
      setCleanPercentage(result.cleanPercentage);
      setCo2PerDay(result.co2PerDay);
      setGridStabilityPct(result.gridStabilityPct);
      setStorageMWh(result.totalStorageAvailableMWh);
      setStorageCapacityMWh(result.totalStorageCapacityMWh);
      setCashDelta(result.cashDelta);
      setHasBlackout(result.hasBlackout);

      // Update treasury using accurate hourly rate and time elapsed
      const cashEarnedThisTick = result.cashDelta * deltaHours;
      fundsFractionRef.current += cashEarnedThisTick;
      const wholePesos = Math.trunc(fundsFractionRef.current);
      if (wholePesos !== 0) {
        fundsFractionRef.current -= wholePesos;
        const newFunds = Math.max(0, fundsRef.current + wholePesos);
        fundsRef.current = newFunds;
        setFunds(newFunds);

        // Fail the scenario when treasury becomes zero
        if (newFunds <= 0 && !hasWonRef.current && !hasFailedRef.current) {
          triggerInsolvency('TREASURY DEPLETED (₱0): Generation costs and plant maintenance deficits depleted available capital reserves. The municipal utility is insolvent.');
        }
      } else if (fundsRef.current <= 0 && !hasWonRef.current && !hasFailedRef.current) {
        triggerInsolvency('TREASURY DEPLETED (₱0): Municipal utility reserves stand at ₱0.');
      }

      // Add new events
      if (result.newEvents.length > 0) {
        setEvents((prev) => [...prev, ...result.newEvents]);
      }

      // Check Victory Condition against Specific Scenario Directives
      const evalResult = evaluateObjectives(
        currentScenario,
        result.updatedTiles,
        result,
        fundsRef.current,
        techsRef.current
      );

      // Notify when all objectives have been achieved
      if (!hasWon && !hasFailedRef.current && evalResult.isWon) {
        setHasWon(true);
        sound.playVictory();
        confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.55 },
        });
        setEvents((prev) => [
          ...prev,
          {
            id: `win_${Date.now()}`,
            title: `🎉 ALL OBJECTIVES ACHIEVED! VICTORY!`,
            description: `All ${evalResult.totalCount} specific mission directives successfully fulfilled! Clean Net Zero transition complete!`,
            type: 'positive',
            timestamp: Date.now(),
            persistent: true,
          },
        ]);
        // Automatically open scenario modal to notify player and display trophy scorecard
        setIsScenarioModalOpen(true);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [currentScenario, hasWon]);

  // Live Scenario Evaluation for HUD & Modals
  const scenarioEvaluation = useMemo(() => {
    return evaluateObjectives(
      currentScenario,
      tiles,
      {
        cleanPercentage,
        totalCleanMW,
        co2PerDay,
      },
      funds,
      techs
    );
  }, [
    currentScenario,
    tiles,
    cleanPercentage,
    totalCleanMW,
    co2PerDay,
    funds,
    techs,
  ]);

  // Climate Hazard Drill & Manual Alert Handlers
  const handleTriggerAlert = useCallback((type: ClimateAlertType) => {
    sound.playClimateAlert();
    const alert = createClimateAlert(type, false); // Active immediately for drill
    setWeather((prev) => ({
      ...prev,
      activeAlert: alert,
      upcomingAlert: null,
    }));
    setEvents((prev) => [
      ...prev,
      {
        id: `drill_${Date.now()}`,
        title: `🚨 Emergency Drill: ${alert.title}`,
        description: `Meteorological hazard active: ${alert.description}`,
        type: 'critical',
        timestamp: Date.now(),
        durationMs: 10000,
        isClimateAlert: true,
      },
    ]);
  }, []);

  const handleClearAlert = useCallback(() => {
    sound.playAlertResolved();
    setWeather((prev) => ({
      ...prev,
      activeAlert: null,
      upcomingAlert: null,
    }));
    setEvents((prev) => [
      ...prev,
      {
        id: `clear_${Date.now()}`,
        title: '✅ Sector Weather Cleared',
        description: 'Atmospheric conditions reset to nominal baselines.',
        type: 'positive',
        timestamp: Date.now(),
        durationMs: 10000,
        isClimateAlert: true,
      },
    ]);
  }, []);

  // Procedural Climate & Emergency Hazard Randomizer
  const handleRandomizeAlert = useCallback(() => {
    sound.playClimateAlert();
    const currentType = weather.activeAlert?.type || weather.upcomingAlert?.type;
    // 50% chance active emergency, 50% upcoming watch
    const isWatch = Math.random() < 0.5;
    const newAlert = getRandomClimateAlert(isWatch, currentType);

    setWeather((prev) => ({
      ...prev,
      activeAlert: isWatch ? null : newAlert,
      upcomingAlert: isWatch ? newAlert : null,
    }));

    setEvents((prev) => [
      ...prev,
      {
        id: `rand_alert_${Date.now()}`,
        title: isWatch ? `⚠️ Watch Advisory: ${newAlert.title}` : `🚨 Emergency Declared: ${newAlert.title}`,
        description: `Procedural hazard randomized. ${newAlert.description} Mitigation: ${newAlert.mitigationAdvice}`,
        type: isWatch ? 'warning' : 'critical',
        timestamp: Date.now(),
        durationMs: 10000,
        isClimateAlert: true,
      },
    ]);
  }, [weather.activeAlert, weather.upcomingAlert]);

  // Red Alert Building Placement Validity Check
  const checkPlacementValidity = useCallback(
    (x: number, z: number, bldgType: BuildingType): { valid: boolean; reason?: string } => {
      const currentTiles = tilesRef.current;
      const currentFunds = fundsRef.current;

      const tile = currentTiles.find((t) => t.x === x && t.z === z);
      if (!tile) return { valid: false, reason: 'Target out of grid bounds' };

      if (tile.building !== 'empty') {
        const existingName = BUILDING_DEFS[tile.building]?.name || 'structure';
        return { valid: false, reason: `Tile occupied by ${existingName}` };
      }

      const def = BUILDING_DEFS[bldgType];
      if (!def) return { valid: false, reason: 'Unknown structure' };

      if (!def.allowedTerrains.includes(tile.terrain)) {
        return {
          valid: false,
          reason: `${def.name} requires ${def.allowedTerrains.join(' or ')} (tile is ${tile.terrain})`,
        };
      }

      if (currentFunds < def.cost) {
        return { valid: false, reason: `Insufficient funds (Requires ₱${def.cost.toLocaleString()})` };
      }

      return { valid: true };
    },
    []
  );

  // Red Alert Deploy Building Handler
  const handleDeployBuilding = useCallback(
    (x: number, z: number) => {
      const bldgType = selectedBuildTypeRef.current;
      if (!bldgType) return;
      const validity = checkPlacementValidity(x, z, bldgType);

      if (!validity.valid) {
        sound.playCannotDeploy();
        setEvents((prev) => [
          ...prev,
          {
            id: `deploy_fail_${Date.now()}`,
            title: 'Cannot Deploy Here',
            description: validity.reason || 'Invalid placement zone',
            type: 'warning',
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      const def = BUILDING_DEFS[bldgType];

      // Deploy structure with Red Alert pneumatic sound
      sound.playDeploy();
      spendFunds(def.cost, `Construction of ${def.name} exhausted municipal reserves.`);

      setTiles((prev) =>
        prev.map((t) =>
          t.x === x && t.z === z
            ? {
                ...t,
                building: bldgType,
                level: 1,
                health: 100,
                powerOutputMW: 0,
                storedMWh: bldgType === 'battery_bess' ? 100 : 0,
                decommissioning: false,
                decommissionProgress: 0,
              }
            : t
        )
      );

      setSelectedTileCoords({ x, z });

      setEvents((prev) => [
        ...prev,
        {
          id: `deploy_${Date.now()}`,
          title: 'Construction Complete',
          description: `${def.name} deployed at (${x}, ${z}). Online and feeding grid.`,
          type: 'positive',
          timestamp: Date.now(),
        },
      ]);
    },
    [checkPlacementValidity, spendFunds]
  );

  // Quick Build directly from TileInspector
  const handleQuickBuild = (tile: GridTile, bldgType: BuildingType) => {
    const validity = checkPlacementValidity(tile.x, tile.z, bldgType);
    if (!validity.valid) {
      sound.playCannotDeploy();
      setEvents((prev) => [
        ...prev,
        {
          id: `deploy_fail_${Date.now()}`,
          title: 'Cannot Deploy Here',
          description: validity.reason || 'Invalid placement zone',
          type: 'warning',
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    const def = BUILDING_DEFS[bldgType];
    sound.playDeploy();
    spendFunds(def.cost, `Construction of ${def.name} exhausted municipal reserves.`);

    setTiles((prev) =>
      prev.map((t) =>
        t.x === tile.x && t.z === tile.z
          ? {
              ...t,
              building: bldgType,
              level: 1,
              health: 100,
              powerOutputMW: 0,
              storedMWh: bldgType === 'battery_bess' ? 100 : 0,
              decommissioning: false,
              decommissionProgress: 0,
            }
          : t
      )
    );

    setSelectedTileCoords({ x: tile.x, z: tile.z });

    setEvents((prev) => [
      ...prev,
      {
        id: `quick_deploy_${Date.now()}`,
        title: 'Construction Complete',
        description: `${def.name} constructed at (${tile.x}, ${tile.z}).`,
        type: 'positive',
        timestamp: Date.now(),
      },
    ]);
  };

  // Red Alert Cancel Placement Mode (Right Click or ESC)
  const handleCancelPlacement = useCallback(() => {
    sound.playCancel();
    setSelectedBuildType(null);
    setToolMode('select');
  }, []);

  // Handle Tile Click in 3D Scene (Select / Sell / Repair mode)
  const handleTileSelect = useCallback(
    (x: number, z: number) => {
      const tile = tiles.find((t) => t.x === x && t.z === z);
      if (!tile) return;

      if (toolMode === 'sell') {
        // Red Alert Sell Tool: Decommission or dismantle clicked structure
        if (tile.building === 'empty' || tile.building === 'city_center') {
          sound.playCannotDeploy();
          return;
        }

        const def = BUILDING_DEFS[tile.building];
        sound.playSell();

        if (def.category === 'fossil') {
          // Decommission fossil plant
          setTiles((prev) =>
            prev.map((t) =>
              t.x === x && t.z === z
                ? { ...t, decommissioning: true, decommissionProgress: 1 }
                : t
            )
          );
          setEvents((prev) => [
            ...prev,
            {
              id: `sell_${Date.now()}`,
              title: 'Decommissioning Initiated',
              description: `Retiring ${def.name}. Emissions terminating.`,
              type: 'positive',
              timestamp: Date.now(),
            },
          ]);
        } else {
          // Dismantle renewable/infrastructure and refund 50%
          const refund = Math.round(def.cost * 0.5);
          const newFunds = fundsRef.current + refund;
          fundsRef.current = newFunds;
          setFunds(newFunds);
          setTiles((prev) =>
            prev.map((t) =>
              t.x === x && t.z === z
                ? { ...t, building: 'empty', level: 1, powerOutputMW: 0, storedMWh: 0 }
                : t
            )
          );
          setEvents((prev) => [
            ...prev,
            {
              id: `sold_${Date.now()}`,
              title: 'Structure Sold',
              description: `Dismantled ${def.name}. Recouped ₱${refund.toLocaleString()} in salvage capital.`,
              type: 'info',
              timestamp: Date.now(),
            },
          ]);
        }
      } else if (toolMode === 'repair') {
        // Red Alert Repair / Upgrade Tool
        const def = BUILDING_DEFS[tile.building];
        if ((def.category === 'renewable' || def.category === 'storage') && tile.level < 2) {
          const cost = def.upgradeCost || 25000;
          if (fundsRef.current >= cost) {
            sound.playUpgrade();
            spendFunds(cost, `Upgrade of ${def.name} to Level 2 exhausted municipal reserves.`);
            setTiles((prev) =>
              prev.map((t) => (t.x === x && t.z === z ? { ...t, level: 2 } : t))
            );
            setEvents((prev) => [
              ...prev,
              {
                id: `upg_${Date.now()}`,
                title: 'Upgrade Complete',
                description: `${def.name} upgraded to Level 2 (+35% efficiency).`,
                type: 'positive',
                timestamp: Date.now(),
              },
            ]);
          } else {
            sound.playCannotDeploy();
          }
        } else {
          sound.playCannotDeploy();
        }
      } else {
        // Select tool: inspect tile
        sound.playClick();
        setSelectedTileCoords({ x, z });
      }
    },
    [tiles, toolMode, spendFunds]
  );

  // Keyboard Shortcuts (Red Alert style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        handleCancelPlacement();
      } else if (e.key === 's' || e.key === 'S') {
        sound.playClick();
        setSelectedBuildType(null);
        setToolMode((prev) => (prev === 'sell' ? 'select' : 'sell'));
      } else if (e.key === 'r' || e.key === 'R') {
        sound.playClick();
        setSelectedBuildType(null);
        setToolMode((prev) => (prev === 'repair' ? 'select' : 'repair'));
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const next = simSpeedRef.current === 0 ? 1 : 0;
        handleSpeedChange(next);
      } else if (SHORTCUT_BUILDINGS[e.key]) {
        const bldg = SHORTCUT_BUILDINGS[e.key];
        sound.playClick();
        setSelectedBuildType(bldg);
        setToolMode('build');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCancelPlacement]);

  // Tile Actions from Inspector
  const handleUpgradeTile = (tile: GridTile) => {
    const def = BUILDING_DEFS[tile.building];
    const cost = def.upgradeCost || 25000;
    if (fundsRef.current < cost) return;

    sound.playUpgrade();
    spendFunds(cost, `Upgrade of ${def.name} to Level 2 exhausted municipal reserves.`);
    setTiles((prev) =>
      prev.map((t) => (t.x === tile.x && t.z === tile.z ? { ...t, level: 2 } : t))
    );
  };

  const handleDecommissionTile = (tile: GridTile) => {
    sound.playDecommission();
    setTiles((prev) =>
      prev.map((t) =>
        t.x === tile.x && t.z === tile.z
          ? { ...t, decommissioning: true, decommissionProgress: 1 }
          : t
      )
    );
  };

  const handleDemolishTile = (tile: GridTile) => {
    sound.playClick();
    spendFunds(2000, 'Demolition clearance costs exhausted municipal reserves.');
    setTiles((prev) =>
      prev.map((t) =>
        t.x === tile.x && t.z === tile.z
          ? {
              ...t,
              building: 'empty',
              level: 1,
              powerOutputMW: 0,
              storedMWh: 0,
              decommissioning: false,
            }
          : t
      )
    );
  };

  // Tech Unlock
  const handleUnlockTech = (techId: string) => {
    const tech = techs.find((t) => t.id === techId);
    if (!tech || tech.unlocked || fundsRef.current < tech.cost) return;

    // Check prerequisites
    if (tech.prerequisites && tech.prerequisites.length > 0) {
      const missing = tech.prerequisites.filter((reqId) => {
        const reqTech = techs.find((t) => t.id === reqId);
        return !reqTech || !reqTech.unlocked;
      });
      if (missing.length > 0) {
        sound.playCannotDeploy();
        const missingNames = missing
          .map((id) => techs.find((t) => t.id === id)?.name || id)
          .join(', ');
        setEvents((prev) => [
          ...prev,
          {
            id: `req_fail_${Date.now()}`,
            title: 'Prerequisite Required',
            description: `Must research ${missingNames} before unlocking ${tech.name}.`,
            type: 'warning',
            timestamp: Date.now(),
          },
        ]);
        return;
      }
    }

    sound.playUpgrade();
    spendFunds(tech.cost, `Technology upgrade deployment (${tech.name}) exhausted municipal reserves.`);
    setTechs((prev) =>
      prev.map((t) => (t.id === techId ? { ...t, unlocked: true } : t))
    );
    setEvents((prev) => [
      ...prev,
      {
        id: `tech_${Date.now()}`,
        title: 'Technology Deployed',
        description: `${tech.name}: ${tech.effectDescription}`,
        type: 'positive',
        timestamp: Date.now(),
      },
    ]);
  };

  // Dismiss Toast Event Notification
  const handleDismissEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const selectedTile = tiles.find(
    (t) =>
      selectedTileCoords &&
      t.x === selectedTileCoords.x &&
      t.z === selectedTileCoords.z
  ) || null;

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden bg-[#070b12] text-slate-100 font-sans ${
        deviceInfo.effectiveScale === 'compact' ? 'text-xs' : ''
      }`}
      style={{ ['--hud-height' as string]: `${hudHeight}px` }}
      data-device-type={deviceInfo.deviceType}
      data-ui-scale={deviceInfo.effectiveScale}
    >
      {/* 1. Babylon.js 3D WebGL Canvas with Red Alert Ghost Blueprinting */}
      <BabylonScene
        tiles={tiles}
        weather={weather}
        cleanPercentage={cleanPercentage}
        selectedTileCoords={selectedTileCoords}
        onTileSelect={handleTileSelect}
        placementBuilding={toolMode === 'build' ? selectedBuildType : null}
        onDeployBuilding={handleDeployBuilding}
        onCancelPlacement={handleCancelPlacement}
        validityChecker={checkPlacementValidity}
        deviceType={deviceInfo.deviceType}
        onUpgrade={handleUpgradeTile}
        onDecommission={handleDecommissionTile}
        onDemolish={handleDemolishTile}
        onQuickBuild={handleQuickBuild}
        onSelectBuildType={(b) => {
          setSelectedBuildType(b);
          if (b) setToolMode('build');
        }}
        onSetToolMode={setToolMode}
        onRestartScenario={handleRandomizeGrid}
      />

      {/* 2. Top Navigation & Telemetry HUD */}
      <GameHUD
        totalDemandMW={totalDemandMW}
        totalCleanMW={totalCleanMW}
        totalFossilMW={totalFossilMW}
        cleanPercentage={cleanPercentage}
        co2PerDay={co2PerDay}
        gridStabilityPct={gridStabilityPct}
        funds={funds}
        cashDelta={cashDelta}
        weather={weather}
        storageMWh={storageMWh}
        storageCapacityMWh={storageCapacityMWh}
        simSpeed={simSpeed}
        hasBlackout={hasBlackout}
        onSpeedChange={handleSpeedChange}
        onOpenScenarios={() => setIsScenarioModalOpen(true)}
        onOpenTechTree={() => setIsTechTreeOpen(true)}
        onOpenCodex={() => setIsCodexOpen(true)}
        onOpenClimateRadar={() => setIsClimateModalOpen(true)}
        onOpenTitleWindow={() => setIsTitleWindowOpen(true)}
        onRandomizeGrid={handleRandomizeGrid}
        onRandomizeConditions={handleRandomizeConditions}
        onRandomizeAlert={handleRandomizeAlert}
        economicEngine={economicEngine}
        demandProfile={demandProfile}
        onOpenEconomicModal={() => setIsEconomicModalOpen(true)}
        activeScenarioName={currentScenario.name}
        scenarioEvaluation={scenarioEvaluation}
        isObjectivesOpen={isObjectivesOpen}
        onToggleObjectives={handleToggleObjectives}
        isClockStartedForScenario={isClockStartedForScenario}
        deviceInfo={deviceInfo}
        onHeightChange={setHudHeight}
      />

      {/* 3. Red Alert Right Construction Sidebar */}
      <RedAlertSidebar
        funds={funds}
        selectedBuildType={selectedBuildType}
        toolMode={toolMode}
        onSelectBuild={(type) => {
          setSelectedBuildType(type);
          if (type) setToolMode('build');
        }}
        onSetToolMode={setToolMode}
        totalGenerationMW={totalCleanMW + totalFossilMW}
        totalDemandMW={totalDemandMW}
        topOffset={hudHeight}
      />

      {/* 4. Left Tile Inspector */}
      {selectedTile && toolMode === 'select' && (
        <TileInspector
          tile={selectedTile}
          funds={funds}
          onClose={() => setSelectedTileCoords(null)}
          onUpgrade={handleUpgradeTile}
          onDecommission={handleDecommissionTile}
          onDemolish={handleDemolishTile}
          onQuickBuild={handleQuickBuild}
          topOffset={hudHeight}
        />
      )}

      {/* 5. In-Game Toast Notifications */}
      <EventNotification
        events={events}
        onDismiss={handleDismissEvent}
      />

      {/* 6. Title Window & Mission Launch Screen */}
      <TitleWindowModal
        isOpen={isTitleWindowOpen}
        onClose={() => setIsTitleWindowOpen(false)}
        currentScenario={currentScenario}
        onSelectScenario={(sc) => {
          initScenario(sc);
          setIsTitleWindowOpen(false);
        }}
        economicEngine={economicEngine}
        demandProfile={demandProfile}
        onOpenCodex={() => {
          setIsTitleWindowOpen(false);
          setIsCodexOpen(true);
        }}
        onOpenTechTree={() => {
          setIsTitleWindowOpen(false);
          setIsTechTreeOpen(true);
        }}
      />

      {/* 7. Scenario & Victory Modal */}
      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        currentScenario={currentScenario}
        onSelectScenario={(sc) => {
          initScenario(sc);
          setIsScenarioModalOpen(false);
        }}
        cleanPercentage={cleanPercentage}
        co2PerDay={co2PerDay}
        hasWon={hasWon}
        onResetScenario={() => {
          initScenario(currentScenario);
          setIsScenarioModalOpen(false);
        }}
        evaluation={scenarioEvaluation}
        economicEngine={economicEngine}
        demandProfile={demandProfile}
      />

      {/* 7. Technology Upgrades Modal */}
      <TechTreeModal
        isOpen={isTechTreeOpen}
        onClose={() => setIsTechTreeOpen(false)}
        techs={techs}
        funds={funds}
        onUnlockTech={handleUnlockTech}
      />

      {/* 8. Energy Codex Modal */}
      <EnergyCodexModal
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
      />

      {/* 9. Economic Engine & Peak Demand Profile Modal */}
      <EconomicEngineModal
        isOpen={isEconomicModalOpen}
        onClose={() => setIsEconomicModalOpen(false)}
        activeEngine={economicEngine}
        activeProfile={demandProfile}
        onSelectEngine={(engine) => {
          setEconomicEngine(engine);
          economicEngineRef.current = engine;
        }}
        onSelectProfile={(profile) => {
          setDemandProfile(profile);
          demandProfileRef.current = profile;
        }}
        onRandomizeAll={handleRandomizeConditions}
        currentHour={weather.timeOfDay}
      />

      {/* 10. Climate & Weather Hazard Command Center Modal */}
      <ClimateAlertModal
        isOpen={isClimateModalOpen}
        onClose={() => setIsClimateModalOpen(false)}
        weather={weather}
        onTriggerAlert={handleTriggerAlert}
        onClearAlert={handleClearAlert}
        onRandomizeAlert={handleRandomizeAlert}
      />

      {/* 11. Scenario Defeat / Bankruptcy Modal */}
      {hasFailed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-950 border-2 border-red-500/70 rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                Insolvency Alert
              </span>
              <h2 className="text-2xl font-bold text-white font-display mt-1">
                Scenario Failed: Treasury Depleted
              </h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                {failReason ||
                  'Your municipal treasury has dropped to ₱0. Inability to fund generation and maintenance has halted the regional clean energy transition.'}
              </p>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Final Treasury Balance:</span>
                <span className="font-mono text-red-400 font-bold">₱0</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Clean Energy Share:</span>
                <span className="font-mono text-amber-400 font-bold">{cleanPercentage}%</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Active Demand:</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(totalDemandMW)} MW</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleRandomizeGrid}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Dices className="w-4 h-4" />
                <span>Restart (Randomize Grid)</span>
              </button>
              <button
                onClick={() => {
                  setHasFailed(false);
                  setIsScenarioModalOpen(true);
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer text-sm"
              >
                Change Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

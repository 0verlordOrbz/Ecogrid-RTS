/**
 * Types and interfaces for the EcoGrid Clean Energy Transition simulation game.
 */

export type TerrainType = 'water' | 'coastal' | 'plains' | 'hills' | 'mountains' | 'river' | 'city';

export type BuildingCategory = 'fossil' | 'renewable' | 'storage' | 'infrastructure' | 'civic';

export type BuildingType = 
  | 'empty'
  | 'coal_plant'
  | 'gas_peaker'
  | 'solar_farm'
  | 'wind_turbine'
  | 'offshore_wind'
  | 'hydro_dam'
  | 'geothermal'
  | 'battery_bess'
  | 'substation'
  | 'city_center'
  | 'remediated_park';

export interface BuildingDef {
  type: BuildingType;
  name: string;
  category: BuildingCategory;
  description: string;
  cost: number;
  maintenancePerDay: number;
  basePowerMW: number; // Positive = produces, Negative = consumes, 0 = passive
  maxStorageMWh?: number; // For batteries
  co2PerDay: number; // Metric tons CO2 per day
  allowedTerrains: TerrainType[];
  upgradeCost?: number;
  techRequired?: string;
  icon: string;
  lcoe: string; // Levelized Cost of Energy indicator (₱/MWh)
  capacityFactor: number; // 0 to 1
}

export interface GridTile {
  id: string;
  x: number;
  z: number;
  terrain: TerrainType;
  elevation: number;
  building: BuildingType;
  level: number;
  health: number; // 0 to 100
  powerOutputMW: number;
  storedMWh: number;
  decommissioning?: boolean;
  decommissionProgress?: number; // 0 to 100
  installedDay?: number;
}

export interface WeatherState {
  timeOfDay: number; // 0.0 to 24.0 (hours)
  day: number;
  year: number;
  windSpeedMs: number; // m/s (0 to 25)
  solarIrradiancePct: number; // 0 to 100%
  temperatureC: number;
  cloudCoverPct: number; // 0 to 100%
  isHeatwave: boolean;
  isDunkelflaute: boolean; // low wind, high cloud
  activeAlert?: ClimateAlert | null;
  upcomingAlert?: ClimateAlert | null;
}

export interface TechUpgrade {
  id: string;
  name: string;
  cost: number;
  category: 'efficiency' | 'storage' | 'grid' | 'policy';
  description: string;
  effectDescription: string;
  unlocked: boolean;
  bonus: {
    solarMultiplier?: number;
    windMultiplier?: number;
    batteryMultiplier?: number;
    carbonCreditRateMultiplier?: number;
    demandReductionPct?: number;
  };
}

export type ObjectiveType =
  | 'decommission_type'
  | 'decommission_all_fossil'
  | 'clean_percentage'
  | 'deploy_building'
  | 'deploy_count'
  | 'clean_capacity_mw'
  | 'storage_capacity_mwh'
  | 'funds_accumulated'
  | 'tech_researched'
  | 'zero_emissions'
  | 'energy_diversity';

export interface SpecificObjective {
  id: string;
  title: string;
  description: string;
  type: ObjectiveType;
  target: number;
  current?: number;
  unit?: string;
  targetBuilding?: BuildingType;
  completed?: boolean;
}

export type EconomicEngineId =
  | 'green_tariff'
  | 'merit_order'
  | 'public_utility'
  | 'clean_export'
  | 'polluter_pays';

export interface EconomicEngine {
  id: EconomicEngineId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  tariffPerMWh: number; // Base retail power rate (₱/MWh)
  cleanCreditPerMWh: number; // Clean energy generation premium (₱/MWh)
  fossilSurchargePerMWh: number; // Fossil fuel burn penalty / carbon fee (₱/MWh)
  maintenanceMultiplier: number; // Facility upkeep scaling
  blackoutPenaltyPerMWh: number; // Penalty for unserved MWh during outages
  surplusExportRatePerMWh: number; // Revenue for clean energy surplus exported to neighboring grid
  ecoParkGrantHourly: number; // Hourly subsidy for each remediated park carbon sink
  peakTariffMultiplier: number; // Surge multiplier during peak demand hours
  color: string;
  iconName: string;
}

export type PeakDemandProfileId =
  | 'duck_curve'
  | 'heavy_industrial'
  | 'evening_surge'
  | 'hyperscale_datacenter'
  | 'tropical_heat_ramp';

export interface PeakDemandProfile {
  id: PeakDemandProfileId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  baseDemandScale: number; // Base multiplier on city demand (0.85 to 1.25)
  peakMultiplier: number; // Peak factor (e.g. 1.35x to 1.65x)
  peakHoursDescription: string;
  calculateDemandFactor: (hour: number, isHeatwave: boolean) => number;
  isPeakHour: (hour: number) => boolean;
  color: string;
  iconName: string;
}

export interface Scenario {
  id: string;
  name: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Expert' | 'Sandbox';
  tagline: string;
  description: string;
  startingFunds: number;
  gridSize: { width: number; depth: number };
  initialCo2Target: number;
  targetCleanPct: number;
  deadlineDays: number;
  initialTiles: (x: number, z: number, terrain: TerrainType, building: BuildingType) => Partial<GridTile>;
  objectives: SpecificObjective[];
  defaultEngineId?: EconomicEngineId;
  defaultDemandProfileId?: PeakDemandProfileId;
  initialAlert?: ClimateAlertType;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'positive' | 'warning' | 'critical';
  timestamp: number;
  persistent?: boolean;
  durationMs?: number; // Custom on-screen duration in ms (10000ms for climate alerts)
  isClimateAlert?: boolean;
}

export type ClimateAlertSeverity = 'advisory' | 'warning' | 'emergency';

export type ClimateAlertType =
  | 'heatwave'
  | 'dunkelflaute'
  | 'typhoon'
  | 'wildfire_haze'
  | 'polar_vortex'
  | 'atmospheric_river'
  | 'geomagnetic_storm'
  | 'flash_drought'
  | 'grid_frequency_instability'
  | 'el_nino';

export interface ClimateAlertEffects {
  solarMultiplier?: number;
  windMultiplier?: number;
  hydroMultiplier?: number;
  demandMultiplier?: number;
  stabilityImpact?: number;
  windTurbineCutoff?: boolean;
}

export interface ClimateAlert {
  id: string;
  type: ClimateAlertType;
  title: string;
  shortName: string;
  severity: ClimateAlertSeverity;
  description: string;
  scienceNote: string;
  mitigationAdvice: string;
  effects: ClimateAlertEffects;
  durationHours: number;
  remainingHours: number;
  warningLeadHours: number; // Hours remaining in watch/warning phase before arrival
  isWatchPhase: boolean; // True during lead-time warning countdown, false when active
  iconName: string;
  color: string;
}

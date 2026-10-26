/**
 * Climate and Weather Emergency Alerts System for EcoGrid
 * Defines realistic meteorological hazards, physics modifiers, and alert lifecycles.
 */

import { ClimateAlert, ClimateAlertType, ClimateAlertSeverity } from './types';

export interface ClimateAlertTemplate {
  type: ClimateAlertType;
  title: string;
  shortName: string;
  severity: ClimateAlertSeverity;
  description: string;
  scienceNote: string;
  mitigationAdvice: string;
  effects: {
    solarMultiplier?: number;
    windMultiplier?: number;
    hydroMultiplier?: number;
    demandMultiplier?: number;
    stabilityImpact?: number;
    windTurbineCutoff?: boolean;
  };
  durationHours: number;
  warningLeadHours: number;
  iconName: string;
  color: string;
}

export const CLIMATE_ALERT_TEMPLATES: Record<ClimateAlertType, ClimateAlertTemplate> = {
  heatwave: {
    type: 'heatwave',
    title: 'Category 4 Extreme Heat Dome',
    shortName: 'Extreme Heatwave',
    severity: 'emergency',
    description: 'A stagnant high-pressure heat dome traps scorching 39°C air across the metropolitan grid.',
    scienceNote: 'High ambient heat degrades solar PV semiconductor efficiency by -15%, while continuous residential and commercial AC cooling drives regional demand up by +35%.',
    mitigationAdvice: 'Pre-charge BESS battery storage banks before mid-afternoon peak. Dispatch hydro and geothermal baseload to avert grid trip.',
    effects: {
      solarMultiplier: 0.85,
      demandMultiplier: 1.35,
      stabilityImpact: -6,
    },
    durationHours: 24,
    warningLeadHours: 8,
    iconName: 'Flame',
    color: '#f97316',
  },
  dunkelflaute: {
    type: 'dunkelflaute',
    title: 'Severe Dunkelflaute (Dark Stagnation)',
    shortName: 'Dunkelflaute',
    severity: 'emergency',
    description: 'Persistent low-altitude stratus inversion brings calm stagnation and dense cloud cover across the entire basin.',
    scienceNote: 'Cloud absorption drops solar irradiance below 20%, while regional wind speeds drop below the 2.5 m/s turbine cut-in threshold, creating a severe compound renewable shortfall.',
    mitigationAdvice: 'Rely on deep geothermal baseload, dispatchable hydro, and pre-stored Megapack BESS buffers. Curtail non-essential grid exports.',
    effects: {
      solarMultiplier: 0.25,
      windMultiplier: 0.20,
      demandMultiplier: 1.15,
      stabilityImpact: -8,
    },
    durationHours: 28,
    warningLeadHours: 10,
    iconName: 'CloudOff',
    color: '#a855f7',
  },
  typhoon: {
    type: 'typhoon',
    title: 'Cat-4 Super Typhoon "Vortex"',
    shortName: 'Super Typhoon',
    severity: 'emergency',
    description: 'A violent tropical cyclone sweeps in with sustained winds peaking at 28 m/s and torrential driving rain.',
    scienceNote: 'Winds above 22 m/s trigger automated fail-safe mechanical brake cutoffs on standard onshore turbines to prevent rotor destruction.',
    mitigationAdvice: 'Expect onshore wind cutoffs during peak gusts. Battery storage and offshore marine generators must stabilize fluctuating grid frequency.',
    effects: {
      windTurbineCutoff: true,
      solarMultiplier: 0.35,
      hydroMultiplier: 1.30,
      stabilityImpact: -12,
    },
    durationHours: 18,
    warningLeadHours: 12,
    iconName: 'Tornado',
    color: '#ef4444',
  },
  wildfire_haze: {
    type: 'wildfire_haze',
    title: 'Wildfire Smoke & Aerosol Inversion',
    shortName: 'Wildfire Haze',
    severity: 'warning',
    description: 'Prevailing winds transport thick particulate aerosol plumes and dense soot from regional wildfires.',
    scienceNote: 'Particulate air mass optical depth (AOD) scatters direct solar irradiance by 55%, reducing rooftop and utility-scale solar generation.',
    mitigationAdvice: 'Deploy stored battery power to cover solar dips. Keep civic filtration loads stabilized.',
    effects: {
      solarMultiplier: 0.45,
      demandMultiplier: 1.10,
      stabilityImpact: -4,
    },
    durationHours: 22,
    warningLeadHours: 7,
    iconName: 'CloudFog',
    color: '#eab308',
  },
  polar_vortex: {
    type: 'polar_vortex',
    title: 'Arctic Polar Vortex Deep Freeze',
    shortName: 'Polar Vortex',
    severity: 'emergency',
    description: 'A displaced arctic polar vortex brings sub-zero -16°C temperatures and freezing freezing fog.',
    scienceNote: 'Freezing conditions drive unprecedented heating load surges (+40% demand), while atmospheric rime ice reduces turbine aerodynamic lift.',
    mitigationAdvice: 'Dispatch maximum available reserves. Ensure battery banks are fully charged before the twilight heating surge.',
    effects: {
      demandMultiplier: 1.40,
      windMultiplier: 0.70,
      stabilityImpact: -10,
    },
    durationHours: 26,
    warningLeadHours: 9,
    iconName: 'Snowflake',
    color: '#06b6d4',
  },
  atmospheric_river: {
    type: 'atmospheric_river',
    title: 'Atmospheric River & Hydro Surge',
    shortName: 'Atmospheric River',
    severity: 'advisory',
    description: 'A massive atmospheric conveyor belt delivers relentless warm tropical moisture and heavy rainfall.',
    scienceNote: 'Persistent rain clouds suppress daytime solar PV, but swollen mountain rivers supercharge hydroelectric dam reservoir throughput by +35%.',
    mitigationAdvice: 'Harness boosted hydro generation to charge all BESS battery assets to 100% capacity and export clean surplus.',
    effects: {
      solarMultiplier: 0.50,
      hydroMultiplier: 1.35,
      windMultiplier: 1.15,
      stabilityImpact: 0,
    },
    durationHours: 20,
    warningLeadHours: 6,
    iconName: 'Droplets',
    color: '#3b82f6',
  },
  geomagnetic_storm: {
    type: 'geomagnetic_storm',
    title: 'G4 Severe Solar Geomagnetic Storm',
    shortName: 'Solar Storm',
    severity: 'emergency',
    description: 'A powerful coronal mass ejection induces geomagnetically induced currents (GIC) across regional high-voltage transmission lines.',
    scienceNote: 'High-voltage transformer cores experience magnetic saturation and reactive power loss, causing rapid grid frequency jitter and -14% stability impact.',
    mitigationAdvice: 'Dispatch smart substations, switch dynamic line ratings, and discharge BESS power reserves to stabilize transmission frequency.',
    effects: {
      stabilityImpact: -14,
      demandMultiplier: 1.08,
      solarMultiplier: 0.95,
    },
    durationHours: 16,
    warningLeadHours: 8,
    iconName: 'Zap',
    color: '#ec4899',
  },
  flash_drought: {
    type: 'flash_drought',
    title: 'Flash Drought & Hydrological Drawdown',
    shortName: 'Flash Drought',
    severity: 'warning',
    description: 'Sudden precipitation deficit and prolonged unseasonal warmth rapidly evaporate watershed reservoirs and mountain streams.',
    scienceNote: 'Hydroelectric turbine hydrostatic head drops, reducing dam output by -45%, while agricultural irrigation pumping slightly boosts baseline demand.',
    mitigationAdvice: 'Ramp up deep geothermal baseload and maximize utility solar tracking during midday to conserve remaining hydro reservoir buffers.',
    effects: {
      hydroMultiplier: 0.55,
      demandMultiplier: 1.12,
      solarMultiplier: 1.10,
      stabilityImpact: -4,
    },
    durationHours: 32,
    warningLeadHours: 14,
    iconName: 'SunMedium',
    color: '#d97706',
  },
  grid_frequency_instability: {
    type: 'grid_frequency_instability',
    title: 'Interconnection Frequency Anomaly & Contingency Trip',
    shortName: 'Frequency Surge',
    severity: 'emergency',
    description: 'Regional cross-border intertie excursion triggers sudden frequency deviations outside standard tolerance bands.',
    scienceNote: 'Rapid imbalance between instantaneous load and generation forces automatic spinning reserves and smart substation fast-response intervention.',
    mitigationAdvice: 'Deploy utility Megapack BESS millisecond frequency response and smart substations to arrest rate of change of frequency (RoCoF).',
    effects: {
      stabilityImpact: -18,
      demandMultiplier: 1.06,
    },
    durationHours: 14,
    warningLeadHours: 5,
    iconName: 'Activity',
    color: '#f43f5e',
  },
  el_nino: {
    type: 'el_nino',
    title: 'El Niño-Southern Oscillation (Severe Watershed Drought)',
    shortName: 'El Niño Crisis',
    severity: 'emergency',
    description: 'An intense Pacific El Niño warm anomaly triggers severe prolonged hydrological drought, critical reservoir depletion, and soaring ambient heat.',
    scienceNote: 'Precipitation deficits slash hydroelectric dam reservoir capacity by -80%, while extreme sustained heatwaves drive massive regional air conditioning demand (+45%).',
    mitigationAdvice: 'Conserve dwindling hydro reserves. Maximize daytime solar output, deploy deep geothermal baseload, and pre-charge battery BESS banks for the evening peak.',
    effects: {
      hydroMultiplier: 0.20,
      demandMultiplier: 1.45,
      solarMultiplier: 1.10,
      windMultiplier: 0.80,
      stabilityImpact: -15,
    },
    durationHours: 48,
    warningLeadHours: 12,
    iconName: 'Sun',
    color: '#ea580c',
  },
};

/**
 * Creates an active or upcoming Climate Alert instance from a template with randomized variances
 */
export function createClimateAlert(
  type: ClimateAlertType,
  isWatchPhase: boolean = true
): ClimateAlert {
  const template = CLIMATE_ALERT_TEMPLATES[type] || CLIMATE_ALERT_TEMPLATES.heatwave;
  // Dynamic duration with +/- 3 hour variance for unpredictability
  const variance = Math.floor(Math.random() * 7) - 3;
  const duration = Math.max(10, template.durationHours + variance);
  const leadHours = Math.max(3, template.warningLeadHours + (Math.floor(Math.random() * 3) - 1));

  // Small randomized modifier jitter (+/- 5%) for realistic meteorological uniqueness
  const jitter = (Math.random() * 0.1) - 0.05;
  const effects = { ...template.effects };
  if (effects.solarMultiplier !== undefined) {
    effects.solarMultiplier = Number(Math.max(0.1, effects.solarMultiplier + jitter).toFixed(2));
  }
  if (effects.windMultiplier !== undefined) {
    effects.windMultiplier = Number(Math.max(0.1, effects.windMultiplier + jitter).toFixed(2));
  }
  if (effects.hydroMultiplier !== undefined) {
    effects.hydroMultiplier = Number(Math.max(0.2, effects.hydroMultiplier + jitter).toFixed(2));
  }
  if (effects.demandMultiplier !== undefined) {
    effects.demandMultiplier = Number(Math.max(1.0, effects.demandMultiplier + jitter).toFixed(2));
  }

  return {
    id: `alert_${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type,
    title: template.title,
    shortName: template.shortName,
    severity: template.severity,
    description: template.description,
    scienceNote: template.scienceNote,
    mitigationAdvice: template.mitigationAdvice,
    effects,
    durationHours: duration,
    remainingHours: duration,
    warningLeadHours: isWatchPhase ? leadHours : 0,
    isWatchPhase,
    iconName: template.iconName,
    color: template.color,
  };
}

/**
 * Returns a randomized alert type different from current, if any
 */
export function getRandomClimateAlertType(currentType?: ClimateAlertType): ClimateAlertType {
  const keys = Object.keys(CLIMATE_ALERT_TEMPLATES) as ClimateAlertType[];
  const pool = currentType ? keys.filter((k) => k !== currentType) : keys;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked || 'heatwave';
}

/**
 * Directly generates a randomized Climate or Emergency Alert
 */
export function getRandomClimateAlert(isWatchPhase: boolean = true, currentType?: ClimateAlertType): ClimateAlert {
  const type = getRandomClimateAlertType(currentType);
  return createClimateAlert(type, isWatchPhase);
}

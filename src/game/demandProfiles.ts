import { PeakDemandProfile, PeakDemandProfileId } from './types';

export const DEMAND_PROFILES: Record<PeakDemandProfileId, PeakDemandProfile> = {
  duck_curve: {
    id: 'duck_curve',
    name: 'Dual Duck-Curve Demand',
    shortName: 'Dual Duck Curve',
    tagline: 'Morning (07-09h: 1.20x) & Evening (17-21h: 1.45x) peaks',
    description:
      'Classic duck curve demand: deep midday solar dip followed by an aggressive evening ramp as families return home, cook, and turn on lights.',
    baseDemandScale: 1.0,
    peakMultiplier: 1.45,
    peakHoursDescription: '07:00–09:00 & 17:00–21:00',
    color: '#38bdf8',
    iconName: 'Activity',
    isPeakHour: (hour: number) => {
      const h = Math.floor(hour) % 24;
      return (h >= 7 && h <= 9) || (h >= 17 && h <= 21);
    },
    calculateDemandFactor: (hour: number, isHeatwave: boolean) => {
      const h = hour % 24;
      let factor = 0.85;
      if (h >= 7 && h <= 9) {
        factor = 1.20; // Morning commuter / light commercial ramp
      } else if (h > 9 && h < 16) {
        factor = 0.90; // Midday solar belly
      } else if (h >= 17 && h <= 21) {
        factor = 1.45; // Evening peak
      } else if (h >= 23 || h <= 5) {
        factor = 0.60; // Nighttime valley
      }
      return factor * (isHeatwave ? 1.25 : 1.0);
    },
  },

  heavy_industrial: {
    id: 'heavy_industrial',
    name: 'Midday Heavy Industrial Arc',
    shortName: 'Heavy Industrial',
    tagline: 'Sustained daytime manufacturing load (10-16h: 1.50x)',
    description:
      'High industrial load driven by heavy manufacturing, smelting, and commercial HVAC running during business hours. Perfectly synchronizes with peak solar generation.',
    baseDemandScale: 1.08,
    peakMultiplier: 1.50,
    peakHoursDescription: '10:00–16:00 Daylight Shift',
    color: '#fbbf24',
    iconName: 'Factory',
    isPeakHour: (hour: number) => {
      const h = Math.floor(hour) % 24;
      return h >= 10 && h <= 16;
    },
    calculateDemandFactor: (hour: number, isHeatwave: boolean) => {
      const h = hour % 24;
      let factor = 0.95;
      if (h >= 10 && h <= 16) {
        factor = 1.50; // Heavy daytime factory shift
      } else if (h >= 17 && h <= 21) {
        factor = 1.10; // Moderate evening
      } else if (h >= 22 || h <= 5) {
        factor = 0.72; // Night industrial base
      }
      return factor * (isHeatwave ? 1.20 : 1.0);
    },
  },

  evening_surge: {
    id: 'evening_surge',
    name: 'Dense Metropolis Evening Surge',
    shortName: 'Metropolis Surge',
    tagline: 'Extreme sharp evening spike (18-22h: 1.65x)',
    description:
      'Dense urban high-rises where millions return home at once, powering on EV chargers, air-conditioners, and appliances right after solar irradiance has collapsed to zero.',
    baseDemandScale: 0.98,
    peakMultiplier: 1.65,
    peakHoursDescription: '18:00–22:00 High-Rise Surge',
    color: '#f87171',
    iconName: 'Zap',
    isPeakHour: (hour: number) => {
      const h = Math.floor(hour) % 24;
      return h >= 18 && h <= 22;
    },
    calculateDemandFactor: (hour: number, isHeatwave: boolean) => {
      const h = hour % 24;
      let factor = 0.80;
      if (h >= 7 && h <= 10) {
        factor = 1.05;
      } else if (h >= 18 && h <= 22) {
        factor = 1.65; // Severe evening spike!
      } else if (h >= 23 || h <= 5) {
        factor = 0.65;
      }
      return factor * (isHeatwave ? 1.30 : 1.0);
    },
  },

  hyperscale_datacenter: {
    id: 'hyperscale_datacenter',
    name: 'Hyperscale AI & Cloud Corridor',
    shortName: 'AI Cloud Corridor',
    tagline: 'High 24/7 baseline (1.20x) + training bursts',
    description:
      'Continuous round-the-clock server clusters and chilled cooling loops demand steady power day and night, with intermittent computational machine learning bursts.',
    baseDemandScale: 1.20,
    peakMultiplier: 1.40,
    peakHoursDescription: '24/7 High Baseline (Spikes 13:00–19:00)',
    color: '#a855f7',
    iconName: 'Server',
    isPeakHour: (hour: number) => {
      const h = Math.floor(hour) % 24;
      return h >= 13 && h <= 19;
    },
    calculateDemandFactor: (hour: number, isHeatwave: boolean) => {
      const h = hour % 24;
      // High floor (never drops below 0.95)
      let factor = 1.05;
      if (h >= 13 && h <= 19) {
        factor = 1.38; // Model training compute peak
      } else if (h >= 23 || h <= 5) {
        factor = 0.95; // Unbroken nocturnal computing base
      }
      return factor * (isHeatwave ? 1.15 : 1.0);
    },
  },

  tropical_heat_ramp: {
    id: 'tropical_heat_ramp',
    name: 'Equatorial Heatwave Ramp',
    shortName: 'Equatorial Ramp',
    tagline: 'Prolonged afternoon & nighttime AC (12-23h: 1.55x)',
    description:
      'Tropical climate causes relentless domestic and commercial air-conditioning demand starting at noon and staying elevated late into the sultry evening hours.',
    baseDemandScale: 1.10,
    peakMultiplier: 1.55,
    peakHoursDescription: '12:00–23:00 Continuous Ramp',
    color: '#fb923c',
    iconName: 'Sun',
    isPeakHour: (hour: number) => {
      const h = Math.floor(hour) % 24;
      return h >= 12 && h <= 23;
    },
    calculateDemandFactor: (hour: number, isHeatwave: boolean) => {
      const h = hour % 24;
      let factor = 0.88;
      if (h >= 12 && h <= 23) {
        factor = 1.55; // Extended afternoon and evening cooling load
      } else if (h >= 0 && h <= 6) {
        factor = 0.75;
      }
      return factor * (isHeatwave ? 1.25 : 1.0);
    },
  },
};

export const DEMAND_PROFILE_LIST: PeakDemandProfile[] = Object.values(DEMAND_PROFILES);

export function getRandomDemandProfile(excludeId?: PeakDemandProfileId): PeakDemandProfile {
  const pool = excludeId
    ? DEMAND_PROFILE_LIST.filter((p) => p.id !== excludeId)
    : DEMAND_PROFILE_LIST;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function getDemandProfile(id?: PeakDemandProfileId): PeakDemandProfile {
  if (id && DEMAND_PROFILES[id]) {
    return DEMAND_PROFILES[id];
  }
  return DEMAND_PROFILES.duck_curve;
}

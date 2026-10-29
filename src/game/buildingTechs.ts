import { BuildingType, TechUpgrade } from './types';

export interface BuildingTechLink {
  techId: string;
  name: string;
  tacticalCode: string;
  tier: number;
  category: string;
  effectOnBuilding: string;
  description: string;
}

/**
 * Tactical mapping linking each building type to relevant technologies from the Tech Tree.
 */
export const BUILDING_TECH_REGISTRY: Partial<Record<BuildingType, BuildingTechLink[]>> = {
  solar_farm: [
    {
      techId: 'perovskite_tandem',
      name: 'Perovskite Tandem Solar Cells',
      tacticalCode: 'RA-PWR-01',
      tier: 1,
      category: 'power_systems',
      effectOnBuilding: '+25% Solar Generation across all weather conditions',
      description: 'Dual-junction crystalline solar cells pushing conversion efficiency past 31%.',
    },
    {
      techId: 'predictive_weather_ai',
      name: 'Neural Doppler Weather Forecasting',
      tacticalCode: 'RA-ADV-02',
      tier: 2,
      category: 'advanced_tech',
      effectOnBuilding: '+10% Additional Solar Output through predictive sun tracking',
      description: 'Satellite radar models anticipating cloud shadow vectors to optimize tilt angles.',
    },
  ],
  wind_turbine: [
    {
      techId: 'deepwater_offshore_anchors',
      name: 'Tension-Leg Turbine Tech',
      tacticalCode: 'RA-PWR-02',
      tier: 2,
      category: 'power_systems',
      effectOnBuilding: '+20% Wind Generation through reinforced blade pitch dynamics',
      description: 'Advanced composite blades and smart yaw controls designed for high wind shear.',
    },
    {
      techId: 'predictive_weather_ai',
      name: 'Neural Doppler Weather Forecasting',
      tacticalCode: 'RA-ADV-02',
      tier: 2,
      category: 'advanced_tech',
      effectOnBuilding: '+10% Wind Generation through predictive front tracking',
      description: 'Pre-positions yaw angles prior to incoming atmospheric wind gusts.',
    },
  ],
  offshore_wind: [
    {
      techId: 'deepwater_offshore_anchors',
      name: 'Tension-Leg Deepwater Anchors',
      tacticalCode: 'RA-PWR-02',
      tier: 2,
      category: 'power_systems',
      effectOnBuilding: '+20% Offshore Marine Generation in deepwater zones',
      description: 'Floating spar and tension-leg mooring capable of handling intense ocean storms.',
    },
    {
      techId: 'predictive_weather_ai',
      name: 'Neural Doppler Weather Forecasting',
      tacticalCode: 'RA-ADV-02',
      tier: 2,
      category: 'advanced_tech',
      effectOnBuilding: '+10% Marine Wind Harvest through maritime front prediction',
      description: 'Anticipates gale boundaries to maximize energy extraction.',
    },
  ],
  hydro_dam: [
    {
      techId: 'supercritical_hydro_turbines',
      name: 'Supercritical Aerodynamic Hydro Penstocks',
      tacticalCode: 'RA-PWR-04',
      tier: 4,
      category: 'power_systems',
      effectOnBuilding: '+35% Hydroelectric Dam Power Throughput',
      description: 'Vortex-chamber micro-cavitation penstocks amplifying reservoir pressure recovery.',
    },
  ],
  geothermal: [
    {
      techId: 'enhanced_geothermal',
      name: 'Hydraulic Shear Enhanced Geothermal (EGS)',
      tacticalCode: 'RA-PWR-03',
      tier: 3,
      category: 'power_systems',
      effectOnBuilding: '+30% Geothermal Facility 24/7 Baseload Output',
      description: 'Deep directional drilling into crystalline basement rock for continuous thermal flow.',
    },
  ],
  battery_bess: [
    {
      techId: 'solid_state_storage',
      name: 'Grid-Scale Solid-State Batteries',
      tacticalCode: 'RA-STR-01',
      tier: 1,
      category: 'resource_management',
      effectOnBuilding: '+40% Storage Buffer Capacity & zero fire degradation',
      description: 'Non-flammable solid electrolyte delivering double energy density and 98% efficiency.',
    },
    {
      techId: 'vanadium_flow_cells',
      name: 'Vanadium Redox Industrial Flow Cells',
      tacticalCode: 'RA-STR-02',
      tier: 2,
      category: 'resource_management',
      effectOnBuilding: '+25% Extended Multi-Day Storage Capacity',
      description: 'Aqueous electrolyte tanks that scale energy volume independently of cell stacks.',
    },
    {
      techId: 'molten_salt_storage',
      name: 'Liquid Salt Thermal Reserve Silos',
      tacticalCode: 'RA-STR-03',
      tier: 3,
      category: 'resource_management',
      effectOnBuilding: '+30% Reserve Buffer & extreme heatwave tolerance',
      description: 'Insulated thermal salts retaining dispatchable high-temperature reserves.',
    },
  ],
  substation: [
    {
      techId: 'synchronous_condensers',
      name: 'Flywheel Synchronous Condensers',
      tacticalCode: 'RA-INF-01',
      tier: 1,
      category: 'infrastructure',
      effectOnBuilding: '+8% Regional Grid Stability & physical rotational inertia',
      description: 'Spinning rotors providing physical inertia and instantaneous reactive voltage support.',
    },
    {
      techId: 'smart_substations_v2',
      name: 'Automated Solid-State Substations',
      tacticalCode: 'RA-INF-02',
      tier: 2,
      category: 'infrastructure',
      effectOnBuilding: '+10% Stability & micro-second feeder rerouting',
      description: 'Silicon carbide solid-state transformers with sub-cycle automated routing.',
    },
    {
      techId: 'cryo_superconductors',
      name: 'Cryogenic Superconducting Lines',
      tacticalCode: 'RA-INF-03',
      tier: 3,
      category: 'infrastructure',
      effectOnBuilding: '+15% Grid Stability & 0% line transmission losses',
      description: 'Liquid nitrogen jacketed cables delivering zero-resistance high-power delivery.',
    },
    {
      techId: 'emp_surge_deflectors',
      name: 'EMP & Lightning Grounding Deflectors',
      tacticalCode: 'RA-DEF-01',
      tier: 1,
      category: 'defense_systems',
      effectOnBuilding: '+6% Baseline Stability & surge suppression',
      description: 'Faraday-shielded transformer enclosures and fast-acting discharge tubes.',
    },
    {
      techId: 'black_start_isolators',
      name: 'Autonomous Black-Start Isolators',
      tacticalCode: 'RA-DEF-03',
      tier: 3,
      category: 'defense_systems',
      effectOnBuilding: '+12% Stability & rapid sector black-start recovery',
      description: 'Battery-driven auxiliary starters able to restore dark sectors within seconds.',
    },
  ],
  city_center: [
    {
      techId: 'ai_smart_grid',
      name: 'AI Dynamic Load Balancing',
      tacticalCode: 'RA-ADV-01',
      tier: 1,
      category: 'advanced_tech',
      effectOnBuilding: 'Reduces Urban Peak Demand by 15%',
      description: 'Automated demand-response algorithms shifting EV charging and heavy HVAC.',
    },
    {
      techId: 'carbon_border_pricing',
      name: 'National Carbon Fee & Dividend',
      tacticalCode: 'RA-POL-01',
      tier: 1,
      category: 'special_projects',
      effectOnBuilding: '+35% Carbon Revenue Premiums paid to municipal treasury',
      description: 'Levies carbon fees on fossil generators while rewarding clean power output.',
    },
    {
      techId: 'industrial_demand_curtailment',
      name: 'Strategic Curtailment Compact',
      tacticalCode: 'RA-POL-02',
      tier: 2,
      category: 'special_projects',
      effectOnBuilding: 'Reduces Industrial Peak Demand by 12%',
      description: 'Pre-negotiated compensation contracts for heavy consumers to pause during peaks.',
    },
  ],
  remediated_park: [
    {
      techId: 'carbon_border_pricing',
      name: 'National Carbon Fee & Dividend',
      tacticalCode: 'RA-POL-01',
      tier: 1,
      category: 'special_projects',
      effectOnBuilding: '+35% Sequestration Carbon Credit Yield',
      description: 'Maximizes the financial dividend generated per ton of carbon sequestered.',
    },
    {
      techId: 'strategic_clean_reserve',
      name: 'Sovereign Clean Energy Reserve',
      tacticalCode: 'RA-POL-03',
      tier: 3,
      category: 'special_projects',
      effectOnBuilding: '+30% Eco-Credit Valuation & municipal prestige',
      description: 'Multi-regional accord providing sovereign valuation on natural buffer assets.',
    },
  ],
};

/**
 * Reverse mapping from techId to target building names for the Tech Tree Dossier.
 */
export const TECH_TO_TARGET_BUILDINGS: Record<string, { buildingType: BuildingType; role: string }[]> = {
  perovskite_tandem: [{ buildingType: 'solar_farm', role: 'Primary Target Asset (+25% Generation)' }],
  deepwater_offshore_anchors: [
    { buildingType: 'offshore_wind', role: 'Primary Target Asset (+20% Marine Yield)' },
    { buildingType: 'wind_turbine', role: 'Secondary Beneficiary (+20% High-Shear Yield)' },
  ],
  enhanced_geothermal: [{ buildingType: 'geothermal', role: 'Primary Target Asset (+30% Baseload MW)' }],
  supercritical_hydro_turbines: [{ buildingType: 'hydro_dam', role: 'Primary Target Asset (+35% Hydro Throughput)' }],
  solid_state_storage: [{ buildingType: 'battery_bess', role: 'Primary Target Asset (+40% Capacity Buffer)' }],
  vanadium_flow_cells: [{ buildingType: 'battery_bess', role: 'Primary Target Asset (+25% Long-Duration Storage)' }],
  molten_salt_storage: [{ buildingType: 'battery_bess', role: 'Primary Target Asset (+30% Reserve Buffer)' }],
  synchronous_condensers: [{ buildingType: 'substation', role: 'Primary Target Asset (+8% Inertia Stability)' }],
  smart_substations_v2: [{ buildingType: 'substation', role: 'Primary Target Asset (+10% Switching Stability)' }],
  cryo_superconductors: [{ buildingType: 'substation', role: 'Primary Target Asset (+15% Lossless Transmission)' }],
  emp_surge_deflectors: [{ buildingType: 'substation', role: 'Primary Target Asset (+6% EMP Hardening)' }],
  hardened_scada_defense: [{ buildingType: 'substation', role: 'Primary Target Asset (+8% Cyber Stability)' }],
  black_start_isolators: [{ buildingType: 'substation', role: 'Primary Target Asset (+12% Black-Start Recovery)' }],
  ai_smart_grid: [
    { buildingType: 'city_center', role: 'Primary Target Asset (-15% Peak Demand)' },
    { buildingType: 'substation', role: 'Network Node (Smart Dynamic Dispatch)' },
  ],
  predictive_weather_ai: [
    { buildingType: 'solar_farm', role: 'Sensor Integration (+10% Predictive Solar)' },
    { buildingType: 'wind_turbine', role: 'Sensor Integration (+10% Predictive Wind)' },
    { buildingType: 'offshore_wind', role: 'Sensor Integration (+10% Predictive Marine Wind)' },
  ],
  quantum_grid_optimizer: [
    { buildingType: 'city_center', role: 'Primary Beneficiary (-10% Peak Demand)' },
    { buildingType: 'substation', role: 'Global Compute Node (+10% Stability)' },
  ],
  carbon_border_pricing: [
    { buildingType: 'city_center', role: 'Fiscal Policy Node (+35% Export Value)' },
    { buildingType: 'remediated_park', role: 'Carbon Credit Yield Boost' },
  ],
  industrial_demand_curtailment: [
    { buildingType: 'city_center', role: 'Industrial Demand Node (-12% Peak Surge)' },
  ],
  strategic_clean_reserve: [
    { buildingType: 'city_center', role: 'Regional Intertie Node (+30% Export Tariffs)' },
    { buildingType: 'remediated_park', role: 'Ecological Reserve Dividend' },
  ],
};

/**
 * Get all technologies relevant to a specific building with their current live status.
 */
export function getBuildingTechDetails(
  buildingType: BuildingType,
  allTechs: TechUpgrade[]
): Array<BuildingTechLink & { tech?: TechUpgrade; status: 'unlocked' | 'researching' | 'available' | 'locked' }> {
  const links = BUILDING_TECH_REGISTRY[buildingType] || [];

  return links.map((link) => {
    const tech = allTechs.find((t) => t.id === link.techId);
    if (!tech) {
      return { ...link, tech: undefined, status: 'locked' as const };
    }

    if (tech.unlocked) {
      return { ...link, tech, status: 'unlocked' as const };
    }

    if (tech.isResearching) {
      return { ...link, tech, status: 'researching' as const };
    }

    const prereqs = tech.prerequisites || [];
    const prereqsMet = prereqs.every((prereqId) => {
      const p = allTechs.find((t) => t.id === prereqId);
      return p && p.unlocked;
    });

    return {
      ...link,
      tech,
      status: prereqsMet ? ('available' as const) : ('locked' as const),
    };
  });
}

/**
 * Returns a concise tactical summary badge string for a building, e.g. "+35% BOOST" or null.
 */
export function getBuildingTechBadge(
  buildingType: BuildingType,
  allTechs: TechUpgrade[]
): { text: string; isBoosted: boolean; countUnlocked: number; totalCount: number } | null {
  const details = getBuildingTechDetails(buildingType, allTechs);
  if (details.length === 0) return null;

  const unlockedCount = details.filter((d) => d.status === 'unlocked').length;
  const availableCount = details.filter((d) => d.status === 'available').length;

  if (unlockedCount > 0) {
    if (buildingType === 'solar_farm') {
      const p = allTechs.find((t) => t.id === 'perovskite_tandem')?.unlocked;
      const w = allTechs.find((t) => t.id === 'predictive_weather_ai')?.unlocked;
      const pct = (p ? 25 : 0) + (w ? 10 : 0);
      return { text: `+${pct}% Solar Boost`, isBoosted: true, countUnlocked: unlockedCount, totalCount: details.length };
    }
    if (buildingType === 'wind_turbine' || buildingType === 'offshore_wind') {
      const a = allTechs.find((t) => t.id === 'deepwater_offshore_anchors')?.unlocked;
      const w = allTechs.find((t) => t.id === 'predictive_weather_ai')?.unlocked;
      const pct = (a ? 20 : 0) + (w ? 10 : 0);
      return { text: `+${pct}% Wind Boost`, isBoosted: true, countUnlocked: unlockedCount, totalCount: details.length };
    }
    if (buildingType === 'geothermal') {
      return { text: '+30% EGS Baseload', isBoosted: true, countUnlocked: unlockedCount, totalCount: details.length };
    }
    if (buildingType === 'hydro_dam') {
      return { text: '+35% Supercritical Flow', isBoosted: true, countUnlocked: unlockedCount, totalCount: details.length };
    }
    if (buildingType === 'battery_bess') {
      let bPct = 0;
      if (allTechs.find((t) => t.id === 'solid_state_storage')?.unlocked) bPct += 40;
      if (allTechs.find((t) => t.id === 'vanadium_flow_cells')?.unlocked) bPct += 25;
      if (allTechs.find((t) => t.id === 'molten_salt_storage')?.unlocked) bPct += 30;
      return { text: `+${bPct}% BESS Capacity`, isBoosted: true, countUnlocked: unlockedCount, totalCount: details.length };
    }
    if (buildingType === 'substation') {
      return { text: `${unlockedCount} Grid Techs Active`, isBoosted: true, countUnlocked: unlockedCount, totalCount: details.length };
    }
    if (buildingType === 'city_center') {
      return { text: 'AI Load Optimized', isBoosted: true, countUnlocked: unlockedCount, totalCount: details.length };
    }
    return { text: `${unlockedCount}/${details.length} Techs Active`, isBoosted: true, countUnlocked: unlockedCount, totalCount: details.length };
  }

  if (availableCount > 0) {
    return { text: `${availableCount} R&D Available`, isBoosted: false, countUnlocked: 0, totalCount: details.length };
  }

  return { text: 'Tech Upgradable', isBoosted: false, countUnlocked: 0, totalCount: details.length };
}

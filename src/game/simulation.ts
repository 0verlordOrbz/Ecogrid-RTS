import { GridTile, WeatherState, TechUpgrade, GameEvent, EconomicEngine, PeakDemandProfile, ClimateAlert } from './types';
import { BUILDING_DEFS } from './buildingDefs';
import { ECONOMIC_ENGINES } from './economicEngines';
import { DEMAND_PROFILES } from './demandProfiles';
import { createClimateAlert, getRandomClimateAlertType } from './climateAlerts';

export interface SimulationResult {
  weather: WeatherState;
  totalDemandMW: number;
  totalCleanMW: number;
  totalFossilMW: number;
  totalBatteryDischargedMW: number;
  totalBatteryChargedMW: number;
  totalStorageAvailableMWh: number;
  totalStorageCapacityMWh: number;
  cleanPercentage: number;
  gridStabilityPct: number;
  co2PerDay: number;
  cashDelta: number;
  hasBlackout: boolean;
  surplusExportMW: number;
  isPeakActive: boolean;
  powerRevenueHourly: number;
  cleanCreditHourly: number;
  exportRevenueHourly: number;
  ecoParkGrantHourly: number;
  updatedTiles: GridTile[];
  newEvents: GameEvent[];
}

export function createInitialWeather(): WeatherState {
  return {
    timeOfDay: 9.0, // 9:00 AM
    day: 1,
    year: 2026,
    windSpeedMs: 8.5,
    solarIrradiancePct: 80,
    temperatureC: 22,
    cloudCoverPct: 20,
    isHeatwave: false,
    isDunkelflaute: false,
    activeAlert: null,
    // Initialize a randomized upcoming climate hazard advisory
    upcomingAlert: createClimateAlert(getRandomClimateAlertType(), true),
  };
}

export function updateWeather(current: WeatherState, deltaHours: number): WeatherState {
  let newTime = current.timeOfDay + deltaHours;
  let newDay = current.day;
  let newYear = current.year;
  let dayRolledOver = false;

  if (newTime >= 24) {
    newTime -= 24;
    newDay += 1;
    dayRolledOver = true;
    if (newDay > 365) {
      newDay = 1;
      newYear += 1;
    }
  }

  // Handle Climate Alert Timers & Transitions
  let activeAlert = current.activeAlert ? { ...current.activeAlert } : null;
  let upcomingAlert = current.upcomingAlert ? { ...current.upcomingAlert } : null;

  if (upcomingAlert) {
    upcomingAlert.warningLeadHours = Math.max(0, upcomingAlert.warningLeadHours - deltaHours);
    if (upcomingAlert.warningLeadHours <= 0) {
      // Watch phase over: transition directly into ACTIVE alert!
      activeAlert = {
        ...upcomingAlert,
        isWatchPhase: false,
        remainingHours: upcomingAlert.durationHours,
      };
      upcomingAlert = null;
    }
  } else if (activeAlert) {
    activeAlert.remainingHours = Math.max(0, activeAlert.remainingHours - deltaHours);
    if (activeAlert.remainingHours <= 0) {
      // Alert has run its course and cleared!
      activeAlert = null;
    }
  } else {
    // No active or upcoming alert: evaluate natural weather forecast generation
    // Every ~3-4 days, or on day rollover with ~25% chance
    if (dayRolledOver && (newDay % 3 === 0 || Math.random() < 0.28)) {
      const nextType = getRandomClimateAlertType();
      upcomingAlert = createClimateAlert(nextType, true);
    }
  }

  // Base day cycle
  const dayCyclePhase = (newTime / 24) * Math.PI * 2;
  
  // Sunlight: 6:00 to 18:00
  let rawSun = 0;
  if (newTime >= 6 && newTime <= 18) {
    const sunAngle = ((newTime - 6) / 12) * Math.PI;
    rawSun = Math.sin(sunAngle) * 100;
  }

  // Cloud variation
  let cloudCycle = Math.sin(newDay * 0.7 + newTime * 0.2) * 25 + Math.cos(newDay * 0.3) * 15 + 30;
  if (activeAlert?.type === 'dunkelflaute') cloudCycle = Math.max(cloudCycle, 92);
  if (activeAlert?.type === 'typhoon') cloudCycle = Math.max(cloudCycle, 88);
  if (activeAlert?.type === 'atmospheric_river') cloudCycle = Math.max(cloudCycle, 82);
  const clampedCloud = Math.max(5, Math.min(95, cloudCycle));

  // Actual solar irradiance after cloud absorption
  let solarIrradiancePct = Math.max(0, Math.round(rawSun * (1 - clampedCloud * 0.007)));
  if (activeAlert?.effects.solarMultiplier !== undefined) {
    solarIrradiancePct = Math.round(solarIrradiancePct * activeAlert.effects.solarMultiplier);
  }

  // Wind speed variation
  let baseWind = 7.5 + Math.sin(newDay * 0.5 + newTime * 0.15) * 4.5 + Math.cos(newTime * 0.4) * 2;
  if (activeAlert?.type === 'typhoon') {
    baseWind = 24.5 + Math.sin(newTime * 0.8) * 3.5; // Extreme gale winds
  } else if (activeAlert?.type === 'dunkelflaute') {
    baseWind = 1.8 + Math.sin(newTime * 0.1) * 0.6; // Stagnation calm
  }
  const windSpeedMs = Math.max(1.0, Math.min(28.0, Number(baseWind.toFixed(1))));

  // Temperature
  let temperatureC = Math.round(18 + Math.sin(dayCyclePhase - Math.PI / 2) * 7 - (clampedCloud > 70 ? 2 : 0));
  if (activeAlert?.type === 'heatwave') {
    temperatureC = Math.max(38, temperatureC + 10);
  } else if (activeAlert?.type === 'polar_vortex') {
    temperatureC = Math.min(-14, temperatureC - 26);
  }

  return {
    timeOfDay: Number(newTime.toFixed(4)),
    day: newDay,
    year: newYear,
    windSpeedMs,
    solarIrradiancePct,
    temperatureC,
    cloudCoverPct: Math.round(clampedCloud),
    isHeatwave: temperatureC > 31 || activeAlert?.type === 'heatwave',
    isDunkelflaute: (clampedCloud > 80 && windSpeedMs < 3.5) || activeAlert?.type === 'dunkelflaute',
    activeAlert,
    upcomingAlert,
  };
}

export function stepSimulation(
  tiles: GridTile[],
  weather: WeatherState,
  unlockedTechs: TechUpgrade[],
  currentFunds: number,
  deltaSeconds: number,
  economicEngine: EconomicEngine = ECONOMIC_ENGINES.green_tariff,
  demandProfile: PeakDemandProfile = DEMAND_PROFILES.duck_curve
): SimulationResult {
  const events: GameEvent[] = [];
  // Time scale: 1 in-game minute = 2 real seconds at 1x speed (1 in-game hour = 120 real seconds)
  const deltaHours = deltaSeconds / 120;

  // Apply tech bonuses
  let solarMultiplier = 1.0;
  let windMultiplier = 1.0;
  let batteryMultiplier = 1.0;
  let demandMultiplier = 1.0;
  let carbonCreditMultiplier = 1.0;
  let hydroMultiplier = 1.0;

  unlockedTechs.forEach((t) => {
    if (t.bonus.solarMultiplier) solarMultiplier *= t.bonus.solarMultiplier;
    if (t.bonus.windMultiplier) windMultiplier *= t.bonus.windMultiplier;
    if (t.bonus.batteryMultiplier) batteryMultiplier *= t.bonus.batteryMultiplier;
    if (t.bonus.demandReductionPct) demandMultiplier *= (1 - t.bonus.demandReductionPct);
    if (t.bonus.carbonCreditRateMultiplier) carbonCreditMultiplier *= t.bonus.carbonCreditRateMultiplier;
  });

  // Apply Active Climate Alert Modifiers
  const activeAlert = weather.activeAlert;
  if (activeAlert) {
    if (activeAlert.effects.solarMultiplier !== undefined) {
      solarMultiplier *= activeAlert.effects.solarMultiplier;
    }
    if (activeAlert.effects.windMultiplier !== undefined) {
      windMultiplier *= activeAlert.effects.windMultiplier;
    }
    if (activeAlert.effects.hydroMultiplier !== undefined) {
      hydroMultiplier *= activeAlert.effects.hydroMultiplier;
    }
    if (activeAlert.effects.demandMultiplier !== undefined) {
      demandMultiplier *= activeAlert.effects.demandMultiplier;
    }
  }

  // Calculate Dynamic Demand from Peak Demand Profile
  const isPeakActive = demandProfile.isPeakHour(weather.timeOfDay);
  const demandFactor = demandProfile.calculateDemandFactor(weather.timeOfDay, weather.isHeatwave);
  const profileScale = demandProfile.baseDemandScale;

  let totalDemandMW = 0;
  let totalCleanMW = 0;
  let totalFossilMW = 0;
  let totalCo2Daily = 0;
  let dailyMaintenance = 0;

  let totalStorageAvailableMWh = 0;
  let totalStorageCapacityMWh = 0;

  // Update tiles and sum initial generation
  const updatedTiles: GridTile[] = tiles.map((tile): GridTile => {
    const def = BUILDING_DEFS[tile.building];
    let outputMW = 0;

    // Check decommissioning progress
    if (tile.decommissioning) {
      const progress = (tile.decommissionProgress || 0) + (deltaSeconds * 4);
      if (progress >= 100) {
        events.push({
          id: `decom_${tile.id}_${Date.now()}`,
          title: 'Plant Decommissioned',
          description: `${def.name} has been safely retired. Emissions ceased!`,
          type: 'positive',
          timestamp: Date.now(),
        });
        return {
          ...tile,
          building: 'remediated_park',
          decommissioning: false,
          decommissionProgress: 0,
          powerOutputMW: 0,
        };
      }
      return {
        ...tile,
        decommissionProgress: progress,
        powerOutputMW: 0,
      };
    }

    // Daily maintenance cost (₱/day)
    dailyMaintenance += (def.maintenancePerDay * (tile.level === 2 ? 1.4 : 1.0));

    if (def.category === 'civic' && def.basePowerMW < 0) {
      // City demand tile scaled by profile and duck-curve factors
      const cityDemand = Math.abs(def.basePowerMW) * demandFactor * profileScale * demandMultiplier * (tile.level === 2 ? 1.5 : 1.0);
      totalDemandMW += cityDemand;
      outputMW = -cityDemand;
    } else if (def.category === 'fossil') {
      // Fossil power plant
      outputMW = def.basePowerMW * (tile.level === 2 ? 1.3 : 1.0);
      totalFossilMW += outputMW;
      totalCo2Daily += def.co2PerDay * (tile.level === 2 ? 1.2 : 1.0);
    } else if (def.category === 'renewable') {
      // Clean renewable power
      if (tile.building === 'solar_farm') {
        const irradianceFrac = weather.solarIrradiancePct / 100;
        outputMW = def.basePowerMW * irradianceFrac * solarMultiplier * (tile.level === 2 ? 1.35 : 1.0);
      } else if (tile.building === 'wind_turbine') {
        const v = weather.windSpeedMs;
        // Automated Safety Cutoff during violent gale/typhoon (> 22 m/s)
        if (activeAlert?.effects.windTurbineCutoff && v >= 22) {
          outputMW = 0; // Mechanical safety brake applied
        } else {
          let windFactor = 0;
          if (v >= 3 && v <= 25) {
            windFactor = Math.min(1.0, Math.pow((v - 3) / 9, 2));
          }
          outputMW = def.basePowerMW * windFactor * windMultiplier * (tile.level === 2 ? 1.35 : 1.0);
        }
      } else if (tile.building === 'offshore_wind') {
        // Offshore experiences ~25% stronger winds, heavy storm marine moorings
        const v = weather.windSpeedMs * 1.25;
        let windFactor = 0;
        if (v >= 3 && v <= 28) {
          windFactor = Math.min(1.0, Math.pow((v - 3) / 8.5, 2));
          // If wind is extreme gale (>25 m/s), offshore feathers to 35% capacity
          if (v > 25) windFactor *= 0.35;
        }
        outputMW = def.basePowerMW * windFactor * windMultiplier * (tile.level === 2 ? 1.35 : 1.0);
      } else if (tile.building === 'hydro_dam') {
        // Dispatchable renewable multiplied by catchment inflow
        outputMW = def.basePowerMW * (tile.level === 2 ? 1.3 : 1.0) * hydroMultiplier;
      } else if (tile.building === 'geothermal') {
        // Weather-independent baseload
        outputMW = def.basePowerMW * (tile.level === 2 ? 1.35 : 1.0);
      }
      totalCleanMW += outputMW;
    } else if (tile.building === 'battery_bess') {
      const capacity = (def.maxStorageMWh || 400) * batteryMultiplier * (tile.level === 2 ? 1.6 : 1.0);
      totalStorageCapacityMWh += capacity;
      totalStorageAvailableMWh += tile.storedMWh;
    } else if (tile.building === 'remediated_park') {
      totalCo2Daily += def.co2PerDay; // Negative, acts as carbon sink
    }

    return {
      ...tile,
      powerOutputMW: Number(outputMW.toFixed(1)),
    };
  });

  // Battery Charging / Discharging Logic
  let totalBatteryDischargedMW = 0;
  let totalBatteryChargedMW = 0;

  const netCleanSurplusMW = totalCleanMW - totalDemandMW;

  if (netCleanSurplusMW > 0 && totalStorageCapacityMWh > 0) {
    // Charge batteries with clean surplus
    const maxChargeRateMW = updatedTiles.filter((t) => t.building === 'battery_bess').length * 100;
    const chargeMW = Math.min(netCleanSurplusMW, maxChargeRateMW);
    const chargeMWh = chargeMW * deltaHours;

    let remainingToCharge = chargeMWh;
    updatedTiles.forEach((tile) => {
      if (tile.building === 'battery_bess') {
        const def = BUILDING_DEFS.battery_bess;
        const maxCap = (def.maxStorageMWh || 400) * batteryMultiplier * (tile.level === 2 ? 1.6 : 1.0);
        const space = maxCap - tile.storedMWh;
        const add = Math.min(space, remainingToCharge);
        tile.storedMWh += add;
        remainingToCharge -= add;
        tile.powerOutputMW = -chargeMW; // negative indicates charging
      }
    });
    totalBatteryChargedMW = chargeMW;
  } else if (netCleanSurplusMW < 0 && totalStorageAvailableMWh > 0) {
    // Deficit: Discharge batteries to avoid running fossil or blacking out
    const deficitMW = Math.abs(netCleanSurplusMW);
    const maxDischargeRateMW = updatedTiles.filter((t) => t.building === 'battery_bess').length * 100;
    const dischargeMW = Math.min(deficitMW, maxDischargeRateMW);
    const neededMWh = dischargeMW * deltaHours;

    let remainingDischarge = neededMWh;
    updatedTiles.forEach((tile) => {
      if (tile.building === 'battery_bess' && tile.storedMWh > 0) {
        const take = Math.min(tile.storedMWh, remainingDischarge);
        tile.storedMWh -= take;
        remainingDischarge -= take;
        tile.powerOutputMW = dischargeMW;
      }
    });

    const actualDischargedMW = (neededMWh - remainingDischarge) / deltaHours;
    totalBatteryDischargedMW = actualDischargedMW;
    totalCleanMW += actualDischargedMW; // Discharged stored clean energy counts toward serving demand
  }

  // Calculate clean energy percentage
  const effectiveTotalGeneration = totalCleanMW + totalFossilMW;
  const cleanPercentage = effectiveTotalGeneration > 0
    ? Math.min(100, Math.round((totalCleanMW / effectiveTotalGeneration) * 100))
    : 0;

  // Grid Stability: 100% when supply meets or exceeds demand, factoring in alert turbulence
  const supplyDeficitMW = totalDemandMW - effectiveTotalGeneration;
  const hasBlackout = supplyDeficitMW > 30; // 30MW threshold
  let rawStabilityPct = Math.round((effectiveTotalGeneration / Math.max(1, totalDemandMW)) * 100);
  if (activeAlert?.effects.stabilityImpact) {
    rawStabilityPct += activeAlert.effects.stabilityImpact;
  }
  const gridStabilityPct = Math.max(0, Math.min(100, rawStabilityPct));

  // Economics (Hourly rate ₱/hr)
  // 1. Electricity tariff revenue: base or peak surge tariff
  const activeTariff = isPeakActive
    ? economicEngine.tariffPerMWh * economicEngine.peakTariffMultiplier
    : economicEngine.tariffPerMWh;
  const powerDeliveredMW = Math.min(effectiveTotalGeneration, totalDemandMW);
  const powerRevenueHourly = powerDeliveredMW * activeTariff;

  // 2. Clean Energy Incentive Premium
  const cleanCreditRevenueHourly = totalCleanMW * economicEngine.cleanCreditPerMWh * carbonCreditMultiplier;

  // 3. Cross-Border Clean Surplus Export Revenue (when clean gen exceeds city demand)
  const surplusCleanMW = Math.max(0, totalCleanMW - totalDemandMW);
  const exportRevenueHourly = surplusCleanMW * economicEngine.surplusExportRatePerMWh;

  // 4. Civic Carbon Sink Eco-Park Subsidy
  const ecoParkCount = updatedTiles.filter((t) => t.building === 'remediated_park').length;
  const ecoParkGrantHourly = ecoParkCount * economicEngine.ecoParkGrantHourly;

  // 5. Maintenance hourly cost with regulatory modifier:
  const maintenanceCostHourly = (dailyMaintenance * economicEngine.maintenanceMultiplier) / 24;

  // 6. Fossil Fuel & Carbon Surcharge:
  const fossilFuelCostHourly = totalFossilMW * economicEngine.fossilSurchargePerMWh;

  // 7. Blackout penalty:
  const blackoutPenaltyHourly = hasBlackout ? supplyDeficitMW * economicEngine.blackoutPenaltyPerMWh : 0;

  const cashRatePerHour =
    powerRevenueHourly +
    cleanCreditRevenueHourly +
    exportRevenueHourly +
    ecoParkGrantHourly -
    maintenanceCostHourly -
    fossilFuelCostHourly -
    blackoutPenaltyHourly;

  return {
    weather,
    totalDemandMW: Math.round(totalDemandMW),
    totalCleanMW: Math.round(totalCleanMW),
    totalFossilMW: Math.round(totalFossilMW),
    totalBatteryDischargedMW: Math.round(totalBatteryDischargedMW),
    totalBatteryChargedMW: Math.round(totalBatteryChargedMW),
    totalStorageAvailableMWh: Math.round(totalStorageAvailableMWh),
    totalStorageCapacityMWh: Math.round(totalStorageCapacityMWh),
    cleanPercentage,
    gridStabilityPct,
    co2PerDay: Math.max(0, Math.round(totalCo2Daily)),
    cashDelta: Math.round(cashRatePerHour),
    hasBlackout,
    surplusExportMW: Math.round(surplusCleanMW),
    isPeakActive,
    powerRevenueHourly: Math.round(powerRevenueHourly),
    cleanCreditHourly: Math.round(cleanCreditRevenueHourly),
    exportRevenueHourly: Math.round(exportRevenueHourly),
    ecoParkGrantHourly: Math.round(ecoParkGrantHourly),
    updatedTiles,
    newEvents: events,
  };
}

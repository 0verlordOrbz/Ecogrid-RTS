import { EconomicEngine, EconomicEngineId } from './types';

export const ECONOMIC_ENGINES: Record<EconomicEngineId, EconomicEngine> = {
  green_tariff: {
    id: 'green_tariff',
    name: 'Green Tariff & Feed-in Premium',
    shortName: 'Green Tariff',
    tagline: '+₱48/MWh clean premium, ₱65/MWh carbon tax',
    description:
      'State-backed green incentives pay high feed-in tariffs (+₱48/MWh) for wind, solar, hydro, and geothermal, while levying strict penalties on fossil emissions.',
    tariffPerMWh: 95,
    cleanCreditPerMWh: 48,
    fossilSurchargePerMWh: 65,
    maintenanceMultiplier: 1.0,
    blackoutPenaltyPerMWh: 250,
    surplusExportRatePerMWh: 25,
    ecoParkGrantHourly: 150,
    peakTariffMultiplier: 1.15,
    color: '#10b981',
    iconName: 'Leaf',
  },
  merit_order: {
    id: 'merit_order',
    name: 'Industrial Wholesale Merit-Order',
    shortName: 'Wholesale Merit',
    tagline: '1.45x peak pricing, ₱420/MWh blackout penalty',
    description:
      'Deregulated spot-market rewards generators who produce during critical peak hours with surging power rates (up to ₱135/MWh), but imposes severe blackout penalties.',
    tariffPerMWh: 90,
    cleanCreditPerMWh: 22,
    fossilSurchargePerMWh: 40,
    maintenanceMultiplier: 1.05,
    blackoutPenaltyPerMWh: 420,
    surplusExportRatePerMWh: 35,
    ecoParkGrantHourly: 80,
    peakTariffMultiplier: 1.45,
    color: '#f59e0b',
    iconName: 'TrendingUp',
  },
  public_utility: {
    id: 'public_utility',
    name: 'Municipal Public Utility Cooperative',
    shortName: 'Public Utility',
    tagline: '-25% plant upkeep, +₱350/h eco-park grants',
    description:
      'Civic cooperative funded by public bonds. Prioritizes grid stability and consumer affordability with subsidized maintenance (-25%) and heavy civic wetland grants.',
    tariffPerMWh: 85,
    cleanCreditPerMWh: 28,
    fossilSurchargePerMWh: 45,
    maintenanceMultiplier: 0.75,
    blackoutPenaltyPerMWh: 200,
    surplusExportRatePerMWh: 20,
    ecoParkGrantHourly: 350,
    peakTariffMultiplier: 1.05,
    color: '#06b6d4',
    iconName: 'Shield',
  },
  clean_export: {
    id: 'clean_export',
    name: 'Cross-Border Clean Power Superhub',
    shortName: 'Export Superhub',
    tagline: '+₱55/MWh for surplus clean power exports',
    description:
      'High-voltage HVDC interconnectors sell clean generation surpluses across the regional border at premium rates (₱55/MWh), rewarding aggressive clean overbuilding.',
    tariffPerMWh: 92,
    cleanCreditPerMWh: 35,
    fossilSurchargePerMWh: 45,
    maintenanceMultiplier: 1.0,
    blackoutPenaltyPerMWh: 280,
    surplusExportRatePerMWh: 55,
    ecoParkGrantHourly: 120,
    peakTariffMultiplier: 1.20,
    color: '#8b5cf6',
    iconName: 'Zap',
  },
  polluter_pays: {
    id: 'polluter_pays',
    name: 'Polluter-Pays Decarbonization Mandate',
    shortName: 'Polluter-Pays',
    tagline: '₱80/MWh dirty fossil levy, +₱450/h carbon sinks',
    description:
      'Aggressive climate mandate heavily taxes fossil fuel generation (₱80/MWh), subsidizes rapid battery storage discharge, and awards generous eco-park carbon credits.',
    tariffPerMWh: 100,
    cleanCreditPerMWh: 42,
    fossilSurchargePerMWh: 80,
    maintenanceMultiplier: 0.90,
    blackoutPenaltyPerMWh: 320,
    surplusExportRatePerMWh: 30,
    ecoParkGrantHourly: 450,
    peakTariffMultiplier: 1.15,
    color: '#ec4899',
    iconName: 'Flame',
  },
};

export const ECONOMIC_ENGINE_LIST: EconomicEngine[] = Object.values(ECONOMIC_ENGINES);

export function getRandomEconomicEngine(excludeId?: EconomicEngineId): EconomicEngine {
  const pool = excludeId
    ? ECONOMIC_ENGINE_LIST.filter((e) => e.id !== excludeId)
    : ECONOMIC_ENGINE_LIST;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function getEconomicEngine(id?: EconomicEngineId): EconomicEngine {
  if (id && ECONOMIC_ENGINES[id]) {
    return ECONOMIC_ENGINES[id];
  }
  return ECONOMIC_ENGINES.green_tariff;
}

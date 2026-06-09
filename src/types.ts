export interface Metric {
  name: string;
  value: string;
}

export interface TechnicalIndicator {
  name: string;
  value: string;
  status: string;
}

export interface SupportResistance {
  support: number[];
  resistance: number[];
}

export interface TickerLevels {
  day: SupportResistance;
  week: SupportResistance;
  month: SupportResistance;
}

export interface ProfitTarget {
  name: string;
  price: number;
  probability: string;
}

export interface VolatilityAnalysis {
  annualVolatility: string;
  thirtyDayVolatility: string;
  riskLevel: string;
  stopLossRecommendation: number;
  volatilityExplanation: string;
  profitTargets: ProfitTarget[];
}

export interface FundamentalAnalysis {
  summary: string;
  metrics: Metric[];
  strengths: string[];
  headwinds: string[];
  healthScore: number;
}

export interface TechnicalAnalysis {
  summary: string;
  indicators: TechnicalIndicator[];
  rsi: number;
  macd: string;
  overallTrend: string;
}

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface EtfHolding {
  symbol: string;
  name: string;
  weight: string;
}

export interface EtfSectorAllocation {
  sector: string;
  weight: string;
}

export interface EtfChange {
  symbol: string;
  name: string;
  changeType: string;
  weightChange: string;
  details: string;
}

export interface EtfProfile {
  isEtf: boolean;
  fundObjective: string;
  expenseRatio: string;
  aum: string;
  dividendYield: string;
  netAssetValue: string;
  holdings: EtfHolding[];
  sectorAllocations: EtfSectorAllocation[];
  recentAllocationChanges?: EtfChange[];
}

export interface StockResearchData {
  ticker: string;
  companyName: string;
  currentPrice: number;
  lastUpdated: string;
  simulated?: boolean;
  errorFeedback?: string;
  fundamentalAnalysis: FundamentalAnalysis;
  technicalAnalysis: TechnicalAnalysis;
  levels: TickerLevels;
  volatilityAnalysis: VolatilityAnalysis;
  priceStream: PricePoint[];
  etfProfile?: EtfProfile; // Added optional ETF profile details
}

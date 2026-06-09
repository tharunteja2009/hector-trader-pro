import { VolatilityAnalysis } from "../types";
import { AlertTriangle, Percent, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { motion } from "motion/react";

interface RiskAnalysisProps {
  volatility: VolatilityAnalysis;
  currentPrice: number;
}

export default function RiskAnalysis({ volatility, currentPrice }: RiskAnalysisProps) {
  const {
    annualVolatility,
    thirtyDayVolatility,
    riskLevel,
    stopLossRecommendation,
    volatilityExplanation,
    profitTargets
  } = volatility;

  // Color mappings for risk levels
  const getRiskStyles = (risk: string) => {
    const r = risk.toLowerCase();
    if (r.includes("low")) {
      return { bg: "bg-emerald-500/5 text-emerald-400 border-emerald-500/10", accent: "text-emerald-400", text: "text-emerald-300" };
    } else if (r.includes("high") || r.includes("extreme")) {
      return { bg: "bg-rose-500/5 text-rose-400 border-rose-500/10", accent: "text-rose-400", text: "text-rose-350" };
    }
    return { bg: "bg-amber-500/5 text-amber-400 border-amber-500/10", accent: "text-amber-400", text: "text-amber-300" };
  };

  const riskStyles = getRiskStyles(riskLevel);

  return (
    <div className="bg-[#0F172A] rounded-sm border border-[#1E293B] p-6 shadow-md flex flex-col h-full" id="risk-analysis-card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-semibold text-lg text-[#E2E8F0]">Volatility & Profit Targets</h3>
          <p className="text-xs text-[#94A3B8]">Statistical risk/reward modeling driven by historic variance</p>
        </div>
        <div className={`px-2.5 py-1 rounded-sm text-xs font-bold border uppercase tracking-wider ${riskStyles.bg}`}>
          {riskLevel} Risk
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Volatility Metrics and explanation */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0A0C10] p-4 rounded-sm border border-[#1E293B]">
              <div className="flex items-center gap-1.5 text-[#64748B] text-[10px] uppercase font-bold tracking-wider mb-1">
                <Percent className="w-3.5 h-3.5 text-blue-500" />
                <span>30D Volatility</span>
              </div>
              <div className="text-xl font-mono font-bold text-[#E2E8F0]">{thirtyDayVolatility}</div>
            </div>

            <div className="bg-[#0A0C10] p-4 rounded-sm border border-[#1E293B]">
              <div className="flex items-center gap-1.5 text-[#64748B] text-[10px] uppercase font-bold tracking-wider mb-1">
                <Percent className="w-3.5 h-3.5 text-blue-500" />
                <span>Annual Volatility</span>
              </div>
              <div className="text-xl font-mono font-bold text-[#E2E8F0]">{annualVolatility}</div>
            </div>
          </div>

          <div className="bg-[#1E293B]/25 p-4 rounded-sm border border-[#334155]/30 text-xs flex gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#E2E8F0] block mb-1 uppercase tracking-wider text-[10px]">Statistical Methodology</span>
              <p className="text-[#94A3B8] leading-relaxed">{volatilityExplanation}</p>
            </div>
          </div>

          {/* Stop-loss Recommendation Alert */}
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-sm p-4 flex gap-3.5 items-center">
            <div className="p-2.5 bg-amber-500/10 rounded-sm shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400/85 uppercase font-bold font-mono tracking-widest">Recommended Stop Loss</span>
              <div className="text-xl font-mono font-bold text-[#E2E8F0] mt-0.5">${stopLossRecommendation.toFixed(2)}</div>
              <p className="text-[10px] text-[#64748B] mt-0.5">
                Set exactly <strong className="text-amber-400">{(((currentPrice - stopLossRecommendation) / currentPrice) * 100).toFixed(1)}%</strong> below current price to filter minor market noise.
              </p>
            </div>
          </div>
        </div>

        {/* Profit targets breakdown list */}
        <div className="flex flex-col justify-between">
          <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-3">Model-Derived Upside Targets</h4>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {profitTargets.map((target, idx) => {
              const upside = (((target.price - currentPrice) / currentPrice) * 100).toFixed(1);
              const isCons = target.name.toLowerCase().includes("conservative");
              const isMod = target.name.toLowerCase().includes("moderate");

              return (
                <div
                  key={idx}
                  className="p-3.5 border border-[#1E293B] hover:border-[#334155] transition-all rounded-sm shadow-md bg-[#0A0C10] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {/* Ring Indicator */}
                    <div className={`w-2.5 h-2.5 rounded-sm rotate-45 ${
                      isCons ? "bg-emerald-400" : isMod ? "bg-blue-400" : "bg-purple-400"
                    }`} />
                    <div>
                      <span className="font-bold text-xs text-[#E2E8F0] block">{target.name}</span>
                      <span className="text-[10px] text-[#64748B]">Likelihood probability: <strong className="text-[#94A3B8]">{target.probability}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-[#E2E8F0]">${target.price.toFixed(2)}</div>
                    <div className="text-[10px] text-emerald-400 flex items-center justify-end gap-0.5 font-bold">
                      <ArrowUpRight className="w-3" />
                      +{upside}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

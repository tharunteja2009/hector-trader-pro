import { useState } from "react";
import { TickerLevels } from "../types";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

interface LevelsMeterProps {
  levels: TickerLevels;
  currentPrice: number;
}

export default function LevelsMeter({ levels, currentPrice }: LevelsMeterProps) {
  const [activeTab, setActiveTab] = useState<"day" | "week" | "month">("day");

  const activeLevels = levels[activeTab];
  const { support, resistance } = activeLevels;

  // We have S2, S1, Current, R1, R2.
  // Let's sort them to find the min and max to draw the scale
  const s2 = support[1] || support[0] * 0.95;
  const s1 = support[0];
  const r1 = resistance[0];
  const r2 = resistance[1] || resistance[0] * 1.05;

  const minVal = s2 * 0.99;
  const maxVal = r2 * 1.01;
  const span = maxVal - minVal;

  const getPercent = (val: number) => {
    const pct = ((val - minVal) / span) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const currentPct = getPercent(currentPrice);
  const s1Pct = getPercent(s1);
  const s2Pct = getPercent(s2);
  const r1Pct = getPercent(r1);
  const r2Pct = getPercent(r2);

  return (
    <div className="bg-[#0F172A] rounded-sm border border-[#1E293B] p-6 shadow-md flex flex-col h-full" id="levels-meter-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg text-[#E2E8F0]">Support & Resistance</h3>
          <p className="text-xs text-[#94A3B8]">Boundary thresholds for breakouts and pullback triggers</p>
        </div>
        <div className="flex bg-[#0A0C10] p-1 rounded-sm border border-[#1E293B]">
          {(["day", "week", "month"] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-btn-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-sm capitalize transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#1E293B] text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main levels visualization meter */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 items-stretch min-h-[300px]">
        {/* Vertical Scale Meter */}
        <div className="w-full lg:w-48 flex flex-col justify-between py-2 relative h-[320px] bg-[#0A0C10] rounded-sm p-4 border border-[#1E293B] font-mono text-xs">
          {/* Background graduated line */}
          <div className="absolute left-[38px] top-6 bottom-6 w-1 bg-[#1E293B] rounded-sm overflow-hidden">
            {/* Resistance fill (Redtop) */}
            <div 
              style={{ bottom: `${r1Pct}%`, height: `${100 - r1Pct}%` }} 
              className="absolute w-full bg-rose-500/10"
            />
            {/* Support fill (Greendon) */}
            <div 
              style={{ height: `${s1Pct}%` }} 
              className="absolute left-0 bottom-0 w-full bg-emerald-500/10"
            />
          </div>

          {/* R2 Indicator */}
          <div 
            style={{ bottom: `${r2Pct}%` }}
            className="absolute left-10 transform -translate-y-1/2 flex items-center gap-2 group cursor-help"
            title="Resistance level 2 (Secondary Pivot)"
          >
            <div className="w-3 h-0.5 bg-rose-500" />
            <span className="text-[10px] text-rose-400 font-bold px-1 rounded-sm bg-rose-950/20 border border-rose-900/30">R2</span>
            <span className="font-bold text-[#E2E8F0]">${r2.toFixed(2)}</span>
          </div>

          {/* R1 Indicator */}
          <div 
            style={{ bottom: `${r1Pct}%` }}
            className="absolute left-10 transform -translate-y-1/2 flex items-center gap-2"
            title="Resistance level 1 (Primary Breakout Line)"
          >
            <div className="w-3 h-0.5 bg-rose-400" />
            <span className="text-[10px] text-rose-400 font-bold px-1 rounded-sm bg-rose-950/20 border border-rose-900/30">R1</span>
            <span className="font-bold text-[#94A3B8]">${r1.toFixed(2)}</span>
          </div>

          {/* S1 Indicator */}
          <div 
            style={{ bottom: `${s1Pct}%` }}
            className="absolute left-10 transform -translate-y-1/2 flex items-center gap-2"
            title="Support level 1 (Immediate Bounce Base)"
          >
            <div className="w-3 h-0.5 bg-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-bold px-1 rounded-sm bg-emerald-950/20 border border-emerald-900/30">S1</span>
            <span className="font-bold text-[#94A3B8]">${s1.toFixed(2)}</span>
          </div>

          {/* S2 Indicator */}
          <div 
            style={{ bottom: `${s2Pct}%` }}
            className="absolute left-10 transform -translate-y-1/2 flex items-center gap-2"
            title="Support level 2 (Major Floor Baseline)"
          >
            <div className="w-3 h-0.5 bg-emerald-500" />
            <span className="text-[10px] text-emerald-400 font-bold px-1 rounded-sm bg-emerald-950/20 border border-emerald-900/30">S2</span>
            <span className="font-bold text-[#E2E8F0]">${s2.toFixed(2)}</span>
          </div>

          {/* Floating Current Price Slider Badge */}
          <motion.div 
            style={{ bottom: `${currentPct}%` }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute left-8 transform -translate-y-1/2 flex items-center z-10"
          >
            <div className="w-3 h-3 bg-blue-500 rounded-sm rotate-45 border border-[#0A0C10] shadow flex items-center justify-center">
              <div className="w-1 h-1 bg-white" />
            </div>
            <div className="ml-1.5 bg-blue-600 text-white font-bold px-2 py-0.5 text-xs rounded-sm shadow-sm border border-blue-500">
              ${currentPrice.toFixed(2)}
            </div>
          </motion.div>
        </div>

        {/* Level Metrics Cards */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Resistance Column */}
            <div className="bg-rose-500/5 rounded-sm p-4 border border-rose-500/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-450 tracking-widest block">Resistance Target</span>
                <div className="text-2xl font-mono font-bold text-rose-400 mt-1">${r1.toFixed(2)}</div>
                <div className="text-xs text-[#64748B] font-mono mt-0.5">Slightly below R2 (${r2.toFixed(2)})</div>
              </div>
              <div className="flex items-center gap-1.5 text-rose-300 text-xs mt-3 bg-[#0A0C10] px-2.5 py-1.5 rounded-sm border border-rose-950/35 w-fit font-mono">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Upside: {(((r1 - currentPrice) / currentPrice) * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Support Column */}
            <div className="bg-emerald-500/5 rounded-sm p-4 border border-emerald-500/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-450 tracking-widest block">Immediate Floor</span>
                <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">${s1.toFixed(2)}</div>
                <div className="text-xs text-[#64748B] font-mono mt-0.5">Solid baseline S2 (${s2.toFixed(2)})</div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs mt-3 bg-[#0A0C10] px-2.5 py-1.5 rounded-sm border border-emerald-950/35 w-fit font-mono">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Downside: {(((currentPrice - s1) / currentPrice) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Quick Commentary Card */}
          <div className="bg-[#0A0C10] rounded-sm p-4 border border-[#1E293B] text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-4 h-4 text-blue-550" />
              <span className="font-bold text-[#E2E8F0] uppercase tracking-wider text-[11px]">Level Guidance</span>
            </div>
            {currentPrice > r1 ? (
              <p>The asset has broken above resistance <strong className="text-rose-400 font-bold">R1</strong>. This suggests strong momentum, paving the path to <strong className="text-rose-300">R2</strong>. Watch out for potential overextended pullbacks.</p>
            ) : currentPrice < s1 ? (
              <p>Trading below immediate support <strong className="text-emerald-400 font-bold">S1</strong>. If volume rises, prices could drift to major floor <strong className="text-emerald-300">S2</strong>. A great value zone for potential bounce confirmation.</p>
            ) : (
              <p>Currently consolidating inside bounds. It has safe breathing room of <strong className="text-emerald-400 font-bold">{(((currentPrice - s1)/currentPrice)*100).toFixed(1)}%</strong> down to support floor, and faces resistance hurdle <strong className="text-rose-400 font-bold">{(((r1 - currentPrice)/currentPrice)*100).toFixed(1)}%</strong> above.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

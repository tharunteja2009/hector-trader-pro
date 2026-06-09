import { useState } from "react";
import { FundamentalAnalysis, TechnicalAnalysis, EtfProfile } from "../types";
import { CheckCircle2, AlertTriangle, ChartBar, Compass, HeartPulse, PieChart, Layers, DollarSign, Percent, Award } from "lucide-react";

interface MetricsPanelProps {
  fundamental: FundamentalAnalysis;
  technical: TechnicalAnalysis;
  etfProfile?: EtfProfile;
}

export default function MetricsPanel({ fundamental, technical, etfProfile }: MetricsPanelProps) {
  const [tab, setTab] = useState<"fundamental" | "technical">("fundamental");
  const [etfSubTab, setEtfSubTab] = useState<"holdings" | "sectors">("holdings");

  const isEtf = etfProfile?.isEtf || false;

  return (
    <div className="bg-[#0F172A] rounded-sm border border-[#1E293B] p-6 shadow-md flex flex-col h-full" id="metrics-panel-card">
      {/* Toggles */}
      <div className="flex border-b border-[#1E293B] mb-6 gap-6">
        <button
          onClick={() => setTab("fundamental")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            tab === "fundamental"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-[#64748B] hover:text-[#94A3B8]"
          }`}
          id="btn-fundamental-tab"
        >
          <ChartBar className="w-4 h-4" />
          {isEtf ? "Fund Overview" : "Fundamental Context"}
        </button>
        <button
          onClick={() => setTab("technical")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            tab === "technical"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-[#64748B] hover:text-[#94A3B8]"
          }`}
          id="btn-technical-tab"
        >
          <Compass className="w-4 h-4" />
          Technical Setup
        </button>
      </div>

      {tab === "fundamental" ? (
        isEtf && etfProfile ? (
          // UNIQUE HIGH-FIDELITY ETF FUNDAMENTAL PROFILE INTERFACE
          <div className="space-y-6 flex-1 flex flex-col justify-between" id="etf-fundamental-section">
            {/* Top Overview: Objective + Quick Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-[#0A0C10] rounded-sm p-5 border border-[#1E293B]">
              <div className="flex flex-col items-center justify-center p-3 text-center border-b md:border-b-0 md:border-r border-[#1E293B]">
                <HeartPulse className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Business Health</span>
                <div className="text-xl font-mono font-bold mt-2 text-[#94A3B8] uppercase">
                  N/A
                </div>
                <div className="mt-2 px-2 py-0.5 rounded-sm text-[8px] font-bold tracking-wider uppercase bg-[#1E293B] text-[#94A3B8] border border-[#334155]/40 text-center">
                  Diversified Asset
                </div>
              </div>

              <div className="md:col-span-2 text-[#94A3B8] text-xs leading-relaxed">
                <span className="font-bold text-blue-400 block mb-1.5 uppercase tracking-wider text-[10px]">Fund Investment Objective</span>
                <p className="text-[#E2E8F0] leading-relaxed mb-3">{etfProfile.fundObjective}</p>
                <div className="text-[10px] text-[#64748B] bg-blue-500/5 px-2.5 py-1.5 rounded-sm border border-blue-500/10 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    Note: Corporate Health Rating is marked <strong className="text-amber-500 font-mono">N/A</strong> because ETFs list index-pooled baskets instead of direct individual balance sheets.
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Grid: stats figures & holdings list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
              {/* Left Column: Fund Figures & Metrics Table */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-3">Key Fund Figures</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0A0C10] p-3 rounded-sm border border-[#1E293B] flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-blue-500/5 border border-blue-500/10 text-blue-400">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider block">Net Asset Value</span>
                        <span className="text-sm font-mono font-bold text-[#E2E8F0]">{etfProfile.netAssetValue}</span>
                      </div>
                    </div>
                    <div className="bg-[#0A0C10] p-3 rounded-sm border border-[#1E293B] flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-purple-500/5 border border-purple-500/10 text-purple-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider block">Total AUM</span>
                        <span className="text-sm font-mono font-bold text-[#E2E8F0]">{etfProfile.aum}</span>
                      </div>
                    </div>
                    <div className="bg-[#0A0C10] p-3 rounded-sm border border-[#1E293B] flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-rose-500/5 border border-rose-500/10 text-rose-400">
                        <Percent className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider block">Expense Ratio</span>
                        <span className="text-sm font-mono font-bold text-rose-400">{etfProfile.expenseRatio}</span>
                      </div>
                    </div>
                    <div className="bg-[#0A0C10] p-3 rounded-sm border border-[#1E293B] flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider block">Dividend Yield</span>
                        <span className="text-sm font-mono font-bold text-[#E2E8F0]">{etfProfile.dividendYield}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-2.5">Corporate Rate Overrides [ETF Checked]</h4>
                  <div className="border border-[#1E293B]/60 rounded-sm overflow-hidden bg-[#0A0C10]/40">
                    <table className="w-full text-xs text-left">
                      <tbody className="divide-y divide-[#1E293B]/50 font-mono text-[#94A3B8]">
                        {fundamental.metrics.map((m, idx) => (
                          <tr key={idx} className="hover:bg-[#1E293B]/20 transition-colors">
                            <td className="px-4 py-2 font-sans font-medium text-[#64748B]">{m.name}</td>
                            <td className={`px-4 py-2 text-right font-bold ${m.value.includes("Not Applicable") ? "text-amber-500/70 font-mono text-[10px]" : "text-[#E2E8F0]"}`}>
                              {m.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Holdings Allocations vs Sector Allocations Toggles */}
              <div className="flex flex-col h-full bg-[#0A0C10] p-5 rounded-sm border border-[#1E293B]">
                <div className="flex justify-between items-center pb-3 border-b border-[#1E293B] mb-4">
                  <h4 className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider flex items-center gap-1.5">
                    {etfSubTab === "holdings" ? <Layers className="w-4 h-4 text-blue-400" /> : <PieChart className="w-4 h-4 text-purple-400" />}
                    {etfSubTab === "holdings" ? "Basket Allocations" : "Sector Distributions"}
                  </h4>

                  <div className="flex gap-1.5 p-1 bg-[#0F172A] border border-[#1E293B] rounded-sm">
                    <button
                      onClick={() => setEtfSubTab("holdings")}
                      className={`px-2 py-1 text-[9px] font-bold uppercase rounded-sm transition-all cursor-pointer ${
                        etfSubTab === "holdings" ? "bg-blue-600 text-white" : "text-[#64748B] hover:text-[#94A3B8]"
                      }`}
                    >
                      Constituents
                    </button>
                    <button
                      onClick={() => setEtfSubTab("sectors")}
                      className={`px-2 py-1 text-[9px] font-bold uppercase rounded-sm transition-all cursor-pointer ${
                        etfSubTab === "sectors" ? "bg-blue-600 text-white" : "text-[#64748B] hover:text-[#94A3B8]"
                      }`}
                    >
                      Sectors
                    </button>
                  </div>
                </div>

                {etfSubTab === "holdings" ? (
                  <div className="space-y-3.5 flex-1 max-h-[280px] overflow-y-auto pr-1">
                    {etfProfile.holdings.length === 0 ? (
                      <p className="text-xs text-[#64748B] italic text-center py-8">No constituent details available.</p>
                    ) : (
                      etfProfile.holdings.map((h, idx) => {
                        const numericWeight = parseFloat(h.weight) || 5;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-baseline text-xs text-[#E2E8F0]">
                              <div className="flex gap-2 items-center">
                                <span className="font-mono text-[9px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/25 px-1 rounded-sm">
                                  {h.symbol}
                                </span>
                                <span className="font-medium text-[11px] text-[#94A3B8] truncate max-w-[150px] md:max-w-xs">{h.name}</span>
                              </div>
                              <span className="font-mono font-bold text-[11px] text-blue-400">{h.weight}</span>
                            </div>
                            <div className="w-full bg-[#1E293B]/60 h-1.5 rounded-sm overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-sm" style={{ width: `${numericWeight * 5.5}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="space-y-3.5 flex-1 max-h-[280px] overflow-y-auto pr-1">
                    {etfProfile.sectorAllocations.length === 0 ? (
                      <p className="text-xs text-[#64748B] italic text-center py-8">No sector configuration details available.</p>
                    ) : (
                      etfProfile.sectorAllocations.map((sec, idx) => {
                        const numericWeight = parseFloat(sec.weight) || 10;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-baseline text-xs text-[#E2E8F0]">
                              <span className="font-sans font-medium text-[11px] text-[#94A3B8]">{sec.sector}</span>
                              <span className="font-mono font-bold text-[11px] text-purple-400">{sec.weight}</span>
                            </div>
                            <div className="w-full bg-[#1E293B]/60 h-1.5 rounded-sm overflow-hidden">
                              <div className="bg-purple-500 h-full rounded-sm" style={{ width: `${numericWeight}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // ORIGINAL STABLE HIGH-FIDELITY STOCK FUNDAMENTAL PROFILE INTERFACE
          <div className="space-y-6 flex-1 flex flex-col justify-between" id="fundamental-section">
            {/* Business Health Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-[#0A0C10] rounded-sm p-5 border border-[#1E293B]">
              <div className="flex flex-col items-center justify-center p-3 text-center border-b md:border-b-0 md:border-r border-[#1E293B]">
                <HeartPulse className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Health Score</span>
                <div className="text-3xl font-mono font-bold mt-2 text-[#E2E8F0] flex items-baseline gap-1">
                  {fundamental.healthScore}
                  <span className="text-xs text-[#64748B] font-normal">/100</span>
                </div>
                <div className="mt-2 px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-wider uppercase bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                  {fundamental.healthScore >= 80 ? "Premium Grade" : fundamental.healthScore >= 60 ? "Investment Grade" : "Speculative"}
                </div>
              </div>

              <div className="md:col-span-2 text-[#94A3B8] text-xs leading-relaxed">
                <span className="font-bold text-[#E2E8F0] block mb-1 uppercase tracking-wider text-[10px]">Fundamental Summary</span>
                {fundamental.summary}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
              {/* Core Metrics Table */}
              <div>
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-3">Key Corporate Rates</h4>
                <div className="border border-[#1E293B] rounded-sm overflow-hidden bg-[#0A0C10]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#0F172A] border-b border-[#1E293B] text-[10px] text-[#64748B] uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Metric</th>
                        <th className="px-4 py-2.5 text-right font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] font-mono text-[#94A3B8]">
                      {fundamental.metrics.map((m, idx) => (
                        <tr key={idx} className="hover:bg-[#1E293B]/40 transition-colors">
                          <td className="px-4 py-2.5 text-[#94A3B8] font-sans font-medium">{m.name}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-[#E2E8F0]">{m.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Economic Moat vs Headwinds */}
              <div className="space-y-4">
                {/* Strengths */}
                <div>
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-2.5">Economic Strengths / Moat</h4>
                  <ul className="space-y-2">
                    {fundamental.strengths.map((str, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start text-xs text-[#94A3B8]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Headwinds */}
                <div>
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-2.5">Challenges & Headwinds</h4>
                  <ul className="space-y-2">
                    {fundamental.headwinds.map((head, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start text-xs text-[#94A3B8]">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 opacity-80" />
                        <span>{head}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-6 flex-1 flex flex-col justify-between" id="technical-section">
          {/* Technical Summary */}
          <div className="bg-[#0A0C10] rounded-sm p-5 border border-[#1E293B] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="flex flex-col items-center justify-center p-3 text-center border-b md:border-b-0 md:border-r border-[#1E293B]">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Stance</span>
              <div className="text-lg font-mono font-bold mt-1.5 text-[#E2E8F0] uppercase tracking-wider">
                {technical.overallTrend}
              </div>
              <div className="mt-2 text-[10px] text-[#94A3B8] font-mono">
                RSI (14D): <strong className="text-[#E2E8F0]">{technical.rsi}</strong>
              </div>
            </div>

            <div className="md:col-span-2 text-[#94A3B8] text-xs leading-relaxed">
              <span className="font-bold text-[#E2E8F0] block mb-1 uppercase tracking-wider text-[10px]">Technical Setup Summary</span>
              {technical.summary}
            </div>
          </div>

          {/* Indicators Table */}
          <div className="mt-2">
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-3">Key Technical Indicators</h4>
            <div className="border border-[#1E293B] rounded-sm overflow-hidden bg-[#0A0C10]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0F172A] border-b border-[#1E293B] text-[10px] text-[#64748B] uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Indicator Name</th>
                    <th className="px-4 py-2.5 font-medium">Value / Setting</th>
                    <th className="px-4 py-2.5 text-right font-medium">Signal/Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] font-mono text-[#94A3B8]">
                  {technical.indicators.map((ind, idx) => (
                    <tr key={idx} className="hover:bg-[#1E293B]/40 transition-colors">
                      <td className="px-4 py-2.5 text-[#94A3B8] font-sans font-medium">{ind.name}</td>
                      <td className="px-4 py-2.5 text-[#E2E8F0]">{ind.value}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider uppercase ${
                          ind.status.toLowerCase().includes("bullish") || ind.status.toLowerCase().includes("above") || ind.status.toLowerCase().includes("oversold")
                            ? "bg-emerald-500/5 text-emerald-400 border border-emerald-500/10"
                            : ind.status.toLowerCase().includes("bearish") || ind.status.toLowerCase().includes("below") || ind.status.toLowerCase().includes("overbought")
                            ? "bg-rose-500/5 text-rose-400 border border-rose-500/10"
                            : "bg-[#1E293B] text-[#94A3B8] border border-[#334155]"
                        }`}>
                          {ind.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

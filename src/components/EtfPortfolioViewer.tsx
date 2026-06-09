import { useState } from "react";
import { EtfProfile } from "../types";
import { 
  Building2, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Info, 
  DollarSign, 
  Layers2, 
  Percent, 
  TrendingUp, 
  TrendingDown, 
  Briefcase 
} from "lucide-react";

interface EtfPortfolioViewerProps {
  etfProfile?: EtfProfile;
  ticker: string;
}

export default function EtfPortfolioViewer({ etfProfile, ticker }: EtfPortfolioViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!etfProfile || !etfProfile.isEtf) {
    return (
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-8 text-center text-[#64748B] font-mono text-sm">
        No active ETF Profile loaded. This asset may be treated as a single corporate equity.
      </div>
    );
  }

  // Filter holdings based on search term
  const filteredHoldings = etfProfile.holdings.filter(
    h => h.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
         h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]" id="etf-portfolio-tab-viewer">
      
      {/* 1. Header Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Assets Under Management */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-sm flex items-center gap-4 hover:border-[#334155] transition-colors">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-mono font-bold uppercase tracking-wider block">Total AUM</span>
            <span className="text-lg font-mono font-bold text-white">{etfProfile.aum}</span>
          </div>
        </div>

        {/* Expense Ratio */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-sm flex items-center gap-4 hover:border-[#334155] transition-colors">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-sm">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-mono font-bold uppercase tracking-wider block">Expense Ratio</span>
            <span className="text-lg font-mono font-bold text-rose-400">{etfProfile.expenseRatio}</span>
          </div>
        </div>

        {/* Net Asset Value */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-sm flex items-center gap-4 hover:border-[#334155] transition-colors">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-sm">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-mono font-bold uppercase tracking-wider block">Net Asset Value (NAV)</span>
            <span className="text-lg font-mono font-bold text-emerald-400">{etfProfile.netAssetValue}</span>
          </div>
        </div>

        {/* Yield */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-sm flex items-center gap-4 hover:border-[#334155] transition-colors">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-mono font-bold uppercase tracking-wider block">Dividend Yield</span>
            <span className="text-lg font-mono font-bold text-purple-400">{etfProfile.dividendYield}</span>
          </div>
        </div>

      </div>

      {/* INVESTMENT OBJECTIVE BRIEF */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-sm flex gap-4 items-start">
        <div className="p-1.5 bg-[#1E293B] rounded-sm text-blue-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-[#94A3B8] leading-relaxed">
          <span className="font-bold text-white mr-1.5">{ticker} Investment Mandate:</span>
          {etfProfile.fundObjective}
        </div>
      </div>

      {/* 2. Core Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Holdings portfolio & progress */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-sm flex flex-col h-full" id="etf-left-holdings-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1E293B] gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                Portfolio Constituents
              </h3>
              <p className="text-[10px] text-[#64748B] mt-0.5">Top primary underlying allocations & active weights</p>
            </div>

            {/* Search Input Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0A0C10] border border-[#1E293B] text-xs px-8 py-1.5 rounded-sm text-white focus:outline-none focus:border-blue-500 w-full sm:w-44 font-sans"
              />
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="space-y-4 flex-1 h-[420px] overflow-y-auto pr-1">
            {filteredHoldings.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#64748B] italic">
                No matching holdings found for "{searchTerm}".
              </div>
            ) : (
              filteredHoldings.map((h, index) => {
                const weightNum = parseFloat(h.weight) || 3.0;
                // Relative width calculation (e.g. assume max weight is around 15%)
                const progressPercent = Math.min(100, (weightNum / 15) * 100);

                return (
                  <div key={index} className="space-y-1.5 bg-[#0A0C10]/40 p-3 rounded-sm border border-[#1E293B]/40 hover:border-[#1E293B] transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-sm">
                          {h.symbol}
                        </span>
                        <span className="font-medium text-white text-[11px] truncate max-w-[180px] sm:max-w-xs">{h.name}</span>
                      </div>
                      <span className="font-mono font-bold text-[11px] text-blue-400">{h.weight}</span>
                    </div>
                    {/* Visual Segmented Progress Bar */}
                    <div className="w-full bg-[#1E293B]/50 h-2 rounded-sm overflow-hidden p-px">
                      <div 
                        className="bg-blue-500 h-full rounded-sm transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Major recent shifts and allocation modifications */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-sm flex flex-col h-full" id="etf-right-changes-panel">
          <div className="pb-4 border-b border-[#1E293B] mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers2 className="w-4 h-4 text-purple-400" />
              Recent Portfolio Changes & Manager Actions
            </h3>
            <p className="text-[10px] text-[#64748B] mt-0.5">Factual rebalancings, trims, and additions (last 30-90 days)</p>
          </div>

          <div className="space-y-4 flex-1 h-[420px] overflow-y-auto pr-1">
            {!etfProfile.recentAllocationChanges || etfProfile.recentAllocationChanges.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#64748B] italic">
                No recent portfolio allocation changes available for this fund model.
              </div>
            ) : (
              etfProfile.recentAllocationChanges.map((change, index) => {
                const isPositive = change.changeType.toLowerCase().includes("added") || 
                                   change.changeType.toLowerCase().includes("increased") || 
                                   change.weightChange.startsWith("+");
                
                return (
                  <div 
                    key={index} 
                    className="bg-[#0A0C10] p-4 rounded-sm border border-[#1E293B] hover:border-[#334155] transition-all flex flex-col gap-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-sm">
                          {change.symbol}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                          {change.name}
                        </h4>
                      </div>
                      
                      {/* Change badges */}
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className={`px-2 py-0.5 rounded-sm font-bold ${
                          isPositive 
                            ? "bg-emerald-500/5 text-emerald-400 border border-emerald-500/10" 
                            : "bg-rose-500/5 text-rose-400 border border-rose-500/10"
                        }`}>
                          {change.changeType}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-sm font-mono font-bold flex items-center gap-0.5 ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {change.weightChange}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#94A3B8] leading-relaxed border-t border-[#1E293B]/60 pt-2 font-sans">
                      {change.details}
                    </p>
                  </div>
                );
              })
            )}

            {/* General Information Insight footer */}
            <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-sm text-[10px] text-[#94A3B8] leading-relaxed flex gap-2">
              <Info className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Allocation Rotation Insight:</strong> Active managers or target trackers rotate weights based on recent daily liquidity, tracking indices, systematic sector rebalancing cycles, or corporate equity flow. Check SEC N-PORT quarterly filings or daily fund receipts for exhaustive tracking.
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* 3. Auxiliary Sector Allocations breakdown panel */}
      {etfProfile.sectorAllocations && etfProfile.sectorAllocations.length > 0 && (
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-sm">
          <div className="pb-3 border-b border-[#1E293B] mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Fund Sector Allocations Breakdown
            </h3>
            <p className="text-[10px] text-[#64748B] mt-0.5">Top industry concentrates across the constituent basket</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {etfProfile.sectorAllocations.map((sec, index) => {
              const weightNum = parseFloat(sec.weight) || 10;
              return (
                <div key={index} className="bg-[#0A0C10] p-3 rounded-sm border border-[#1E293B] hover:border-[#1E293B]*2 flex flex-col justify-between gap-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#94A3B8] font-medium truncate max-w-[160px]">{sec.sector}</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{sec.weight}</span>
                  </div>
                  <div className="w-full bg-[#1E293B]/40 h-1.5 rounded-sm overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-sm" 
                      style={{ width: `${weightNum}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

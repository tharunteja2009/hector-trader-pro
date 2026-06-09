import { useState, useEffect, FormEvent } from "react";
import { Briefcase, Plus, Trash2, TrendingUp, TrendingDown, Sparkles, ShieldCheck, ShieldAlert, Activity, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockResearchData } from "../types";

interface Holding {
  id: string;
  symbol: string;
  purchasePrice: number;
  quantity: number;
  currentPrice: number;
  fundamentalSummary?: string;
  technicalTrend?: string;
  healthScore?: number;
  isEtf?: boolean;
}

interface PortfolioInsights {
  summary: string;
  allocationAdvice: string;
  opportunities: string[];
  risks: string[];
  simulated?: boolean;
  errorFeedback?: string;
}

interface PortfolioTrackerProps {
  onSelectTicker: (symbol: string) => void;
  activeTickerData: StockResearchData | null;
}

export default function PortfolioTracker({ onSelectTicker, activeTickerData }: PortfolioTrackerProps) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [symbolInput, setSymbolInput] = useState<string>("");
  const [purchasePriceInput, setPurchasePriceInput] = useState<string>("");
  const [quantityInput, setQuantityInput] = useState<string>("");
  
  const [insights, setInsights] = useState<PortfolioInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);
  const [isSyncingPrices, setIsSyncingPrices] = useState<boolean>(false);

  // 1. Initial Load of Holdings from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("alpha_portfolio_holdings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHoldings(parsed);
      } catch (err) {
        setHoldings([]);
      }
    }
  }, []);

  // Sync holdings back to local storage
  const saveHoldings = (newHoldings: Holding[]) => {
    setHoldings(newHoldings);
    localStorage.setItem("alpha_portfolio_holdings", JSON.stringify(newHoldings));
  };

  // 2. Fetch Latest Prices and Data for Holdings
  const syncLatestPrices = async (targetHoldings: Holding[]) => {
    if (targetHoldings.length === 0) {
      setInsights(null);
      return;
    }
    
    setIsSyncingPrices(true);
    const updated = [...targetHoldings];
    
    try {
      // Fetch latest research for each unique stock in parallel
      const uniqueSymbols = Array.from(new Set(updated.map(h => h.symbol.toUpperCase())));
      
      const resultsMap = new Map<string, StockResearchData>();
      
      await Promise.all(
        uniqueSymbols.map(async (symbol) => {
          try {
            // Note: If the active ticker is already loaded, we can skip fetching or fetch anyway to be fresh
            if (activeTickerData && activeTickerData.ticker === symbol) {
              resultsMap.set(symbol, activeTickerData);
            } else {
              const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticker: symbol }),
              });
              if (res.ok) {
                const data = await res.json();
                resultsMap.set(symbol, data);
              }
            }
          } catch (err) {
            console.error(`Sync failure for ${symbol}:`, err);
          }
        })
      );

      // Re-map holding live prices & indicators
      const finalHoldings = updated.map(h => {
        const live = resultsMap.get(h.symbol.toUpperCase());
        if (live) {
          return {
            ...h,
            currentPrice: live.currentPrice,
            fundamentalSummary: live.fundamentalAnalysis.summary,
            technicalTrend: live.technicalAnalysis.overallTrend,
            healthScore: live.fundamentalAnalysis.healthScore,
            isEtf: live.etfProfile?.isEtf || false
          };
        }
        return h;
      });

      setHoldings(finalHoldings);
      localStorage.setItem("alpha_portfolio_holdings", JSON.stringify(finalHoldings));
      
      // Now fetch aggregate portfolio insights
      fetchPortfolioInsights(finalHoldings);
    } catch (err) {
      console.error("Error matching tickers", err);
    } finally {
      setIsSyncingPrices(false);
    }
  };

  // Whenever holdings set is initialized or changed by user adding/removing, sync prices periodically
  useEffect(() => {
    if (holdings.length > 0 && holdings.every(h => h.currentPrice === h.purchasePrice)) {
      syncLatestPrices(holdings);
    }
  }, [holdings.length]);

  // 3. Fetch Portfolio Aggregated Insights via server API
  const fetchPortfolioInsights = async (activeHoldings: Holding[]) => {
    if (activeHoldings.length === 0) {
      setInsights(null);
      return;
    }
    
    setIsLoadingInsights(true);
    try {
      const res = await fetch("/api/portfolio-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings: activeHoldings }),
      });

      if (res.ok) {
        const insightResult = await res.json();
        setInsights(insightResult);
      }
    } catch (err) {
      console.error("Failed to generate portfolio summaries", err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Add position handler
  const handleAddPosition = async (e: FormEvent) => {
    e.preventDefault();
    const symbol = symbolInput.toUpperCase().trim();
    const price = parseFloat(purchasePriceInput);
    const qty = parseFloat(quantityInput);

    if (!symbol || isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) return;

    // Use default values temporarily, will be immediately synchronized
    const newHolding: Holding = {
      id: Date.now().toString(),
      symbol,
      purchasePrice: price,
      quantity: qty,
      currentPrice: price, // fallback
    };

    const nextHoldings = [...holdings, newHolding];
    saveHoldings(nextHoldings);
    
    setSymbolInput("");
    setPurchasePriceInput("");
    setQuantityInput("");

    // Trigger price and metrics sync immediately
    syncLatestPrices(nextHoldings);
  };

  const handleRemovePosition = (id: string) => {
    const nextHoldings = holdings.filter(h => h.id !== id);
    saveHoldings(nextHoldings);
    syncLatestPrices(nextHoldings);
  };

  // Calculate Aggregated Metrics
  const totalCost = holdings.reduce((sum, h) => sum + h.purchasePrice * h.quantity, 0);
  const totalValue = holdings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
  const totalGainLoss = totalValue - totalCost;
  const gainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  
  // Weighted Health Score calculation
  const validHoldingsWithScores = holdings.filter(h => h.healthScore !== undefined);
  const totalValueWithScores = validHoldingsWithScores.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
  const weightedHealthScore = totalValueWithScores > 0 
    ? validHoldingsWithScores.reduce((sum, h) => sum + (h.healthScore || 0) * (h.currentPrice * h.quantity), 0) / totalValueWithScores
    : 0;

  return (
    <div className="space-y-8" id="portfolio-component">
      
      {/* Upper Grid: Position adding form & Total Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Form panel */}
        <section className="xl:col-span-4 bg-[#0F172A] rounded-sm border border-[#1E293B] p-6 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-[#E2E8F0] text-base flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-blue-500" />
              Add holding position
            </h3>
            <p className="text-xs text-[#64748B] mb-5">Input stock buy limits to monitor unrealized quantitative variances</p>

            <form onSubmit={handleAddPosition} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#64748B] font-bold block mb-1">Ticker Symbol</label>
                <input
                  type="text"
                  placeholder="E.g., AAPL, TSLA, BTC-USD"
                  value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value)}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-sm px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#64748B] font-bold block mb-1">Buy Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="182.50"
                    value={purchasePriceInput}
                    onChange={(e) => setPurchasePriceInput(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-sm px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#64748B] font-bold block mb-1">Shares Qty</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="15"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-sm px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#64748B] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add to Portfolio
              </button>
            </form>
          </div>

          <button
            onClick={() => syncLatestPrices(holdings)}
            disabled={isSyncingPrices || holdings.length === 0}
            className="mt-6 border border-[#1E293B] hover:border-[#334155] bg-[#0A0C10] text-[#94A3B8] hover:text-[#E2E8F0] font-bold text-[10px] py-2 rounded-sm uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Activity className={`w-3.5 h-3.5 text-blue-500 ${isSyncingPrices ? "animate-spin" : ""}`} />
            {isSyncingPrices ? "Syncing..." : "Sync Live Positions"}
          </button>
        </section>

        {/* Aggregate Value / Profit stats panel */}
        <section className="xl:col-span-8 bg-[#0F172A] rounded-sm border border-[#1E293B] p-6 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-[#E2E8F0] text-base mb-1">Portfolio Summary & Values</h3>
            <p className="text-xs text-[#64748B] mb-5">Aggregated investment weights and quantitative overview metrics</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="bg-[#0A0C10] p-4 rounded-sm border border-[#1E293B]">
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest block">Total Portfolio Value</span>
                <span className="text-3xl font-mono font-bold text-[#E2E8F0] block mt-1.5">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#64748B] font-mono mt-1 block">Cost Basis: ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>

              <div className="bg-[#0A0C10] p-4 rounded-sm border border-[#1E293B]">
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest block">Unrealized gains / losses</span>
                <div className={`text-3xl font-mono font-bold mt-1.5 flex items-center gap-1.5 ${totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {totalGainLoss >= 0 ? <TrendingUp className="w-5 h-5 shrink-0" /> : <TrendingDown className="w-5 h-5 shrink-0" />}
                  <span>{totalGainLoss >= 0 ? "+" : ""}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <span className={`text-[10px] font-bold mt-1 block ${totalGainLoss >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {totalGainLoss >= 0 ? "▲" : "▼"} {gainLossPercentage.toFixed(2)}% Performance
                </span>
              </div>

              <div className="bg-[#0A0C10] p-4 rounded-sm border border-[#1E293B]">
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest block">Aggregated Asset Health</span>
                <span className="text-3xl font-mono font-bold text-blue-400 block mt-1.5">
                  {weightedHealthScore > 0 ? `${weightedHealthScore.toFixed(0)}/100` : "N/A"}
                </span>
                <div className="mt-1 px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-wider uppercase bg-blue-500/5 text-blue-400 border border-blue-500/10 w-fit">
                  {weightedHealthScore >= 80 ? "Premium Grade" : weightedHealthScore >= 60 ? "Investment Grade" : weightedHealthScore > 0 ? "Speculative Grade" : "No Assets"}
                </div>
              </div>

            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-[#1E293B]/70 pt-4 text-[10px] text-[#64748B] font-mono">
            <span>HOLDINGS COUNT: {holdings.length} Positions</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Fully aggregated across client datasets
            </span>
          </div>
        </section>

      </div>

      {/* Main Row: Holdings Table */}
      <section className="bg-[#0F172A] rounded-sm border border-[#1E293B] p-6 shadow-md">
        <h3 className="font-display font-semibold text-[#E2E8F0] text-base mb-1">Active Positions Tracker</h3>
        <p className="text-xs text-[#64748B] mb-5">Select a holding position to quick-load full corporate due-diligence analysis</p>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0A0C10] border-b border-[#1E293B] text-[10px] text-[#64748B] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Avg Cost</th>
                <th className="px-4 py-3 text-right font-medium">Real-time Trade</th>
                <th className="px-4 py-3 text-right font-medium">Total Cost</th>
                <th className="px-4 py-3 text-right font-medium">Total value</th>
                <th className="px-4 py-3 text-right font-medium">Unrealized P&L</th>
                <th className="px-4 py-3 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] font-mono text-[#94A3B8]">
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-[#64748B] font-sans">
                    No open positions tracking in portfolio ledger.
                  </td>
                </tr>
              ) : (
                holdings.map((h) => {
                  const itemCost = h.purchasePrice * h.quantity;
                  const itemVal = h.currentPrice * h.quantity;
                  const itemPL = itemVal - itemCost;
                  const itemPLPct = itemCost > 0 ? (itemPL / itemCost) * 100 : 0;
                  
                  return (
                    <tr key={h.id} className="hover:bg-[#1E293B]/20 transition-colors">
                      <td className="px-4 py-3.5 text-[#E2E8F0] font-sans font-bold flex items-center gap-2">
                        <button
                          onClick={() => onSelectTicker(h.symbol)}
                          className="hover:text-blue-400 font-mono text-left bg-transparent border-none cursor-pointer p-0 underline decoration-blue-500 decoration-dotted underline-offset-4 focus:outline-none"
                        >
                          {h.symbol}
                        </button>
                        {h.isEtf ? (
                          <span className="text-[9px] font-mono border border-blue-500/25 bg-blue-500/5 text-blue-400 px-1.5 py-0.5 rounded-sm font-bold uppercase">
                            ETF
                          </span>
                        ) : h.healthScore !== undefined ? (
                          <span className="text-[9px] font-mono border border-[#1E293B] bg-[#0A0C10] text-[#E2E8F0] px-1.5 py-0.5 rounded-sm">
                            H:{h.healthScore}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 text-right">{h.quantity.toLocaleString(undefined, { maximumFractionDigits: 3 })}</td>
                      <td className="px-4 py-3.5 text-right">${h.purchasePrice.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-right text-[#E2E8F0] font-bold">${h.currentPrice.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-right">${itemCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3.5 text-right text-[#E2E8F0]">${itemVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`px-4 py-3.5 text-right font-bold ${itemPL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        <div>{itemPL >= 0 ? "+" : ""}${itemPL.toFixed(2)}</div>
                        <div className="text-[10px] font-semibold opacity-90">{itemPL >= 0 ? "▲" : "▼"}{itemPLPct.toFixed(1)}%</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleRemovePosition(h.id)}
                          className="text-[#64748B] hover:text-rose-400 p-1 rounded-sm hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 cursor-pointer transition-colors"
                          title="Delete holding"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Aggregate due diligence insight advisory card */}
      <section className="bg-[#0F172A] rounded-sm border border-[#1E293B] p-6 shadow-md" id="portfolio-insights-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-display font-semibold text-[#E2E8F0] text-base mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Quant Portfolio Advisor
            </h3>
            <p className="text-xs text-[#64748B]">Gemini aggregate risk summaries and diversification directives</p>
          </div>
          {insights && insights.simulated && (
            <div className="flex flex-col sm:items-end gap-1">
              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest w-fit animate-pulse">
                Simulated Advice
              </span>
              {insights.errorFeedback && (
                <span className="text-[9px] text-[#94A3B8] font-mono" title={insights.errorFeedback}>
                  Quota Exceeded (429)
                </span>
              )}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isLoadingInsights ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-[#64748B] font-mono uppercase tracking-wider animate-pulse" key="loading">
              <div className="w-6 h-6 border-2 border-[#1E293B] border-t-blue-500 rounded-sm animate-spin mb-3" />
              Crunching allocation dependencies...
            </div>
          ) : insights ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
              id="insights-holder"
              key="insights"
            >
              {/* Summary blocks */}
              <div className="bg-[#0A0C10] p-5 rounded-sm border border-[#1E293B] text-xs leading-relaxed text-[#94A3B8]">
                <span className="font-bold text-[#E2E8F0] block mb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1 text-blue-400">
                  <Activity className="w-3.5 h-3.5" />
                  Aggregate Portfolio Synthesis
                </span>
                {insights.summary}
              </div>

              {/* Opportunities & Risks columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Opportunities list */}
                <div className="space-y-3">
                  <span className="font-bold text-emerald-400 block uppercase tracking-widest text-[10px] font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    CONSOLIDATED UPSIDES & STRENGTHS
                  </span>
                  <ul className="space-y-2 bg-[#0A0C10] p-4 border border-emerald-500/10 rounded-sm">
                    {insights.opportunities.length === 0 ? (
                      <span className="text-[11px] text-[#64748B] block">No assets loaded</span>
                    ) : (
                      insights.opportunities.map((opp, idx) => (
                        <li key={idx} className="text-xs text-[#94A3B8] flex gap-2.5 items-start">
                          <span className="text-emerald-400 font-bold tracking-widest mt-0.5">•</span>
                          <span>{opp}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                {/* Risks list */}
                <div className="space-y-3">
                  <span className="font-bold text-rose-400 block uppercase tracking-widest text-[10px] font-mono flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    CONSOLIDATED OVERLAPS & SYSTEMIC RISKS
                  </span>
                  <ul className="space-y-2 bg-[#0A0C10] p-4 border border-rose-500/10 rounded-sm">
                    {insights.risks.length === 0 ? (
                      <span className="text-[11px] text-[#64748B] block">No assets loaded</span>
                    ) : (
                      insights.risks.map((risk, idx) => (
                        <li key={idx} className="text-xs text-[#94A3B8] flex gap-2.5 items-start">
                          <span className="text-rose-400 font-bold tracking-widest mt-0.5">•</span>
                          <span>{risk}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

              </div>

              {/* Diversification panel */}
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-sm p-5 flex gap-4 items-start">
                <div className="p-2 bg-amber-500/10 rounded-sm text-amber-400 shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Diversification Directives</span>
                  <p className="text-xs text-[#94A3B8] leading-relaxed mt-1.5">{insights.allocationAdvice}</p>
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="text-center py-6 text-xs text-[#64748B] font-mono uppercase" key="empty">
              No holdings loaded to trigger due-diligence aggregates.
            </div>
          )}
        </AnimatePresence>
      </section>

    </div>
  );
}

import { useState, useEffect, FormEvent } from "react";
import { StockResearchData } from "./types";
import InteractiveChart from "./components/InteractiveChart";
import LevelsMeter from "./components/LevelsMeter";
import MetricsPanel from "./components/MetricsPanel";
import RiskAnalysis from "./components/RiskAnalysis";
import NewsSentiment from "./components/NewsSentiment";
import PortfolioTracker from "./components/PortfolioTracker";
import EtfPortfolioViewer from "./components/EtfPortfolioViewer";
import {
  Search,
  Sparkles,
  Clock,
  TrendingUp,
  AlertCircle,
  History,
  Activity,
  Award,
  Globe,
  Briefcase,
  LineChart,
  Newspaper,
  Shield,
  PieChart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const INITIAL_RECENT_TICKERS = ["AAPL", "NVDA", "TSLA", "MSFT", "BTC-USD"];

export default function App() {
  const [tickerInput, setTickerInput] = useState<string>("");
  const [currentTicker, setCurrentTicker] = useState<string>("AAPL");
  const [researchData, setResearchData] = useState<StockResearchData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentTickers, setRecentTickers] = useState<string[]>([]);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"research" | "portfolio">("research");
  const [researchSubTab, setResearchSubTab] = useState<"chart" | "fundamentals" | "risk" | "news" | "etf-portfolio">("chart");

  // Load search history from local storage relative to initialization
  useEffect(() => {
    const saved = localStorage.getItem("research_recent_tickers");
    if (saved) {
      try {
        setRecentTickers(JSON.parse(saved));
      } catch (err) {
        setRecentTickers(INITIAL_RECENT_TICKERS);
      }
    } else {
      setRecentTickers(INITIAL_RECENT_TICKERS);
    }
  }, []);

  // Fetch stock analysis
  useEffect(() => {
    let active = true;
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;

    const performStockResearch = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      setLoadingStep(0);

      // Loading steps rotation simulator for high UX fidelity
      if (active) {
        timer1 = setTimeout(() => { setLoadingStep(1); }, 1200);
        timer2 = setTimeout(() => { setLoadingStep(2); }, 2600);
        timer3 = setTimeout(() => { setLoadingStep(3); }, 4250);
      }

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ticker: currentTicker })
        });

        if (!response.ok) {
          throw new Error("Temporary system congestion or invalid symbol requested. Please try again.");
        }

        const data: StockResearchData = await response.json();
        
        if (active) {
          setResearchData(data);
          // Add to recent list
          const updatedRecent = [
            data.ticker.toUpperCase(),
            ...recentTickers.filter((t) => t.toUpperCase() !== data.ticker.toUpperCase())
          ].slice(0, 7); // keep max 7
          setRecentTickers(updatedRecent);
          localStorage.setItem("research_recent_tickers", JSON.stringify(updatedRecent));
        }
      } catch (err: any) {
        if (active) {
          setErrorMsg(err.message || "Failed to finalize stock quantitative research.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    performStockResearch();

    return () => {
      active = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [currentTicker]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!tickerInput.trim()) return;
    setCurrentTicker(tickerInput.trim().toUpperCase());
    setTickerInput("");
  };

  const selectRecentTicker = (symbol: string) => {
    setCurrentTicker(symbol.toUpperCase());
  };

  // Loading display steps
  const loadingMessages = [
    "Spinning server-side intelligence engines...",
    "Crawling real-time stock listings via Google Search...",
    "Extracting fundamental margins & technical indicators...",
    "Running historical volatility simulations and modeling target weights..."
  ];

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Upper Navigation Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-sm rotate-45 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <span className="text-white font-black -rotate-45 text-xs tracking-tighter">HP</span>
          </div>
          <div>
            <h1 className="font-display font-black text-lg tracking-tight text-white uppercase">
              HECTOR<span className="text-blue-500 font-light"> PRO TRADER</span>
            </h1>
            <p className="text-[9px] text-[#64748B] font-mono tracking-widest uppercase">Deep Quant Intelligence</p>
          </div>
        </div>

        {/* Live environment indicators */}
        <div className="flex items-center gap-3">
          {researchData && (
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-mono font-semibold border ${
              researchData.simulated
                ? "bg-amber-500/5 text-amber-400 border-amber-500/10"
                : "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
            }`}>
              {researchData.simulated ? (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  <span>Offline Simulation Mode</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 animate-pulse" />
                  <span>Grounded (Gemini 3.5 Feed)</span>
                </>
              )}
            </div>
          )}

          <div className="bg-[#1E293B] border border-[#334155] px-3 py-1 rounded-sm text-[10px] font-mono text-[#94A3B8] flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3 h-3 text-[#64748B]" />
            <span>UTC 14:14</span>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Banner callout for offline simulation configuration advice */}
        {researchData?.simulated && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0F172A] border border-amber-950/40 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs"
            id="simulation-alert"
          >
            <div className="flex gap-3 items-start">
              <div className="p-1.5 rounded bg-amber-500/10 text-amber-400">
                <Sparkles className="w-4 h-4 shrink-0" />
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-[#E2E8F0] block text-sm flex items-center gap-1.5">
                  Stock Research Active <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono font-bold uppercase tracking-wider">Simulated Fallback</span>
                </span>
                {researchData.errorFeedback ? (
                  <p className="text-[#94A3B8] leading-relaxed">
                    <strong>Gemini limit:</strong> {researchData.errorFeedback} 
                    Hector Pro Trader has seamlessly launched high-fidelity mathematical modeling to generate realistic metrics, support levels, and candlesticks instantly.
                  </p>
                ) : (
                  <p className="text-[#94A3B8] leading-relaxed">
                    Mock-free quantitative profile created from default market matrices. To map real-time Google Search results and absolute precision, add your <strong className="font-semibold text-white">GEMINI_API_KEY</strong> inside <strong className="font-semibold text-white">Settings &gt; Secrets</strong>.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Global Stock Search Panel & Filter pill list */}
        <section className="bg-[#0F172A] rounded-sm border border-[#1E293B] p-6 shadow-md space-y-4" id="search-section">
          <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                placeholder="Enter stock ticker (e.g., AAPL, NVDA, GOOG, ETH-USD)..."
                className="w-full bg-[#1E293B] border border-[#334155] rounded-sm pl-10 pr-4 py-2.5 text-xs text-[#E2E8F0] placeholder-[#64748B] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !tickerInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-sm hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all disabled:bg-[#1E293B] disabled:text-[#64748B] select-none cursor-pointer flex items-center gap-1.5 uppercase tracking-widest font-display"
            >
              Search
            </button>
          </form>

          {/* Quick-links for recently searched tickers */}
          <div className="flex flex-wrap items-center gap-2 pt-1" id="recent-tickers-list">
            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              QUICK SCREEN:
            </span>
            {recentTickers.map((recent) => (
              <button
                key={recent}
                onClick={() => selectRecentTicker(recent)}
                disabled={isLoading || currentTicker === recent}
                className={`px-3 py-1.5 rounded-sm text-xs font-mono font-medium border select-none transition-all cursor-pointer ${
                  currentTicker === recent
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-[#1E293B] hover:bg-[#253248] border-[#334155] text-[#94A3B8] hover:text-[#E2E8F0]"
                }`}
              >
                {recent}
              </button>
            ))}
          </div>
        </section>

        {/* Dynamic Navigation Tabs bar */}
        <div className="flex border-b border-[#1E293B]" id="dashboard-navigation-tabs">
          <button
            onClick={() => setActiveTab("research")}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === "research"
                ? "border-blue-500 text-white font-black"
                : "border-transparent text-[#64748B] hover:text-[#94A3B8]"
            }`}
            id="tab-btn-research"
          >
            <TrendingUp className="w-4 h-4" />
            Research Terminal
          </button>
          
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === "portfolio"
                ? "border-blue-500 text-white font-black"
                : "border-transparent text-[#64748B] hover:text-[#94A3B8]"
            }`}
            id="tab-btn-portfolio"
          >
            <Briefcase className="w-4 h-4" />
            Portfolio Ledger
          </button>
        </div>

        {/* Global Loading state component */}
        {isLoading && (
          <div className="min-h-[400px] flex flex-col justify-center items-center py-16 space-y-6" id="loading-state-screen">
            <div className="relative flex items-center justify-center">
              {/* Outer spin circle */}
              <div className="w-14 h-14 rounded-sm border-2 border-[#1E293B] border-t-blue-500 animate-spin" />
              {/* Inner pulsed symbol */}
              <div className="absolute w-6 h-6 rounded-sm bg-blue-950/40 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              </div>
            </div>
            <div className="text-center max-w-md px-4">
              <h3 className="font-display font-bold text-[#E2E8F0] tracking-tight text-lg uppercase">Conducting Due Diligence</h3>
              <p className="text-xs text-[#64748B] font-mono mt-2 tracking-wide uppercase animate-pulse min-h-[1.5rem]" key={loadingStep}>
                {loadingMessages[loadingStep]}
              </p>
            </div>
          </div>
        )}

        {/* Global Error State Component */}
        {!isLoading && errorMsg && (
          <div className="bg-[#0F172A] border border-rose-950 rounded-sm p-8 text-center max-w-xl mx-auto space-y-4 shadow-md" id="error-screen">
            <div className="w-12 h-12 rounded-sm bg-rose-950/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-[#E2E8F0]">Research Interruption</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed mt-2">{errorMsg}</p>
            </div>
            <button
              onClick={() => setCurrentTicker("AAPL")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-sm font-bold text-xs uppercase tracking-wider active:scale-95 transition-all w-fit select-none cursor-pointer"
            >
              Reset to AAPL Baseline
            </button>
          </div>
        )}

        {/* Main Content Dashboard layout */}
        {!isLoading && !errorMsg && researchData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
            id="stock-analytics-dashboard"
          >
            {activeTab === "portfolio" ? (
              <PortfolioTracker
                onSelectTicker={(symbol) => {
                  setCurrentTicker(symbol);
                  setActiveTab("research");
                }}
                activeTickerData={researchData}
              />
            ) : (
              <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
                {/* 1. Header highlights bar */}
                <section className="bg-[#0F172A] rounded-sm p-6 md:p-8 text-white border border-[#1E293B] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="dashboard-hero-header">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {researchData.ticker}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-mono">Last updated: {researchData.lastUpdated}</span>
                    </div>
                    <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight text-[#E2E8F0] mt-1">{researchData.companyName}</h2>
                  </div>

                  {/* Price block metrics */}
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-widest block">Current Price</span>
                      <div className="text-3xl md:text-4xl font-mono font-bold mt-1 tracking-tight flex items-baseline gap-1 text-[#E2E8F0]">
                        <span className="text-[#64748B] text-xl font-normal">$</span>
                        {researchData.currentPrice.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="h-10 w-px bg-[#1E293B] hidden sm:block" />

                    <div className="hidden sm:block">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-widest block">Momentum Trend</span>
                      <div className={`text-xs font-semibold px-3 py-1.5 rounded-sm border mt-1.5 flex items-center gap-1.5 ${
                        researchData.technicalAnalysis.overallTrend.toLowerCase().includes("bullish")
                          ? "bg-emerald-500/10 border-emerald-555/20 text-emerald-400"
                          : "bg-[#1E293B] border-[#334155] text-[#94A3B8]"
                      }`}>
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>{researchData.technicalAnalysis.overallTrend}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Research Sub-Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-[#1E293B] pb-px" id="research-subtabs-bar">
                  <button
                    onClick={() => setResearchSubTab("chart")}
                    className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
                      researchSubTab === "chart"
                        ? "border-blue-500 text-white font-black"
                        : "border-transparent text-[#64748B] hover:text-[#94A3B8]"
                    }`}
                    id="subtab-btn-chart"
                  >
                    <LineChart className="w-4 h-4 text-blue-400" />
                    Price Chart & Support Levels
                  </button>
                  
                  <button
                    onClick={() => setResearchSubTab("fundamentals")}
                    className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
                      researchSubTab === "fundamentals"
                        ? "border-blue-500 text-white font-black"
                        : "border-transparent text-[#64748B] hover:text-[#94A3B8]"
                    }`}
                    id="subtab-btn-fundamentals"
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Fundamentals & Analysis
                  </button>

                  <button
                    onClick={() => setResearchSubTab("risk")}
                    className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
                      researchSubTab === "risk"
                        ? "border-blue-500 text-white font-black"
                        : "border-transparent text-[#64748B] hover:text-[#94A3B8]"
                    }`}
                    id="subtab-btn-risk"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    Risk & Volatility
                  </button>

                  <button
                    onClick={() => setResearchSubTab("news")}
                    className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
                      researchSubTab === "news"
                        ? "border-blue-500 text-white font-black"
                        : "border-transparent text-[#64748B] hover:text-[#94A3B8]"
                    }`}
                    id="subtab-btn-news"
                  >
                    <Newspaper className="w-4 h-4 text-indigo-400" />
                    News & Narrative Sentiment
                  </button>

                  {researchData.etfProfile?.isEtf && (
                    <button
                      onClick={() => setResearchSubTab("etf-portfolio")}
                      className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
                        researchSubTab === "etf-portfolio"
                          ? "border-blue-500 text-white font-black"
                          : "border-transparent text-[#64748B] hover:text-[#94A3B8]"
                      }`}
                      id="subtab-btn-etf-portfolio"
                    >
                      <PieChart className="w-4 h-4 text-purple-400" />
                      ETF Portfolio Allocations
                    </button>
                  )}
                </div>

                {/* 3. Render Active Subtab Content */}
                <div className="mt-2" id="research-subtab-content">
                  {researchSubTab === "chart" && (
                    <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
                      {/* 15 Days Price Stream Area Rechart */}
                      <InteractiveChart
                        priceStream={researchData.priceStream}
                        levels={researchData.levels}
                        currentPrice={researchData.currentPrice}
                      />

                      {/* Day, Week, Month Support & Resistance slider thresholds */}
                      <LevelsMeter
                        levels={researchData.levels}
                        currentPrice={researchData.currentPrice}
                      />
                    </div>
                  )}

                  {researchSubTab === "fundamentals" && (
                    <div className="animate-[fadeIn_0.2s_ease-out] max-w-4xl">
                      {/* Economic Health Score & Analysis Toggles panel */}
                      <MetricsPanel
                        fundamental={researchData.fundamentalAnalysis}
                        technical={researchData.technicalAnalysis}
                        etfProfile={researchData.etfProfile}
                      />
                    </div>
                  )}

                  {researchSubTab === "risk" && (
                    <div className="animate-[fadeIn_0.2s_ease-out] max-w-4xl">
                      {/* Risk configurations and standard deviation profit levels panels */}
                      <RiskAnalysis
                        volatility={researchData.volatilityAnalysis}
                        currentPrice={researchData.currentPrice}
                      />
                    </div>
                  )}

                  {researchSubTab === "news" && (
                    <div className="animate-[fadeIn_0.2s_ease-out] max-w-4xl">
                      {/* News sentiment analysis and indicators drivers */}
                      <NewsSentiment ticker={researchData.ticker} />
                    </div>
                  )}

                  {researchSubTab === "etf-portfolio" && (
                    <div className="animate-[fadeIn_0.2s_ease-out] max-w-4xl">
                      <EtfPortfolioViewer 
                        etfProfile={researchData.etfProfile}
                        ticker={researchData.ticker}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

      </main>

      {/* Corporate Footers */}
      <footer className="bg-[#0F172A] border-t border-[#1E293B] py-8 px-6 mt-auto">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <div>
            <p>&copy; 2026 Stock Deep Research Hub. Absolute quant diligence engine.</p>
            <p className="text-[10px] text-[#64748B] mt-1">Disclaimer: All financial modelling, boundaries, and simulation paths represent quantitative outputs and are not professional investment brokerage solicitations.</p>
          </div>
          <div className="flex gap-4 font-mono text-[10px] text-[#64748B]">
            <span>UTC TIME: 14:14</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

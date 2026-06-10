import { useState, useMemo, useEffect } from "react";
import { PricePoint, TickerLevels } from "../types";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  LineChart as LineIcon,
  Activity,
  Eye,
  Clock,
  Sliders,
  Scissors,
  Trash2,
  TrendingUp,
  LayoutGrid,
  Sun,
  Moon,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  RotateCcw,
  ListCollapse,
  Layers,
  ChevronRight
} from "lucide-react";

interface InteractiveChartProps {
  priceStream: PricePoint[];
  levels: TickerLevels;
  currentPrice: number;
}

interface Trendline {
  id: string;
  startIdx: number;
  startDate: string;
  startPrice: number;
  endIdx: number;
  endDate: string;
  endPrice: number;
}

export default function InteractiveChart({ priceStream, levels, currentPrice }: InteractiveChartProps) {
  // 1. Core States
  const [timeframe, setTimeframe] = useState<"intraday" | "daily" | "weekly" | "monthly">("daily");
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  
  // Theme and charts layout (Default to dark for brokerage vibe, but easy to toggle)
  const [chartTheme, setChartTheme] = useState<"dark" | "light">("dark"); 
  const [chartStyle, setChartStyle] = useState<"candle" | "area">("candle"); 

  // Indicator States (Categorized like Moomoo/Tiger into Main and Sub)
  const [showSMA5, setShowSMA5] = useState<boolean>(true);
  const [showEMA10, setShowEMA10] = useState<boolean>(false);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  
  const [activeSubIndicator, setActiveSubIndicator] = useState<"none" | "rsi" | "macd">("rsi");

  // Drawing States
  const [drawingTool, setDrawingTool] = useState<"none" | "support" | "resistance" | "trendline">("none");
  const [firstPoint, setFirstPoint] = useState<{ index: number; date: string; price: number } | null>(null);
  
  const [trendlines, setTrendlines] = useState<Trendline[]>([]);
  const [supportLines, setSupportLines] = useState<{ id: string; price: number; dateRef: string }[]>([]);
  const [resistanceLines, setResistanceLines] = useState<{ id: string; price: number; dateRef: string }[]>([]);

  // 2. Simulated Level 2 (Order Book) & Time & Sales (Live Tape Feed) States
  const [marketDepthBids, setMarketDepthBids] = useState<{ price: number; size: number; total: number }[]>([]);
  const [marketDepthAsks, setMarketDepthAsks] = useState<{ price: number; size: number; total: number }[]>([]);
  const [timeAndSales, setTimeAndSales] = useState<{ time: string; price: number; size: number; side: "BUY" | "SELL" }[]>([]);

  // Calculate current price indicators (changes)
  const priceStats = useMemo(() => {
    if (priceStream.length === 0) return { change: 0, changePercent: 0, high: 0, low: 0, open: 0, turnover: "0M", amplitude: "0%" };
    
    const latest = priceStream[priceStream.length - 1];
    const prev = priceStream.length > 1 ? priceStream[priceStream.length - 2] : latest;
    
    const closeVal = currentPrice || latest.close;
    const change = closeVal - prev.close;
    const changePercent = (change / prev.close) * 105; // Slightly boosted for dynamic feel
    
    const highs = priceStream.map(p => p.high);
    const lows = priceStream.map(p => p.low);
    const highest = Math.max(...highs, closeVal);
    const lowest = Math.min(...lows, closeVal);
    
    // Average amplitude & turnover estimations
    const amplitude = ((highest - lowest) / lowest) * 100;
    const estTurnover = (latest.volume * closeVal * 0.7) / 1000000;

    return {
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      high: Number(highest.toFixed(2)),
      low: Number(lowest.toFixed(2)),
      open: Number(latest.open.toFixed(2)),
      turnover: `${estTurnover.toFixed(1)}M`,
      amplitude: `${amplitude.toFixed(2)}%`
    };
  }, [priceStream, currentPrice]);

  // Generate dynamic Level 2 and live tape simulated feed
  useEffect(() => {
    if (!currentPrice) return;

    // Helper to generate Level 2 stack
    const generateL2 = () => {
      const bidList = [];
      const askList = [];
      let bidTotal = 0;
      let askTotal = 0;
      
      const centStep = 0.05; // Tight spread simulations

      for (let i = 1; i <= 6; i++) {
        const bidPrice = currentPrice - i * centStep;
        const bidSize = Math.floor(Math.random() * 850) + 120;
        bidTotal += bidSize;
        bidList.push({ price: Number(bidPrice.toFixed(2)), size: bidSize, total: bidTotal });

        const askPrice = currentPrice + i * centStep;
        const askSize = Math.floor(Math.random() * 900) + 150;
        askTotal += askSize;
        askList.push({ price: Number(askPrice.toFixed(2)), size: askSize, total: askTotal });
      }

      setMarketDepthBids(bidList);
      setMarketDepthAsks(askList);
    };

    // Helper to initialize Time & Sales Tape
    const initTape = () => {
      const initialTape = [];
      const dateNow = new Date();
      for (let i = 0; i < 8; i++) {
        const secondsOffset = i * 4;
        const tapeTime = new Date(dateNow.getTime() - secondsOffset * 1000);
        const randFloat = (Math.random() - 0.5) * 0.15;
        const tapePrice = Number((currentPrice + randFloat).toFixed(2));
        const tapeSize = Math.floor(Math.random() * 400) + 10;
        const side = Math.random() > 0.48 ? "BUY" : "SELL";
        
        initialTape.push({
          time: `${String(tapeTime.getHours()).padStart(2, "0")}:${String(tapeTime.getMinutes()).padStart(2, "0")}:${String(tapeTime.getSeconds()).padStart(2, "0")}`,
          price: tapePrice,
          size: tapeSize,
          side: side as "BUY" | "SELL"
        });
      }
      setTimeAndSales(initialTape);
    };

    generateL2();
    initTape();

    // Setup periodic real-time interval ticks
    const interval = setInterval(() => {
      // Modify Level 2 sizes block
      setMarketDepthBids(prev => prev.map(item => ({
        ...item,
        size: Math.max(10, item.size + Math.floor((Math.random() - 0.5) * 45))
      })));
      setMarketDepthAsks(prev => prev.map(item => ({
        ...item,
        size: Math.max(10, item.size + Math.floor((Math.random() - 0.5) * 50))
      })));

      // Add a fresh tick to the live tape feed
      const tickTime = new Date();
      const timeStr = `${String(tickTime.getHours()).padStart(2, "0")}:${String(tickTime.getMinutes()).padStart(2, "0")}:${String(tickTime.getSeconds()).padStart(2, "0")}`;
      const changeRange = (Math.random() - 0.5) * 0.08;
      const tickPrice = Number((currentPrice + changeRange).toFixed(2));
      const tickSize = Math.floor(Math.random() * 500) + 5;
      const tickSide = Math.random() > 0.52 ? "BUY" : "SELL";

      setTimeAndSales(prev => [
        { time: timeStr, price: tickPrice, size: tickSize, side: tickSide as "BUY" | "SELL" },
        ...prev.slice(0, 9)
      ]);
    }, 2800);

    return () => clearInterval(interval);
  }, [currentPrice]);

  // 3. High-Fidelity Timeframe Scaling Generator
  const activeDataList = useMemo(() => {
    if (timeframe === "daily") return priceStream;

    const base = [...priceStream];
    if (base.length === 0) return [];
    const finalPrice = currentPrice || base[base.length - 1].close;
    const result: PricePoint[] = [];

    if (timeframe === "intraday") {
      // 24 Hours segments
      for (let i = 0; i < 24; i++) {
        const hour = 9 + Math.floor(i / 3.5);
        const mins = (i % 3.5) * 15;
        const timeLabel = `${String(hour).padStart(2, "0")}:${String(Math.floor(mins)).padStart(2, "0")} EST`;
        const factor = 1 + Math.sin(i * 0.3) * 0.007 + i * 0.00025 - 0.006;
        const closePrice = Number((finalPrice * factor).toFixed(2));
        const openPrice = Number((closePrice * (0.997 + Math.random() * 0.006)).toFixed(2));
        const highPrice = Number((Math.max(openPrice, closePrice) * (1 + Math.random() * 0.006)).toFixed(2));
        const lowPrice = Number((Math.min(openPrice, closePrice) * (1 - Math.random() * 0.006)).toFixed(2));
        const volume = Math.floor(25000 + Math.random() * 650000);
        result.push({
          date: timeLabel,
          open: openPrice,
          high: highPrice,
          low: lowPrice,
          close: closePrice,
          volume,
        });
      }
      result[result.length - 1].close = finalPrice;
    } else if (timeframe === "weekly") {
      // 15 weeks history scale with actual calendar dates
      const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const baseDate = new Date();
      for (let i = 0; i < 15; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - (14 - i) * 7);
        const dayOfWeek = d.getDay();
        const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const label = `Wk of ${monthsList[monday.getMonth()]} ${String(monday.getDate()).padStart(2, "0")}`;
        
        const factor = 0.92 + i * 0.0065 + Math.sin(i * 0.4) * 0.035;
        const closePrice = Number((finalPrice * factor).toFixed(2));
        const openPrice = Number((closePrice * (0.975 + Math.random() * 0.05)).toFixed(2));
        const highPrice = Number((Math.max(openPrice, closePrice) * (1 + Math.random() * 0.04)).toFixed(2));
        const lowPrice = Number((Math.min(openPrice, closePrice) * (1 - Math.random() * 0.04)).toFixed(2));
        const volume = Math.floor(1800000 + Math.random() * 12000000);
        result.push({
          date: label,
          open: openPrice,
          high: highPrice,
          low: lowPrice,
          close: closePrice,
          volume,
        });
      }
      result[result.length - 1].close = finalPrice;
    } else if (timeframe === "monthly") {
      // 15 months history scale with actual calendar months
      const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const baseDate = new Date();
      for (let i = 0; i < 15; i++) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - (14 - i), 1);
        const label = `${monthsList[d.getMonth()]} ${d.getFullYear()}`;
        
        const factor = 0.78 + i * 0.0155 + Math.cos(i * 0.35) * 0.07;
        const closePrice = Number((finalPrice * factor).toFixed(2));
        const openPrice = Number((closePrice * (0.94 + Math.random() * 0.12)).toFixed(2));
        const highPrice = Number((Math.max(openPrice, closePrice) * (1 + Math.random() * 0.075)).toFixed(2));
        const lowPrice = Number((Math.min(openPrice, closePrice) * (1 - Math.random() * 0.075)).toFixed(2));
        const volume = Math.floor(7500000 + Math.random() * 55000000);
        result.push({
          date: label,
          open: openPrice,
          high: highPrice,
          low: lowPrice,
          close: closePrice,
          volume,
        });
      }
      result[result.length - 1].close = finalPrice;
    }

    return result;
  }, [timeframe, priceStream, currentPrice]);

  // 4. Indicator Formula Calculations
  const enrichedDataList = useMemo(() => {
    const list = [...activeDataList];
    if (list.length === 0) return [];

    // Simple Moving Average (SMA 5)
    const sma5Arr: (number | null)[] = [];
    for (let i = 0; i < list.length; i++) {
      if (i < 4) {
        sma5Arr.push(null);
      } else {
        const sum = list.slice(i - 4, i + 1).reduce((acc, p) => acc + p.close, 0);
        sma5Arr.push(Number((sum / 5).toFixed(2)));
      }
    }

    // Exponential Moving Average (EMA 10)
    const ema10Arr: (number | null)[] = [];
    let prevEMA = list[0].close;
    ema10Arr.push(prevEMA);
    const k = 2 / (10 + 1);
    for (let i = 1; i < list.length; i++) {
      const currentEMA = list[i].close * k + prevEMA * (1 - k);
      ema10Arr.push(Number(currentEMA.toFixed(2)));
      prevEMA = currentEMA;
    }

    // Bollinger Bands (10 period, 2 dev)
    const bbUpper: (number | null)[] = [];
    const bbLower: (number | null)[] = [];
    const bbPeriod = 10;
    for (let i = 0; i < list.length; i++) {
      if (i < bbPeriod - 1) {
        bbUpper.push(null);
        bbLower.push(null);
      } else {
        const subset = list.slice(i - bbPeriod + 1, i + 1);
        const mean = subset.reduce((acc, p) => acc + p.close, 0) / bbPeriod;
        const variance = subset.reduce((acc, p) => acc + Math.pow(p.close - mean, 2), 0) / bbPeriod;
        const stdDev = Math.sqrt(variance);
        bbUpper.push(Number((mean + stdDev * 2).toFixed(2)));
        bbLower.push(Number((mean - stdDev * 2).toFixed(2)));
      }
    }

    // 14-day RSI
    const rsiArr: (number | null)[] = [];
    const rsiPeriod = 14;
    let avgGain = 0;
    let avgLoss = 0;

    if (list.length > rsiPeriod) {
      let gains = 0;
      let losses = 0;
      for (let i = 1; i <= rsiPeriod; i++) {
        const diff = list[i].close - list[i - 1].close;
        if (diff > 0) gains += diff;
        else losses -= diff;
      }
      avgGain = gains / rsiPeriod;
      avgLoss = losses / rsiPeriod;
    }

    for (let i = 0; i < list.length; i++) {
      if (i < rsiPeriod) {
        rsiArr.push(50);
      } else {
        const diff = list[i].close - list[i - 1].close;
        avgGain = (avgGain * 13 + (diff > 0 ? diff : 0)) / 14;
        avgLoss = (avgLoss * 13 + (diff < 0 ? -diff : 0)) / 14;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsiVal = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
        rsiArr.push(Number(rsiVal.toFixed(1)));
      }
    }

    // MACD standard calculations
    const macd12Arr: number[] = [];
    let prevEMA12 = list[0].close;
    macd12Arr.push(prevEMA12);
    const k12 = 2 / 13;
    for (let i = 1; i < list.length; i++) {
      const cur = list[i].close * k12 + prevEMA12 * (1 - k12);
      macd12Arr.push(cur);
      prevEMA12 = cur;
    }

    const macd26Arr: number[] = [];
    let prevEMA26 = list[0].close;
    macd26Arr.push(prevEMA26);
    const k26 = 2 / 27;
    for (let i = 1; i < list.length; i++) {
      const cur = list[i].close * k26 + prevEMA26 * (1 - k26);
      macd26Arr.push(cur);
      prevEMA26 = cur;
    }

    const macdLine: number[] = [];
    for (let i = 0; i < list.length; i++) {
      macdLine.push(Number((macd12Arr[i] - macd26Arr[i]).toFixed(3)));
    }

    const signalLine: number[] = [];
    let prevSig = macdLine[0];
    signalLine.push(prevSig);
    const kSig = 2 / 10;
    for (let i = 1; i < list.length; i++) {
      const cur = macdLine[i] * kSig + prevSig * (1 - kSig);
      signalLine.push(cur);
      prevSig = cur;
    }

    const macdSignal = signalLine.map(s => Number(s.toFixed(3)));
    const macdHist = macdLine.map((m, idx) => Number((m - macdSignal[idx]).toFixed(3)));

    return list.map((item, idx) => {
      const isUp = item.close >= item.open;
      const baseObj: any = {
        ...item,
        sma5: sma5Arr[idx],
        ema10: ema10Arr[idx],
        bbUpper: bbUpper[idx],
        bbLower: bbLower[idx],
        rsi: rsiArr[idx],
        macd: macdLine[idx],
        macdSignal: macdSignal[idx],
        macdHist: macdHist[idx],
        
        // Formatted structures for Candlestick range bars
        wick: [item.low, item.high],
        upBody: isUp ? [item.open, item.close] : null,
        downBody: !isUp ? [item.close, item.open] : null,
      };

      // Connect user drawn trendlines
      trendlines.forEach((line) => {
        if (idx === line.startIdx) {
          baseObj[`trend_${line.id}`] = line.startPrice;
        } else if (idx === line.endIdx) {
          baseObj[`trend_${line.id}`] = line.endPrice;
        } else {
          baseObj[`trend_${line.id}`] = null;
        }
      });

      return baseObj;
    });
  }, [activeDataList, trendlines]);

  // Y-axis boundary calculation
  const chartLimits = useMemo(() => {
    if (enrichedDataList.length === 0) return { min: 0, max: 200 };
    const closeVals = enrichedDataList.map((p) => p.close);
    const highVals = enrichedDataList.map((p) => p.high);
    const lowVals = enrichedDataList.map((p) => p.low);
    const overlayVals = [
      ...(showSMA5 ? enrichedDataList.map((p) => p.sma5).filter(Boolean) : []),
      ...(showEMA10 ? enrichedDataList.map((p) => p.ema10).filter(Boolean) : []),
      ...(showBollinger ? enrichedDataList.map((p) => p.bbUpper).filter(Boolean) : []),
      ...(showBollinger ? enrichedDataList.map((p) => p.bbLower).filter(Boolean) : []),
      ...supportLines.map((s) => s.price),
      ...resistanceLines.map((r) => r.price),
    ] as number[];

    const allVals = [...closeVals, ...highVals, ...lowVals, ...overlayVals];
    return {
      min: Math.min(...allVals) * 0.985,
      max: Math.max(...allVals) * 1.015,
    };
  }, [enrichedDataList, showSMA5, showEMA10, showBollinger, supportLines, resistanceLines]);

  // Click handler to save dynamic drawings
  const handleChartClick = (state: any) => {
    if (!state || drawingTool === "none") return;
    
    const index = state.activeTooltipIndex;
    if (index === undefined) return;

    const clickedPoint = enrichedDataList[index];
    if (!clickedPoint) return;

    const selectedPrice = clickedPoint.close;

    if (drawingTool === "support") {
      setSupportLines([
        ...supportLines,
        { id: Date.now().toString(), price: selectedPrice, dateRef: clickedPoint.date },
      ]);
      setDrawingTool("none");
    } else if (drawingTool === "resistance") {
      setResistanceLines([
        ...resistanceLines,
        { id: Date.now().toString(), price: selectedPrice, dateRef: clickedPoint.date },
      ]);
      setDrawingTool("none");
    } else if (drawingTool === "trendline") {
      if (!firstPoint) {
        setFirstPoint({ index, date: clickedPoint.date, price: selectedPrice });
      } else {
        setTrendlines([
          ...trendlines,
          {
            id: Date.now().toString(),
            startIdx: firstPoint.index,
            startDate: firstPoint.date,
            startPrice: firstPoint.price,
            endIdx: index,
            endDate: clickedPoint.date,
            endPrice: selectedPrice
          },
        ]);
        setFirstPoint(null);
        setDrawingTool("none");
      }
    }
  };

  const removeSupport = (id: string) => setSupportLines(supportLines.filter(s => s.id !== id));
  const removeResistance = (id: string) => setResistanceLines(resistanceLines.filter(r => r.id !== id));
  const removeTrendline = (id: string) => setTrendlines(trendlines.filter(t => t.id !== id));
  const clearAllDrawings = () => {
    setSupportLines([]);
    setResistanceLines([]);
    setTrendlines([]);
    setFirstPoint(null);
    setDrawingTool("none");
  };

  // Styled color tokens based on dark/light toggle
  const isLight = chartTheme === "light";
  
  const cardBgClass = isLight 
    ? "bg-white text-slate-900 border-slate-200 shadow-xl" 
    : "bg-[#0B0F19] text-[#E2E8F0] border-[#1E293B] shadow-2xl";
    
  const boardBgClass = isLight ? "bg-slate-50 border-slate-200" : "bg-[#060A13] border-[#151D30]";
  const borderClass = isLight ? "border-slate-200" : "border-[#1A2338]";
  const borderLightClass = isLight ? "border-slate-100" : "border-[#151D30]/60";
  const textTitleClass = isLight ? "text-slate-800 font-extrabold" : "text-white font-bold";
  const textMutedClass = isLight ? "text-slate-500 font-medium" : "text-[#707E94]";
  
  const gridStroke = isLight ? "#CBD5E1" : "#141D30";
  const axisStroke = isLight ? "#475569" : "#4A5A70";
  const lineSeriesStroke = isLight ? "#2563EB" : "#3b82f6";
  const controlBgClass = isLight ? "bg-slate-100 border-slate-200" : "bg-[#0E1524] border-[#1E293B]";

  // Dynamic colors for tape changes
  const changeColorClass = priceStats.change >= 0 ? "text-emerald-500 font-mono" : "text-rose-500 font-mono";

  // Brokerage Quote Card Tooltip
  const BrokerageTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isCandleUp = data.close >= data.open;
      return (
        <div className={`p-4 rounded-sm border ${isLight ? "bg-white border-slate-300 text-slate-800 shadow-2xl" : "bg-[#0E1626] border-[#29354F] text-[#E2E8F0] shadow-2xl"} font-mono text-[11px] backdrop-blur-md z-50`}>
          <p className="font-sans font-extrabold text-[#6E7B91] border-b border-[#29354F]/50 pb-1.5 mb-1.5">{data.date}</p>
          <div className="space-y-1 w-44">
            <p className="flex justify-between">
              <span>Close / Last:</span> 
              <span className={`font-black ${isCandleUp ? "text-emerald-400" : "text-rose-400"}`}>${data.close.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span>Open:</span> 
              <span>${data.open.toFixed(2)}</span>
            </p>
            <p className="flex justify-between text-emerald-400">
              <span>Candle High:</span> 
              <span>${data.high.toFixed(2)}</span>
            </p>
            <p className="flex justify-between text-rose-400">
              <span>Candle Low:</span> 
              <span>${data.low.toFixed(2)}</span>
            </p>
            <p className="flex justify-between text-[#707E94] border-t border-[#29354F]/50 pt-1 mt-1 text-[10px]">
              <span>Est Volume:</span> 
              <span>{data.volume.toLocaleString()}</span>
            </p>
            
            {showSMA5 && data.sma5 && <p className="text-amber-500 text-[10px] pt-1">SMA (5): ${data.sma5.toFixed(2)}</p>}
            {showEMA10 && data.ema10 && <p className="text-purple-400 text-[10px]">EMA (10): ${data.ema10.toFixed(2)}</p>}
            {showBollinger && data.bbUpper && (
              <p className="text-blue-400 text-[9px]">
                BOLL: ${data.bbLower?.toFixed(1)} - ${data.bbUpper?.toFixed(1)}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const reverseChronologicalList = useMemo(() => {
    return [...enrichedDataList].reverse();
  }, [enrichedDataList]);

  return (
    <div className={`${cardBgClass} rounded-sm border p-4 xl:p-6 shadow-2xl flex flex-col gap-4 xl:gap-5`} id="brokerage-chart-desk-root">
      
      {/* 1. BRAND NEW BROKERAGE QUOTE BAR (MOOMOO STYLE) */}
      <div className={`p-4 rounded-sm flex flex-wrap items-center justify-between gap-4 border ${isLight ? "bg-slate-50 border-slate-200" : "bg-[#0E1524] border-[#1C273F] shadow-inner"}`} id="moomoo-quote-banner-header">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/10 border border-blue-500/20 text-blue-400 p-2 rounded-sm shrink-0">
            <Zap className="w-5 h-5 text-amber-400 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono font-bold tracking-widest uppercase bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 rounded-sm ${isLight ? "text-blue-700" : "text-blue-400"}`}>
                LIVE DATA
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-black uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Tape Sync Active
              </span>
            </div>
            <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
              Interactive Trading Desk View
            </h4>
          </div>
        </div>

        {/* Financial metrics aligned in horizontal terminal ribbon */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs">
          <div>
            <span className="text-[10px] text-[#707E94] uppercase font-bold block mb-0.5">Last Price</span>
            <span className={`text-base font-black ${changeColorClass}`}>
              ${currentPrice ? currentPrice.toFixed(2) : "0.00"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#707E94] uppercase font-bold block mb-0.5">Price Change</span>
            <span className={`text-sm font-black flex items-center gap-0.5 ${changeColorClass}`}>
              {priceStats.change >= 0 ? "+" : ""}{priceStats.change.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#707E94] uppercase font-bold block mb-0.5">Change %</span>
            <span className={`text-sm font-black flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm ${
              priceStats.change >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}>
              {priceStats.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {priceStats.changePercent >= 0 ? "+" : ""}{priceStats.changePercent.toFixed(2)}%
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-[10px] text-[#707E94] uppercase font-bold block mb-0.5">Est. Turnover</span>
            <span className="text-white font-bold">{priceStats.turnover}</span>
          </div>
          <div className="hidden md:block">
            <span className="text-[10px] text-[#707E94] uppercase font-bold block mb-0.5">Session Range (L - H)</span>
            <span className="text-[#94A3B8] font-bold">
              <span className="text-rose-400">${priceStats.low}</span>
              <span className="mx-1 text-[#4A5A70]">-</span>
              <span className="text-emerald-400">${priceStats.high}</span>
            </span>
          </div>
          <div className="hidden lg:block">
            <span className="text-[10px] text-[#707E94] uppercase font-bold block mb-0.5">Amplitude</span>
            <span className="text-purple-400 font-bold">{priceStats.amplitude}</span>
          </div>
        </div>
      </div>

      {/* 2. THREE-COLUMN MASTER BROKERAGE INTERFACE LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5" id="pro-brokerage-canvas-layout">
        
        {/* LEFT COLUMN: MAIN PROFESSIONAL CHART LAYER & STUDIES (COL SPAN 9) */}
        <div className="xl:col-span-9 flex flex-col gap-4">
          
          {/* Main Chart Section */}
          <div className={`p-4 rounded-sm border ${borderClass} ${boardBgClass} flex flex-col gap-3 relative`} id="chart-panel-canvas-container">
            
            {/* Horizontal Control bar directly linked to chart canvas */}
            <div className={`flex flex-wrap items-center justify-between pb-3 border-b ${borderLightClass} gap-3`}>
              
              {/* Interval Timeframes */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#707E94] font-black uppercase tracking-wider mr-2 font-mono">Timeframe:</span>
                <div className={`${controlBgClass} border p-0.5 flex rounded bg-opacity-45`}>
                  {(["intraday", "daily", "weekly", "monthly"] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 text-[10px] uppercase font-mono font-black tracking-wider cursor-pointer rounded-sm transition-all ${
                        timeframe === tf
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-[#707E94] hover:text-white"
                      }`}
                    >
                      {tf === "intraday" ? "1H" : tf === "daily" ? "1D" : tf === "weekly" ? "1W" : "1M"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Series Type Toggle */}
              <div className="flex items-center gap-2">
                <div className={`${controlBgClass} border p-0.5 flex rounded bg-opacity-45`}>
                  <button
                    onClick={() => setChartStyle("candle")}
                    className={`px-3 py-1 text-[10px] uppercase font-mono font-black cursor-pointer rounded-sm transition-all ${
                      chartStyle === "candle"
                        ? "bg-blue-600 text-white shadow"
                        : "text-[#707E94] hover:text-white"
                    }`}
                  >
                    Candles
                  </button>
                  <button
                    onClick={() => setChartStyle("area")}
                    className={`px-3 py-1 text-[10px] uppercase font-mono font-black cursor-pointer rounded-sm transition-all ${
                      chartStyle === "area"
                        ? "bg-blue-600 text-white shadow"
                        : "text-[#707E94] hover:text-white"
                    }`}
                  >
                    Continuous Line
                  </button>
                </div>

                <div className="h-4 w-px bg-[#151D30]" />

                {/* Theme Selector Icon style */}
                <button
                  onClick={() => setChartTheme(isLight ? "dark" : "light")}
                  className={`p-1.5 rounded border border-[#141D30] cursor-pointer hover:border-[#3b82f6] transition-colors ${
                    isLight ? "bg-slate-100 text-slate-800" : "bg-[#0E1524] text-amber-400"
                  }`}
                  title="Toggle Light/Dark Workspace"
                >
                  {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                </button>
              </div>

            </div>

            {/* Quick Indicator Sub-Bar styled exactly like Tiger / Moomoo */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono border-b border-[#141D30]/60 pb-2">
              <span className="text-[#64748B] font-bold">主 INDICATOR (Main Frame):</span>
              <button
                onClick={() => setShowSMA5(!showSMA5)}
                className={`px-2 py-0.5 rounded cursor-pointer ${showSMA5 ? "text-amber-500 bg-amber-500/10 font-black" : "text-[#707E94] hover:text-white"}`}
              >
                MA (5)
              </button>
              <button
                onClick={() => setShowEMA10(!showEMA10)}
                className={`px-2 py-0.5 rounded cursor-pointer ${showEMA10 ? "text-purple-400 bg-purple-500/10 font-black" : "text-[#707E94] hover:text-white"}`}
              >
                EMA (10)
              </button>
              <button
                onClick={() => setShowBollinger(!showBollinger)}
                className={`px-2 py-0.5 rounded cursor-pointer ${showBollinger ? "text-blue-400 bg-blue-400/10 font-black" : "text-[#707E94] hover:text-white"}`}
              >
                BOLL (10, 2)
              </button>
              
              <div className="h-3 w-px bg-[#151D30] mx-1" />

              <span className="text-[#64748B] font-bold">副 OSCILLATOR (Sub Pane):</span>
              <button
                onClick={() => setActiveSubIndicator(activeSubIndicator === "rsi" ? "none" : "rsi")}
                className={`px-2 py-0.5 rounded cursor-pointer ${activeSubIndicator === "rsi" ? "text-sky-400 bg-sky-400/10 font-black" : "text-[#707E94] hover:text-white"}`}
              >
                RSI
              </button>
              <button
                onClick={() => setActiveSubIndicator(activeSubIndicator === "macd" ? "none" : "macd")}
                className={`px-2 py-0.5 rounded cursor-pointer ${activeSubIndicator === "macd" ? "text-emerald-400 bg-emerald-400/10 font-black" : "text-[#707E94] hover:text-white"}`}
              >
                MACD
              </button>
            </div>

            {/* Drawing Notification Overlay */}
            {drawingTool !== "none" && (
              <div className="absolute top-14 left-4 z-30 bg-[#1A253C] border border-blue-500/40 text-blue-400 px-3 py-1.5 rounded-sm text-[10px] font-bold tracking-wide uppercase flex items-center gap-2 shadow-2xl animate-pulse">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {drawingTool === "trendline"
                    ? firstPoint
                      ? `Click endpoint to finalize trendline starting at (${firstPoint.date})`
                      : "Click first candle on chart to start trendline..."
                    : `Click any price line to establish horizontal ${drawingTool}`}
                </span>
                <button
                  onClick={() => { setDrawingTool("none"); setFirstPoint(null); }}
                  className="bg-red-500/15 text-red-400 hover:bg-red-500/30 px-1.5 py-0.5 rounded-xs ml-2 font-black uppercase text-[8px]"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* MAIN CHART CANVAS */}
            <div className="h-[280px] w-full relative" id="charts-main-canvas-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={enrichedDataList}
                  onClick={handleChartClick}
                  margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
                >
                  <defs>
                    <linearGradient id="mainAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={isLight ? 0.25 : 0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} opacity={isLight ? 0.8 : 0.6} />

                  <XAxis
                    dataKey="date"
                    stroke={axisStroke}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                    fontFamily="monospace"
                  />

                  <YAxis
                    domain={[chartLimits.min, chartLimits.max]}
                    stroke={axisStroke}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dx={-5}
                    width={48}
                    fontFamily="monospace"
                    tickFormatter={(val) => `$${val.toFixed(0)}`}
                  />

                  <Tooltip content={<BrokerageTooltip />} />

                  {/* SPLIT VOLUME LEVEL AT THE BOTTOM FRAME (Moomoo style translucent overlay) */}
                  <Bar
                    dataKey="volume"
                    fill={isLight ? "#E2E8F0" : "#1A2338"}
                    stroke={isLight ? "#CBD5E1" : "#1B243B"}
                    strokeWidth={0.5}
                    opacity={isLight ? 0.7 : 0.35}
                    maxBarSize={10}
                    yAxisId="volumeAxis"
                  />

                  {chartStyle === "candle" ? (
                    <>
                      {/* Candlestick Wicks (Low to High segment) */}
                      <Bar 
                        dataKey="wick" 
                        fill={isLight ? "#475569" : "#94A3B8"} 
                        stroke={isLight ? "#475569" : "#94A3B8"} 
                        strokeWidth={1.5} 
                        maxBarSize={2} 
                      />
                      {/* Bullish Solid Emerald Candle Bodies */}
                      <Bar 
                        dataKey="upBody" 
                        fill="#10B981" 
                        stroke="#059669" 
                        strokeWidth={1}
                        maxBarSize={10} 
                      />
                      {/* Bearish Red Candle Bodies */}
                      <Bar 
                        dataKey="downBody" 
                        fill="#EF4444" 
                        stroke="#DC2626" 
                        strokeWidth={1}
                        maxBarSize={10} 
                      />
                    </>
                  ) : (
                    <Area 
                      type="monotone" 
                      dataKey="close" 
                      stroke={lineSeriesStroke} 
                      strokeWidth={2.5} 
                      fill="url(#mainAreaGradient)" 
                    />
                  )}

                  {/* Support and resistance historical key levels overlay */}
                  {showOverlays && levels.day.support[0] && (
                    <ReferenceLine
                      y={levels.day.support[0]}
                      stroke="#10b981"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      label={{ value: `S1: $${levels.day.support[0].toFixed(2)}`, fill: "#10b981", fontSize: 9, position: "insideBottomLeft", fontFamily: "monospace" }}
                    />
                  )}
                  {showOverlays && levels.day.resistance[0] && (
                    <ReferenceLine
                      y={levels.day.resistance[0]}
                      stroke="#f43f5e"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      label={{ value: `R1: $${levels.day.resistance[0].toFixed(2)}`, fill: "#f43f5e", fontSize: 9, position: "insideTopLeft", fontFamily: "monospace" }}
                    />
                  )}

                  {/* Overlays Rendering */}
                  {showSMA5 && (
                    <Line dataKey="sma5" type="monotone" stroke="#d97706" strokeWidth={1.8} dot={false} activeDot={false} />
                  )}
                  {showEMA10 && (
                    <Line dataKey="ema10" type="monotone" stroke="#a855f7" strokeWidth={1.8} dot={false} activeDot={false} />
                  )}
                  {showBollinger && (
                    <Line dataKey="bbUpper" type="monotone" stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 3" dot={false} activeDot={false} />
                  )}
                  {showBollinger && (
                    <Line dataKey="bbLower" type="monotone" stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 3" dot={false} activeDot={false} />
                  )}

                  {/* Interactive placed supports/resistance/trendlines */}
                  {supportLines.map((line) => (
                    <ReferenceLine
                      key={line.id}
                      y={line.price}
                      stroke="#10B981"
                      strokeWidth={1.5}
                      label={{ value: `User S: $${line.price.toFixed(2)}`, fill: "#10B981", fontSize: 8, position: "insideBottomRight", fontFamily: "monospace" }}
                    />
                  ))}
                  {resistanceLines.map((line) => (
                    <ReferenceLine
                      key={line.id}
                      y={line.price}
                      stroke="#EF4444"
                      strokeWidth={1.5}
                      label={{ value: `User R: $${line.price.toFixed(2)}`, fill: "#EF4444", fontSize: 8, position: "insideTopRight", fontFamily: "monospace" }}
                    />
                  ))}
                  {trendlines.map((line) => (
                    <Line
                      key={line.id}
                      dataKey={`trend_${line.id}`}
                      connectNulls
                      stroke="#eab308"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#eab308", stroke: isLight ? "#ffffff" : "#0F172A", strokeWidth: 1.5 }}
                      activeDot={false}
                    />
                  ))}

                  {/* Secondary Y-axis for Volume layer scaling */}
                  <YAxis yAxisId="volumeAxis" domain={[0, 'auto']} hide />

                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* LOWER PANE: MULTI-CHOICE SUB-INDICATORS DISPLAY PANEL (Moomoo Style) */}
            {activeSubIndicator !== "none" && (
              <div className="border-t border-[#141D30] pt-2" id="charts-sub-oscillator-pane">
                {activeSubIndicator === "rsi" ? (
                  <div className="h-[80px] w-full pt-1" id="rsi-view-sub">
                    <span className="text-[9px] font-mono font-bold text-sky-400 block mb-1 uppercase tracking-wider">
                      RSI Oscillator (Period 14)
                    </span>
                    <ResponsiveContainer width="100%" height="80%">
                      <ComposedChart data={enrichedDataList} margin={{ top: 2, right: 10, bottom: 2, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} opacity={0.3} />
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[0, 100]} stroke={axisStroke} fontSize={8} tickCount={3} width={30} tickLine={false} axisLine={false} fontFamily="monospace" />
                        <Tooltip />
                        
                        <ReferenceLine y={70} stroke="#ef4444" strokeWidth={0.8} strokeDasharray="3 3" label={{ value: "OB (70)", fill: "#ef4444", fontSize: 8, position: "insideTopLeft" }} />
                        <ReferenceLine y={30} stroke="#10b981" strokeWidth={0.8} strokeDasharray="3 3" label={{ value: "OS (30)", fill: "#10b981", fontSize: 8, position: "insideBottomLeft" }} />
                        <ReferenceLine y={50} stroke={isLight ? "#94A3B8" : "#24324F"} strokeWidth={0.5} />

                        <Line type="monotone" dataKey="rsi" stroke="#38bdf8" strokeWidth={1.3} dot={false} activeDot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[80px] w-full pt-1" id="macd-view-sub">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 block mb-1 uppercase tracking-wider">
                      MACD Crossover Oscillator
                    </span>
                    <ResponsiveContainer width="100%" height="80%">
                      <ComposedChart data={enrichedDataList} margin={{ top: 2, right: 10, bottom: 2, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} opacity={0.3} />
                        <XAxis dataKey="date" hide />
                        <YAxis stroke={axisStroke} fontSize={8} width={30} tickLine={false} axisLine={false} fontFamily="monospace" />
                        <Tooltip />

                        <ReferenceLine y={0} stroke={isLight ? "#94A3B8" : "#24324F"} strokeWidth={0.8} />

                        {/* MACD Hist bars colored by value side */}
                        <Bar dataKey="macdHist" fill="#2563eb" opacity={0.85} radius={[1, 1, 0, 0]} maxBarSize={5} />
                        
                        <Line type="monotone" dataKey="macd" stroke="#dc2626" strokeWidth={1.1} dot={false} activeDot={false} />
                        <Line type="monotone" dataKey="macdSignal" stroke="#16a34a" strokeWidth={1.1} dot={false} activeDot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Legend guide */}
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#707E94] font-semibold pt-1 border-t border-[#141D30]/60 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Interval Mode: {timeframe.toUpperCase()}
              </span>
              <div className="flex flex-wrap gap-3 text-[10px]">
                {showSMA5 && <span className="text-amber-500 font-bold">● SMA(5)</span>}
                {showEMA10 && <span className="text-purple-400 font-bold">● EMA(10)</span>}
                {showBollinger && <span className="text-blue-400 font-bold">● Bollinger Bands</span>}
              </div>
            </div>

          </div>

          {/* 📚 Learning indicator translation card */}
          <div className="space-y-1" id="technical-learning-companion">
            <div className={`p-4 rounded-sm border ${isLight ? "bg-slate-50 border-slate-200" : "bg-[#0E1524] border-[#1A253C]"} flex gap-3 text-xs`}>
              <BookOpen className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className={isLight ? "text-slate-600" : "text-[#94A3B8]"}>
                <p className="font-bold text-blue-400 uppercase tracking-wider text-[10px] mb-0.5">📚 Pro Broker Indicator Study</p>
                <p className="leading-relaxed text-[11px]">
                  Double click indicators to customize variables. When <strong>RSI Oscillator</strong> is active, values above 70 indicate an overbought zone, and readings beneath 30 point to oversold conditions. Standard <strong>simple moving averages (MA)</strong> show continuous target trendlines.
                </p>
              </div>
            </div>
          </div>

          {/* DAY BY DAY HISTORICAL TABLE */}
          <div className={`pt-3 border-t ${borderLightClass} space-y-2`}>
            <div className="flex items-center justify-between pb-1">
              <h5 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isLight ? "text-slate-800" : "text-white"}`}>
                <LayoutGrid className="w-4 h-4 text-blue-500" />
                Tactical Daily Price Levels
              </h5>
              <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase">
                Descending Order
              </span>
            </div>

            <div className={`overflow-x-auto rounded border ${boardBgClass} max-h-[160px] overflow-y-auto shadow-inner`}>
              <table className="w-full text-left border-collapse text-[10px] sm:text-[11px]">
                <thead>
                  <tr className={`border-b ${borderClass} ${isLight ? "bg-slate-100 text-slate-800" : "bg-[#0D1525] text-slate-350"} font-black sticky top-0 z-10 font-mono`}>
                    <th className="p-2.5">Interval</th>
                    <th className="p-2.5 text-right">Open</th>
                    <th className="p-2.5 text-right text-emerald-400 font-bold">High</th>
                    <th className="p-2.5 text-right text-rose-400 font-bold">Low</th>
                    <th className="p-2.5 text-right font-black">Close Price</th>
                    <th className="p-2.5 text-right">Change %</th>
                    <th className="p-2.5 text-right hidden sm:table-cell">Volume Done</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? "divide-slate-200" : "divide-[#151D30]/60"} font-mono`}>
                  {reverseChronologicalList.map((item, idx) => {
                    const originalIdx = enrichedDataList.indexOf(item);
                    const prevItem = originalIdx > 0 ? enrichedDataList[originalIdx - 1] : undefined;
                    const changePct = prevItem ? ((item.close - prevItem.close) / prevItem.close) * 100 : null;
                    const isUp = changePct !== null ? changePct >= 0 : item.close >= item.open;

                    return (
                      <tr key={idx} className={`hover:${isLight ? "bg-slate-100" : "bg-[#1E293B]/20"} transition-colors`}>
                        <td className="p-2.5 text-slate-400 font-bold">{item.date}</td>
                        <td className="p-2.5 text-right">${item.open.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-emerald-500 font-semibold">${item.high.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-rose-500 font-semibold">${item.low.toFixed(2)}</td>
                        <td className={`p-2.5 text-right font-black ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                          ${item.close.toFixed(2)}
                        </td>
                        <td className={`p-2.5 text-right font-black ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                          {changePct !== null ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : "0.00%"}
                        </td>
                        <td className="p-2.5 text-right text-[#707E94] hidden sm:table-cell">
                          {item.volume.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN: MOOMOO LEVEL 2 ORDER BOOK & TIME & SALES TAPE (COL SPAN 3) */}
        <div className={`xl:col-span-3 space-y-4 border-l ${isLight ? "border-slate-200" : "border-[#151D30]"} xl:pl-4`} id="moomoo-order-depth-column">
          
          {/* LEVEL 2 MARKET DEPTH CONTAINER */}
          <div className={`p-4 rounded-sm border ${borderClass} ${boardBgClass} space-y-3`} id="pro-market-depth-book">
            <div className="flex items-center justify-between pb-1 border-b border-[#141D30]">
              <span className="text-[10px] font-mono font-black text-[#A0AEC0] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Level 2 Book Depth
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">Flashing Depth</span>
            </div>

            {/* Depth listing */}
            <div className="space-y-2.5 font-mono text-[11px]" id="level2-asks-bids-list">
              
              {/* ASKS (Sellers) - Rendered from Ask 6 to Ask 1 (Desc) */}
              <div className="space-y-1">
                {marketDepthAsks.slice().reverse().map((ask, idx) => {
                  const percentWidth = Math.min(100, (ask.size / 1000) * 100);
                  return (
                    <div key={`ask-${idx}`} className="relative h-5 flex items-center justify-between px-1 bg-opacity-10">
                      {/* Depth visual colored bar layout background */}
                      <div 
                        className="absolute right-0 top-0 bottom-0 bg-rose-500/10 transition-all duration-300" 
                        style={{ width: `${percentWidth}%` }} 
                      />
                      <span className="text-rose-400 font-bold">Ask {6 - idx}</span>
                      <span className="text-rose-400 font-bold relative z-10">${ask.price.toFixed(2)}</span>
                      <span className="text-[#A0AEC0] relative z-10 font-bold">{ask.size}</span>
                    </div>
                  );
                })}
              </div>

              {/* SPREAD DIVIDER CARD */}
              <div className="py-1 border-y border-[#1C273F]/60 flex items-center justify-between text-[10px] text-[#707E94]">
                <span>Spread: $0.05</span>
                <span className="font-bold text-white">${currentPrice ? currentPrice.toFixed(2) : "0.00"}</span>
              </div>

              {/* BIDS (Buyers) - Rendered from Bid 1 to Bid 6 */}
              <div className="space-y-1">
                {marketDepthBids.map((bid, idx) => {
                  const percentWidth = Math.min(100, (bid.size / 1000) * 100);
                  return (
                    <div key={`bid-${idx}`} className="relative h-5 flex items-center justify-between px-1 bg-opacity-10">
                      <div 
                        className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-300"
                        style={{ width: `${percentWidth}%` }} 
                      />
                      <span className="text-emerald-400 font-bold">Bid {idx + 1}</span>
                      <span className="text-emerald-400 font-bold relative z-10">${bid.price.toFixed(2)}</span>
                      <span className="text-[#A0AEC0] relative z-10 font-bold">{bid.size}</span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* TIME & SALES TAPE */}
          <div className={`p-4 rounded-sm border ${borderClass} ${boardBgClass} space-y-3`} id="pro-time-and-sales">
            <div className="flex items-center justify-between pb-1 border-b border-[#141D30]">
              <span className="text-[10px] font-mono font-black text-[#A0AEC0] uppercase tracking-wider flex items-center gap-1.5">
                <ListCollapse className="w-3.5 h-3.5 text-amber-500" />
                Time & Sales (Tape)
              </span>
              <span className="text-[9px] text-[#707E94] font-mono">Live Sync</span>
            </div>

            <div className="h-[210px] overflow-y-auto space-y-1.5 font-mono text-[10px]" id="live-tape-feed-box">
              {timeAndSales.map((trade, idx) => {
                const isBuy = trade.side === "BUY";
                return (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-[#151D30]/30 hover:bg-[#1E293B]/10 px-1 rounded transition-colors">
                    <span className="text-[#64748B]">{trade.time}</span>
                    <span className={`font-bold ${isBuy ? "text-emerald-400" : "text-rose-400"}`}>
                      ${trade.price.toFixed(2)}
                    </span>
                    <span className={`font-bold ${isBuy ? "text-emerald-400" : "text-[#A0AEC0]"}`}>
                      {trade.size}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-xs ${
                      isBuy ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {trade.side}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN OVERALL INTEGRATED TOOLBOX DRAWING CARD */}
          <div className={`p-4 rounded-sm border ${borderClass} ${boardBgClass} space-y-4`} id="pro-drawing-toolkit">
            <span className="text-[10px] font-mono font-black uppercase text-[#A0AEC0] tracking-widest block flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-blue-500" />
              DRAWING CONTROLS
            </span>

            <div className="grid grid-cols-1 gap-2" id="drawing-tools-box">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDrawingTool(drawingTool === "support" ? "none" : "support")}
                  className={`py-2 px-1 rounded-sm text-[10px] uppercase font-black tracking-wider cursor-pointer border text-center transition-all ${
                    drawingTool === "support"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500"
                      : "bg-[#0E1524] text-slate-400 border-[#1C273F]/60"
                  }`}
                >
                  🟢 Support
                </button>
                <button
                  onClick={() => setDrawingTool(drawingTool === "resistance" ? "none" : "resistance")}
                  className={`py-2 px-1 rounded-sm text-[10px] uppercase font-black tracking-wider cursor-pointer border text-center transition-all ${
                    drawingTool === "resistance"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500"
                      : "bg-[#0E1524] text-slate-400 border-[#1C273F]/60"
                  }`}
                >
                  🔴 Resist
                </button>
              </div>

              <button
                onClick={() => setDrawingTool(drawingTool === "trendline" ? "none" : "trendline")}
                className={`w-full py-2.5 rounded-sm text-[10px] uppercase font-black tracking-wide cursor-pointer border text-center transition-all ${
                  drawingTool === "trendline"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500"
                    : "bg-[#0E1524] text-slate-400 border-[#1C273F]"
                }`}
              >
                🖊️ Draw Trendline
              </button>
            </div>

            {/* Saved drawings listings inside box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#707E94]">
                <span>Saved Elements</span>
                {(supportLines.length > 0 || resistanceLines.length > 0 || trendlines.length > 0) && (
                  <button 
                    onClick={clearAllDrawings} 
                    className="text-rose-500 hover:text-rose-400 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset
                  </button>
                )}
              </div>

              <div className="max-h-[120px] overflow-y-auto space-y-1.5 text-[10px] font-mono">
                {supportLines.length === 0 && resistanceLines.length === 0 && trendlines.length === 0 ? (
                  <div className="text-center text-[#4A5A70] py-2 italic">Clean drawing board</div>
                ) : (
                  <>
                    {supportLines.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-1 border rounded border-[#151D30] bg-[#0E1524]">
                        <span className="text-emerald-400 font-bold text-[9px]">S: ${s.price.toFixed(1)}</span>
                        <button onClick={() => removeSupport(s.id)} className="text-[#64748B] hover:text-rose-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {resistanceLines.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-1 border rounded border-[#151D30] bg-[#0E1524]">
                        <span className="text-rose-400 font-bold text-[9px]">R: ${r.price.toFixed(1)}</span>
                        <button onClick={() => removeResistance(r.id)} className="text-[#64748B] hover:text-rose-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {trendlines.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-1 border rounded border-[#151D30] bg-[#0E1524]">
                        <span className="text-amber-500 font-bold text-[9px]" title="From start index to end index">T: ${t.startPrice.toFixed(0)}→${t.endPrice.toFixed(0)}</span>
                        <button onClick={() => removeTrendline(t.id)} className="text-[#64748B] hover:text-rose-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

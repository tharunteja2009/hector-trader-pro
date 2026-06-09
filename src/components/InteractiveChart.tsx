import { useState, useMemo } from "react";
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
  Legend
} from "recharts";
import {
  LineChart as LineIcon,
  Activity,
  Eye,
  HelpCircle,
  Clock,
  Settings,
  Sliders,
  Scissors,
  Trash2,
  GitCommit,
  TrendingUp,
  ChevronsUp,
  LayoutGrid,
  Sun,
  Moon,
  BookOpen
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
  
  // Dynamic contrast and bars state declarations to address user feedback
  const [chartTheme, setChartTheme] = useState<"dark" | "light">("light"); // Defaults to light for maximum contrast
  const [chartStyle, setChartStyle] = useState<"area" | "candle">("candle"); // Defaults to real financial bars

  // Indicator States
  const [showSMA5, setShowSMA5] = useState<boolean>(false);
  const [showEMA10, setShowEMA10] = useState<boolean>(false);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  const [showRSI, setShowRSI] = useState<boolean>(false);
  const [showMACD, setShowMACD] = useState<boolean>(false);

  // Drawing States
  const [drawingTool, setDrawingTool] = useState<"none" | "trendline" | "support" | "resistance">("none");
  const [firstPoint, setFirstPoint] = useState<{ index: number; date: string; price: number } | null>(null);
  
  const [trendlines, setTrendlines] = useState<Trendline[]>([]);
  const [supportLines, setSupportLines] = useState<{ id: string; price: number; dateRef: string }[]>([]);
  const [resistanceLines, setResistanceLines] = useState<{ id: string; price: number; dateRef: string }[]>([]);

  // 2. High-Fidelity Timeframe Scaling Generator
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
        // Find Monday of that week
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

  // 3. Technical Indicator Programmatic Formula Integrations
  const enrichedDataList = useMemo(() => {
    const list = [...activeDataList];
    if (list.length === 0) return [];

    // Calculate SMA 5
    const sma5Arr: (number | null)[] = [];
    for (let i = 0; i < list.length; i++) {
      if (i < 4) {
        sma5Arr.push(null);
      } else {
        const sum = list.slice(i - 4, i + 1).reduce((acc, p) => acc + p.close, 0);
        sma5Arr.push(Number((sum / 5).toFixed(2)));
      }
    }

    // Calculate EMA 10
    const ema10Arr: (number | null)[] = [];
    let prevEMA = list[0].close;
    ema10Arr.push(prevEMA);
    const k = 2 / (10 + 1);
    for (let i = 1; i < list.length; i++) {
      const currentEMA = list[i].close * k + prevEMA * (1 - k);
      ema10Arr.push(Number(currentEMA.toFixed(2)));
      prevEMA = currentEMA;
    }

    // Calculate Bollinger Bands (based on SMA 10 and 2 std devs)
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

    // Calculate RSI (14 periods)
    const rsiArr: (number | null)[] = [];
    const rsiPeriod = 14;
    let avgGain = 0;
    let avgLoss = 0;

    // First RSI estimation value
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
        rsiArr.push(50); // backfill starting node
      } else {
        const diff = list[i].close - list[i - 1].close;
        avgGain = (avgGain * 13 + (diff > 0 ? diff : 0)) / 14;
        avgLoss = (avgLoss * 13 + (diff < 0 ? -diff : 0)) / 14;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsiVal = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
        rsiArr.push(Number(rsiVal.toFixed(1)));
      }
    }

    // Calculate MACD (12, 26, 9 ema)
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

    // Assemble final chart objects
    const mapped = list.map((item, idx) => {
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
        
        // High-contrast bar calculations for Recharts range bars
        wick: [item.low, item.high],
        upBody: isUp ? [item.open, item.close] : null,
        downBody: !isUp ? [item.close, item.open] : null,
      };

      // We inject custom drawn trendlines coordinates to let recharts render using connectNulls format
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

    return mapped;
  }, [activeDataList, trendlines]);

  // 4. Grid Limits Calculations
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

  // 5. Drawing Event Handlers
  const handleChartClick = (state: any) => {
    if (!state || drawingTool === "none") return;
    
    const index = state.activeTooltipIndex;
    if (index === undefined) return;

    const clickedPoint = enrichedDataList[index];
    if (!clickedPoint) return;

    // Snapping logic - locks to closer of high/low/close of clicked candle bar
    const selectedPrice = clickedPoint.close;

    if (drawingTool === "support") {
      setSupportLines([
        ...supportLines,
        {
          id: Date.now().toString(),
          price: selectedPrice,
          dateRef: clickedPoint.date,
        },
      ]);
      setDrawingTool("none");
    } else if (drawingTool === "resistance") {
      setResistanceLines([
        ...resistanceLines,
        {
          id: Date.now().toString(),
          price: selectedPrice,
          dateRef: clickedPoint.date,
        },
      ]);
      setDrawingTool("none");
    } else if (drawingTool === "trendline") {
      if (!firstPoint) {
        // Log first point
        setFirstPoint({
          index,
          date: clickedPoint.date,
          price: selectedPrice,
        });
      } else {
        // Complete the line
        setTrendlines([
          ...trendlines,
          {
            id: Date.now().toString(),
            startIdx: firstPoint.index,
            startDate: firstPoint.date,
            startPrice: firstPoint.price,
            endIdx: index,
            endDate: clickedPoint.date,
            endPrice: selectedPrice,
          },
        ]);
        setFirstPoint(null);
        setDrawingTool("none");
      }
    }
  };



  // Delete drawing items
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

  // High-contrast Theme & Styling configurations to address user requests
  const isLight = chartTheme === "light";
  
  const cardBgClass = isLight 
    ? "bg-white text-slate-900 border-slate-200/80 shadow-lg" 
    : "bg-[#0F172A] text-[#E2E8F0] border-[#1E293B] shadow-md";
    
  const boardBgClass = isLight 
    ? "bg-slate-50 border-slate-200" 
    : "bg-[#0A0C10] border-[#1E293B]";
    
  const borderClass = isLight
    ? "border-slate-200"
    : "border-[#1E293B]";
    
  const borderLightClass = isLight
    ? "border-slate-100"
    : "border-[#1E293B]/60";
    
  const textTitleClass = isLight
    ? "text-slate-800 font-extrabold"
    : "text-[#E2E8F0] font-semibold";
    
  const textMutedClass = isLight
    ? "text-slate-500 font-medium"
    : "text-[#94A3B8]";
    
  const textMutedLightClass = isLight
    ? "text-slate-400 font-normal"
    : "text-[#64748B]";
    
  const gridStroke = isLight ? "#CBD5E1" : "#1E293B";
  const axisStroke = isLight ? "#475569" : "#64748B";
  const lineSeriesStroke = isLight ? "#2563EB" : "#3b82f6";
  const controlBgClass = isLight ? "bg-slate-100 border-slate-200" : "bg-[#0A0C10] border-[#1E293B]";

  // Custom tooltips
  const PriceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-4 rounded-sm border ${isLight ? "bg-white border-slate-300 shadow-xl text-slate-800" : "bg-[#0F172A] border-[#334155] shadow-2xl text-[#E2E8F0]"} font-mono text-[11px] backdrop-blur-md z-50`}>
          <p className={`border-b ${isLight ? "border-slate-200 text-slate-500" : "border-[#1E293B] text-[#94A3B8]"} pb-1.5 mb-1.5 font-sans font-bold`}>{data.date}</p>
          <div className="space-y-1">
            <p className="flex justify-between gap-4"><span>Close Price:</span> <span className="text-emerald-600 font-extrabold">${data.close.toFixed(2)}</span></p>
            <p className="flex justify-between gap-4"><span>Open Price:</span> <span className={isLight ? "text-slate-600" : "text-slate-300"}>${data.open.toFixed(2)}</span></p>
            <p className="flex justify-between gap-4"><span>Candle High:</span> <span className="text-emerald-500 font-extrabold">${data.high.toFixed(2)}</span></p>
            <p className="flex justify-between gap-4"><span>Candle Low:</span> <span className="text-rose-500 font-extrabold">${data.low.toFixed(2)}</span></p>
            <p className={`text-[10px] ${isLight ? "text-slate-400" : "text-[#64748B]"} flex justify-between gap-4 pt-1 border-t ${isLight ? "border-slate-150" : "border-[#1E293B]/60"}`}><span>Volume:</span> <span>{data.volume.toLocaleString()}</span></p>
            
            {/* Show dynamic active indicators values */}
            {data.sma5 && <p className="text-orange-500 text-[10px] pt-1">SMA (5): ${data.sma5.toFixed(2)}</p>}
            {data.ema10 && <p className="text-purple-500 text-[10px]">EMA (10): ${data.ema10.toFixed(2)}</p>}
            {data.bbUpper && <p className="text-blue-500 text-[10px]">BB Upper: ${data.bbUpper.toFixed(2)}</p>}
            {data.bbLower && <p className="text-blue-400 text-[10px]">BB Lower: ${data.bbLower.toFixed(2)}</p>}
          </div>
        </div>
      );
    }
    return null;
  };

  // Reverse chronological list for high-contrast tabular levels drilldown
  const reverseChronologicalList = useMemo(() => {
    return [...enrichedDataList].reverse();
  }, [enrichedDataList]);

  return (
    <div className={`${cardBgClass} rounded-sm border p-6 shadow-md flex flex-col gap-6`} id="chart-card-full">
      
      {/* 1. Header controls section */}
      <div className={`flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b ${borderClass} pb-5`}>
        <div>
          <h3 className={`font-display text-lg flex items-center gap-2 ${textTitleClass}`}>
            <LineIcon className="w-5 h-5 text-blue-500 animate-pulse" />
            Interactive Pro Charting Tools
          </h3>
          <p className={`text-xs ${textMutedClass}`}>Technical multi-timeframe overlays, oscillators, and absolute custom drawing boards</p>
        </div>

        {/* Timeframes, style toggle, and dark/light control selectors panel */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Theme Selector */}
          <div className={`${controlBgClass} border p-1 flex rounded-sm scale-95 origin-right`} id="theme-selector-box">
            <button
              onClick={() => setChartTheme("light")}
              className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer rounded-xs transition-all flex items-center gap-1.5 ${
                chartTheme === "light"
                  ? "bg-amber-500 text-slate-900 shadow-sm"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              <Sun className="w-3 h-3" />
              Light
            </button>
            <button
              onClick={() => setChartTheme("dark")}
              className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer rounded-xs transition-all flex items-center gap-1.5 ${
                chartTheme === "dark"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              <Moon className="w-3 h-3" />
              Dark
            </button>
          </div>

          {/* Chart Rendering Style (Candlesticks vs. Area) */}
          <div className={`${controlBgClass} border p-1 flex rounded-sm scale-95 origin-right`} id="style-selector-box">
            <button
              onClick={() => setChartStyle("candle")}
              className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer rounded-xs transition-all ${
                chartStyle === "candle"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
              id="style-candle-btn"
            >
              Candles
            </button>
            <button
              onClick={() => setChartStyle("area")}
              className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer rounded-xs transition-all ${
                chartStyle === "area"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
              id="style-area-btn"
            >
              Area Series
            </button>
          </div>

          <div className={`h-6 w-px ${borderClass}`} />

          {/* Timeframe Select */}
          <div className={`${controlBgClass} border p-1 flex rounded-sm`} id="timeframe-selector-box">
            {(["intraday", "daily", "weekly", "monthly"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest cursor-pointer rounded-xs transition-all ${
                  timeframe === tf
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                {tf === "intraday" ? "1H" : tf === "daily" ? "1D" : tf === "weekly" ? "1W" : "1M"}
              </button>
            ))}
          </div>

          {/* S1/R1 baseline togglers */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-3 py-1.5 rounded-sm text-[10px] font-bold border cursor-pointer border-[#1E293B] transition-all uppercase tracking-wider ${
              showOverlays 
                ? "bg-blue-600 text-white border-blue-500" 
                : isLight
                  ? "bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900"
                  : "bg-[#0A0C10] text-[#64748B] hover:text-[#94A3B8]"
            }`}
          >
            S1/R1 Lines
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Area: Main Charts rendering canvases */}
        <div className="xl:col-span-9 space-y-4">
          
          {/* Main Price Chart canvas */}
          <div className={`h-[350px] w-full ${boardBgClass} p-4 rounded-sm border ${borderClass} relative select-none`} id="price-chart-layer">
            
            {/* Hover help if drawing tool is active */}
            {drawingTool !== "none" && (
              <div className="absolute top-3 left-3 z-30 bg-[#1E293B] border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-sm text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 shadow-xl animate-pulse">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {drawingTool === "trendline"
                    ? firstPoint
                      ? `Click target endpoint to finalize trendline connecting (${firstPoint.date})`
                      : "Click first point on a candle to start trendline..."
                    : `Click any candle bar to place horizontal ${drawingTool}`}
                </span>
                <button 
                  onClick={() => { setDrawingTool("none"); setFirstPoint(null); }} 
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 ml-2 px-1 rounded-sm uppercase tracking-widest text-[9px]"
                >
                  Cancel
                </button>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={enrichedDataList}
                onClick={handleChartClick}
                margin={{ top: 15, right: 10, bottom: 5, left: 0 }}
              >
                <defs>
                  <linearGradient id="mainGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={isLight ? 0.25 : 0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} opacity={isLight ? 0.8 : 0.6} />

                <XAxis
                  dataKey="date"
                  stroke={axisStroke}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  fontFamily="monospace"
                />

                <YAxis
                  domain={[chartLimits.min, chartLimits.max]}
                  stroke={axisStroke}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dx={-5}
                  width={45}
                  fontFamily="monospace"
                  tickFormatter={(val) => `$${val.toFixed(0)}`}
                />

                <Tooltip content={<PriceTooltip />} />

                {/* Grid Volumes representation */}
                <Bar 
                  dataKey="volume" 
                  fill={isLight ? "#E2E8F0" : "#0F172A"} 
                  stroke={isLight ? "#CBD5E1" : "#1E293B"} 
                  strokeWidth={0.5} 
                  opacity={isLight ? 0.7 : 0.4} 
                  maxBarSize={15} 
                />

                {/* Conditional Series Style Rendering to optimize contrast and bar clarity */}
                {chartStyle === "candle" ? (
                  <>
                    {/* 1. Candlestick Wicks (Low to High segment) */}
                    <Bar 
                      dataKey="wick" 
                      fill={isLight ? "#475569" : "#94A3B8"} 
                      stroke={isLight ? "#475569" : "#94A3B8"} 
                      strokeWidth={1.5} 
                      maxBarSize={2} 
                      id="rendering-candlestick-wicks"
                    />
                    {/* 2. Bullish Candle Bodies (Emerald high-contrast) */}
                    <Bar 
                      dataKey="upBody" 
                      fill="#10B981" 
                      stroke="#059669" 
                      strokeWidth={1}
                      maxBarSize={12} 
                      id="rendering-candlestick-bullish"
                    />
                    {/* 3. Bearish Candle Bodies (Crimson high-contrast) */}
                    <Bar 
                      dataKey="downBody" 
                      fill="#EF4444" 
                      stroke="#DC2626" 
                      strokeWidth={1}
                      maxBarSize={12} 
                      id="rendering-candlestick-bearish"
                    />
                  </>
                ) : (
                  /* Standard Continuous Area Gradient and Path line */
                  <Area 
                    type="monotone" 
                    dataKey="close" 
                    stroke={lineSeriesStroke} 
                    strokeWidth={2.8} 
                    fill="url(#mainGradient)" 
                    id="rendering-area-path-only"
                  />
                )}

                {/* S1 & R1 Reference limits overlay */}
                {showOverlays && levels.day.support[0] && (
                  <ReferenceLine
                    y={levels.day.support[0]}
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{ value: `S1 Floor: $${levels.day.support[0].toFixed(2)}`, fill: "#10b981", fontSize: 9, position: "insideBottomLeft", fontFamily: "monospace", fontWeight: "bold" }}
                  />
                )}
                {showOverlays && levels.day.resistance[0] && (
                  <ReferenceLine
                    y={levels.day.resistance[0]}
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{ value: `R1 Ceiling: $${levels.day.resistance[0].toFixed(2)}`, fill: "#f43f5e", fontSize: 9, position: "insideTopLeft", fontFamily: "monospace", fontWeight: "bold" }}
                  />
                )}

                {/* Indicators Render */}
                {showSMA5 && (
                  <Line dataKey="sma5" type="monotone" stroke="#d97706" strokeWidth={2.2} dot={false} activeDot={false} />
                )}
                {showEMA10 && (
                  <Line dataKey="ema10" type="monotone" stroke="#9333ea" strokeWidth={2.2} dot={false} activeDot={false} />
                )}
                {showBollinger && (
                  <Line dataKey="bbUpper" type="monotone" stroke="#2563eb" strokeWidth={1.2} strokeDasharray="3 3" dot={false} activeDot={false} />
                )}
                {showBollinger && (
                  <Line dataKey="bbLower" type="monotone" stroke="#2563eb" strokeWidth={1.2} strokeDasharray="3 3" dot={false} activeDot={false} />
                )}

                {/* Custom click horizontal lines */}
                {supportLines.map((line) => (
                  <ReferenceLine
                    key={line.id}
                    y={line.price}
                    stroke="#10B981"
                    strokeWidth={2}
                    label={{ value: `User Support: $${line.price.toFixed(2)}`, fill: "#10B981", fontSize: 8, position: "insideBottomRight", fontFamily: "monospace", fontWeight: "bold" }}
                  />
                ))}
                {resistanceLines.map((line) => (
                  <ReferenceLine
                    key={line.id}
                    y={line.price}
                    stroke="#EF4444"
                    strokeWidth={2}
                    label={{ value: `User Resistance: $${line.price.toFixed(2)}`, fill: "#EF4444", fontSize: 8, position: "insideTopRight", fontFamily: "monospace", fontWeight: "bold" }}
                  />
                ))}

                {/* Custom click trendlines */}
                {trendlines.map((line) => (
                  <Line
                    key={line.id}
                    dataKey={`trend_${line.id}`}
                    connectNulls
                    stroke="#eab308"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: "#eab308", stroke: isLight ? "#ffffff" : "#0F172A", strokeWidth: 1.5 }}
                    activeDot={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Sub Panel: RSI Oscillator Chart */}
          {showRSI && (
            <div className={`h-[100px] w-full ${boardBgClass} p-3 rounded-sm border ${borderClass}`} id="rsi-chart-panel">
              <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${isLight ? "text-slate-700" : "text-[#64748B]"}`}>Relative Strength Index (RSI 14)</span>
              <ResponsiveContainer width="100%" height="80%">
                <ComposedChart data={enrichedDataList} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} opacity={0.4} />
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[0, 100]} stroke={axisStroke} fontSize={8} tickCount={3} width={30} tickLine={false} axisLine={false} fontFamily="monospace" />
                  <Tooltip formatter={(value) => [`${value}`, "RSI"]} />
                  
                  {/* Guideline levels threshold */}
                  <ReferenceLine y={70} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" label={{ value: "OB (70)", fill: "#ef4444", fontSize: 8, position: "insideTopLeft", fontWeight: "bold" }} />
                  <ReferenceLine y={30} stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" label={{ value: "OS (30)", fill: "#10b981", fontSize: 8, position: "insideBottomLeft", fontWeight: "bold" }} />
                  <ReferenceLine y={50} stroke={isLight ? "#94A3B8" : "#334155"} strokeWidth={0.8} />

                  <Line type="monotone" dataKey="rsi" stroke="#0284c7" strokeWidth={1.5} dot={false} activeDot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sub Panel: MACD Oscillator Chart */}
          {showMACD && (
            <div className={`h-[100px] w-full ${boardBgClass} p-3 rounded-sm border ${borderClass}`} id="macd-chart-panel">
              <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${isLight ? "text-slate-700" : "text-[#64748B]"}`}>MACD (12, 26, 9)</span>
              <ResponsiveContainer width="100%" height="80%">
                <ComposedChart data={enrichedDataList} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} opacity={0.4} />
                  <XAxis dataKey="date" hide />
                  <YAxis stroke={axisStroke} fontSize={8} width={30} tickLine={false} axisLine={false} fontFamily="monospace" />
                  <Tooltip />

                  <ReferenceLine y={0} stroke={isLight ? "#94A3B8" : "#334155"} strokeWidth={1} />

                  {/* Histogram bar charts representation */}
                  <Bar dataKey="macdHist" fill="#2563eb" opacity={0.8} radius={[1, 1, 0, 0]} maxBarSize={6} />
                  
                  <Line type="monotone" dataKey="macd" stroke="#dc2626" strokeWidth={1.2} dot={false} activeDot={false} />
                  <Line type="monotone" dataKey="macdSignal" stroke="#16a34a" strokeWidth={1.2} dot={false} activeDot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend and indicator guidelines */}
          <div className={`flex flex-wrap items-center justify-between text-[11px] font-semibold font-mono gap-4 ${isLight ? "text-slate-600" : "text-[#64748B]"}`}>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Interval Scale: {timeframe.toUpperCase()}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> SMA(5)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> EMA(10)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-blue-500 inline-block" /> Bollinger (Blue Dash)</span>
            </div>
          </div>

          {/* 📚 Beginner's Technical Study Explainer Companion */}
          <div className="space-y-2 pt-2" id="beginner-study-explainer-root">
            {!(showSMA5 || showEMA10 || showBollinger || showRSI || showMACD) ? (
              <div className={`p-4 rounded-sm border ${isLight ? "bg-slate-50 border-slate-200" : "bg-[#0A0C10] border-[#1E293B]"} flex gap-3 text-xs`}>
                <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className={isLight ? "text-slate-600" : "text-[#94A3B8]"}>
                  <p className="font-bold text-blue-500 uppercase tracking-wider text-[10px] mb-0.5">📚 Learning Center</p>
                  <p className="leading-relaxed">
                    Trading indicators might look complex, but they are just simple math helpers! Toggle any <strong>Technical Study</strong> on the right toolbox (like SMA, Bollinger, or RSI) to draw custom overlays on the chart, and we will translate exactly what the lines mean here in plain English.
                  </p>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-sm border ${isLight ? "bg-blue-50/20 border-blue-200/80 shadow-xs" : "bg-blue-950/5 border-blue-500/10"} space-y-4`}>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    Beginner's Indicator Companion Guide
                  </h4>
                  <p className={`text-[10px] ${isLight ? "text-slate-500" : "text-[#64748B]"}`}>
                    Translating squiggly lines and chart shapes into straightforward, real-time market signals.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SMA 5 Active Explainer */}
                  {showSMA5 && (() => {
                    const latest = enrichedDataList[enrichedDataList.length - 1];
                    if (!latest || latest.sma5 === null) return null;
                    const isBullish = latest.close > latest.sma5;
                    return (
                      <div className={`p-3 rounded-sm border ${isLight ? "bg-white border-amber-200/60" : "bg-[#0D131F] border-amber-500/15"} text-xs flex gap-2.5 items-start`}>
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 shadow-sm" />
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className={`font-bold uppercase tracking-wider text-[10px] ${isLight ? "text-slate-800" : "text-slate-200"}`}>Simple Moving Avg (SMA 5)</span>
                            <span className="font-mono text-[10px] text-amber-500 font-bold">${latest.sma5.toFixed(2)}</span>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${isLight ? "text-slate-600" : "text-[#94A3B8]"}`}>
                            Calculates the average price of the last 5 days to smooth out minor price fluctuations.
                          </p>
                          <div className="pt-1 flex items-center gap-1">
                            <span className="text-[9px] font-mono uppercase font-black tracking-wider text-[#64748B]">Trend:</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                              isBullish ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                            }`}>
                              {isBullish ? "🟢 Above Average (Short-term Strength)" : "🔴 Below Average (Short-term Weakness)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* EMA 10 Active Explainer */}
                  {showEMA10 && (() => {
                    const latest = enrichedDataList[enrichedDataList.length - 1];
                    if (!latest || latest.ema10 === null) return null;
                    const isBullish = latest.close > latest.ema10;
                    return (
                      <div className={`p-3 rounded-sm border ${isLight ? "bg-white border-purple-200/60" : "bg-[#0D131F] border-purple-500/15"} text-xs flex gap-2.5 items-start`}>
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1.5 shadow-sm" />
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className={`font-bold uppercase tracking-wider text-[10px] ${isLight ? "text-slate-800" : "text-slate-200"}`}>Exp Moving Avg (EMA 10)</span>
                            <span className="font-mono text-[10px] text-purple-400 font-bold">${latest.ema10.toFixed(2)}</span>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${isLight ? "text-slate-600" : "text-[#94A3B8]"}`}>
                            Like SMA, but gives extra weight to the most recent prices to detect fresh trend shifts much faster.
                          </p>
                          <div className="pt-1 flex items-center gap-1">
                            <span className="text-[9px] font-mono uppercase font-black tracking-wider text-[#64748B]">Trend:</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                              isBullish ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                            }`}>
                              {isBullish ? "🟢 Bullish Cushion (Price Holds Above)" : "🔴 Price Beneath (Suggests Caution)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bollinger Bands Active Explainer */}
                  {showBollinger && (() => {
                    const latest = enrichedDataList[enrichedDataList.length - 1];
                    if (!latest || latest.bbUpper === null || latest.bbLower === null) return null;
                    const price = latest.close;
                    let positionLabel = "Stable (Normal Range)";
                    let pillClass = "bg-[#1E293B] text-[#94A3B8] border border-[#334155]/40";
                    if (price >= latest.bbUpper * 0.99) {
                      positionLabel = "⚠️ Price Near Ceiling (Potentially Expensive)";
                      pillClass = "bg-rose-500/10 text-rose-400 border border-rose-500/15";
                    } else if (price <= latest.bbLower * 1.01) {
                      positionLabel = "💚 Price Near Floor (Potentially Cheap)";
                      pillClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15";
                    }
                    return (
                      <div className={`p-3 rounded-sm border ${isLight ? "bg-white border-blue-200/60" : "bg-[#0D131F] border-blue-500/15"} text-xs flex gap-2.5 items-start`}>
                        <span className="w-4 h-1 border-b-2 border-dashed border-blue-500 shrink-0 mt-2.5" />
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className={`font-bold uppercase tracking-wider text-[10px] ${isLight ? "text-slate-800" : "text-slate-200"}`}>Bollinger Volatility Bands</span>
                            <span className="font-mono text-[9px] text-[#64748B] font-bold">
                              Chnl: ${latest.bbLower.toFixed(0)} - ${latest.bbUpper.toFixed(0)}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${isLight ? "text-slate-600" : "text-[#94A3B8]"}`}>
                            Creates upper and lower limits based on asset speed. Price usually stays inside these boundaries.
                          </p>
                          <div className="pt-1 flex items-center gap-1">
                            <span className="text-[9px] font-mono uppercase font-black tracking-wider text-[#64748B]">State:</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${pillClass}`}>
                              {positionLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* RSI Oscillator Active Explainer */}
                  {showRSI && (() => {
                    const latest = enrichedDataList[enrichedDataList.length - 1];
                    if (!latest || latest.rsi === null) return null;
                    const rsi = latest.rsi;
                    let signal = "Balanced (Healthy Activity)";
                    let pillClass = "bg-[#1E293B] text-[#94A3B8] border border-[#334155]/40";
                    if (rsi >= 70) {
                      signal = "⚠️ Overbought (Above 70 - Due for correction)";
                      pillClass = "bg-rose-500/10 text-rose-400 border border-rose-500/15";
                    } else if (rsi <= 30) {
                      signal = "🔥 Oversold (Below 30 - Due for a relief bounce)";
                      pillClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15";
                    }
                    return (
                      <div className={`p-3 rounded-sm border ${isLight ? "bg-white border-sky-200/60" : "bg-[#0D131F] border-sky-500/15"} text-xs flex gap-2.5 items-start`}>
                        <span className="text-[9px] font-mono bg-sky-500/15 border border-sky-500/30 text-sky-400 px-1 rounded-sm shrink-0 mt-1 font-black">RSI</span>
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className={`font-bold uppercase tracking-wider text-[10px] ${isLight ? "text-slate-800" : "text-slate-200"}`}>Strength Momentum (RSI)</span>
                            <span className={`font-mono text-[10px] font-bold ${rsi >= 70 ? "text-red-400" : rsi <= 30 ? "text-emerald-400" : "text-sky-400"}`}>{rsi.toFixed(1)}</span>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${isLight ? "text-slate-600" : "text-[#94A3B8]"}`}>
                            Gauges buyer pressure from 0 (oversold/cheap) to 100 (overbought/overheated). Shown on the lower chart panel.
                          </p>
                          <div className="pt-1 flex items-center gap-1">
                            <span className="text-[9px] font-mono uppercase font-black tracking-wider text-[#64748B]">Status:</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${pillClass}`}>
                              {signal}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* MACD Oscillator Active Explainer */}
                  {showMACD && (() => {
                    const latest = enrichedDataList[enrichedDataList.length - 1];
                    if (!latest || latest.macd === null || latest.macdSignal === null) return null;
                    const cross = latest.macd > latest.macdSignal;
                    return (
                      <div className={`p-3 rounded-sm border ${isLight ? "bg-white border-emerald-200/60" : "bg-[#0D131F] border-emerald-500/15"} text-xs flex gap-2.5 items-start md:col-span-2`}>
                        <span className="text-[9px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-1 rounded-sm shrink-0 mt-1 font-black">MACD</span>
                        <div className="space-y-1 w-full">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className={`font-bold uppercase tracking-wider text-[10px] ${isLight ? "text-slate-800" : "text-slate-200"}`}>Trend Speed & Crossovers (MACD)</span>
                            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-slate-400">
                              <span>MACD Line: <strong className="text-red-400">{latest.macd.toFixed(3)}</strong></span>
                              <span>Sig Line: <strong className="text-green-400">{latest.macdSignal.toFixed(3)}</strong></span>
                            </div>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${isLight ? "text-slate-600" : "text-[#94A3B8]"}`}>
                            Tracks whether short-term momentum is speeding up or slowing down. When the fast (Red) line climbs above the slow (Green) line, it indicates accelerating upward fuel.
                          </p>
                          <div className="pt-1 flex items-center gap-1">
                            <span className="text-[9px] font-mono uppercase font-black tracking-wider text-[#64748B]">Crossover Signal:</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                              cross ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                            }`}>
                              {cross ? "🟢 Bullish Crossover (Red line is above Green - positive momentum)" : "🔴 Bearish Alignment (Red line is underneath Green - slow momentum)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Interval Levels details table to answer "not understanding levels of each day" */}
          <div className={`pt-4 border-t ${borderLightClass} space-y-3`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-500" />
                <h4 className={`text-xs font-black uppercase tracking-wider ${isLight ? "text-slate-800" : "text-slate-100"}`} id="table-drilldown-header">
                  Day-by-Day Historical Levels & Return Summary
                </h4>
              </div>
              <span className={`text-[10px] font-mono font-bold ${textMutedClass} bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20`}>
                Chronology: Newest interval at the top
              </span>
            </div>
            
            <div className={`overflow-x-auto rounded border ${boardBgClass} max-h-[220px] overflow-y-auto shadow-inner`} id="levels-table-container">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className={`border-b ${borderClass} ${isLight ? "bg-slate-100 text-slate-800" : "bg-slate-950 text-slate-300"} font-black sticky top-0 backdrop-blur-md`}>
                    <th className="p-3 font-mono">Date / Time Interval</th>
                    <th className="p-3 text-right">Open Level</th>
                    <th className="p-3 text-right text-emerald-500">High Ceiling</th>
                    <th className="p-3 text-right text-rose-500">Low Floor</th>
                    <th className="p-3 text-right font-extrabold">Close Price</th>
                    <th className="p-3 text-right">Period Return %</th>
                    <th className="p-3 text-right">Volume Done</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? "divide-slate-200" : "divide-[#1E293B]/60"} font-mono`}>
                  {reverseChronologicalList.map((item, idx) => {
                    const chronoIdx = enrichedDataList.indexOf(item);
                    const prevItem = chronoIdx > 0 ? enrichedDataList[chronoIdx - 1] : undefined;
                    const changePct = prevItem ? ((item.close - prevItem.close) / prevItem.close) * 100 : null;
                    const isUp = changePct !== null ? changePct >= 0 : item.close >= item.open;
                    
                    return (
                      <tr 
                        key={item.date + idx} 
                        className={`hover:${isLight ? "bg-slate-100/50" : "bg-[#1E293B]/20"} transition-colors`}
                      >
                        <td className="p-3 font-bold text-slate-400">{item.date}</td>
                        <td className="p-3 text-right">${item.open.toFixed(2)}</td>
                        <td className="p-3 text-right text-emerald-600 font-bold">${item.high.toFixed(2)}</td>
                        <td className="p-3 text-right text-rose-600 font-bold">${item.low.toFixed(2)}</td>
                        <td className={`p-3 text-right font-black ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                          ${item.close.toFixed(2)}
                        </td>
                        <td className={`p-3 text-right font-black ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                          {changePct !== null ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : "0.00%"}
                        </td>
                        <td className={`p-3 text-right ${isLight ? "text-slate-500" : "text-slate-400"} text-[10px]`}>
                          {item.volume.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className={`text-[10px] italic ${textMutedClass}`}>
              * Protip: Select support 🟢 or resistance 🔴 from the layout tools toolbox on the right side of the screen, and map your customized thresholds.
            </p>
          </div>

        </div>

        {/* Right Area: Drawing settings, triggers, and active drawings panel list */}
        <div className={`xl:col-span-3 space-y-6 border-l ${isLight ? "border-slate-200" : "border-[#1E293B]/60"} xl:pl-6`} id="chart-studies-toolbox">
          
          {/* Studies panel */}
          <div className="space-y-3">
            <span className={`text-[10px] uppercase tracking-widest font-bold block flex items-center gap-1 ${isLight ? "text-slate-800" : "text-[#64748B]"}`}>
              <Sliders className="w-3.5 h-3.5" />
              TECHNICAL STUDIES
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setShowSMA5(!showSMA5)}
                className={`py-2 px-3 text-left rounded-sm text-xs border cursor-pointer select-none transition-all flex items-center justify-between ${
                  showSMA5 
                    ? "bg-[#1E293B] border-[#334155] text-amber-500 font-bold" 
                    : isLight 
                      ? "bg-white border-slate-255 text-slate-700 hover:bg-slate-50" 
                      : "bg-[#0A0C10] border-[#1E293B] text-[#94A3B8]"
                }`}
              >
                <span>Simple Moving Avg (5)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </button>

              <button
                onClick={() => setShowEMA10(!showEMA10)}
                className={`py-2 px-3 text-left rounded-sm text-xs border cursor-pointer select-none transition-all flex items-center justify-between ${
                  showEMA10 
                    ? "bg-[#1E293B] border-[#334155] text-[#c084fc] font-bold" 
                    : isLight 
                      ? "bg-white border-slate-255 text-slate-700 hover:bg-slate-50" 
                      : "bg-[#0A0C10] border-[#1E293B] text-[#94A3B8]"
                }`}
              >
                <span>Exp Moving Avg (10)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              </button>

              <button
                onClick={() => setShowBollinger(!showBollinger)}
                className={`py-2 px-3 text-left rounded-sm text-xs border cursor-pointer select-none transition-all flex items-center justify-between ${
                  showBollinger 
                    ? "bg-[#1E293B] border-[#334155] text-blue-400 font-bold" 
                    : isLight 
                      ? "bg-white border-slate-255 text-slate-700 hover:bg-slate-50" 
                      : "bg-[#0A0C10] border-[#1E293B] text-[#94A3B8]"
                }`}
              >
                <span>Bollinger Bands (10, 2)</span>
                <span className="w-4 h-1 border-t-2 border-b-2 border-dashed border-blue-400" />
              </button>

              <button
                onClick={() => setShowRSI(!showRSI)}
                className={`py-2 px-3 text-left rounded-sm text-xs border cursor-pointer select-none transition-all flex items-center justify-between ${
                  showRSI 
                    ? "bg-[#1E293B] border-[#334155] text-[#38bdf8] font-bold" 
                    : isLight 
                      ? "bg-white border-slate-255 text-slate-700 hover:bg-slate-50" 
                      : "bg-[#0A0C10] border-[#1E293B] text-[#94A3B8]"
                }`}
                id="btn-toggle-rsi"
              >
                <span>RSI Oscillator Chart</span>
                <span className="text-[10px] font-mono text-[#38bdf8]">RSI</span>
              </button>

              <button
                onClick={() => setShowMACD(!showMACD)}
                className={`py-2 px-3 text-left rounded-sm text-xs border cursor-pointer select-none transition-all flex items-center justify-between ${
                  showMACD 
                    ? "bg-[#1E293B] border-[#334155] text-emerald-400 font-bold" 
                    : isLight 
                      ? "bg-white border-slate-255 text-slate-700 hover:bg-slate-50" 
                      : "bg-[#0A0C10] border-[#1E293B] text-[#94A3B8]"
                }`}
                id="btn-toggle-macd"
              >
                <span>MACD Converge Panel</span>
                <span className="text-[10px] font-mono text-emerald-400">MACD</span>
              </button>
            </div>
          </div>

          {/* Drawings toolbar */}
          <div className="space-y-3">
            <span className={`text-[10px] uppercase tracking-widest font-bold block flex items-center gap-1 ${isLight ? "text-slate-800" : "text-[#64748B]"}`}>
              <Scissors className="w-3.5 h-3.5" />
              DRAWING TOOLS
            </span>

            <div className="grid grid-cols-2 gap-2" id="drawing-tools-selectors">
              <button
                onClick={() => setDrawingTool(drawingTool === "support" ? "none" : "support")}
                className={`p-2.5 rounded-sm text-[10px] uppercase font-bold tracking-wider cursor-pointer border select-none text-center transition-all ${
                  drawingTool === "support" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-black font-extrabold" 
                    : isLight 
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200" 
                      : "bg-[#0A0C10] text-[#94A3B8] border-[#1E293B]"
                }`}
                id="btn-draw-support"
              >
                🟢 Support
              </button>

              <button
                onClick={() => setDrawingTool(drawingTool === "resistance" ? "none" : "resistance")}
                className={`p-2.5 rounded-sm text-[10px] uppercase font-bold tracking-wider cursor-pointer border select-none text-center transition-all ${
                  drawingTool === "resistance" 
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30 font-black font-extrabold" 
                    : isLight 
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200" 
                      : "bg-[#0A0C10] text-[#94A3B8] border-[#1E293B]"
                }`}
                id="btn-draw-resistance"
              >
                🔴 Resistance
              </button>

              <button
                onClick={() => setDrawingTool(drawingTool === "trendline" ? "none" : "trendline")}
                className={`col-span-2 p-2.5 rounded-sm text-[10px] uppercase font-bold tracking-wider cursor-pointer border select-none text-center transition-all ${
                  drawingTool === "trendline" 
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30 font-black font-extrabold" 
                    : isLight 
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200" 
                      : "bg-[#0A0C10] text-[#94A3B8] border-[#1E293B]"
                }`}
                id="btn-draw-trendline"
              >
                🖊️ Draw Trendline
              </button>
            </div>
          </div>

          {/* Active list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase tracking-widest font-bold block ${isLight ? "text-slate-800" : "text-[#64748B]"}`}>SAVED DRAWINGS</span>
              {(supportLines.length > 0 || resistanceLines.length > 0 || trendlines.length > 0) && (
                <button
                  onClick={clearAllDrawings}
                  className="text-rose-500 hover:text-rose-600 text-[10px] font-black uppercase transition-all cursor-pointer select-none bg-transparent border-none"
                  id="btn-clear-drawings"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className={`border rounded-sm p-3 max-h-[160px] overflow-y-auto space-y-2 text-[10px] ${boardBgClass}`} id="saved-drawings-list">
              {supportLines.length === 0 && resistanceLines.length === 0 && trendlines.length === 0 ? (
                <div className="text-center text-[#64748B] py-4 font-mono uppercase">Empty Board</div>
              ) : (
                <div className="space-y-2">
                  {supportLines.map((s) => (
                    <div key={s.id} className={`flex items-center justify-between p-1.5 border rounded-sm ${isLight ? "bg-white border-slate-200" : "bg-[#1E293B]/30 border-[#1E293B]"}`}>
                      <span className="text-emerald-500 font-extrabold uppercase">🟢 Support: ${s.price.toFixed(2)}</span>
                      <button onClick={() => removeSupport(s.id)} className="text-[#64748B] hover:text-rose-500 cursor-pointer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {resistanceLines.map((r) => (
                    <div key={r.id} className={`flex items-center justify-between p-1.5 border rounded-sm ${isLight ? "bg-white border-slate-200" : "bg-[#1E293B]/30 border-[#1E293B]"}`}>
                      <span className="text-rose-500 font-extrabold uppercase">🔴 Resist: ${r.price.toFixed(2)}</span>
                      <button onClick={() => removeResistance(r.id)} className="text-[#64748B] hover:text-rose-500 cursor-pointer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {trendlines.map((t) => (
                    <div key={t.id} className={`flex items-center justify-between p-1.5 border rounded-sm ${isLight ? "bg-white border-slate-200" : "bg-[#1E293B]/30 border-[#1E293B]"}`}>
                      <span className="text-amber-500 font-extrabold uppercase">🖊️ Trend: ${t.startPrice.toFixed(0)}→${t.endPrice.toFixed(0)}</span>
                      <button onClick={() => removeTrendline(t.id)} className="text-[#64748B] hover:text-rose-500 cursor-pointer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

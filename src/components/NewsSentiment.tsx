import { useState, useEffect } from "react";
import { Newspaper, HelpCircle, Activity, ExternalLink, ArrowUpRight, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Article {
  title: string;
  source: string;
  url: string;
  sentiment: string;
}

interface NewsSentimentData {
  ticker: string;
  sentiment: string;
  score: number;
  summary: string;
  drivers: string[];
  articles: Article[];
  simulated?: boolean;
  errorFeedback?: string;
}

interface NewsSentimentProps {
  ticker: string;
}

export default function NewsSentiment({ ticker }: NewsSentimentProps) {
  const [data, setData] = useState<NewsSentimentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchSentiment = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/news-sentiment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ticker }),
        });

        if (!res.ok) {
          throw new Error("Failed to process news sentiment stream.");
        }

        const sentimentResult = await res.json();
        if (active) {
          setData(sentimentResult);
        }
      } catch (err: any) {
        if (active) {
          setErrorMsg(err.message || "News stream service is temporarily congested.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchSentiment();
    return () => {
      active = false;
    };
  }, [ticker]);

  const getSentimentColors = (sent: string) => {
    const s = sent.toUpperCase();
    if (s.includes("POS")) {
      return {
        bg: "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
        meter: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]",
        textColor: "text-emerald-400",
      };
    } else if (s.includes("NEG")) {
      return {
        bg: "bg-rose-500/5 text-rose-400 border-rose-500/10",
        meter: "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]",
        textColor: "text-rose-400",
      };
    }
    return {
      bg: "bg-blue-500/5 text-blue-400 border-blue-500/10",
      meter: "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]",
      textColor: "text-blue-400",
    };
  };

  return (
    <div className="bg-[#0F172A] rounded-sm border border-[#1E293B] p-6 shadow-md flex flex-col h-full" id="news-sentiment-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-display font-semibold text-lg text-[#E2E8F0] flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-500" />
            News Sentiment Intelligence
          </h3>
          <p className="text-xs text-[#94A3B8]">Grounded sentiment index and narrative accelerators</p>
        </div>
        {data && data.simulated && (
          <div className="flex flex-col sm:items-end gap-1">
            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest w-fit">
              Simulated News Feed
            </span>
            {data.errorFeedback && (
              <span className="text-[9px] text-[#94A3B8] font-mono" title={data.errorFeedback}>
                Quota Exceeded (429)
              </span>
            )}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12" id="sentiment-loading" key="loading">
            <div className="w-8 h-8 rounded-sm border-2 border-[#1E293B] border-t-blue-500 animate-spin mb-3" />
            <p className="text-xs text-[#64748B] font-mono tracking-wider uppercase animate-pulse">Scanning news wires...</p>
          </div>
        ) : errorMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-[#94A3B8]" id="sentiment-error" key="error">
            <p className="text-rose-400 font-semibold mb-1">Sentiment scan failed</p>
            <p className="opacity-80">{errorMsg}</p>
          </div>
        ) : data ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 flex-1 flex flex-col justify-between"
            id="sentiment-content"
            key="content"
          >
            {/* Sentiment Summary Metric Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-[#0A0C10] rounded-sm p-5 border border-[#1E293B]">
              <div className="flex flex-col items-center justify-center p-3 text-center border-b md:border-b-0 md:border-r border-[#1E293B]">
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Sentiment Dial</span>
                
                <div className={`mt-2 px-3 py-1 rounded-sm text-xs font-bold tracking-wider uppercase border ${getSentimentColors(data.sentiment).bg}`}>
                  {data.sentiment}
                </div>

                <div className="text-xs text-[#94A3B8] font-mono mt-3">
                  Confidence: <span className="font-bold text-[#E2E8F0]">{data.score}%</span>
                </div>

                {/* Score Bar */}
                <div className="w-24 bg-[#1E293B] h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${getSentimentColors(data.sentiment).meter}`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
              </div>

              <div className="md:col-span-2 text-[#94A3B8] text-xs leading-relaxed">
                <span className="font-bold text-[#E2E8F0] block mb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Qualitative Narrative Summary
                </span>
                {data.summary}
              </div>
            </div>

            {/* Drivers list */}
            <div>
              <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-3">Key Sentiment Drivers</h4>
              <ul className="space-y-2.5">
                {data.drivers.map((driver, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs text-[#94A3B8]">
                    <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Verified Feed */}
            <div>
              <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-3">Recent News Context</h4>
              <div className="space-y-2.5">
                {data.articles.map((art, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-[#1E293B] hover:border-[#334155] rounded-sm bg-[#0A0C10] flex items-start justify-between gap-3 transition-all"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wide block">
                        {art.source}
                      </span>
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noreferrer"
                        referrerPolicy="no-referrer"
                        className="text-xs font-bold text-[#E2E8F0] hover:text-blue-400 transition-colors leading-snug block flex items-center gap-1.5"
                      >
                        {art.title}
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                      </a>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-wider uppercase shrink-0 border ${getSentimentColors(art.sentiment).bg}`}>
                      {art.sentiment}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

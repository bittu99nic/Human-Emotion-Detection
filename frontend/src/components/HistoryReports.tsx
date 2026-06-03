"use client";

import { useEffect, useState } from "react";
import { TableProperties, Download, Trash2, CalendarRange, Info } from "lucide-react";
import { HolographicCard } from "./HolographicCard";
import { exportToCSV, exportToJSON } from "@/utils/exportData";
import { getBackendUrl } from "@/utils/api";

interface SessionLog {
  id: string;
  timestamp: string;
  emotion: string;
  data_points: number;
  device_info: string;
}

export function HistoryReports() {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionHistory = async () => {
    const token = localStorage.getItem("aura_token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const baseUrl = getBackendUrl("http");
      const response = await fetch(`${baseUrl}/api/history/sessions`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        throw new Error("Failed to load database session history.");
      }
    } catch (e: any) {
      console.error("[AURA ARCHIVES] Error loading sessions:", e);
      setError(e.message || "Failed to load database. Verify backend server is active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionHistory();
  }, []);

  const getEmotionColor = (emo: string) => {
    switch (emo.toLowerCase()) {
      case "happy": return "bg-cyber-green/20 border-cyber-green/40 text-cyber-green";
      case "sad": return "bg-blue-600/20 border-blue-500/40 text-blue-400";
      case "angry": return "bg-cyber-pink/20 border-cyber-pink/40 text-cyber-pink";
      case "fear": return "bg-cyber-purple/20 border-cyber-purple/40 text-cyber-purple";
      case "surprise": return "bg-cyber-yellow/20 border-cyber-yellow/40 text-cyber-yellow";
      case "neutral": return "bg-slate-700/20 border-slate-500/40 text-slate-300";
      default: return "bg-slate-900 border-slate-700 text-slate-500";
    }
  };

  const heatmapHours = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"];
  const dummyEmotions = ["happy", "neutral", "sad", "neutral", "surprise", "angry", "happy", "fear", "neutral", "neutral"];

  const getHeatmapColor = (index: number) => {
    const seed = (index * 7) % dummyEmotions.length;
    const emo = dummyEmotions[seed];
    switch (emo) {
      case "happy": return "bg-cyber-green border border-cyber-green/50 shadow-[0_0_5px_rgba(57,255,20,0.4)]";
      case "sad": return "bg-blue-500 border border-blue-500/50";
      case "angry": return "bg-cyber-pink border border-cyber-pink/50 shadow-[0_0_5px_rgba(255,0,127,0.4)]";
      case "surprise": return "bg-cyber-yellow border border-cyber-yellow/50";
      case "fear": return "bg-cyber-purple border border-cyber-purple/50";
      default: return "bg-slate-800 border border-slate-800/50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heatmap Grid Panel */}
        <div className="lg:col-span-1">
          <HolographicCard title="Chronological Emotion Grid">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                <CalendarRange className="w-4 h-4 text-cyber-cyan" />
                <span>14-DAY SENTIMENT VARIATION OVER TIME</span>
              </div>
              
              <div className="flex gap-2">
                <div className="flex flex-col justify-between text-[9px] font-mono text-slate-500 py-1 select-none">
                  {heatmapHours.map((h, i) => <span key={i}>{h}</span>)}
                </div>
                
                <div className="flex-1 grid grid-cols-14 gap-1.5">
                  {Array.from({ length: 14 * 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square w-full rounded-sm transition-all duration-300 hover:scale-125 hover:z-10 ${getHeatmapColor(i)}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-cyber-border/20 pt-3 text-[9px] font-mono text-slate-400">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyber-green" /><span>Happy</span></div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-800" /><span>Neutral</span></div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" /><span>Sad</span></div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyber-pink" /><span>Angry</span></div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyber-purple" /><span>Aroused</span></div>
              </div>
            </div>
          </HolographicCard>
        </div>

        {/* Real Sessions Table List */}
        <div className="lg:col-span-2">
          <HolographicCard
            title="Archived Sensory Logs (SQLite DB)"
            headerRight={
              <div className="flex gap-2">
                <button
                  onClick={() => exportToCSV(logs, "aura_session_history.csv")}
                  className="p-1 hover:text-cyber-cyan transition-colors"
                  title="CSV Export"
                  disabled={logs.length === 0}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => exportToJSON(logs, "aura_session_history.json")}
                  className="p-1 hover:text-cyber-cyan transition-colors"
                  title="JSON Export"
                  disabled={logs.length === 0}
                >
                  <TableProperties className="w-4 h-4" />
                </button>
                <button
                  onClick={fetchSessionHistory}
                  className="p-1 hover:text-cyber-cyan transition-colors"
                  title="Refresh Logs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            }
          >
            {loading ? (
              <div className="h-48 flex items-center justify-center font-mono text-xs text-cyber-cyan animate-pulse">
                QUERYING SQLITE TRANSACTION ARCHIVES...
              </div>
            ) : error ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 font-mono text-xs text-cyber-pink">
                <Info className="w-6 h-6 animate-pulse" />
                <span>{error}</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-center text-slate-500 font-mono text-xs p-4 border border-dashed border-cyber-border/20 rounded-lg">
                <Info className="w-6 h-6 text-slate-600 animate-pulse" />
                <span>DATABASE INSTANCE CONTAINS 0 LOGGED SESSIONS.</span>
                <p className="text-[10px] text-slate-600 max-w-sm mt-1">
                  Connect sensors under the Live Telemetry screen. AURA X will automatically register user IDs and write frames telemetry to databases.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-cyber-border/30 text-slate-400 uppercase tracking-widest text-[9px]">
                      <th className="pb-2">Session Timestamp</th>
                      <th className="pb-2">Primary Sentiment</th>
                      <th className="pb-2 text-center">Data Points Logged</th>
                      <th className="pb-2">Sensor Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/10 text-slate-300">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-2.5 font-semibold text-slate-300">{log.timestamp}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${getEmotionColor(log.emotion)}`}>
                            {log.emotion}
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-bold text-cyber-cyan">{log.data_points} frames</td>
                        <td className="py-2.5 text-slate-400 uppercase">{log.device_info}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </HolographicCard>
        </div>

      </div>
    </div>
  );
}

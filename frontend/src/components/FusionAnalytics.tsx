"use client";

import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Cpu, Heart, Flame, Compass, Brain } from "lucide-react";
import { HolographicCard } from "./HolographicCard";
import { FusionData } from "@/hooks/useWebSocket";
import { EMOTIONS } from "../../../backend/config"; // We can redefine it locally or import

const LOCAL_EMOTIONS = ["happy", "sad", "angry", "fear", "surprise", "neutral", "disgust"];

interface FusionAnalyticsProps {
  fusion: FusionData | null;
  historyTimeline: any[];
}

export function FusionAnalytics({ fusion, historyTimeline }: FusionAnalyticsProps) {
  const [mounted, setMounted] = useState(false);

  // Prevent SSR Hydration errors from Recharts rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 flex items-center justify-center font-mono text-xs text-cyber-cyan animate-pulse">SYNCHRONIZING HUDS...</div>;
  }

  // Get active values
  const activeEmotion = fusion?.label || "neutral";
  const confidence = fusion?.confidence || 0.0;
  const intensity = fusion?.intensity || 0.0;
  const stress = fusion?.stress_level || 0.0;
  const engagement = fusion?.engagement_score || 0.0;
  const probs = fusion?.probs || Array(7).fill(0.14);

  // Build Radar Data
  const radarData = LOCAL_EMOTIONS.map((emo, index) => ({
    subject: emo.toUpperCase(),
    value: Math.round((probs[index] || 0) * 100),
  }));

  // Create localized AI narrative insights
  const getAIInsight = () => {
    if (stress > 0.7) {
      return {
        alert: "STRESS DANGER INDEX HIGH",
        desc: "Significant arousal and low valence indicators flagged. Heart rate / pitch tremors suspected. Engage box-breathing: Inhale 4s, Hold 4s, Exhale 4s.",
        color: "text-cyber-pink border-cyber-pink/30 bg-cyber-pink/5"
      };
    }
    if (engagement < 0.3) {
      return {
        alert: "COGNITIVE DRIFT DETECTED",
        desc: "Engagement metrics drop below threshold. High sad/neutral flatlines. Recommend audio stimulation or physical stance reset to recover focus.",
        color: "text-cyber-yellow border-cyber-yellow/30 bg-cyber-yellow/5"
      };
    }
    if (intensity > 0.8) {
      return {
        alert: "HIGH EMOTIONAL AMPLITUDE",
        desc: "Sensory peaks captured across face and speech. Cognitive expression states are highly pronounced. Unified engagement is optimal.",
        color: "text-cyber-green border-cyber-green/30 bg-cyber-green/5"
      };
    }
    return {
      alert: "PSYCHO-SENSORY STABILIZED",
      desc: "All indicators hovering within baseline bounds. Synaptic focus and valence scales suggest high neural balance. Engine calibrated.",
      color: "text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/5"
    };
  };

  const insight = getAIInsight();

  // Circular Meter SVG Helper
  const CircularProgress = ({ value, label, icon: Icon, colorClass }: any) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value * circumference);
    
    return (
      <div className="flex flex-col items-center gap-2 bg-slate-950/40 p-3 rounded-lg border border-cyber-border/10 flex-1">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              className="text-slate-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="32"
              cy="32"
            />
            <circle
              className={colorClass}
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="32"
              cy="32"
            />
          </svg>
          <div className="absolute flex items-center justify-center">
            <Icon className="w-5 h-5 opacity-90" />
          </div>
        </div>
        <div className="text-center font-mono">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</div>
          <div className="text-sm font-bold text-white">{(value * 100).toFixed(0)}%</div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left panel: Fused state circular meters + Radar */}
      <div className="space-y-6">
        {/* Core fused emotion card */}
        <HolographicCard title="Decision Fusion Matrix">
          <div className="space-y-5">
            {/* Unified status grid */}
            <div className="flex items-center justify-between bg-[#0e1627]/60 border border-cyber-border/20 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1 bg-cyber-cyan/10 border-b border-l border-cyber-border/30 text-[9px] font-mono text-cyber-cyan">FUSION ACTIVE</div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">PREDICTED STATE</div>
                <div className="text-3xl font-extrabold text-white tracking-wider flex items-center gap-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-purple uppercase">{activeEmotion}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 tracking-widest">STRENGTH INDEX</div>
                <div className="text-2xl font-bold text-cyber-cyan">{(confidence * 100).toFixed(0)}%</div>
              </div>
            </div>

            {/* Circular Meters */}
            <div className="flex gap-4">
              <CircularProgress
                value={intensity}
                label="Intensity"
                icon={Flame}
                colorClass="text-cyber-pink"
              />
              <CircularProgress
                value={stress}
                label="Stress Index"
                icon={Heart}
                colorClass="text-cyber-purple"
              />
              <CircularProgress
                value={engagement}
                label="Engagement"
                icon={Compass}
                colorClass="text-cyber-green"
              />
            </div>
          </div>
        </HolographicCard>

        {/* AI narrative Insights */}
        <HolographicCard title="AI Psycho-Sensory Insights">
          <div className={`border p-4 rounded-lg space-y-2 ${insight.color}`}>
            <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider">
              <Brain className="w-4 h-4" />
              <span>{insight.alert}</span>
            </div>
            <p className="text-xs font-light leading-relaxed text-slate-300">
              {insight.desc}
            </p>
          </div>
        </HolographicCard>
      </div>

      {/* Right panel: Radar Chart and Time chart */}
      <div className="space-y-6">
        <HolographicCard title="Vector Probabilities">
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" radius="70%" data={radarData}>
                <PolarGrid stroke="rgba(0, 240, 255, 0.15)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#94a3b8", fontSize: 9, fontFamily: "var(--font-outfit)" }}
                />
                <Radar
                  name="Confidence"
                  dataKey="value"
                  stroke="#00f0ff"
                  fill="#00f0ff"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </HolographicCard>

        {/* Timeline Line Chart */}
        {historyTimeline.length > 0 && (
          <HolographicCard title="Sensory Timeline tracking">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyTimeline}>
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fill: "#64748b", fontSize: 9 }}
                    stroke="rgba(0,240,255,0.1)"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#64748b", fontSize: 9 }}
                    stroke="rgba(0,240,255,0.1)"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10, 15, 26, 0.95)",
                      border: "1px solid rgba(0, 240, 255, 0.2)",
                      borderRadius: "6px",
                      fontSize: "11px",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    name="Stress %"
                    stroke="#ff007f"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    name="Engagement %"
                    stroke="#39ff14"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="intensity"
                    name="Intensity %"
                    stroke="#00f0ff"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </HolographicCard>
        )}
      </div>
    </div>
  );
}

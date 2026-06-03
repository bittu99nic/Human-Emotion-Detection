"use client";

import { useEffect, useState, useCallback } from "react";
import { getBackendUrl } from "@/utils/api";
import {
  Cpu,
  Activity,
  Heart,
  CalendarRange,
  Flame,
  BrainCircuit,
  Sliders,
  LogOut,
  Users,
  Compass,
  Server,
} from "lucide-react";
import Link from "next/link";

import { useWebSocket } from "@/hooks/useWebSocket";
import { WebcamAnalysis } from "@/components/WebcamAnalysis";
import { VoiceStudio } from "@/components/VoiceStudio";
import { FusionAnalytics } from "@/components/FusionAnalytics";
import { HistoryReports } from "@/components/HistoryReports";
import { TherapistPanel } from "@/components/TherapistPanel";
import { TeamAnalytics } from "@/components/TeamAnalytics";
import { ModelTrainingCenter } from "@/components/ModelTrainingCenter";
import { SettingsPanel } from "@/components/SettingsPanel";
import { AdminMonitor } from "@/components/AdminMonitor";
import { WebGLOrb } from "@/components/WebGLOrb";

type ActiveTabType = "live" | "reports" | "therapist" | "teams" | "training" | "settings" | "admin";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>("live");
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  
  // Real-time sensor state timelines
  const [historyTimeline, setHistoryTimeline] = useState<any[]>([]);

  // 1. Authenticate user on mount
  useEffect(() => {
    const t = localStorage.getItem("aura_token");
    const u = localStorage.getItem("aura_username");
    const r = localStorage.getItem("aura_role");
    
    if (!t) {
      // Bounce unauthorized users back to login landing
      window.location.href = "/";
    } else {
      setToken(t);
      setUsername(u);
      setRole(r);
    }
  }, []);

  // 2. Establish live database-linked WebSocket connection
  const socketUrl = token 
    ? `${getBackendUrl("ws")}/ws/stream?token=${encodeURIComponent(token)}` 
    : `${getBackendUrl("ws")}/ws/stream`;

  const { isConnected, lastPayload, sendData, error } = useWebSocket(socketUrl);

  const handleFrameCaptured = useCallback((base64Frame: string) => {
    sendData({ video: base64Frame });
  }, [sendData]);

  const handleAudioCaptured = useCallback((base64Audio: string) => {
    sendData({ audio: base64Audio });
  }, [sendData]);

  // Telemetry updates
  useEffect(() => {
    if (!lastPayload?.fusion) return;

    setHistoryTimeline(prev => {
      const newPoint = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        stress: Math.round(lastPayload.fusion.stress_level * 100),
        engagement: Math.round(lastPayload.fusion.engagement_score * 100),
        intensity: Math.round(lastPayload.fusion.intensity * 100),
      };

      const updated = [...prev, newPoint];
      if (updated.length > 20) {
        updated.shift();
      }
      return updated;
    });
  }, [lastPayload]);

  const handleFileAnalysisResult = (result: any) => {
    alert(`File evaluated! Primary mood: ${result.primary_emotion.toUpperCase()}. Timeline loaded.`);
    const formattedTimeline = result.timeline.map((item: any) => ({
      timestamp: `File:${item.timestamp}s`,
      stress: Math.round(item.stress_level * 100),
      engagement: Math.round(item.engagement_score * 100),
      intensity: Math.round(item.intensity * 100),
    }));
    setHistoryTimeline(formattedTimeline);
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "live": return "Multi-Sensor Bio-Metric Telemetry";
      case "reports": return "Chronological Archives & Heatmaps";
      case "therapist": return "AI Therapist Cognitive Support";
      case "teams": return "Organizational Sentiment analytics";
      case "training": return "Model Training Console";
      case "settings": return "Sensor Calibration Settings";
      case "admin": return "Administrative Telemetry Panel";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("aura_token");
    localStorage.removeItem("aura_username");
    localStorage.removeItem("aura_role");
    window.location.href = "/";
  };

  // Safe checks before render
  if (!token) {
    return <div className="h-screen bg-cyber-bg flex items-center justify-center font-mono text-xs text-cyber-cyan animate-pulse">AUTHORIZING CREDENTIAL NODES...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-cyber-bg relative font-sans text-slate-200">
      
      {/* Side Navigation HUD */}
      <aside className="w-64 bg-cyber-dark/80 border-r border-cyber-border/40 backdrop-blur-md flex flex-col justify-between z-20 shrink-0">
        <div>
          {/* Logo container */}
          <div className="p-6 border-b border-cyber-border/20 flex items-center gap-3 select-none">
            <div className="relative w-7 h-7 rounded-md bg-cyber-cyan/10 border border-cyber-cyan flex items-center justify-center pulse-cyan-glow">
              <div className="absolute w-1.5 h-1.5 rounded-full bg-cyber-cyan" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-sm text-white">AURA X</span>
              <span className="text-[9px] block font-mono text-cyber-cyan uppercase -mt-1 tracking-widest">SENSORY PORTAL</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5 font-mono text-xs">
            <button
              onClick={() => setActiveTab("live")}
              className={`w-full text-left py-3 px-4 rounded flex items-center gap-3 transition-colors ${
                activeTab === "live"
                  ? "bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
              }`}
            >
              <Activity className="w-4 h-4" />
              LIVE TELEMETRY
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full text-left py-3 px-4 rounded flex items-center gap-3 transition-colors ${
                activeTab === "reports"
                  ? "bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              ARCHIVES & PLOTS
            </button>

            <button
              onClick={() => setActiveTab("therapist")}
              className={`w-full text-left py-3 px-4 rounded flex items-center gap-3 transition-colors ${
                activeTab === "therapist"
                  ? "bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
              }`}
            >
              <Heart className="w-4 h-4" />
              AI THERAPIST MODE
            </button>

            <button
              onClick={() => setActiveTab("teams")}
              className={`w-full text-left py-3 px-4 rounded flex items-center gap-3 transition-colors ${
                activeTab === "teams"
                  ? "bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
              }`}
            >
              <Users className="w-4 h-4" />
              TEAM ANALYTICS
            </button>

            <button
              onClick={() => setActiveTab("training")}
              className={`w-full text-left py-3 px-4 rounded flex items-center gap-3 transition-colors ${
                activeTab === "training"
                  ? "bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              MODEL MANAGER
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full text-left py-3 px-4 rounded flex items-center gap-3 transition-colors ${
                activeTab === "settings"
                  ? "bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
              }`}
            >
              <Sliders className="w-4 h-4" />
              CALIBRATION
            </button>

            {/* Reveal Administrative screen only to Admin accounts */}
            {role === "admin" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`w-full text-left py-3 px-4 rounded flex items-center gap-3 transition-colors ${
                  activeTab === "admin"
                    ? "bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                }`}
              >
                <Server className="w-4 h-4" />
                ADMIN MONITOR
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-cyber-border/20 space-y-4 font-mono text-[10px]">
          <div className="flex items-center justify-between p-2 rounded bg-slate-950/55 border border-cyber-border/10">
            <span className="text-slate-500">SOCKET MATRIX</span>
            <span className={`font-bold flex items-center gap-1 ${isConnected ? "text-cyber-green" : "text-cyber-pink"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-cyber-green animate-ping" : "bg-cyber-pink"}`} />
              {isConnected ? "CONNECTED" : "LINK ERROR"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 border border-cyber-pink/30 hover:bg-cyber-pink/15 text-cyber-pink rounded font-bold text-center flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            EXIT PORTAL
          </button>
        </div>
      </aside>

      {/* Main Workspace Section */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Core HUD Header */}
        <header className="h-16 border-b border-cyber-border/40 bg-cyber-dark/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] block font-mono text-cyber-cyan uppercase tracking-widest">AURA OS // SCREEN CONTROL</span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{getHeaderTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-6 font-mono text-[10px] text-slate-400 select-none">
            <div className="flex flex-col text-right">
              <span className="text-[8px] text-slate-500">NODE KEY</span>
              <span className="text-cyber-cyan font-bold uppercase">{username}</span>
            </div>
            <div className="hidden sm:flex flex-col text-right border-l border-cyber-border/20 pl-4">
              <span className="text-[8px] text-slate-500">ENGINE LATENCY</span>
              <span className="text-cyber-green font-bold">~140 ms</span>
            </div>
          </div>
        </header>

        {/* View container */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-cyber-pink/5 border border-cyber-pink/35 text-cyber-pink text-xs font-mono p-3 rounded-lg flex items-center gap-2">
              <span className="font-bold uppercase">[SOCKET ERROR]</span>
              <span>{error} - Retrying connection...</span>
            </div>
          )}

          {activeTab === "live" && (
            <div className="space-y-6">
              {/* Webcam + Voice grids */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Visual Camera Panel */}
                <div className="xl:col-span-1">
                  <WebcamAnalysis
                    onFrameCaptured={handleFrameCaptured}
                    faces={lastPayload?.faces || []}
                    isConnected={isConnected}
                  />
                </div>

                {/* WebGL Sensory Sphere Centerpiece */}
                <div className="xl:col-span-1">
                  <WebGLOrb
                    emotion={lastPayload?.fusion.label || "neutral"}
                    intensity={lastPayload?.fusion.intensity || 0.4}
                    stress={lastPayload?.fusion.stress_level || 0.1}
                    engagement={lastPayload?.fusion.engagement_score || 0.6}
                  />
                </div>

                {/* Voice Acoustic Panel */}
                <div className="xl:col-span-1">
                  <VoiceStudio
                    onAudioCaptured={handleAudioCaptured}
                    onAnalysisResult={handleFileAnalysisResult}
                    isConnected={isConnected}
                  />
                </div>

              </div>

              {/* Fused analytics graphs */}
              <FusionAnalytics
                fusion={lastPayload?.fusion || null}
                historyTimeline={historyTimeline}
              />
            </div>
          )}

          {activeTab === "reports" && <HistoryReports />}
          
          {activeTab === "therapist" && <TherapistPanel fusion={lastPayload?.fusion || null} />}
          
          {activeTab === "teams" && <TeamAnalytics />}
          
          {activeTab === "training" && <ModelTrainingCenter />}
          
          {activeTab === "settings" && <SettingsPanel />}

          {activeTab === "admin" && role === "admin" && <AdminMonitor />}
        </main>
      </div>

    </div>
  );
}

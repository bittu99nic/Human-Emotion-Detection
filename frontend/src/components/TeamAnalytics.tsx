"use client";

import { useState } from "react";
import { Users, PhoneCall, GraduationCap, UserCheck, Flame, Heart, AlertTriangle } from "lucide-react";
import { HolographicCard } from "./HolographicCard";

export function TeamAnalytics() {
  const [activeMode, setActiveMode] = useState<"call" | "class" | "interview">("call");

  return (
    <div className="space-y-6">
      {/* Mode selection HUD */}
      <div className="flex gap-4 border-b border-cyber-border/20 pb-4">
        <button
          onClick={() => setActiveMode("call")}
          className={`py-2 px-4 rounded font-mono text-xs flex items-center gap-2 border transition-all ${
            activeMode === "call"
              ? "bg-cyber-pink/10 border-cyber-pink text-cyber-pink shadow-[0_0_10px_rgba(255,0,127,0.2)]"
              : "bg-slate-900/30 border-cyber-border/30 text-slate-400 hover:text-slate-300"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          CALL CENTER
        </button>

        <button
          onClick={() => setActiveMode("class")}
          className={`py-2 px-4 rounded font-mono text-xs flex items-center gap-2 border transition-all ${
            activeMode === "class"
              ? "bg-cyber-green/10 border-cyber-green text-cyber-green shadow-[0_0_10px_rgba(57,255,20,0.2)]"
              : "bg-slate-900/30 border-cyber-border/30 text-slate-400 hover:text-slate-300"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          CLASSROOM FEED
        </button>

        <button
          onClick={() => setActiveMode("interview")}
          className={`py-2 px-4 rounded font-mono text-xs flex items-center gap-2 border transition-all ${
            activeMode === "interview"
              ? "bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              : "bg-slate-900/30 border-cyber-border/30 text-slate-400 hover:text-slate-300"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          INTERVIEW STUDIO
        </button>
      </div>

      {/* Render selected view */}
      {activeMode === "call" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HolographicCard title="Customer Frustration Indicator">
            <div className="space-y-4">
              <div className="text-center py-4 bg-slate-950/40 border border-cyber-border/10 rounded-lg">
                <div className="text-[10px] font-mono text-slate-500">FRUSTRATION PROBABILITY</div>
                <div className="text-4xl font-extrabold text-cyber-pink animate-pulse">38%</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">BASED ON AROUSAL VALENCY</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Analysis logs identify micro-tremors in pitch patterns suggesting high volume peaks on channel 2.
              </p>
            </div>
          </HolographicCard>

          <HolographicCard title="Active Agent Health Tracker">
            <div className="space-y-4">
              <div className="text-center py-4 bg-slate-950/40 border border-cyber-border/10 rounded-lg">
                <div className="text-[10px] font-mono text-slate-500">FATIGUE INDEX</div>
                <div className="text-4xl font-extrabold text-cyber-green">14%</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1 font-semibold text-cyber-green">STABILIZED BASAL LEVELS</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Browsers capture consistent facial alignments, indicating steady cognitive performance metrics.
              </p>
            </div>
          </HolographicCard>

          <HolographicCard title="Spike Warning System">
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded flex gap-2 text-yellow-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-[10px] leading-normal">
                  <span className="font-bold uppercase">Minor Alert: </span>
                  Anger spike mapped on trunk link #04. Call routed.
                </div>
              </div>
              <div className="p-3 bg-cyber-pink/5 border border-cyber-pink/20 rounded flex gap-2 text-cyber-pink">
                <Flame className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-[10px] leading-normal">
                  <span className="font-bold uppercase">Urgent Alert: </span>
                  Elevated frustration score detected. Supervisor advised.
                </div>
              </div>
            </div>
          </HolographicCard>
        </div>
      )}

      {activeMode === "class" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HolographicCard title="Class Attention metrics">
            <div className="space-y-4">
              <div className="text-center py-4 bg-slate-950/40 border border-cyber-border/10 rounded-lg">
                <div className="text-[10px] font-mono text-slate-500">ENGAGEMENT AVERAGE</div>
                <div className="text-4xl font-extrabold text-cyber-green">86%</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">HIGH LECTURE COMPATIBILITY</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Visual scan counts indicate 18 of 21 tracked students are maintaining forward gaze alignment.
              </p>
            </div>
          </HolographicCard>

          <HolographicCard title="Attention Loss Risk">
            <div className="space-y-4">
              <div className="text-center py-4 bg-slate-950/40 border border-cyber-border/10 rounded-lg">
                <div className="text-[10px] font-mono text-slate-500">DISTRACTION PROBABILITY</div>
                <div className="text-4xl font-extrabold text-cyber-cyan">12%</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">BASELINE NOISE LIMITS</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Movement telemetry records normal, low-frequency transitions with no structural distraction patterns.
              </p>
            </div>
          </HolographicCard>

          <HolographicCard title="Topic Sentiment Tracker">
            <div className="space-y-3 font-mono text-[10px] text-slate-400">
              <div className="space-y-1">
                <div className="flex justify-between"><span>CONCEPT COMPREHENSION</span><span className="text-cyber-green">92%</span></div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-cyber-green h-full" style={{ width: "92%" }} /></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between"><span>CLASSROOM VALENCE</span><span className="text-cyber-cyan">74%</span></div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-cyber-cyan h-full" style={{ width: "74%" }} /></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between"><span>AROUSAL PEAKS</span><span className="text-cyber-pink">15%</span></div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-cyber-pink h-full" style={{ width: "15%" }} /></div>
              </div>
            </div>
          </HolographicCard>
        </div>
      )}

      {activeMode === "interview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HolographicCard title="Applicant Confidence telemetry">
            <div className="space-y-4">
              <div className="text-center py-4 bg-slate-950/40 border border-cyber-border/10 rounded-lg">
                <div className="text-[10px] font-mono text-slate-500">CONFIDENCE COEFFICIENT</div>
                <div className="text-4xl font-extrabold text-cyber-cyan animate-pulse">78%</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">STEADY VOCAL TENSION</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Micro-expressions map calm, controlled responses. Speech tempo registers at a regular 135 WPM.
              </p>
            </div>
          </HolographicCard>

          <HolographicCard title="Cognitive stress / lie metrics">
            <div className="space-y-4">
              <div className="text-center py-4 bg-slate-950/40 border border-cyber-border/10 rounded-lg">
                <div className="text-[10px] font-mono text-slate-500">STRESS / DECEIT RATIO</div>
                <div className="text-4xl font-extrabold text-cyber-pink">18%</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">LOW PSYCHO-MOTOR TENSION</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Acoustic pitch variations and blink rates align within the typical truth baseline envelope.
              </p>
            </div>
          </HolographicCard>

          <HolographicCard title="Performance Indices">
            <div className="space-y-3 font-mono text-[10px] text-slate-400">
              <div className="space-y-1">
                <div className="flex justify-between"><span>VOCAL STEADINESS</span><span className="text-cyber-green">89%</span></div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-cyber-green h-full" style={{ width: "89%" }} /></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between"><span>TEMPO COHERENCE</span><span className="text-cyber-cyan">94%</span></div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-cyber-cyan h-full" style={{ width: "94%" }} /></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between"><span>MICRO-EXPRESSION FREQUENCY</span><span className="text-cyber-purple">22%</span></div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-cyber-purple h-full" style={{ width: "22%" }} /></div>
              </div>
            </div>
          </HolographicCard>
        </div>
      )}

      {/* Mode diagnostics footnote */}
      <div className="text-slate-500 font-mono text-[9px] border-t border-cyber-border/20 pt-4 flex gap-4">
        <span>SUITE: Enterprise intelligence metrics dashboard</span>
        <span>MODULAR FEED: Synced</span>
      </div>
    </div>
  );
}

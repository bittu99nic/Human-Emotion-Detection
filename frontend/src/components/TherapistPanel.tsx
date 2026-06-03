"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Smile, ShieldAlert } from "lucide-react";
import { HolographicCard } from "./HolographicCard";
import { FusionData } from "@/hooks/useWebSocket";

interface Message {
  id: string;
  sender: "therapist" | "user";
  text: string;
  timestamp: string;
  emotionTagged?: string;
}

interface TherapistPanelProps {
  fusion: FusionData | null;
}

export function TherapistPanel({ fusion }: TherapistPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "therapist",
      text: "Affirmative, session initiated. I am monitoring your sensory bio-metrics (valence and vocal pitch). Tell me what is on your mind today.",
      timestamp: "10:45",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const activeEmotion = fusion?.label || "neutral";
  const stress = fusion?.stress_level || 0.2;
  const engagement = fusion?.engagement_score || 0.8;

  // Calculate burnout risk index
  const calculateBurnoutRisk = () => {
    // Burnout increases with high stress and low engagement
    const risk = (stress * 1.5 + (1.0 - engagement) * 0.5) / 2.0;
    return Math.min(1.0, Math.max(0.0, risk));
  };
  const burnoutRisk = calculateBurnoutRisk();

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotionTagged: activeEmotion,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");

    // Simulate AI response based on captured emotion state
    setTimeout(() => {
      let therapistReply = "";
      
      if (activeEmotion === "sad") {
        therapistReply = "I noticed a sad vocal pitch or brow tilt. Life presents challenging moments; permit yourself space to feel this. What seems to be weighing on you?";
      } else if (activeEmotion === "angry" || stress > 0.7) {
        therapistReply = "Sensory inputs register elevated stress levels right now. Let's practice a grounding pause. Tell me, what triggered this arousal?";
      } else if (activeEmotion === "fear") {
        therapistReply = "A feeling of apprehension is captured. You are in a safe, secure interface sandbox. Focus on three objects around you. What do you see?";
      } else if (activeEmotion === "happy") {
        therapistReply = "Your expressions register happiness and high engagement! It is wonderful to capture this state. What is driving your positive momentum today?";
      } else {
        therapistReply = "Your expressions are resting in baseline equilibrium. I am listening; go ahead and share whatever is on your mind.";
      }

      const replyMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "therapist",
        text: therapistReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 1000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getRiskLabel = (risk: number) => {
    if (risk > 0.75) return { text: "CRITICAL EXHAUSTION DETECTED", color: "text-cyber-pink" };
    if (risk > 0.5) return { text: "ELEVATED BURNOUT WARNING", color: "text-cyber-yellow" };
    return { text: "PSYCHOLOGICAL LOAD STABLE", color: "text-cyber-green" };
  };

  const riskLabel = getRiskLabel(burnoutRisk);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Risk gauges */}
      <div className="lg:col-span-1 space-y-6">
        <HolographicCard title="Burnout Diagnostics">
          <div className="space-y-6">
            <div className="text-center py-4 bg-slate-950/40 rounded-lg border border-cyber-border/10 space-y-2">
              <div className="text-[10px] font-mono text-slate-500 tracking-wider">FATIGUE INDEX</div>
              <div className="text-4xl font-extrabold text-white">{(burnoutRisk * 100).toFixed(0)}%</div>
              <div className={`text-[10px] font-mono font-semibold ${riskLabel.color}`}>{riskLabel.text}</div>
            </div>

            {/* Diagnostic list */}
            <div className="space-y-3 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between items-center pb-2 border-b border-cyber-border/10">
                <span>AMPLITUDE (STRESS)</span>
                <span className="text-white font-semibold">{(stress * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-cyber-border/10">
                <span>VALENCE (STRETCH)</span>
                <span className="text-white font-semibold">{activeEmotion === "happy" ? "POSITIVE" : activeEmotion === "sad" ? "NEGATIVE" : "NEUTRAL"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>STABILITY</span>
                <span className="text-cyber-green font-semibold">OPTIMAL</span>
              </div>
            </div>
            
            <div className="p-3 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-cyber-cyan shrink-0 mt-0.5" />
              <p className="text-[10px] font-mono leading-normal text-slate-300">
                Therapist diagnostic algorithm leverages valence statistics to evaluate cognitive fatigue risks.
              </p>
            </div>
          </div>
        </HolographicCard>
      </div>

      {/* Chat workspace */}
      <div className="lg:col-span-2">
        <HolographicCard title="Interactive AI Coping Node" headerRight={
          <div className="flex items-center gap-1 text-[10px] text-cyber-cyan font-mono">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>THERAPIST MODE ACTIVE</span>
          </div>
        }>
          <div className="flex flex-col h-96 justify-between">
            {/* Message feed */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scroll-smooth">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-cyber-cyan/10 border border-cyber-cyan/30 text-white"
                        : "bg-slate-900 border border-cyber-border/20 text-slate-300"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-slate-500 px-1">
                    <span>{msg.timestamp}</span>
                    {msg.emotionTagged && (
                      <span className="text-cyber-cyan uppercase">({msg.emotionTagged})</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input fields */}
            <div className="flex items-center gap-2 border-t border-cyber-border/30 pt-3">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Type communication chunk and press enter..."
                className="flex-1 bg-slate-950/60 border border-cyber-border/20 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyber-cyan/50 font-mono"
              />
              <button
                onClick={handleSend}
                className="p-2 rounded bg-cyber-cyan text-black hover:bg-cyber-cyan/80 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        </HolographicCard>
      </div>

    </div>
  );
}

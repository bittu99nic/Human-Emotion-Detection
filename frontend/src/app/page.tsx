"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Activity, Radio, ArrowRight, ShieldAlert, LogOut } from "lucide-react";
import { AuthPortal } from "@/components/AuthPortal";
import { WebGLOrb } from "@/components/WebGLOrb";

export default function Home() {
  const [dots, setDots] = useState<{ x: number; y: number; size: number; speed: number }[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Read credentials on mount
  useEffect(() => {
    const t = localStorage.getItem("aura_token");
    const u = localStorage.getItem("aura_username");
    const r = localStorage.getItem("aura_role");
    if (t) {
      setToken(t);
      setUsername(u);
      setRole(r);
    }
  }, []);

  // Initialize background floating particles
  useEffect(() => {
    const generated = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 1.2 + 0.4,
    }));
    setDots(generated);
  }, []);

  const handleAuthSuccess = (t: string, u: string, r: string) => {
    setToken(t);
    setUsername(u);
    setRole(r);
  };

  const handleLogout = () => {
    localStorage.removeItem("aura_token");
    localStorage.removeItem("aura_username");
    localStorage.removeItem("aura_role");
    setToken(null);
    setUsername(null);
    setRole(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden px-4 md:px-8 py-6 scanlines bg-gradient-to-tr from-[#05070a] via-[#080d16] to-[#040507]">
      {/* Background Matrix Particle floats */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {dots.map((dot, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full bg-cyber-cyan opacity-25"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: dot.size,
              height: dot.size,
            }}
            animate={{
              y: ["0px", "-200px"],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: 12 / dot.speed,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Header HUD branding */}
      <header className="w-full flex items-center justify-between z-10 py-2 border-b border-cyber-border/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan flex items-center justify-center pulse-cyan-glow">
            <div className="absolute w-2 h-2 rounded-full bg-cyber-cyan" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-wider text-white">AURA X</span>
            <span className="text-[10px] block font-mono text-cyber-cyan uppercase -mt-1 tracking-widest">EMOTION ENGINE X v2.0</span>
          </div>
        </div>
        
        {token && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">NODE USER: <span className="text-cyber-cyan font-bold uppercase">{username}</span></span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-cyber-pink hover:text-cyber-pink/80 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              LOGOUT
            </button>
          </div>
        )}
      </header>

      {/* Main Core View Area */}
      <section className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 z-10 max-w-6xl mx-auto my-12 relative w-full">
        
        {/* Left Side: Cinematic messaging */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 flex-1 text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-cyan/5 border border-cyber-cyan/20 backdrop-blur-md">
            <Cpu className="w-4 h-4 text-cyber-cyan animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-cyber-cyan">MULTIMODAL NEURAL FUSION PORTAL</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-none">
            A next-generation <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink text-neon-cyan">
              emotional intelligence
            </span> <br />
            operating system.
          </h1>

          <p className="text-sm text-slate-400 max-w-xl font-light leading-relaxed">
            AURA Emotion Engine X maps real-time facial expressions via camera optical streams and vocal frequencies via microphone acoustic feeds, consolidating them into unified stress, intensity, and engagement vectors.
          </p>

          {/* Entrance buttons revealed only when token exists */}
          {token ? (
            <div className="pt-6">
              <Link href="/dashboard">
                <button className="relative group overflow-hidden px-8 py-3.5 rounded-lg bg-cyber-cyan text-black font-semibold text-sm tracking-wider flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.6)]">
                  INITIALIZE PLATFORM
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          ) : (
            <div className="p-3 bg-cyber-cyan/5 border border-cyber-cyan/15 rounded-lg flex items-center gap-2 text-xs font-mono text-slate-400 max-w-md">
              <ShieldAlert className="w-4 h-4 text-cyber-cyan shrink-0 animate-pulse" />
              <span>Session key required. Sign in or register on the portal to mount sensory devices.</span>
            </div>
          )}
        </motion.div>

        {/* Right Side: Auth Portal or WebGL Particle Sphere */}
        <div className="flex-1 w-full flex justify-center">
          {token ? (
            // Authenticated: Render rotating WebGL points sphere
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-md"
            >
              <WebGLOrb
                emotion="neutral"
                intensity={0.4}
                stress={0.15}
                engagement={0.65}
              />
            </motion.div>
          ) : (
            // Unauthenticated: Render Auth gateway forms
            <AuthPortal onSuccess={handleAuthSuccess} />
          )}
        </div>
      </section>

      {/* Feature showcase grids */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-10 text-left z-10 max-w-6xl mx-auto">
        <div className="glass-panel p-5 rounded-xl space-y-2">
          <Activity className="w-6 h-6 text-cyber-cyan" />
          <h3 className="text-xs font-semibold tracking-wider font-mono text-white">DATABASE LOGS</h3>
          <p className="text-[11px] text-slate-400 leading-normal">
            Relational storage tracks user metrics history, logging timelines to SQLite databases.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-xl space-y-2">
          <Radio className="w-6 h-6 text-cyber-pink" />
          <h3 className="text-xs font-semibold tracking-wider font-mono text-white">SPEECH SPECTRUMS</h3>
          <p className="text-[11px] text-slate-400 leading-normal">
            187-dimension MFCC, chroma, spectral contrast, and pitch classifications.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-xl space-y-2">
          <Cpu className="w-6 h-6 text-cyber-purple" />
          <h3 className="text-xs font-semibold tracking-wider font-mono text-white">NEURAL FUSIONS</h3>
          <p className="text-[11px] text-slate-400 leading-normal">
            Multi-task layers consolidating sensory feeds to isolate stress, intensity, and fatigue.
          </p>
        </div>
      </div>

      {/* Footer HUD ticks */}
      <footer className="w-full flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-500 border-t border-cyber-border/40 pt-4 z-10">
        <div>
          <span>AURA Emotion Engine X - Startup Sandbox Platform</span>
        </div>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <span>SQL CLIENT: SQLITE3 ACTIVE</span>
          <span>GPU ENGINE: CUDA v12.1 Ready</span>
        </div>
      </footer>
    </div>
  );
}

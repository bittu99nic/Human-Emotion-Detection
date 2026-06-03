"use client";

import { useState } from "react";
import { ShieldCheck, Mail, Lock, User, AlertCircle, RefreshCw } from "lucide-react";
import { HolographicCard } from "./HolographicCard";
import { getBackendUrl } from "@/utils/api";

interface AuthPortalProps {
  onSuccess: (token: string, username: string, role: string) => void;
}

export function AuthPortal({ onSuccess }: AuthPortalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill out all credentials.");
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = activeTab === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const baseUrl = getBackendUrl("http");
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication sequence failed.");
      }

      // Persist credentials in local storage
      localStorage.setItem("aura_token", data.access_token);
      localStorage.setItem("aura_username", data.username);
      localStorage.setItem("aura_role", data.role);

      // Trigger callback
      onSuccess(data.access_token, data.username, data.role);
    } catch (err: any) {
      console.error("[AURA AUTH] Error:", err);
      setError(err.message || "Failed to contact backend. Verify Uvicorn server is active.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10 my-10">
      <HolographicCard
        title="Access Authentication"
        headerRight={
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab("login"); setError(null); }}
              className={`text-[10px] font-mono tracking-wider px-2 py-0.5 rounded transition-all ${
                activeTab === "login"
                  ? "bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => { setActiveTab("signup"); setError(null); }}
              className={`text-[10px] font-mono tracking-wider px-2 py-0.5 rounded transition-all ${
                activeTab === "signup"
                  ? "bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              SIGN UP
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Header branding */}
          <div className="text-center pb-4">
            <div className="inline-flex p-3 rounded-xl bg-cyber-cyan/5 border border-cyber-cyan/20 mb-3 pulse-cyan-glow">
              <ShieldCheck className="w-8 h-8 text-cyber-cyan" />
            </div>
            <h2 className="text-lg font-bold tracking-wider text-white uppercase">AURA SECURE PORTAL</h2>
            <p className="text-[10px] font-mono text-slate-400 tracking-wider mt-1">
              {activeTab === "login" ? "ENTER KEY TO UNLOCK ENGINE NODE" : "CREATE NEW SYSTEM CREDENTIAL CREDITS"}
            </p>
          </div>

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">Username</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter system handle..."
                className="w-full bg-slate-950/60 border border-cyber-border/20 rounded pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan/50 font-mono"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">Access Phrase</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-slate-950/60 border border-cyber-border/20 rounded pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan/50 font-mono"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-cyber-pink bg-cyber-pink/5 border border-cyber-pink/20 p-3 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded bg-cyber-cyan text-black font-semibold text-xs tracking-wider flex items-center justify-center gap-2 hover:bg-cyber-cyan/85 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : activeTab === "login" ? (
              "AUTHENTICATE LINK"
            ) : (
              "CREATE SYSTEM NODE"
            )}
          </button>

          {activeTab === "login" && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => alert("Password reset token dispatched to console. Contact system administrator.")}
                className="text-[9px] font-mono text-slate-500 hover:text-slate-400"
              >
                FORGOT SECURE CREDENTIALS?
              </button>
            </div>
          )}
        </form>
      </HolographicCard>
    </div>
  );
}

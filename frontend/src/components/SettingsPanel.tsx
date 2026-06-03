"use client";

import { useEffect, useState } from "react";
import { Sliders, Shield, RefreshCw, CheckCircle } from "lucide-react";
import { HolographicCard } from "./HolographicCard";
import { getBackendUrl } from "@/utils/api";

export function SettingsPanel() {
  const [faceWeight, setFaceWeight] = useState(0.6);
  const [speechWeight, setSpeechWeight] = useState(0.4);
  const [noiseGate, setNoiseGate] = useState(-45); // dB
  const [fpsLimit, setFpsLimit] = useState(5);
  const [backendDevice, setBackendDevice] = useState("cpu");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch current configurations
  const fetchSettings = async () => {
    try {
      const baseUrl = getBackendUrl("http");
      const response = await fetch(`${baseUrl}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setFaceWeight(data.face_weight);
        setSpeechWeight(data.speech_weight);
        setBackendDevice(data.device);
      }
    } catch (e) {
      console.error("[AURA SETTINGS] Error fetching settings:", e);
    }
  };

  // Push configurations to FastAPI config
  const saveSettings = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const baseUrl = getBackendUrl("http");
      const response = await fetch(`${baseUrl}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          face_weight: faceWeight,
          speech_weight: speechWeight,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error("[AURA SETTINGS] Error saving settings:", e);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle slider matching logic (so weights sum to 1.0)
  const handleFaceWeightChange = (val: number) => {
    setFaceWeight(val);
    setSpeechWeight(Number((1.0 - val).toFixed(2)));
  };

  const handleSpeechWeightChange = (val: number) => {
    setSpeechWeight(val);
    setFaceWeight(Number((1.0 - val).toFixed(2)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Sensor Calibration */}
      <div className="lg:col-span-2 space-y-6">
        <HolographicCard title="Sensor Fusion Weight Calibration">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Sliders className="w-4 h-4 text-cyber-cyan" />
              <span>CALIBRATION MATRIX</span>
            </div>

            {/* Slider 1 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">FACIAL WEIGHT BIAS</span>
                <span className="text-cyber-cyan font-bold">{(faceWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={faceWeight}
                onChange={e => handleFaceWeightChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
              />
              <p className="text-[10px] font-mono text-slate-500">
                Determines confidence priority assigned to webcam facial expressions.
              </p>
            </div>

            {/* Slider 2 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">ACOUSTIC WEIGHT BIAS</span>
                <span className="text-cyber-pink font-bold">{(speechWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={speechWeight}
                onChange={e => handleSpeechWeightChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyber-pink"
              />
              <p className="text-[10px] font-mono text-slate-500">
                Determines confidence priority assigned to vocal pitch and chroma variations.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex-1 py-2.5 px-4 rounded bg-cyber-cyan text-black font-semibold text-xs tracking-wider flex items-center justify-center gap-1.5 hover:bg-cyber-cyan/80 transition-colors"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    CALIBRATION MOUNTED
                  </>
                ) : (
                  "COMMIT CALIBRATION"
                )}
              </button>
              
              <button
                onClick={fetchSettings}
                className="py-2.5 px-4 rounded border border-cyber-border/40 text-slate-300 font-semibold text-xs tracking-wider hover:bg-slate-900/30 transition-colors"
              >
                RESET
              </button>
            </div>

          </div>
        </HolographicCard>
      </div>

      {/* Sensor Constraints */}
      <div className="lg:col-span-1 space-y-6">
        <HolographicCard title="Physical Hardware Profiles">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Shield className="w-4 h-4 text-cyber-purple" />
              <span>SENSORY ENVELOPES</span>
            </div>

            {/* Sound Gate */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">NOISE GATE SENSITIVITY</span>
                <span className="text-white font-bold">{noiseGate} dB</span>
              </div>
              <input
                type="range"
                min="-60"
                max="-20"
                step="1"
                value={noiseGate}
                onChange={e => setNoiseGate(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyber-purple"
              />
            </div>

            {/* Optical Rate */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">FRAME LIMIT RATE</span>
                <span className="text-white font-bold">{fpsLimit} FPS</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                step="1"
                value={fpsLimit}
                onChange={e => setFpsLimit(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyber-purple"
              />
            </div>

            {/* Hardware engine */}
            <div className="bg-slate-950/60 p-3 rounded border border-cyber-border/10 font-mono text-[10px] space-y-1">
              <div className="flex justify-between text-slate-400"><span>INFERENCE DEVICE</span><span className="text-white uppercase font-bold">{backendDevice}</span></div>
              <div className="flex justify-between text-slate-400"><span>AUDIO CODEC</span><span className="text-white uppercase font-bold">PCM Float32</span></div>
            </div>

          </div>
        </HolographicCard>
      </div>

    </div>
  );
}

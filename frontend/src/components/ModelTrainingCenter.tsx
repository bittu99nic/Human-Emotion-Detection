"use client";

import { useEffect, useState, useRef } from "react";
import { Play, Download, Settings, Cpu, FileCheck2, Database } from "lucide-react";
import { HolographicCard } from "./HolographicCard";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { getBackendUrl } from "@/utils/api";

interface DatasetStatus {
  speech_dataset_present: boolean;
  face_dataset_present: boolean;
  preprocessed_speech_present: boolean;
  preprocessed_face_present: boolean;
  samples: {
    speech: number;
    face: number;
  };
}

interface TrainingStatus {
  active: boolean;
  model_type: string;
  epoch: number;
  total_epochs: number;
  loss: number;
  accuracy: number;
  message: string;
}

export function ModelTrainingCenter() {
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({
    active: false,
    model_type: "",
    epoch: 0,
    total_epochs: 5,
    loss: 0.0,
    accuracy: 0.0,
    message: "Idle",
  });

  const [selectedModel, setSelectedModel] = useState<"face" | "speech" | "fusion">("face");
  const [trainingHistory, setTrainingHistory] = useState<{ epoch: number; loss: number; accuracy: number }[]>([]);
  const statusPollInterval = useRef<NodeJS.Timeout | null>(null);

  // Load dataset status
  const fetchDatasetStatus = async () => {
    try {
      const baseUrl = getBackendUrl("http");
      const response = await fetch(`${baseUrl}/api/datasets/status`);
      if (response.ok) {
        const data = await response.json();
        setDatasetStatus(data);
      }
    } catch (e) {
      console.error("[AURA MODEL CENTER] Error fetching dataset status:", e);
    }
  };

  // Trigger dataset download/prep
  const triggerDatasetDownload = async () => {
    try {
      const baseUrl = getBackendUrl("http");
      const response = await fetch(`${baseUrl}/api/datasets/download`, { method: "POST" });
      if (response.ok) {
        alert("Downloading started in background. Monitor sample counts below.");
        // Refetch status after some time
        setTimeout(fetchDatasetStatus, 4000);
      }
    } catch (e) {
      console.error("[AURA MODEL CENTER] Error triggering download:", e);
    }
  };

  // Start model training
  const startTraining = async () => {
    setTrainingHistory([]);
    try {
      const formData = new FormData();
      formData.append("model_type", selectedModel);

      const baseUrl = getBackendUrl("http");
      const response = await fetch(`${baseUrl}/api/training/start`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Start polling status
        pollTrainingStatus();
      }
    } catch (e) {
      console.error("[AURA MODEL CENTER] Error starting training:", e);
    }
  };

  // Poll training status from FastAPI
  const pollTrainingStatus = () => {
    if (statusPollInterval.current) clearInterval(statusPollInterval.current);

    statusPollInterval.current = setInterval(async () => {
      try {
        const baseUrl = getBackendUrl("http");
        const response = await fetch(`${baseUrl}/api/training/status`);
        if (response.ok) {
          const status = (await response.json()) as TrainingStatus;
          setTrainingStatus(status);

          if (status.active) {
            // Append data history if epoch changed
            setTrainingHistory(prev => {
              const alreadyHasEpoch = prev.some(h => h.epoch === status.epoch);
              if (!alreadyHasEpoch && status.epoch > 0) {
                return [...prev, { epoch: status.epoch, loss: status.loss, accuracy: status.accuracy }];
              }
              return prev;
            });
          } else {
            // Stopped training
            if (statusPollInterval.current) {
              clearInterval(statusPollInterval.current);
            }
            fetchDatasetStatus(); // Refresh dataset counts
          }
        }
      } catch (e) {
        console.error("[AURA MODEL CENTER] Error polling status:", e);
      }
    }, 1000);
  };

  useEffect(() => {
    fetchDatasetStatus();
    return () => {
      if (statusPollInterval.current) clearInterval(statusPollInterval.current);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left panel: Dataset management */}
      <div className="lg:col-span-1 space-y-6">
        <HolographicCard title="Dataset Repository">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Database className="w-4 h-4 text-cyber-cyan" />
              <span>LOCAL DIRECTORIES STATUS</span>
            </div>

            {/* Dir check details */}
            <div className="space-y-3 font-mono text-[11px]">
              <div className="flex justify-between items-center pb-2 border-b border-cyber-border/10">
                <span>SPEECH DATA (RAVDESS/TESS)</span>
                <span className={datasetStatus?.speech_dataset_present ? "text-cyber-green" : "text-cyber-pink"}>
                  {datasetStatus?.speech_dataset_present ? "SYNCED" : "MISSING"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-cyber-border/10">
                <span>FACE DATA (FER2013)</span>
                <span className={datasetStatus?.face_dataset_present ? "text-cyber-green" : "text-cyber-pink"}>
                  {datasetStatus?.face_dataset_present ? "SYNCED" : "MISSING"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-cyber-border/10">
                <span>SPEECH PREPROCESSED FEATURES</span>
                <span className={datasetStatus?.preprocessed_speech_present ? "text-cyber-green animate-pulse" : "text-cyber-pink"}>
                  {datasetStatus?.preprocessed_speech_present ? "ACTIVE" : "DORMANT"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>FACE PREPROCESSED TENSORS</span>
                <span className={datasetStatus?.preprocessed_face_present ? "text-cyber-green animate-pulse" : "text-cyber-pink"}>
                  {datasetStatus?.preprocessed_face_present ? "ACTIVE" : "DORMANT"}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-cyber-border/10 space-y-1.5 font-mono text-[10px] text-slate-400">
              <div className="flex justify-between"><span>SPEECH RAW SAMPLES</span><span className="text-white font-bold">{datasetStatus?.samples.speech || 0}</span></div>
              <div className="flex justify-between"><span>FACE RAW IMAGE BLOCKS</span><span className="text-white font-bold">{datasetStatus?.samples.face || 0}</span></div>
            </div>

            <button
              onClick={triggerDatasetDownload}
              className="w-full py-2.5 px-4 rounded border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/15 font-mono text-xs flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD/INITIALIZE DATASETS
            </button>
          </div>
        </HolographicCard>
      </div>

      {/* Right panel: Model Training parameters and charting */}
      <div className="lg:col-span-2 space-y-6">
        <HolographicCard
          title="Neural Training console"
          headerRight={
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${trainingStatus.active ? "bg-cyber-pink animate-pulse" : "bg-slate-600"}`} />
              <span className="text-[10px] font-mono uppercase tracking-wider">
                {trainingStatus.active ? "TRAINING PIPELINE COMMITTED" : "DORMANT"}
              </span>
            </div>
          }
        >
          <div className="space-y-6">
            
            {/* Model Select selectors */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Target Neural Core</label>
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value as any)}
                  disabled={trainingStatus.active}
                  className="w-full bg-slate-950 border border-cyber-border/20 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan/50 font-mono"
                >
                  <option value="face">Facial Emotion Model (PyTorch CNN)</option>
                  <option value="speech">Speech Emotion Model (PyTorch MLP)</option>
                  <option value="fusion">Multimodal Fusion layer (Multi-Task MLP)</option>
                </select>
              </div>
              <div className="pt-5">
                <button
                  onClick={startTraining}
                  disabled={trainingStatus.active}
                  className="py-2 px-5 rounded bg-cyber-cyan text-black font-semibold text-xs tracking-wider flex items-center gap-1.5 hover:bg-cyber-cyan/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-black" />
                  START RUN
                </button>
              </div>
            </div>

            {/* Active stats display */}
            {trainingStatus.active && (
              <div className="bg-slate-950/60 border border-cyber-border/10 p-4 rounded-lg grid grid-cols-4 gap-4 font-mono text-xs text-slate-400">
                <div>
                  <div className="text-[9px] text-slate-500">EPOCH</div>
                  <div className="text-sm font-bold text-white">{trainingStatus.epoch} / {trainingStatus.total_epochs}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">TRAIN LOSS</div>
                  <div className="text-sm font-bold text-cyber-pink">{trainingStatus.loss.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">VALIDATION ACCURACY</div>
                  <div className="text-sm font-bold text-cyber-green">{(trainingStatus.accuracy * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">STATUS FEED</div>
                  <div className="text-[10px] text-cyber-cyan truncate">{trainingStatus.message}</div>
                </div>
              </div>
            )}

            {/* Visual plot curve chart */}
            {trainingHistory.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Model Loss Curve</div>
                <div className="h-44 w-full bg-slate-950/20 border border-cyber-border/10 rounded-lg p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingHistory}>
                      <XAxis dataKey="epoch" tick={{ fill: "#64748b", fontSize: 9 }} stroke="rgba(0,240,255,0.1)" />
                      <YAxis tick={{ fill: "#64748b", fontSize: 9 }} stroke="rgba(0,240,255,0.1)" />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(10, 15, 26, 0.95)",
                          border: "1px solid rgba(0, 240, 255, 0.2)",
                          fontSize: "10px",
                          color: "#fff",
                        }}
                      />
                      <Line type="monotone" dataKey="loss" name="CrossEntropy Loss" stroke="#ff007f" strokeWidth={1.5} dot={true} />
                      <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#39ff14" strokeWidth={1.5} dot={true} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Device diagnostic info */}
            <div className="text-[10px] font-mono text-slate-500 border-t border-cyber-border/10 pt-4 flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyber-cyan animate-pulse" />
                ACCELERATION DEVICE: CUDA Core v1 (Fallback CPU Active)
              </span>
              <span className="flex items-center gap-1 text-cyber-green">
                <FileCheck2 className="w-3.5 h-3.5" />
                ONNX EXPORT AUTO-COMPILATION READY
              </span>
            </div>

          </div>
        </HolographicCard>
      </div>

    </div>
  );
}

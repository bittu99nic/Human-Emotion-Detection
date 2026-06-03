"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, UploadCloud, FileAudio, AlertCircle } from "lucide-react";
import { HolographicCard } from "./HolographicCard";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { getBackendUrl } from "@/utils/api";

interface VoiceStudioProps {
  onAudioCaptured: (base64Audio: string) => void;
  onAnalysisResult: (result: any) => void;
  isConnected: boolean;
}

export function VoiceStudio({ onAudioCaptured, onAnalysisResult, isConnected }: VoiceStudioProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Audio API and MediaRecorder
  const startRecording = async () => {
    try {
      setUploadError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioStreamRef.current = stream;

      const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = actx.createMediaStreamSource(stream);
      const node = actx.createAnalyser();
      node.fftSize = 256;
      source.connect(node);

      setAudioContext(actx);
      setAnalyser(node);
      setIsRecording(true);

      // We slice mic audio chunks in an interval to perform speech emotion prediction
      const options = { mimeType: "audio/webm" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback if audio/webm is not supported (Safari/iOS)
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && isConnected) {
          const reader = new FileReader();
          reader.readAsDataURL(event.data);
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            onAudioCaptured(base64Audio);
          };
        }
      };

      // Start recording and slice every 3 seconds
      recorder.start();
      recordingIntervalRef.current = setInterval(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          recorder.start();
        }
      }, 3000); // 3-second slices match the Speech model input duration

    } catch (err: any) {
      console.warn("[AURA AUDIO] Error starting mic capture:", err);
      setUploadError("Could not access microphone. Grant permission.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
      audioContext.close();
    }
    setIsRecording(false);
    setAnalyser(null);
    setAudioContext(null);
  };

  useEffect(() => {
    // Autostart recording on render
    startRecording();
    return () => {
      stopRecording();
    };
  }, []);

  // Handle manual audio file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (limit 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("File size exceeds 15MB limit.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const baseUrl = getBackendUrl("http");
      const response = await fetch(`${baseUrl}/api/predict/file`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Backend failed to process the file.");
      }

      const result = await response.json();
      onAnalysisResult(result);
    } catch (err: any) {
      console.warn("[AURA AUDIO UPLOAD] Upload error:", err);
      setUploadError("Failed to evaluate file. Ensure uvicorn server is active.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <HolographicCard
      title="Microphone Acoustic Sensor"
      headerRight={
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isRecording ? "bg-cyber-pink animate-pulse" : "bg-red-500"}`} />
          <span className="text-[10px] font-mono tracking-wider">
            {isRecording ? "MIC STREAM ACTIVE" : "MUTED"}
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Waveform Visualization */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-slate-400">TELEMETRY GRAPH</div>
          <WaveformVisualizer analyser={analyser} isActive={isRecording} color="#ff007f" />
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="flex-1 py-2 px-3 rounded border border-cyber-pink/30 text-cyber-pink bg-cyber-pink/5 hover:bg-cyber-pink/15 font-mono text-xs flex items-center justify-center gap-2 transition-all"
            >
              <MicOff className="w-4 h-4" />
              MUTE MIC
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="flex-1 py-2 px-3 rounded border border-cyber-cyan/30 text-cyber-cyan bg-cyber-cyan/5 hover:bg-cyber-cyan/15 font-mono text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Mic className="w-4 h-4" />
              ACTIVATE MIC
            </button>
          )}

          {/* Upload Button */}
          <label className="flex-1 py-2 px-3 rounded border border-cyber-border/40 text-slate-300 bg-slate-900/30 hover:bg-slate-900/50 hover:border-cyber-cyan/50 cursor-pointer font-mono text-xs flex items-center justify-center gap-2 transition-all text-center">
            {uploading ? (
              <span className="animate-pulse">EVALUATING...</span>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                UPLOAD AUDIO
              </>
            )}
            <input
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {uploadError && (
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyber-pink bg-cyber-pink/5 border border-cyber-pink/20 p-2 rounded">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between border-t border-cyber-border/20 pt-2">
          <span>SAMPLERATE: 16.0 kHz</span>
          <span>BITRATE: Float32 mono</span>
        </div>
      </div>
    </HolographicCard>
  );
}

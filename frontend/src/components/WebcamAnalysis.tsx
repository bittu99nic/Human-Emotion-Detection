"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Video } from "lucide-react";
import { HolographicCard } from "./HolographicCard";
import { FaceDetection } from "@/hooks/useWebSocket";

interface WebcamAnalysisProps {
  onFrameCaptured: (base64Frame: string) => void;
  faces: FaceDetection[];
  isConnected: boolean;
}

export function WebcamAnalysis({ onFrameCaptured, faces, isConnected }: WebcamAnalysisProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera WebRTC stream
  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 15 },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setStream(mediaStream);
      setHasCamera(true);
    } catch (err: any) {
      console.warn("[AURA CAMERA] Error starting stream:", err);
      setError("Failed to gain camera authorization. Verify settings.");
      setHasCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasCamera(false);
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }
  };

  // Toggle camera active state
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Frame capture loop
  useEffect(() => {
    if (!hasCamera || !stream || !isConnected) {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    captureIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Draw frame onto virtual canvas to get base64 string
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Compress as jpeg to conserve websocket bandwidth
        const base64Frame = canvas.toDataURL("image/jpeg", 0.5);
        onFrameCaptured(base64Frame);
      }
    }, 200); // 5 FPS - balance between real-time tracking and low network overload

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, [hasCamera, stream, isConnected, onFrameCaptured]);

  // Render bounding boxes over video frames
  const drawBoxes = () => {
    const video = videoRef.current;
    if (!video || faces.length === 0) return null;
    
    // Scale bounding boxes from source (640x480) to browser display dimensions
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;
    
    const srcWidth = video.videoWidth || 640;
    const srcHeight = video.videoHeight || 480;

    const scaleX = displayWidth / srcWidth;
    const scaleY = displayHeight / srcHeight;

    return faces.map((face, index) => {
      const [x, y, w, h] = face.bbox;
      const left = x * scaleX;
      const top = y * scaleY;
      const width = w * scaleX;
      const height = h * scaleY;

      return (
        <div
          key={index}
          className="absolute border border-cyber-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] pointer-events-none transition-all duration-75"
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          {/* Label Badge */}
          <div className="absolute -top-6 left-0 bg-slate-950/80 border border-cyber-cyan/30 text-[10px] text-cyber-cyan px-1.5 py-0.5 rounded font-mono flex gap-1">
            <span>{face.label.toUpperCase()}</span>
            <span className="opacity-75">{(face.confidence * 100).toFixed(0)}%</span>
          </div>
          
          {/* Cybernetic Reticles */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyber-cyan" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyber-cyan" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyber-cyan" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyber-cyan" />
        </div>
      );
    });
  };

  return (
    <HolographicCard
      title="Webcam Optical Mapping"
      headerRight={
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${hasCamera ? "bg-cyber-green animate-pulse" : "bg-red-500"}`} />
          <span className="text-[10px] font-mono tracking-wider">
            {hasCamera ? "CAMERA LINKED" : "OFFLINE"}
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Stream Canvas Display */}
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-950 border border-cyber-border/30 flex items-center justify-center">
          {/* Single Video Tag */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${hasCamera ? "block" : "hidden"}`}
            playsInline
            muted
            autoPlay
          />
          
          {/* Draw Overlay Boxes */}
          {hasCamera && drawBoxes()}
          
          {/* Secondary hidden canvas for encoding */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Fallback Display if no Camera */}
          {!hasCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-xs z-10 bg-slate-950/90">
              <CameraOff className="w-8 h-8 text-slate-600 animate-pulse" />
              <span>{error || "CAMERA INTERRUPTED"}</span>
              <button
                onClick={startCamera}
                className="mt-4 px-3 py-1.5 rounded border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
              >
                PROMPT LINK
              </button>
            </div>
          )}
          
          {/* Scanner Overlay Line */}
          {hasCamera && (
            <div className="absolute inset-x-0 w-full h-[2px] bg-cyber-cyan/30 shadow-[0_0_10px_#00f0ff] animate-[bounce_4s_infinite] pointer-events-none z-10" />
          )}
        </div>

        {/* Action controllers */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="text-slate-400">
            <span>FORMAT: YUV_420p</span>
            <span className="mx-2">|</span>
            <span>FPS: 5 Hz</span>
          </div>
          <div>
            {hasCamera ? (
              <button
                onClick={stopCamera}
                className="flex items-center gap-1 text-cyber-pink hover:text-cyber-pink/80 transition-colors"
              >
                <CameraOff className="w-3.5 h-3.5" />
                TERMINATE
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="flex items-center gap-1 text-cyber-cyan hover:text-cyber-cyan/80 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                INITIATE
              </button>
            )}
          </div>
        </div>
      </div>
    </HolographicCard>
  );
}

"use client";

import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  analyser?: AnalyserNode | null;
  isActive: boolean;
  color?: string;
  height?: number;
}

export function WaveformVisualizer({ analyser, isActive, color = "#00f0ff", height = 80 }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = height;
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    let phase = 0;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isActive && analyser) {
        // Real-time microphone data
        analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.beginPath();

        const sliceWidth = (canvas.width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0; // 0.0 to 2.0
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        // Draw frequency glow lines
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
        
      } else {
        // Idle state: Draw moving mathematical sine waves
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `${color}40`; // Fade outline
        
        ctx.beginPath();
        let x = 0;
        phase += 0.05;

        // Draw 3 layers of glowing sine waves
        for (let layer = 0; layer < 3; layer++) {
          const amp = (layer === 0 ? 15 : layer === 1 ? 8 : 4) * (isActive ? 1.5 : 0.8);
          const freqMultiplier = layer === 0 ? 0.01 : layer === 1 ? 0.025 : 0.04;
          ctx.strokeStyle = layer === 0 ? color : layer === 1 ? `${color}aa` : `${color}55`;
          
          ctx.beginPath();
          x = 0;
          for (let i = 0; i < canvas.width; i++) {
            const y = canvas.height / 2 + Math.sin(i * freqMultiplier + phase + layer) * amp;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x = i;
          }
          ctx.stroke();
        }
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [analyser, isActive, color, height]);

  return (
    <div className="w-full relative bg-slate-950/40 rounded-lg p-2 border border-cyber-border/20 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}

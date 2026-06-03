"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface WebGLOrbProps {
  emotion: string;
  intensity: number;
  stress: number;
  engagement: number;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: "#39ff14",     // Neon Green
  sad: "#00b4d8",       // Deep Cyan/Blue
  angry: "#ff007f",     // Hot Pink/Red
  fear: "#9d4edd",      // Deep Purple
  surprise: "#ffea00",  // Neon Yellow
  neutral: "#00f0ff",   // Neon Cyan
  disgust: "#70e000",   // Lime Green
};

export function WebGLOrb({ emotion, intensity, stress, engagement }: WebGLOrbProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const width = container.clientWidth || 300;
    const height = 300;
    const scene = new THREE.Scene();
    
    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 25;

    // 3. Renderer setup with transparency
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Create spherical particle system
    const particleCount = 600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);

    // Populate points in a sphere shell
    const radius = 6.0;
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Particle texture (simple circular glow)
    const pColor = new THREE.Color(EMOTION_COLORS[emotion] || "#00f0ff");
    const material = new THREE.PointsMaterial({
      size: 0.18,
      color: pColor,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Add ambient lights
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light);

    // 5. Animation loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth color transitions towards active emotion color
      const targetColor = new THREE.Color(EMOTION_COLORS[emotion] || "#00f0ff");
      material.color.lerp(targetColor, 0.05);

      // Get pointer references
      const posAttr = geometry.attributes.position;
      const posArr = posAttr.array as Float32Array;

      // Adjust particle amplitude oscillations based on bio-metrics
      const targetPulse = 1.0 + intensity * 0.4;
      const turbulence = stress * 0.9;
      const speed = 0.5 + engagement * 1.5;

      // Rotate sphere
      particles.rotation.y = elapsedTime * 0.15 * speed;
      particles.rotation.x = elapsedTime * 0.08 * speed;

      // Deform positions
      for (let i = 0; i < particleCount; i++) {
        const xIdx = i * 3;
        const yIdx = i * 3 + 1;
        const zIdx = i * 3 + 2;

        const ox = originalPositions[xIdx];
        const oy = originalPositions[yIdx];
        const oz = originalPositions[zIdx];

        // Complex sinusoidal waveform deformation
        const angle = elapsedTime * 3.0 + (ox + oy) * 0.2;
        const deformFactor = Math.sin(angle) * (0.2 + intensity * 0.5);
        
        // Add random turbulence/jitter if stress is high
        const noiseX = (Math.random() - 0.5) * turbulence;
        const noiseY = (Math.random() - 0.5) * turbulence;
        const noiseZ = (Math.random() - 0.5) * turbulence;

        posArr[xIdx] = ox * targetPulse + (ox / radius) * deformFactor + noiseX;
        posArr[yIdx] = oy * targetPulse + (oy / radius) * deformFactor + noiseY;
        posArr[zIdx] = oz * targetPulse + (oz / radius) * deformFactor + noiseZ;
      }

      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    // 6. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [emotion, intensity, stress, engagement]);

  return (
    <div className="w-full relative glass-panel rounded-xl overflow-hidden border border-cyber-border/20 flex flex-col items-center justify-center p-4">
      {/* Background visual scans */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="text-[10px] font-mono text-cyber-cyan absolute top-4 left-4 tracking-widest uppercase flex items-center gap-1.5 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-ping" />
        WebGL Sensory Sphere
      </div>
      <div ref={containerRef} className="w-full h-[300px] flex items-center justify-center relative z-0" />
      <div className="text-[9px] font-mono text-slate-500 absolute bottom-4 select-none tracking-wider">
        COLOR VECTOR SYSTEM STATUS: ONLINE
      </div>
    </div>
  );
}

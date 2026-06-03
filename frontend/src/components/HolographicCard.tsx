import React from "react";
import { clsx } from "clsx";

interface HolographicCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  headerRight?: React.ReactNode;
}

export function HolographicCard({ children, title, className, headerRight }: HolographicCardProps) {
  return (
    <div
      className={clsx(
        "glass-panel rounded-xl p-5 border border-cyber-border/40 relative overflow-hidden flex flex-col justify-between group",
        className
      )}
    >
      {/* HUD Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyber-cyan/50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyber-cyan/50" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyber-cyan/50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyber-cyan/50" />
      
      {/* Background Holographic Scan Line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent group-hover:animate-pulse pointer-events-none" />

      {title && (
        <div className="flex items-center justify-between border-b border-cyber-border/30 pb-3 mb-4 z-10">
          <h3 className="text-xs font-semibold font-mono tracking-widest text-slate-300 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse" />
            {title}
          </h3>
          {headerRight && <div className="text-xs font-mono">{headerRight}</div>}
        </div>
      )}
      
      <div className="flex-1 z-10">{children}</div>
    </div>
  );
}

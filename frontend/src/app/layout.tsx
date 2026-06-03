import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA Emotion Engine | Multimodal AI Platform",
  description: "Next-generation sensory engine analyzing facial expressions and vocal patterns to fuse unified high-fidelity emotional intelligence analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen text-slate-100 flex flex-col">
        <div className="absolute inset-0 grid-background pointer-events-none z-0" />
        <main className="flex-1 flex flex-col relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}

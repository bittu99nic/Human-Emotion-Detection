import { useEffect, useRef, useState, useCallback } from "react";

export interface FaceDetection {
  bbox: [number, number, number, number];
  label: string;
  confidence: number;
}

export interface SpeechData {
  active: boolean;
  label: string;
  confidence: number;
  probs: number[];
}

export interface FusionData {
  label: string;
  confidence: number;
  intensity: number;
  stress_level: number;
  engagement_score: number;
  probs: number[];
}

export interface MultimodalPayload {
  faces: FaceDetection[];
  speech: SpeechData;
  fusion: FusionData;
}

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastPayload, setLastPayload] = useState<MultimodalPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 10;
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    try {
      console.log(`[AURA WS] Connecting to ${url}...`);
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[AURA WS] Connected successfully.");
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as MultimodalPayload;
          setLastPayload(payload);
        } catch (e) {
          console.warn("[AURA WS] Error parsing payload:", e);
        }
      };

      socket.onclose = (event) => {
        console.log(`[AURA WS] Connection closed: code=${event.code}, reason=${event.reason}`);
        setIsConnected(false);
        
        // Auto-reconnect if it wasn't a clean close
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          console.log(`[AURA WS] Reconnecting in ${delay}ms... (Attempt ${reconnectAttemptsRef.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        } else {
          setError("Max reconnect attempts reached. Server may be down.");
        }
      };

      socket.onerror = (err) => {
          console.warn("[AURA WS] Connection error:", err);
          setError("WebSocket experienced a connection error.");
        };

    } catch (e) {
      console.warn("[AURA WS] Error initiating socket:", e);
      setError("Failed to initialize connection.");
    }
  }, [url]);

  const disconnect = useCallback(() => {
    console.log("[AURA WS] Disconnecting manually...");
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = maxReconnectAttempts; // Disable auto-reconnect
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendData = useCallback((data: { video?: string; audio?: string }) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastPayload,
    error,
    connect,
    disconnect,
    sendData,
  };
}

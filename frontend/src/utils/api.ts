/**
 * Resolves the backend base URL dynamically matching the user's browser URL hostname.
 * This guarantees the application runs seamlessly over local IP addresses, custom domains, or container networks.
 */
export function getBackendUrl(protocol: "http" | "ws" = "http"): string {
  if (typeof window === "undefined") {
    return protocol === "http" ? "http://localhost:8000" : "ws://localhost:8000";
  }
  
  const hostname = window.location.hostname;
  const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const httpProto = window.location.protocol;
  
  if (protocol === "ws") {
    return `${wsProto}//${hostname}:8000`;
  }
  return `${httpProto}//${hostname}:8000`;
}

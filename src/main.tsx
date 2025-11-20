import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { validateEnv } from "./utils/validateEnv";
import "./index.css";

// Validate environment variables before app starts
try {
  validateEnv();
} catch (error) {
  console.error("❌ FATAL: Environment validation failed");
  console.error(error);
  // Show user-friendly error
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
      <div style="text-align: center; padding: 2rem; border: 2px solid #ef4444; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #ef4444; margin-bottom: 1rem;">Configuration Error</h1>
        <p style="color: #666; margin-bottom: 1rem;">Required environment variables are missing.</p>
        <p style="color: #666; font-size: 0.9rem;">Please check your .env file and ensure all required variables are set.</p>
        <pre style="background: #f3f4f6; padding: 1rem; border-radius: 4px; text-align: left; margin-top: 1rem; font-size: 0.85rem;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    </div>
  `;
  throw error;
}

// Auto-reconnect for Vite dev server in development
if (import.meta.env.DEV) import("../scripts/reconnect-dev.js");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for offline tile caching
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("✅ Service Worker registered for offline tiles"))
      .catch((err) => console.warn("SW registration failed:", err));
  });
}
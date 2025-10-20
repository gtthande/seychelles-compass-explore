setInterval(() => {
  if (window.__vite_plugin_react_preamble_installed__ && window.WebSocket) {
    console.log("🔄 Checking Vite connection...");
    try {
      const ws = new WebSocket(`ws://${window.location.host}`);
      ws.onopen = () => console.log("✅ Reconnected to dev server");
    } catch (e) {
      console.warn("⚠️ Could not reconnect:", e.message);
    }
  }
}, 10000);
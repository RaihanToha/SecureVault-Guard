import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { registerSW } from "virtual:pwa-register";

// Register PWA service worker for Android standalone app support & offline caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("[PWA ServiceWorker] New version available");
  },
  onOfflineReady() {
    console.log("[PWA ServiceWorker] App ready for offline zero-knowledge usage");
  },
});

createRoot(document.getElementById("root")!).render(<App />);

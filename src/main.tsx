
  import { createRoot } from "react-dom/client";
  import App from "./App";
  import "./index.css";
  import { initDarkMode } from "./utils/darkMode";

  // Global API Interceptor: Bypass browser cache for all backend edge function calls
  // This guarantees the frontend instantly shows newly updated dashboard information.
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config] = args;
    let url = '';
    
    if (typeof resource === 'string') {
      url = resource;
    } else if (resource instanceof URL) {
      url = resource.href;
    } else if (resource && typeof (resource as any).url === 'string') {
      url = (resource as any).url;
    }

    if (url.includes('supabase.co/functions/')) {
      config = config || {};
      if (!config.cache) {
        config.cache = 'no-store';
      }
    }
    return originalFetch(resource, config);
  };

  // Run before React renders to avoid flash of wrong theme
  initDarkMode();

  createRoot(document.getElementById("root")!).render(<App />);
  
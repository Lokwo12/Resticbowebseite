
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { initDarkMode } from "./utils/darkMode";

  // Run before React renders to avoid flash of wrong theme
  initDarkMode();

  createRoot(document.getElementById("root")!).render(<App />);
  
import "./polyfills.js"; // Import polyfills first
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/ie-fixes.css"; // IE11 compatibility fixes
// import "./assets/font.css";
import "@fontsource/inter"; // Defaults to weight 400
import "@fontsource/inter/400.css"; // Specific weight
import "@fontsource/inter/700.css"; // Bold
import AreviREllocin from "./App.jsx";
import { configureAxios } from "./services/axiosInterceptor";

// Configure axios with baseURL before app renders
configureAxios();

// Recover from stale chunk references after a new deploy: if a lazy-loaded
// route/module 404s (old hashed filename no longer exists on the server),
// reload once to pick up the current build instead of leaving a white screen.
const RELOAD_FLAG = "chunk-reload-attempted";
window.addEventListener("vite:preloadError", () => {
  if (!sessionStorage.getItem(RELOAD_FLAG)) {
    sessionStorage.setItem(RELOAD_FLAG, "1");
    window.location.reload();
  }
});
window.addEventListener("unhandledrejection", (event) => {
  const message = event?.reason?.message || "";
  if (
    /Failed to fetch dynamically imported module|Importing a module script failed/i.test(
      message
    ) &&
    !sessionStorage.getItem(RELOAD_FLAG)
  ) {
    sessionStorage.setItem(RELOAD_FLAG, "1");
    window.location.reload();
  }
});
window.addEventListener("load", () => {
  sessionStorage.removeItem(RELOAD_FLAG);
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AreviREllocin />
  </StrictMode>
);

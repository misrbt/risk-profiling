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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AreviREllocin />
  </StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { migrateLegacyStorage } from "./lib/storageKeys.js";
import "./styles/app.css";

migrateLegacyStorage();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

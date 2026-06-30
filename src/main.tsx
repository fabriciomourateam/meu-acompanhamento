import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SupabaseHealthGate } from "@/components/SupabaseHealthGate";

// Aplica o tema persistido antes do React renderizar para evitar flash
const _savedTheme = (() => { try { return localStorage.getItem("ma-theme"); } catch { return null; } })();
if (_savedTheme === "dark") document.documentElement.classList.add("dark");
else document.documentElement.classList.add("theme-light");

const rootElement = document.getElementById("app");
if (rootElement) {
  createRoot(rootElement).render(
    <SupabaseHealthGate>
      <App />
    </SupabaseHealthGate>
  );
}

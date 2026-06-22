import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "ma-theme";

/**
 * Aplica o tema no <html>:
 * - light (padrão): NENHUMA classe nova — fica idêntico ao app de produção de hoje.
 * - dark: classe `dark` (ativa os `dark:` do Tailwind) + variáveis escuras do `:root`.
 * Mantemos `color-scheme` coerente pra o navegador não auto-inverter.
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "only light";
  }
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  // Padrão é SEMPRE claro; só fica escuro se o aluno escolheu explicitamente.
  return saved === "dark" ? "dark" : "light";
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* localStorage indisponível (modo privado) — ok, segue só na sessão */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback seguro se algo for renderizado fora do provider.
    return { theme: "light", setTheme: () => {}, toggleTheme: () => {} };
  }
  return ctx;
}

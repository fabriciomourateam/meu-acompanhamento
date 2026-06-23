import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

// Modo escolhido pelo aluno. "system" segue o aparelho; "light" é o fallback/padrão.
export type ThemeMode = "light" | "dark" | "system";
// Tema realmente aplicado na tela.
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "ma-theme";

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

/**
 * Aplica o tema no <html>:
 * - light (PADRÃO): NENHUMA classe nova — idêntico à produção. ATENÇÃO: o "claro"
 *   deste app é um tema ESCURO "pintado de branco" (o `:root` do index.css é escuro;
 *   os componentes são pintados à mão com classes claras explícitas). NÃO aplicar
 *   `.theme-light` aqui: isso trocaria a camada de variáveis por baixo da pintura e
 *   poderia mexer/quebrar elementos que dependem do `:root`. O claro deve ficar
 *   byte-a-byte como a produção que já foi validada.
 * - dark: classe `dark` (ativa os `dark:` do Tailwind) + variáveis escuras do `:root`.
 * `color-scheme` é declarado explicitamente pra o navegador/SO NÃO forçar auto-dark.
 */
function applyResolved(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.classList.remove("theme-light");
    root.style.colorScheme = "dark";
  } else {
    // Claro = sem classe (NÃO aplicar theme-light — ver nota acima).
    root.classList.remove("dark");
    root.classList.remove("theme-light");
    root.style.colorScheme = "only light";
  }
}

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light" || saved === "system") return saved;
  // Padrão é SEMPRE claro; só muda se o aluno escolher.
  return "light";
}

type ThemeContextValue = {
  /** Modo escolhido: light | dark | system */
  mode: ThemeMode;
  /** Tema efetivamente aplicado: light | dark */
  resolvedTheme: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
  /** Alterna rápido entre claro e escuro (ignora system). */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(getInitialMode()));
  const mediaRef = useRef<MediaQueryList | null>(null);

  // Aplica sempre que o tema resolvido muda.
  useEffect(() => {
    applyResolved(resolvedTheme);
  }, [resolvedTheme]);

  // No modo "system", escuta mudanças do aparelho em tempo real.
  useEffect(() => {
    if (mode !== "system") {
      setResolvedTheme(resolve(mode));
      return;
    }
    setResolvedTheme(systemPrefersDark() ? "dark" : "light");
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mediaRef.current = mq;
    const onChange = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* localStorage indisponível (modo privado) — ok, segue só na sessão */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback seguro se algo for renderizado fora do provider.
    return { mode: "light", resolvedTheme: "light", setMode: () => {}, toggleTheme: () => {} };
  }
  return ctx;
}

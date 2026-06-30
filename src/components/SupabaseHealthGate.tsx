import { useState, useEffect, useCallback, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

async function pingSupabase(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    // Query real ao banco — só retorna sem lançar se o Postgres responder.
    // RLS bloqueando (401/403) ainda conta como "banco no ar".
    // 522/timeout lança exceção → banco fora.
    await supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .abortSignal(controller.signal);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function SupabaseHealthGate({ children }: { children: ReactNode }) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState(30);

  const check = useCallback(async () => {
    const healthy = await pingSupabase();
    setIsHealthy(healthy);
    if (!healthy) setCountdown(30);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  // Contagem regressiva + auto-retry quando em manutenção
  useEffect(() => {
    if (isHealthy !== false) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          check();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isHealthy, check]);

  if (isHealthy === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-4">
              <AlertTriangle className="h-10 w-10 text-orange-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Sistema em manutenção
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Estamos com uma instabilidade momentânea. Por favor, aguarde alguns minutos e tente
              novamente.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setCountdown(30);
                check();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Wifi className="h-3 w-3" />
              Verificando automaticamente em {countdown}s
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

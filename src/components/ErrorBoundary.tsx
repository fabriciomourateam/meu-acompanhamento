import { Component, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Limpa a aba ativa salva no localStorage. Sem isso, se a tela que quebrou for
 * a que estava salva (ex.: comunidade), o reload reabriria direto nela e
 * cairia no mesmo erro de novo — prendendo o usuário no app.
 */
function clearPersistedTabs() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('portal_active_tab_'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* localStorage indisponível (ex.: modo privado) — ignora */
  }
}

/**
 * Error boundary global. Em vez de deixar um erro de render apagar o app inteiro
 * (tela branca/preta), mostra um aviso amigável, registra o erro no Supabase pra
 * triagem e limpa a aba salva pra o reload não cair no mesmo componente quebrado.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
    clearPersistedTabs();
    // Registra pra tratamento posterior. Fire-and-forget: uma falha no log
    // jamais pode mascarar ou substituir o erro original.
    try {
      void supabase
        .rpc('log_client_error' as never, {
          p_message: String(error?.message || error),
          p_stack: error?.stack ?? null,
          p_component_stack: info?.componentStack ?? null,
          p_url: typeof location !== 'undefined' ? location.href : null,
          p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        } as never)
        .then(undefined, () => { /* ignora falha de log */ });
    } catch {
      /* ignora */
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
          <div className="text-4xl">😵‍💫</div>
          <h1 className="text-lg font-semibold text-slate-800">Algo deu errado por aqui</h1>
          <p className="max-w-sm text-sm text-slate-500">
            Tivemos um problema ao carregar esta tela. Já registramos o ocorrido. Tente recarregar — normalmente resolve.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Página pública de instalação do app My Shape.
// Acessível em /instalar (e /baixar). Sem login.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Globe, Smartphone, Apple } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const APP_URL = 'https://meu-acompanhamento.vercel.app/';
const APP_STORE_URL = 'https://apps.apple.com/app/my-shape-fmteam/id6785075637';

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-xs font-bold text-emerald-700 dark:text-emerald-400">
        {n}
      </span>
      <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</span>
    </li>
  );
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPwaInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const installPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') setPwaInstalled(true);
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="mt-4 flex items-center gap-4">
          <img src="/app-icon-512.png" alt="My Shape" className="h-16 w-16 rounded-2xl shadow-sm" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Instalar o app My Shape</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Seu acompanhamento na tela inicial do celular.</p>
          </div>
        </div>

        {/* ===== Android ===== */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-200">
            <Smartphone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Android
          </h2>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Globe className="h-5 w-5" /> Acessar App
            </a>

            {/* Botão extra: o Chrome oferece instalar direto se suportar PWA install prompt */}
            {!pwaInstalled && deferredPrompt && (
              <button
                type="button"
                onClick={installPwa}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white dark:bg-slate-800 px-5 py-3.5 text-base font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm transition hover:bg-emerald-50 dark:hover:bg-slate-700"
              >
                <Download className="h-5 w-5" /> Instalar App
              </button>
            )}

            {pwaInstalled && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-5 py-3.5 text-base font-semibold text-emerald-700 dark:text-emerald-300">
                ✓ App instalado na tela inicial
              </span>
            )}
          </div>

          <ol className="mt-5 space-y-3">
            <Step n={1}>
              Toque em <strong>Acessar App</strong> acima — o portal abre no navegador.
            </Step>
            <Step n={2}>
              No <strong>Chrome</strong>, toque no menu <strong>⋮</strong> (canto superior direito)
              e escolha <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong>.
            </Step>
            <Step n={3}>
              Confirme a instalação. O ícone do <strong>My Shape</strong> aparece na tela
              inicial — abre igual a um app normal, sem o navegador aparecendo.
            </Step>
            <Step n={4}>Nas próximas vezes, abra direto pelo ícone. Sem precisar do link.</Step>
          </ol>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-100 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/50 p-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            <Globe className="mt-0.5 h-4 w-4 flex-none text-emerald-500" />
            <span>
              O app roda direto pelo navegador — sem baixar arquivo. Atualizações chegam
              automaticamente. <strong>Versão nativa na Play Store em breve.</strong>
            </span>
          </div>
        </section>

        {/* ===== iPhone ===== */}
        <section className="mt-8 border-t border-slate-100 dark:border-slate-700/40 pt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-200">
            <Apple className="h-5 w-5 text-slate-700 dark:text-slate-300" /> iPhone (iOS)
          </h2>

          <div className="mt-4">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 px-5 py-3.5 text-base font-semibold text-white dark:text-slate-900 shadow-sm transition hover:bg-slate-700 dark:hover:bg-slate-200"
            >
              <Apple className="h-5 w-5" /> Baixar App
            </a>
          </div>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Disponível na App Store. Baixe, instale e faça login com seus dados.
          </p>
        </section>

        <p className="mt-8 border-t border-slate-100 dark:border-slate-700/40 pt-4 text-xs text-slate-400 dark:text-slate-500">
          Problemas para instalar? Fale com o suporte pelo próprio portal.
        </p>
      </div>
    </div>
  );
}

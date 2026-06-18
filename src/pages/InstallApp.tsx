// Página pública de download/instalação do app (APK Android).
// Acessível em /instalar (e /baixar). Sem login.
// O APK é servido como arquivo estático em /my-shape.apk (pasta public/).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, ShieldCheck, Smartphone, Apple, PlayCircle, X } from 'lucide-react';

const APK_URL = '/my-shape.apk';
// Vídeo de instalação (Google Drive). O arquivo precisa estar compartilhado
// como "qualquer pessoa com o link" para tocar aqui dentro.
const VIDEO_EMBED_URL = 'https://drive.google.com/file/d/1EctBg3Q-gPlsFIS04Ga-Y48zxcWMasKj/preview';

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
        {n}
      </span>
      <span className="text-sm leading-relaxed text-slate-600">{children}</span>
    </li>
  );
}

export default function InstallApp() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <img src="/app-icon-512.png" alt="My Shape" className="h-16 w-16 rounded-2xl shadow-sm" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Instalar o app My Shape</h1>
            <p className="mt-1 text-sm text-slate-500">Seu acompanhamento na tela inicial do celular.</p>
          </div>
        </div>

        {/* Android */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Smartphone className="h-5 w-5 text-emerald-600" /> Android
          </h2>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href={APK_URL}
              download
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Download className="h-5 w-5" /> Baixar o App (.apk)
            </a>
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white px-5 py-3.5 text-base font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              <PlayCircle className="h-5 w-5" /> Ver vídeo de instalação
            </button>
          </div>

          <ol className="mt-5 space-y-3">
            <Step n={1}>Toque em <strong>Baixar o app</strong> acima e aguarde o download terminar.</Step>
            <Step n={2}>
              Abra o arquivo baixado. O Android pode avisar que o app vem de uma{' '}
              <strong>fonte desconhecida</strong> — isso é normal por não vir da Play Store.
            </Step>
            <Step n={3}>
              Toque em <strong>Configurações</strong> e ative <strong>Permitir desta fonte</strong>
              {' '}(ou "Instalar apps desconhecidos"). Depois volte e confirme a instalação.
            </Step>
            <Step n={4}>Pronto! O ícone do <strong>My Shape</strong> aparece na tela inicial.</Step>
          </ol>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800">
            <ShieldCheck className="h-4 w-4 flex-none" />
            <span>
              O app é seguro e oficial do seu acompanhamento. As atualizações de conteúdo chegam
              automaticamente — você não precisa baixar de novo.
            </span>
          </div>
        </section>

        {/* iPhone */}
        <section className="mt-8 border-t border-slate-100 pt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Apple className="h-5 w-5 text-slate-700" /> iPhone (iOS)
          </h2>

          <a
            href="/portal"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
          >
            <Smartphone className="h-5 w-5" /> Acessar o App
          </a>

          <ol className="mt-5 space-y-3">
            <Step n={1}>Abra o portal no <strong>Safari</strong>.</Step>
            <Step n={2}>Toque no botão <strong>Compartilhar</strong> (quadrado com seta para cima).</Step>
            <Step n={3}>Escolha <strong>Adicionar à Tela de Início</strong> e confirme.</Step>
            <Step n={4}>O app aparece na tela inicial, igual a um app normal.</Step>
          </ol>
        </section>

        <p className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-400">
          Problemas para instalar? Fale com o suporte pelo próprio portal.
        </p>
      </div>

      {/* Modal do vídeo de instalação */}
      {showVideo && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowVideo(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowVideo(false)}
              aria-label="Fechar vídeo"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={VIDEO_EMBED_URL}
                title="Vídeo de instalação"
                className="h-full w-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

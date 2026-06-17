// SupportChat — aba "Suporte" do app do aluno: chat 1:1 com a equipe.
// Para o aluno é sempre "Fale com o Fabricio" — ele nunca vê qual atendente
// respondeu. Atualização por polling enquanto a aba está ativa.
// Fatia 2: mídia (foto/vídeo/áudio) — anexar arquivo e gravar nota de voz.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Loader2, MessageCircle, Paperclip, Mic, Square, X } from 'lucide-react';
import { chatService, type SupportMessage, type ChatMediaInput } from '@/lib/chat-service';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';

const BRT = 'America/Sao_Paulo';
const POLL_MS = 6000;

function formatTimeBRT(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: BRT,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Renderiza o anexo de mídia de uma mensagem. */
function MediaContent({
  url,
  type,
  onOpenImage,
}: {
  url: string;
  type: SupportMessage['media_type'];
  onOpenImage: (url: string) => void;
}) {
  if (type === 'image') {
    return (
      <button type="button" onClick={() => onOpenImage(url)} className="block">
        <img
          src={url}
          alt="Imagem enviada"
          loading="lazy"
          className="max-h-60 w-full rounded-lg object-cover"
        />
      </button>
    );
  }
  if (type === 'video') {
    return <video src={url} controls playsInline className="max-h-72 w-full rounded-lg" />;
  }
  if (type === 'audio') {
    return <audio src={url} controls className="w-56 max-w-full" />;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
      Abrir anexo
    </a>
  );
}

interface SupportChatProps {
  patientId: string;
  /** Quando true, a aba está visível e o polling roda. */
  active?: boolean;
}

export function SupportChat({ patientId, active = true }: SupportChatProps) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recorder = useAudioRecorder();

  const load = useCallback(
    async (showSpinner = false) => {
      if (!patientId) return;
      if (showSpinner) setLoading(true);
      try {
        const data = await chatService.getMessages(patientId);
        setMessages(data);
      } catch (e) {
        console.error('Erro ao carregar mensagens de suporte:', e);
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [patientId],
  );

  // Carga inicial
  useEffect(() => {
    load(true);
  }, [load]);

  // Polling enquanto a aba está ativa (pausado durante gravação/anexo pendente
  // pra não atrapalhar a interação)
  useEffect(() => {
    if (!active || !patientId) return;
    const t = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(t);
  }, [active, patientId, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Limpa a URL de preview ao trocar/remover o anexo
  useEffect(() => {
    if (!pendingFile) {
      setPendingPreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPendingPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-selecionar o mesmo arquivo
    if (!file) return;
    setPendingFile(file);
  };

  const handleSend = async () => {
    const text = body.trim();
    if (sending) return;
    if (!text && !pendingFile) return;
    setSending(true);
    try {
      let media: ChatMediaInput | null = null;
      if (pendingFile) {
        media = await chatService.uploadMedia(patientId, pendingFile);
      }
      // otimista (texto e/ou mídia)
      const optimistic: SupportMessage = {
        id: `tmp-${Date.now()}`,
        sender_type: 'patient',
        body: text,
        created_at: new Date().toISOString(),
        is_mine: true,
        media_url: media?.url ?? null,
        media_type: media?.type ?? null,
      };
      setMessages((prev) => [...prev, optimistic]);
      setBody('');
      setPendingFile(null);
      await chatService.sendMessage(patientId, text, media);
      await load(false);
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
      // remove a otimista em caso de falha e devolve o texto
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('tmp-')));
      if (text) setBody(text);
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      await recorder.start();
    } catch (e) {
      console.error('Erro ao acessar o microfone:', e);
      alert('Não foi possível acessar o microfone. Verifique a permissão do navegador.');
    }
  };

  const stopRecording = async () => {
    const file = await recorder.stop();
    if (file) setPendingFile(file);
  };

  const canSend = (!!body.trim() || !!pendingFile) && !sending && !recorder.recording;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-emerald-500 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Fale com o Fabricio</p>
          <p className="text-[11px] text-emerald-50">Tire suas dúvidas com a equipe por aqui</p>
        </div>
      </div>

      {/* Thread */}
      <div className="flex h-[55vh] flex-col gap-2 overflow-y-auto bg-slate-50 px-3 py-4">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-slate-400">
            <MessageCircle className="h-8 w-8" />
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs">Mande sua primeira mensagem para dúvidas ou orientações.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                  m.is_mine
                    ? 'rounded-br-sm bg-emerald-500 text-white'
                    : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
                }`}
              >
                {m.media_url && (
                  <div className={m.body ? 'mb-1.5' : ''}>
                    <MediaContent url={m.media_url} type={m.media_type} onOpenImage={setLightbox} />
                  </div>
                )}
                {m.body && <div className="whitespace-pre-wrap break-words">{m.body}</div>}
                <div className={`mt-1 text-[10px] ${m.is_mine ? 'text-emerald-50' : 'text-slate-400'}`}>
                  {formatTimeBRT(m.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Preview do anexo pendente */}
      {pendingFile && (
        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 px-3 py-2">
          {pendingFile.type.startsWith('image/') && pendingPreview ? (
            <img src={pendingPreview} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : pendingFile.type.startsWith('video/') && pendingPreview ? (
            <video src={pendingPreview} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Mic className="h-5 w-5" />
            </div>
          )}
          <span className="flex-1 truncate text-xs text-slate-600">
            {pendingFile.name || 'Nota de voz'}
          </span>
          <button
            onClick={() => setPendingFile(null)}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-200"
            aria-label="Remover anexo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-slate-100 bg-white p-2">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={onPickFile}
          />
          {recorder.recording ? (
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-600">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
              Gravando… {mmss(recorder.seconds)}
              <button
                onClick={recorder.cancel}
                className="ml-auto rounded-full p-1 text-rose-500 hover:bg-rose-100"
                aria-label="Cancelar gravação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                aria-label="Anexar arquivo"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escreva uma mensagem..."
                rows={1}
                className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </>
          )}

          {/* Gravar áudio (aparece quando não há texto nem anexo) e Enviar */}
          {recorder.recording ? (
            <button
              onClick={stopRecording}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white transition active:scale-95"
              aria-label="Parar e anexar gravação"
            >
              <Square className="h-5 w-5" />
            </button>
          ) : !body.trim() && !pendingFile && recorder.supported ? (
            <button
              onClick={startRecording}
              disabled={sending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition active:scale-95 disabled:opacity-40"
              aria-label="Gravar áudio"
            >
              <Mic className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition active:scale-95 disabled:opacity-40"
              aria-label="Enviar"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Lightbox de imagem */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg" />
          <button
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

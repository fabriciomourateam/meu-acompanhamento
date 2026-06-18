// SupportChat — aba "Suporte" do app do aluno: chat 1:1 com a equipe.
// Para o aluno é sempre "Fale com o Fabricio" — ele nunca vê qual atendente
// respondeu. Atualização por polling enquanto a aba está ativa.
// Fatia 2: mídia (foto/vídeo/áudio) — anexar arquivo e gravar nota de voz.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Loader2, MessageCircle, Paperclip, Mic, Square, X, BellRing, MoreVertical, Pencil, Trash2, Smile, Check, CheckCheck, Reply } from 'lucide-react';
import { chatService, type SupportMessage, type ChatMediaInput } from '@/lib/chat-service';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { pushService } from '@/lib/push-service';
import { InstallPWAButton } from '@/components/InstallPWAButton';
import { renderWithLinks } from '@/lib/linkify';

// Lembra (por aparelho) que o aluno dispensou o convite de notificação no chat.
const NUDGE_DISMISS_KEY = 'chat-notif-nudge-dismissed';

const BRT = 'America/Sao_Paulo';
// Realtime Broadcast entrega quase instantâneo; o polling vira só uma rede de
// segurança (intervalo longo, e pausado quando a aba está em segundo plano).
const POLL_MS = 25000;

// Emojis curados (sem dependência) — mesma lista do back-office.
const EMOJI_GROUPS: { label: string; items: string[] }[] = [
  { label: 'Rostos', items: ['😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😉', '😎', '🤔', '😅', '😴', '😢', '😭', '😡', '🥳', '🤗', '😬'] },
  { label: 'Gestos', items: ['👍', '👎', '👏', '🙏', '💪', '🤝', '👌', '✌️', '🤙', '👋', '🫶', '🙌'] },
  { label: 'Fitness', items: ['🏋️', '🏃', '🥗', '🍗', '🍎', '💧', '🔥', '⚡', '⏰', '📈', '✅', '❌'] },
  { label: 'Símbolos', items: ['❤️', '🎉', '⭐', '💯', '🚀', '📌', '💊', '🩺', '📅', '💬'] },
];

// Emojis de reação rápida (estilo WhatsApp).
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function formatTimeBRT(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: BRT,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Rótulo do separador de dia (Hoje / Ontem / data), sempre em BRT.
function dayLabelBRT(iso: string): string {
  const fmt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: BRT }); // YYYY-MM-DD
  const d = fmt(new Date(iso));
  const today = fmt(new Date());
  const yest = fmt(new Date(Date.now() - 86400000));
  if (d === today) return 'Hoje';
  if (d === yest) return 'Ontem';
  return new Date(iso).toLocaleDateString('pt-BR', {
    timeZone: BRT,
    day: '2-digit',
    month: 'long',
    year: new Date(iso).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
}

// Chave do dia (YYYY-MM-DD em BRT) para detectar troca de data entre mensagens.
function dayKeyBRT(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: BRT });
}

// Resumo curto de uma mensagem citada (rótulo de quem + prévia do conteúdo).
function quotedPreview(m: SupportMessage): { who: string; text: string } {
  const who = m.is_mine ? 'Você' : 'Fabricio';
  if (m.deleted) return { who, text: 'mensagem apagada' };
  if (m.body) return { who, text: m.body };
  if (m.media_type === 'image') return { who, text: '📷 Foto' };
  if (m.media_type === 'audio') return { who, text: '🎤 Áudio' };
  if (m.media_type === 'video') return { who, text: '🎬 Vídeo' };
  return { who, text: 'Anexo' };
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
  const [nudge, setNudge] = useState(false);
  const [nudgeBusy, setNudgeBusy] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  // Editar/apagar: id da mensagem em edição e qual bolha está com o menu aberto.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<SupportMessage | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recorder = useAudioRecorder();

  // "Digitando…" do Fabricio (efêmero, via broadcast).
  const [teamTyping, setTeamTyping] = useState(false);
  const typingNotifyRef = useRef<(() => void) | null>(null);
  const teamTypingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const iosNeedsInstall = pushService.isIOS() && !pushService.isStandalone();

  // Mostra o convite de notificação se o push ainda não está ativo neste aparelho.
  useEffect(() => {
    if (localStorage.getItem(NUDGE_DISMISS_KEY) === '1') return;
    if (!pushService.isSupported() && !iosNeedsInstall) return;
    pushService.isSubscribed().then((sub) => setNudge(!sub));
  }, [iosNeedsInstall]);

  const dismissNudge = () => {
    localStorage.setItem(NUDGE_DISMISS_KEY, '1');
    setNudge(false);
  };

  const enableNudge = async () => {
    if (iosNeedsInstall) {
      setShowInstall(true);
      return;
    }
    setNudgeBusy(true);
    try {
      const res = await pushService.subscribe(patientId);
      if (res.ok) setNudge(false);
    } finally {
      setNudgeBusy(false);
    }
  };

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

  // Realtime Broadcast: assina o tópico da conversa pra receber as respostas da
  // equipe quase na hora (o servidor emite um ping sem conteúdo; recarregamos via
  // RPC escopada). É o caminho principal; o polling abaixo é só fallback.
  useEffect(() => {
    if (!active || !patientId) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    chatService
      .getOrCreateConversation(patientId)
      .then((id) => {
        if (cancelled) return;
        cleanup = chatService.subscribeToConversation(id, () => load(false));
      })
      .catch((e) => console.error('Erro ao assinar conversa (realtime):', e));
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [active, patientId, load]);

  // "Digitando…": assina o canal efêmero e guarda o notify pra emitir ao digitar.
  useEffect(() => {
    if (!active || !patientId) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    chatService
      .getOrCreateConversation(patientId)
      .then((id) => {
        if (cancelled) return;
        const sub = chatService.subscribeTyping(id, (sender) => {
          if (sender !== 'team') return;
          setTeamTyping(true);
          clearTimeout(teamTypingTimer.current);
          teamTypingTimer.current = setTimeout(() => setTeamTyping(false), 3500);
        });
        typingNotifyRef.current = sub.notify;
        cleanup = sub.cleanup;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cleanup?.();
      typingNotifyRef.current = null;
      clearTimeout(teamTypingTimer.current);
    };
  }, [active, patientId]);

  // Polling de fallback (intervalo longo). Pausa quando a aba do navegador está
  // em segundo plano pra não pesar no servidor com centenas de alunos online.
  useEffect(() => {
    if (!active || !patientId) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(() => load(false), POLL_MS);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        load(false); // recupera o que perdeu enquanto estava em background
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
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

  const startEdit = (m: SupportMessage) => {
    setEditingId(m.id);
    setReplyTo(null);
    setBody(m.body);
    setMenuFor(null);
    setPendingFile(null);
    setTimeout(() => composerRef.current?.focus(), 0);
  };

  const startReply = (m: SupportMessage) => {
    setReplyTo(m);
    setEditingId(null);
    setMenuFor(null);
    setTimeout(() => composerRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setBody('');
  };

  // Insere o emoji na posição do cursor do textarea (Parte A).
  const insertEmoji = (emoji: string) => {
    const el = composerRef.current;
    if (!el) {
      setBody((b) => b + emoji);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + emoji + body.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleReact = async (m: SupportMessage, emoji: string) => {
    setMenuFor(null);
    try {
      await chatService.react(patientId, m.id, emoji);
      await load(false);
    } catch (e) {
      console.error('Erro ao reagir:', e);
    }
  };

  const handleDelete = async (m: SupportMessage) => {
    setMenuFor(null);
    if (!window.confirm('Apagar esta mensagem? Ela deixará de aparecer na conversa.')) return;
    // otimista
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, deleted: true } : x)));
    try {
      await chatService.deleteMessage(patientId, m.id);
      await load(false);
    } catch (e) {
      console.error('Erro ao apagar mensagem:', e);
      await load(false);
    }
  };

  const handleSend = async (fileOverride?: File | null) => {
    const text = body.trim();
    if (sending) return;

    // Modo edição (só texto, nunca com anexo/áudio).
    if (editingId && !fileOverride) {
      if (!text) return;
      const id = editingId;
      setSending(true);
      try {
        setMessages((prev) => prev.map((x) => (x.id === id ? { ...x, body: text, edited: true } : x)));
        setBody('');
        setEditingId(null);
        await chatService.editMessage(patientId, id, text);
        await load(false);
      } catch (e) {
        console.error('Erro ao editar mensagem:', e);
        await load(false);
      } finally {
        setSending(false);
      }
      return;
    }
    // fileOverride é usado pela nota de voz (envia direto ao parar a gravação,
    // sem passar pelo estágio de anexo). Senão, usa o anexo pendente.
    const file = fileOverride ?? pendingFile;
    if (!text && !file) return;
    setSending(true);
    try {
      let media: ChatMediaInput | null = null;
      if (file) {
        media = await chatService.uploadMedia(patientId, file);
      }
      const replyId = replyTo?.id ?? null;
      // otimista (texto e/ou mídia)
      const optimistic: SupportMessage = {
        id: `tmp-${Date.now()}`,
        sender_type: 'patient',
        body: text,
        created_at: new Date().toISOString(),
        is_mine: true,
        media_url: media?.url ?? null,
        media_type: media?.type ?? null,
        reply_to_message_id: replyId,
      };
      setMessages((prev) => [...prev, optimistic]);
      setBody('');
      setPendingFile(null);
      setReplyTo(null);
      await chatService.sendMessage(patientId, text, media, replyId);
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
    // Envia a nota de voz na hora (estilo WhatsApp), sem estágio de anexo.
    if (file) await handleSend(file);
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
          <p className="text-[11px] text-emerald-50">
            {teamTyping ? 'Fabricio está digitando…' : 'Tire suas dúvidas com a equipe por aqui'}
          </p>
        </div>
      </div>

      {/* Convite pra ativar notificações (some quando já ativo ou dispensado) */}
      {nudge && (
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-3 py-2">
          <BellRing className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="min-w-0 flex-1 text-xs text-amber-800">
            Ative as notificações pra saber na hora que o Fabricio responder.
          </p>
          <button
            onClick={enableNudge}
            disabled={nudgeBusy}
            className="shrink-0 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
          >
            {nudgeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : iosNeedsInstall ? 'Instalar' : 'Ativar'}
          </button>
          <button onClick={dismissNudge} aria-label="Dispensar" className="shrink-0 text-amber-400 hover:text-amber-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Diálogo de instruções de instalação (iPhone) */}
      <InstallPWAButton triggerless open={showInstall} onOpenChange={setShowInstall} />

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
          messages.map((m, idx) => {
            const canModify = m.is_mine && !m.deleted && !m.id.startsWith('tmp-');
            const showDay = idx === 0 || dayKeyBRT(m.created_at) !== dayKeyBRT(messages[idx - 1].created_at);
            return (
              <div key={m.id} className="contents">
              {showDay && (
                <div className="my-2 flex justify-center">
                  <span className="rounded-full bg-slate-200 px-3 py-0.5 text-[10px] font-medium text-slate-500">
                    {dayLabelBRT(m.created_at)}
                  </span>
                </div>
              )}
              <div className={`group flex items-end gap-1 ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                {/* Menu de ações: Responder (qualquer msg) + Editar/Apagar (só as minhas) */}
                {!m.deleted && !m.id.startsWith('tmp-') && (
                  <div className="relative order-1">
                    <button
                      type="button"
                      onClick={() => setMenuFor(menuFor === m.id ? null : m.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-200"
                      aria-label="Opções da mensagem"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuFor === m.id && (
                      <div className={`absolute bottom-8 z-10 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${m.is_mine ? 'right-0' : 'left-0'}`}>
                        <div className="flex items-center justify-between gap-0.5 border-b border-slate-100 px-1.5 pb-1.5 pt-1">
                          {REACTION_EMOJIS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => handleReact(m, e)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-base hover:bg-slate-100"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => startReply(m)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Reply className="h-3.5 w-3.5" /> Responder
                        </button>
                        {canModify && m.body && (
                          <button
                            type="button"
                            onClick={() => startEdit(m)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </button>
                        )}
                        {canModify && (
                          <button
                            type="button"
                            onClick={() => handleDelete(m)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Apagar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`order-2 max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                    m.is_mine
                      ? 'rounded-br-sm bg-emerald-500 text-white'
                      : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {m.deleted ? (
                    <div className={`flex items-center gap-1.5 text-sm italic ${m.is_mine ? 'text-emerald-50' : 'text-slate-400'}`}>
                      <Trash2 className="h-3.5 w-3.5" /> Esta mensagem foi apagada
                    </div>
                  ) : (
                    <>
                      {/* Bloco da mensagem citada (resolvido na lista local) */}
                      {m.reply_to_message_id && (() => {
                        const q = messages.find((x) => x.id === m.reply_to_message_id);
                        const p = q ? quotedPreview(q) : { who: '', text: 'mensagem' };
                        return (
                          <div className={`mb-1.5 rounded-lg border-l-2 px-2 py-1 text-[11px] ${m.is_mine ? 'border-white/60 bg-white/15' : 'border-emerald-400 bg-slate-100'}`}>
                            <div className={`font-semibold ${m.is_mine ? 'text-white' : 'text-emerald-700'}`}>{p.who}</div>
                            <div className={`line-clamp-2 ${m.is_mine ? 'text-emerald-50' : 'text-slate-500'}`}>{p.text}</div>
                          </div>
                        );
                      })()}
                      {m.media_url && (
                        <div className={m.body ? 'mb-1.5' : ''}>
                          <MediaContent url={m.media_url} type={m.media_type} onOpenImage={setLightbox} />
                        </div>
                      )}
                      {m.body && <div className="whitespace-pre-wrap break-words">{renderWithLinks(m.body)}</div>}
                    </>
                  )}
                  <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${m.is_mine ? 'text-emerald-50' : 'text-slate-400'}`}>
                    <span>{formatTimeBRT(m.created_at)}</span>
                    {m.edited && !m.deleted && <span>(editado)</span>}
                    {/* ✓✓ lido — só nas minhas mensagens (do aluno) já confirmadas */}
                    {m.is_mine && !m.deleted && !m.id.startsWith('tmp-') &&
                      (m.read_at ? (
                        <CheckCheck className="h-3.5 w-3.5 text-sky-200" aria-label="Lida" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-emerald-100" aria-label="Enviada" />
                      ))}
                  </div>
                  {/* Reações */}
                  {m.reactions && m.reactions.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {m.reactions.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleReact(m, r.emoji)}
                          className={`rounded-full px-1.5 py-0.5 text-xs leading-none ring-1 ${m.is_mine ? 'bg-white/20 ring-white/30' : 'bg-slate-100 ring-slate-200'}`}
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
            );
          })
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

      {/* Tarja de "respondendo a…" */}
      {replyTo && !editingId && (
        <div className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50 px-3 py-2">
          <Reply className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-emerald-700">
              Respondendo a {quotedPreview(replyTo).who}
            </div>
            <div className="truncate text-xs text-emerald-800/70">{quotedPreview(replyTo).text}</div>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="rounded-full p-1 text-emerald-500 hover:bg-emerald-100"
            aria-label="Cancelar resposta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Banner de edição */}
      {editingId && (
        <div className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50 px-3 py-2">
          <Pencil className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="flex-1 text-xs text-emerald-800">Editando mensagem</span>
          <button
            onClick={cancelEdit}
            className="rounded-full p-1 text-emerald-500 hover:bg-emerald-100"
            aria-label="Cancelar edição"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="relative border-t border-slate-100 bg-white p-2">
        {/* Painel de emojis (toggle) */}
        {emojiOpen && (
          <div className="absolute bottom-full left-2 z-20 mb-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {EMOJI_GROUPS.map((g) => (
                <div key={g.label}>
                  <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">{g.label}</p>
                  <div className="grid grid-cols-8 gap-0.5">
                    {g.items.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => {
                          insertEmoji(e);
                          setEmojiOpen(false);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-slate-100"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
              {!editingId && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Anexar arquivo"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setEmojiOpen((v) => !v)}
                disabled={sending}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition hover:bg-slate-100 disabled:opacity-40 ${emojiOpen ? 'text-emerald-600' : 'text-slate-500'}`}
                aria-label="Inserir emoji"
              >
                <Smile className="h-5 w-5" />
              </button>
              <textarea
                ref={composerRef}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  typingNotifyRef.current?.();
                }}
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
              aria-label="Parar e enviar gravação"
            >
              <Square className="h-5 w-5" />
            </button>
          ) : !editingId && !body.trim() && !pendingFile && recorder.supported ? (
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
              onClick={() => handleSend()}
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

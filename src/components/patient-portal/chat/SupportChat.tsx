// SupportChat — aba "Suporte" do app do aluno: chat 1:1 com a equipe.
// Para o aluno é sempre "Fale com o Fabricio" — ele nunca vê qual atendente
// respondeu. Atualização por polling enquanto a aba está ativa.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { chatService, type SupportMessage } from '@/lib/chat-service';

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
  const bottomRef = useRef<HTMLDivElement>(null);

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

  // Polling enquanto a aba está ativa
  useEffect(() => {
    if (!active || !patientId) return;
    const t = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(t);
  }, [active, patientId, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    // otimista
    const optimistic: SupportMessage = {
      id: `tmp-${Date.now()}`,
      sender_type: 'patient',
      body: text,
      created_at: new Date().toISOString(),
      is_mine: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setBody('');
    try {
      await chatService.sendMessage(patientId, text);
      await load(false);
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
      // remove a otimista em caso de falha
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setBody(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className={`mt-1 text-[10px] ${m.is_mine ? 'text-emerald-50' : 'text-slate-400'}`}>
                  {formatTimeBRT(m.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-slate-100 bg-white p-2">
        <div className="flex items-end gap-2">
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
          <button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition active:scale-95 disabled:opacity-40"
            aria-label="Enviar"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

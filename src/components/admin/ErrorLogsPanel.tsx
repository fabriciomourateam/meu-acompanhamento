import { useCallback, useEffect, useState } from 'react';
import { Check, RotateCcw, ChevronDown, ChevronRight, Loader2, AlertTriangle, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { clientErrorLogService, type ClientErrorLog } from '@/lib/client-error-log-service';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

export function ErrorLogsPanel({ trainerUserId }: { trainerUserId: string }) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ClientErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await clientErrorLogService.list(trainerUserId, onlyOpen, 100));
    } catch {
      toast({ title: 'Erro ao carregar logs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [trainerUserId, onlyOpen, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const setResolved = async (log: ClientErrorLog, resolved: boolean) => {
    setBusyId(log.id);
    try {
      await clientErrorLogService.setResolved(trainerUserId, log.id, resolved);
      // Se estou vendo só os abertos e acabei de resolver, some da lista.
      if (onlyOpen && resolved) {
        setLogs((prev) => prev.filter((l) => l.id !== log.id));
      } else {
        setLogs((prev) => prev.map((l) => (l.id === log.id ? { ...l, resolved } : l)));
      }
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Bug className="h-4 w-4 text-rose-500" />
          <p className="font-semibold">Erros registrados no app</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyOpen((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              onlyOpen ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            {onlyOpen ? 'Só não resolvidos' : 'Todos'}
          </button>
          <Button variant="ghost" size="sm" onClick={load} className="text-slate-500">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Falhas de tela capturadas automaticamente no portal dos alunos. Use para investigar e marcar como
        resolvido depois de corrigir.
      </p>

      {loading ? (
        <div className="flex justify-center py-10 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-400">
          {onlyOpen ? 'Nenhum erro pendente 🎉' : 'Nenhum erro registrado.'}
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const open = expanded === log.id;
            return (
              <div
                key={log.id}
                className={`rounded-xl border ${log.resolved ? 'border-slate-200 bg-slate-50' : 'border-rose-200 bg-white'}`}
              >
                <div className="flex items-start gap-2 p-3">
                  <button
                    onClick={() => setExpanded(open ? null : log.id)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600"
                    aria-label="Detalhes"
                  >
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${log.resolved ? 'text-slate-300' : 'text-rose-500'}`} />
                      <p className="truncate text-sm font-medium text-slate-800">{log.message || 'Erro sem mensagem'}</p>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {timeAgo(log.created_at)}
                      {log.url ? ` · ${log.url.replace(/^https?:\/\//, '')}` : ''}
                    </p>
                  </div>
                  {log.resolved ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === log.id}
                      onClick={() => setResolved(log, false)}
                      className="shrink-0 text-slate-500"
                    >
                      {busyId === log.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1 h-3.5 w-3.5" />}
                      Reabrir
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === log.id}
                      onClick={() => setResolved(log, true)}
                      className="shrink-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {busyId === log.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                      Resolver
                    </Button>
                  )}
                </div>

                {open && (
                  <div className="space-y-2 border-t border-slate-100 p-3 text-xs">
                    {log.user_agent && (
                      <p className="text-slate-500">
                        <span className="font-semibold text-slate-600">Dispositivo:</span> {log.user_agent}
                      </p>
                    )}
                    {log.component_stack && (
                      <div>
                        <p className="mb-1 font-semibold text-slate-600">Componente:</p>
                        <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 p-2 text-[10px] leading-relaxed text-slate-200">
                          {log.component_stack.trim()}
                        </pre>
                      </div>
                    )}
                    {log.stack && (
                      <div>
                        <p className="mb-1 font-semibold text-slate-600">Stack:</p>
                        <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 p-2 text-[10px] leading-relaxed text-slate-200">
                          {log.stack.trim()}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

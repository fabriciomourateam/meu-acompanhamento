import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Trash2, Flag, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { communityService, type CommunityComment } from '@/lib/community-service';
import { CommunityAvatar } from './CommunityAvatar';
import { ReportDialog } from './ReportDialog';
import { timeAgo } from './communityTime';

interface CommentSectionProps {
  patientId: string;
  postId: string;
  onCountChange: (delta: number) => void;
}

export function CommentSection({ patientId, postId, onCountChange }: CommentSectionProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function load() {
    try {
      const data = await communityService.getComments(patientId, postId);
      if (mounted.current) setComments(data);
    } catch (err) {
      console.error('Erro ao carregar comentários:', err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  const handleSend = async () => {
    const content = text.trim();
    if (!content || submitting) return;
    try {
      setSubmitting(true);
      await communityService.addComment(patientId, postId, content);
      setText('');
      onCountChange(1);
      await load();
    } catch (err) {
      console.error('Erro ao comentar:', err);
      toast({ title: 'Erro ao comentar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    const content = replyText.trim();
    if (!content || !replyTo || replySubmitting) return;
    try {
      setReplySubmitting(true);
      await communityService.addComment(patientId, postId, content, replyTo.id);
      setReplyText('');
      setReplyTo(null);
      onCountChange(1);
      await load();
    } catch (err) {
      console.error('Erro ao responder:', err);
      toast({ title: 'Erro ao responder', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await communityService.deleteComment(patientId, commentId);
      // remove o comentário e (se for raiz) suas respostas, ajustando o contador
      const removedIds = new Set<string>([commentId]);
      comments.forEach((c) => {
        if (c.parent_comment_id === commentId) removedIds.add(c.id);
      });
      setComments((prev) => prev.filter((c) => !removedIds.has(c.id)));
      onCountChange(-removedIds.size);
    } catch (err) {
      console.error('Erro ao excluir comentário:', err);
      toast({ title: 'Erro ao excluir', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  const roots = comments.filter((c) => !c.parent_comment_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_comment_id === id);

  const renderActions = (c: CommunityComment, canReply: boolean) => (
    <div className="mt-1 flex items-center gap-3 pl-1 text-[11px] text-slate-400 dark:text-slate-500">
      <span>{timeAgo(c.created_at)}</span>
      {canReply && (
        <button
          onClick={() => {
            setReplyTo({ id: c.id, name: c.author_name });
            setReplyText('');
          }}
          className="flex items-center gap-1 hover:text-emerald-600"
        >
          <CornerDownRight className="h-3 w-3" /> Responder
        </button>
      )}
      {c.is_own ? (
        <button onClick={() => handleDelete(c.id)} className="flex items-center gap-1 hover:text-rose-500">
          <Trash2 className="h-3 w-3" /> Excluir
        </button>
      ) : (
        <button onClick={() => setReportId(c.id)} className="flex items-center gap-1 hover:text-rose-500">
          <Flag className="h-3 w-3" /> Denunciar
        </button>
      )}
    </div>
  );

  const renderComment = (c: CommunityComment, isReply: boolean) => (
    <li key={c.id} className="flex gap-2">
      <CommunityAvatar name={c.author_name} photo={c.author_photo} className={isReply ? 'h-6 w-6' : 'h-7 w-7'} />
      <div className="flex-1">
        <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 px-3 py-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{c.author_name}</p>
          <p className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200">{c.content}</p>
        </div>
        {renderActions(c, !isReply)}

        {/* Caixa de resposta inline (apenas em raiz) */}
        {!isReply && replyTo?.id === c.id && (
          <div className="mt-2 flex items-center gap-2">
            <input
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
                if (e.key === 'Escape') setReplyTo(null);
              }}
              maxLength={2000}
              placeholder={`Respondendo ${c.author_name}...`}
              className="flex-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
            <Button
              size="icon"
              onClick={handleReply}
              disabled={!replyText.trim() || replySubmitting}
              className="h-8 w-8 shrink-0 rounded-full bg-emerald-500 hover:bg-emerald-600"
            >
              {replySubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </div>
    </li>
  );

  return (
    <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400 dark:text-slate-500" />
        </div>
      ) : (
        <ul className="space-y-3">
          {roots.map((root) => (
            <li key={root.id}>
              <ul className="space-y-3">
                {renderComment(root, false)}
                {repliesOf(root.id).length > 0 && (
                  <ul className="ml-6 space-y-3 border-l border-slate-100 dark:border-slate-800 pl-3">
                    {repliesOf(root.id).map((reply) => renderComment(reply, true))}
                  </ul>
                )}
              </ul>
            </li>
          ))}
          {roots.length === 0 && (
            <p className="py-1 text-center text-xs text-slate-400 dark:text-slate-500">Seja o primeiro a comentar.</p>
          )}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          maxLength={2000}
          placeholder="Escreva um comentário..."
          className="flex-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!text.trim() || submitting}
          className="h-9 w-9 shrink-0 rounded-full bg-emerald-500 hover:bg-emerald-600"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {reportId && (
        <ReportDialog
          open={!!reportId}
          onOpenChange={(o) => !o && setReportId(null)}
          patientId={patientId}
          targetType="comment"
          targetId={reportId}
        />
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Trash2, Flag } from 'lucide-react';
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

  const handleDelete = async (commentId: string) => {
    try {
      await communityService.deleteComment(patientId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCountChange(-1);
    } catch (err) {
      console.error('Erro ao excluir comentário:', err);
      toast({ title: 'Erro ao excluir', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2">
              <CommunityAvatar name={c.author_name} photo={c.author_photo} className="h-7 w-7" />
              <div className="flex-1">
                <div className="rounded-2xl bg-slate-100 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-700">{c.author_name}</p>
                  <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{c.content}</p>
                </div>
                <div className="mt-1 flex items-center gap-3 pl-1 text-[11px] text-slate-400">
                  <span>{timeAgo(c.created_at)}</span>
                  {c.is_own ? (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="flex items-center gap-1 hover:text-rose-500"
                    >
                      <Trash2 className="h-3 w-3" /> Excluir
                    </button>
                  ) : (
                    <button
                      onClick={() => setReportId(c.id)}
                      className="flex items-center gap-1 hover:text-rose-500"
                    >
                      <Flag className="h-3 w-3" /> Denunciar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
          {comments.length === 0 && (
            <p className="py-1 text-center text-xs text-slate-400">Seja o primeiro a comentar.</p>
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
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
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

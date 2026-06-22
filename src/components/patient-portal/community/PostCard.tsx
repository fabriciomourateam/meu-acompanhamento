import { useState } from 'react';
import { MessageCircle, MoreVertical, Trash2, Flag, SmilePlus, Share2, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  communityService,
  REACTIONS,
  CATEGORIES,
  type CommunityPost,
  type ReactionType,
} from '@/lib/community-service';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from './CommunityAvatar';
import { CommentSection } from './CommentSection';
import { ReportDialog } from './ReportDialog';
import { timeAgo } from './communityTime';
import { sharePostImage } from './communityShare';

interface PostCardProps {
  patientId: string;
  post: CommunityPost;
  trainerInstagram?: string;
  shareCaption?: string;
  onDeleted: (postId: string) => void;
}

export function PostCard({
  patientId,
  post: initial,
  trainerInstagram = '',
  shareCaption = '',
  onDeleted,
}: PostCardProps) {
  const { toast } = useToast();
  const [post, setPost] = useState<CommunityPost>(initial);
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await sharePostImage(post, { instagram: trainerInstagram, caption: shareCaption });
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', err);
        toast({ title: 'Erro ao gerar imagem', description: 'Tente novamente.', variant: 'destructive' });
      }
    } finally {
      setSharing(false);
    }
  };

  const category = CATEGORIES.find((c) => c.value === post.category);
  const isConquista = post.category === 'conquista';

  const handleReact = async (type: ReactionType) => {
    setShowReactions(false);
    const had = post.my_reactions.includes(type);
    // otimista
    setPost((p) => {
      const counts = { ...p.reactions };
      counts[type] = (counts[type] || 0) + (had ? -1 : 1);
      if ((counts[type] || 0) <= 0) delete counts[type];
      return {
        ...p,
        reactions: counts,
        my_reactions: had ? p.my_reactions.filter((r) => r !== type) : [...p.my_reactions, type],
      };
    });
    try {
      await communityService.toggleReaction(patientId, post.id, type);
    } catch (err) {
      console.error('Erro ao reagir:', err);
      setPost(initial);
      toast({ title: 'Erro ao reagir', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await communityService.deletePost(patientId, post.id);
      onDeleted(post.id);
    } catch (err) {
      console.error('Erro ao excluir post:', err);
      toast({ title: 'Erro ao excluir', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  const totalReactions = Object.values(post.reactions).reduce((a, b) => a + (b || 0), 0);
  const activeEmojis = REACTIONS.filter((r) => (post.reactions[r.type] || 0) > 0).map((r) => r.emoji);

  return (
    <div className={cn(
      'rounded-2xl border p-4 shadow-sm',
      isConquista
        ? 'border-amber-300 bg-gradient-to-br from-amber-50/70 to-white ring-1 ring-amber-200'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
    )}>
      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <CommunityAvatar name={post.author_name} photo={post.author_photo} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{post.author_name}</p>
            {category && (
              <span className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                isConquista ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
              )}>
                {category.emoji} {category.label}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">{timeAgo(post.created_at)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 hover:text-slate-600">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
            {post.is_own ? (
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-rose-600 dark:text-rose-400 focus:bg-rose-50 focus:text-rose-700"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => setReporting(true)}
                className="text-rose-600 dark:text-rose-400 focus:bg-rose-50 focus:text-rose-700"
              >
                <Flag className="mr-2 h-4 w-4" /> Denunciar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Conteúdo */}
      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200">{post.content}</p>
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Imagem da publicação"
          className="mt-3 max-h-[500px] w-full rounded-xl object-contain bg-slate-50 dark:bg-slate-900"
          loading="lazy"
        />
      )}

      {/* Resumo de reações */}
      {totalReactions > 0 && (
        <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <span>{activeEmojis.join(' ')}</span>
          <span>{totalReactions}</span>
        </div>
      )}

      {/* Ações */}
      <div className="relative mt-2 flex items-center gap-1 border-t border-slate-100 dark:border-slate-800 pt-2">
        <button
          onClick={() => setShowReactions((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            post.my_reactions.length > 0
              ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100',
          )}
        >
          <SmilePlus className="h-4 w-4" /> Reagir
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100"
        >
          <MessageCircle className="h-4 w-4" />
          {post.comment_count > 0 ? post.comment_count : ''} Comentar
        </button>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100"
          title="Compartilhar como imagem"
        >
          {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
        </button>

        {showReactions && (
          <div className="absolute -top-12 left-0 z-20 flex gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-lg">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                onClick={() => handleReact(r.type)}
                title={r.label}
                className={cn(
                  'rounded-full p-1 text-xl transition-transform hover:scale-125',
                  post.my_reactions.includes(r.type) && 'bg-emerald-100 dark:bg-emerald-950/50',
                )}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {showComments && (
        <CommentSection
          patientId={patientId}
          postId={post.id}
          onCountChange={(delta) =>
            setPost((p) => ({ ...p, comment_count: Math.max(0, p.comment_count + delta) }))
          }
        />
      )}

      <ReportDialog
        open={reporting}
        onOpenChange={setReporting}
        patientId={patientId}
        targetType="post"
        targetId={post.id}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-slate-200">Excluir publicação?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              Esta ação não pode ser desfeita. A publicação e seus comentários serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-500 text-white hover:bg-rose-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

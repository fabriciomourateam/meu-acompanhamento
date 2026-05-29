import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Clock, Flame, Users } from 'lucide-react';
import {
  communityService,
  CATEGORIES,
  type CommunityPost,
  type CommunityCategory,
  type FeedSort,
} from '@/lib/community-service';
import { cn } from '@/lib/utils';
import { PostComposer } from './PostComposer';
import { PostCard } from './PostCard';

interface CommunityFeedProps {
  patientId: string;
  trainerUserId: string;
  trainerInstagram?: string;
  shareCaption?: string;
}

type CategoryFilter = CommunityCategory | 'all';

export function CommunityFeed({ patientId, trainerInstagram = '', shareCaption = '' }: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sort, setSort] = useState<FeedSort>('recent');
  // Contadores de posts novos por categoria desde a ultima visita (localStorage).
  const [unread, setUnread] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!patientId) return;
    const key = `community_last_seen_${patientId}`;
    const lastSeen = localStorage.getItem(key);
    // Primeira visita: nao inunda com "novos"; apenas marca o ponto de partida.
    if (lastSeen) {
      communityService
        .getUnreadByCategory(patientId, lastSeen)
        .then(setUnread)
        .catch(() => setUnread({}));
    }
    // Marca esta visita como referencia para a proxima.
    localStorage.setItem(key, new Date().toISOString());
  }, [patientId]);

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  const load = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true);
      else setRefreshing(true);
      try {
        const data = await communityService.getFeed(patientId, category, sort, 50, 0);
        setPosts(data);
      } catch (err) {
        console.error('Erro ao carregar comunidade:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [patientId, category, sort],
  );

  useEffect(() => {
    load(true);
  }, [load]);

  return (
    <div className="space-y-4">
      <PostComposer patientId={patientId} onPosted={() => load(false)} />

      {/* Filtros */}
      <div className="flex items-center justify-between gap-2">
        <div className="scrollbar-emerald flex flex-1 gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory('all')}
            className={cn(
              'relative shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              category === 'all' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            Tudo
            <UnreadDot count={totalUnread} active={category === 'all'} />
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                'relative shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                category === c.value ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {c.emoji} {c.label}
              <UnreadDot count={unread[c.value] || 0} active={category === c.value} />
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 p-0.5">
          <button
            onClick={() => setSort('recent')}
            title="Mais recentes"
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              sort === 'recent' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500',
            )}
          >
            <Clock className="h-3.5 w-3.5" /> Recentes
          </button>
          <button
            onClick={() => setSort('popular')}
            title="Mais populares"
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              sort === 'popular' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500',
            )}
          >
            <Flame className="h-3.5 w-3.5" /> Populares
          </button>
        </div>
        <button
          onClick={() => load(false)}
          disabled={refreshing}
          title="Atualizar"
          className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
          <Users className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">Nenhuma publicação ainda</p>
          <p className="text-xs text-slate-400">Seja o primeiro a compartilhar algo com a comunidade!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              patientId={patientId}
              post={post}
              trainerInstagram={trainerInstagram}
              shareCaption={shareCaption}
              onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Contador de posts novos (desde a ultima visita) exibido no canto do chip.
function UnreadDot({ count, active }: { count: number; active: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none shadow-sm',
        active ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white',
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

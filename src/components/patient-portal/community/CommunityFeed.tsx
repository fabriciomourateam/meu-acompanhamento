import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, Clock, Flame, Users, Sparkles, ChevronDown } from 'lucide-react';
import {
  communityService,
  CATEGORIES,
  POST_CATEGORIES,
  type CommunityPost,
  type CommunityCategory,
  type FeedSort,
} from '@/lib/community-service';
import { cn } from '@/lib/utils';
import { PostComposer } from './PostComposer';
import { PostCard } from './PostCard';
import { getCurrentWeeklyTheme, type WeeklyTheme } from '@/lib/community-themes';

interface CommunityFeedProps {
  patientId: string;
  trainerUserId: string;
  trainerInstagram?: string;
  shareCaption?: string;
  /** Aviso/tema fixado configurado pelo treinador no /admin. */
  announcement?: string;
  announcementEmoji?: string;
  announcementEnabled?: boolean;
  /** Rotação automática de temas semanais (tem prioridade sobre o aviso manual). */
  themeRotationEnabled?: boolean;
  themeStartDate?: string;
  themeSchedule?: WeeklyTheme[];
}

type CategoryFilter = CommunityCategory | 'all';

export function CommunityFeed({
  patientId,
  trainerInstagram = '',
  shareCaption = '',
  announcement = '',
  announcementEmoji = '📌',
  announcementEnabled = false,
  themeRotationEnabled = false,
  themeStartDate = '',
  themeSchedule = [],
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sort, setSort] = useState<FeedSort>('recent');
  // Contadores de posts novos por categoria desde a ultima visita (localStorage).
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [composerCategory, setComposerCategory] = useState<CommunityCategory>('geral');
  const composerRef = useRef<HTMLDivElement>(null);
  const scrollToComposer = () => composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

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

  // Tema vigente: rotação automática tem prioridade; senão, o aviso manual.
  const rotatingTheme = themeRotationEnabled
    ? getCurrentWeeklyTheme(themeSchedule, themeStartDate)
    : null;
  const bannerEmoji = rotatingTheme ? (rotatingTheme.emoji || '📌') : (announcementEmoji || '📌');
  const bannerText = rotatingTheme ? rotatingTheme.text : announcement;
  const showBanner = rotatingTheme ? !!bannerText.trim() : (announcementEnabled && announcement.trim().length > 0);

  return (
    <div className="space-y-4">
      {/* Aviso / tema da semana (rotação automática ou aviso fixo) */}
      {showBanner && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50 dark:from-emerald-950/40 to-white p-3.5 shadow-sm">
          <span className="text-xl leading-none">{bannerEmoji}</span>
          <p className="flex-1 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">{bannerText}</p>
        </div>
      )}

      <div ref={composerRef}>
        <PostComposer
          patientId={patientId}
          category={composerCategory}
          onCategoryChange={setComposerCategory}
          onPosted={() => load(false)}
        />
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-between gap-2">
        {/* Mobile: select de categoria (evita a barra escondida) */}
        <div className="relative flex-1 sm:hidden">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            className="w-full appearance-none rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 dark:text-slate-200 focus:border-emerald-400 focus:outline-none"
          >
            <option value="all">📋 Tudo{totalUnread > 0 ? ` (${totalUnread})` : ''}</option>
            {POST_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}{unread[c.value] ? ` (${unread[c.value]})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        </div>

        {/* Desktop: chips de categoria */}
        <div className="hidden flex-1 gap-1.5 overflow-x-auto pb-1 sm:flex scrollbar-emerald">
          <button
            onClick={() => setCategory('all')}
            className={cn(
              'relative shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              category === 'all' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200',
            )}
          >
            Tudo
            <UnreadDot count={totalUnread} active={category === 'all'} />
          </button>
          {POST_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                'relative shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                category === c.value ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200',
              )}
            >
              {c.emoji} {c.label}
              <UnreadDot count={unread[c.value] || 0} active={category === c.value} />
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 p-0.5">
          <button
            onClick={() => setSort('recent')}
            title="Mais recentes"
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              sort === 'recent' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400',
            )}
          >
            <Clock className="h-3.5 w-3.5" /> Recentes
          </button>
          <button
            onClick={() => setSort('popular')}
            title="Mais populares"
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              sort === 'popular' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400',
            )}
          >
            <Flame className="h-3.5 w-3.5" /> Populares
          </button>
        </div>
        <button
          onClick={() => load(false)}
          disabled={refreshing}
          title="Atualizar"
          className="shrink-0 rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
        category === 'all' ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-12 text-center">
            <Users className="h-8 w-8 text-slate-300" />
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nenhuma publicação ainda</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Seja o primeiro a compartilhar algo com a comunidade!</p>
            </div>
            <button
              onClick={scrollToComposer}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              <Sparkles className="h-3.5 w-3.5" /> Criar o primeiro post
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-12 text-center">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Nenhum post em {CATEGORIES.find((c) => c.value === category)?.emoji}{' '}
              {CATEGORIES.find((c) => c.value === category)?.label} ainda
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => { setComposerCategory(category as CommunityCategory); scrollToComposer(); }}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                <Sparkles className="h-3.5 w-3.5" /> Postar em {CATEGORIES.find((c) => c.value === category)?.label}
              </button>
              <button
                onClick={() => setCategory('all')}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-50"
              >
                Ver tudo
              </button>
            </div>
          </div>
        )
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
        active ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400' : 'bg-emerald-500 text-white',
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

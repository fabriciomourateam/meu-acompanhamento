import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function initials(name?: string): string {
  if (!name) return '🙂';
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || '🙂'
  );
}

export function CommunityAvatar({
  name,
  photo,
  className,
}: {
  name: string;
  photo: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn('h-9 w-9 border border-slate-200 dark:border-slate-700', className)}>
      {photo ? <AvatarImage src={photo} alt={name} /> : null}
      <AvatarFallback className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

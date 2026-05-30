import { Film } from 'lucide-react';
import { detectVideoSource } from '@/lib/workout/video-url';

interface SmartVideoPlayerProps {
  url: string | null | undefined;
  className?: string;
}

export function SmartVideoPlayer({ url, className }: SmartVideoPlayerProps) {
  const src = detectVideoSource(url);
  const wrap = `relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100 ${className || ''}`;

  if (src === 'none') {
    return (
      <div className={wrap}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Film className="w-8 h-8" />
          <span className="text-xs">Sem vídeo</span>
        </div>
      </div>
    );
  }

  if (src === 'youtube' || src === 'drive') {
    return (
      <div className={wrap}>
        <iframe
          src={url!}
          className="absolute inset-0 w-full h-full"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // storage ou external
  return (
    <div className={wrap}>
      <video src={url!} controls className="absolute inset-0 w-full h-full bg-black" preload="metadata" />
    </div>
  );
}

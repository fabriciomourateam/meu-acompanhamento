// Port do controle-de-pacientes/src/lib/video-url.ts.
// `video_url` pode vir como Supabase Storage, YouTube embed, Drive preview ou MP4 externo.

export type VideoSource = 'storage' | 'youtube' | 'drive' | 'external' | 'none';

export function detectVideoSource(url: string | null | undefined): VideoSource {
  if (!url) return 'none';
  if (url.includes('/storage/v1/object/public/exercise-videos/')) return 'storage';
  if (url.startsWith('https://www.youtube.com/embed/')) return 'youtube';
  if (url.includes('drive.google.com/file/d/')) return 'drive';
  return 'external';
}

export function getThumbnail(videoUrl: string | null | undefined, thumbnailUrl: string | null | undefined): string | null {
  if (thumbnailUrl) return thumbnailUrl;
  const src = detectVideoSource(videoUrl);
  if (src === 'youtube' && videoUrl) {
    const match = videoUrl.match(/\/embed\/([^/?]+)/);
    if (match) return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
}

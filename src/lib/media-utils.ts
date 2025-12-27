/**
 * Detecta se uma URL é de um vídeo baseado na extensão
 */
export function isVideoUrl(url: string | null): boolean {
  if (!url) return false;
  
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  
  return videoExtensions.some(ext => lowerUrl.includes(ext));
}

/**
 * Detecta se uma URL é de uma imagem baseado na extensão
 */
export function isImageUrl(url: string | null): boolean {
  if (!url) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const lowerUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

/**
 * Retorna o tipo de mídia (video, image ou unknown)
 */
export function getMediaType(url: string | null): 'video' | 'image' | 'unknown' {
  if (!url) return 'unknown';
  
  if (isVideoUrl(url)) return 'video';
  if (isImageUrl(url)) return 'image';
  
  return 'image'; // Por padrão, tenta como imagem
}

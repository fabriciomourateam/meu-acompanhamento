/**
 * Comprime uma imagem no client antes do upload.
 * Reduz o lado maior para `maxDim` px e re-encoda em JPEG com `quality`.
 * HEIC/HEIF tem suporte irregular em navegadores; nesse caso devolve o arquivo original.
 */
export interface CompressOptions {
  maxDim?: number;       // lado maior (px)
  quality?: number;      // 0..1 (jpeg)
  mimeType?: string;     // 'image/jpeg' por padrão
}

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<File> {
  const { maxDim = 1920, quality = 0.82, mimeType = 'image/jpeg' } = opts;

  if (!file.type.startsWith('image/')) return file;
  // Browsers raramente decodificam HEIC — não tenta comprimir.
  if (/heic|heif/i.test(file.type) || /\.heic$|\.heif$/i.test(file.name)) return file;

  const bitmap = await loadBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  // Libera memória da bitmap.
  if ('close' in bitmap) (bitmap as ImageBitmap).close();

  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, mimeType, quality),
  );
  if (!blob) return file;
  // Se a compressão piorar o tamanho, mantém o original.
  if (blob.size >= file.size) return file;

  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}.${ext}`, { type: mimeType, lastModified: Date.now() });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // fallback abaixo
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

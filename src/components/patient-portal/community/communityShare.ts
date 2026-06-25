import html2canvas from 'html2canvas';
import { CATEGORIES, type CommunityPost } from '@/lib/community-service';

export interface ShareBranding {
  /** @handle do treinador (sem @). */
  instagram?: string;
  /** Frase exibida acima do @ (pode ter quebras de linha). */
  caption?: string;
}

// Gera um card de imagem (PNG) a partir de um post para o aluno compartilhar.
// Inclui a frase e o @ do treinador apenas quando configurados (multitenancy:
// cada treinador define os seus nas configs do /admin).
export async function generatePostShareImage(
  post: CommunityPost,
  branding: ShareBranding,
): Promise<Blob> {
  const handle = (branding.instagram || '').trim().replace(/^@+/, '');
  const caption = (branding.caption || '').trim();
  const category = CATEGORIES.find((c) => c.value === post.category);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1080px';
  container.style.fontFamily = 'Inter, system-ui, sans-serif';

  const safe = (t: string) =>
    t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  container.innerHTML = `
    <div style="width:1080px;box-sizing:border-box;padding:72px;background:linear-gradient(135deg,#ecfdf5 0%,#ffffff 60%);">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:40px;padding:64px;box-shadow:0 24px 60px rgba(15,23,42,0.10);">
        <div style="display:flex;align-items:center;gap:24px;margin-bottom:40px;">
          ${
            post.author_photo
              ? `<img src="${post.author_photo}" crossorigin="anonymous" style="width:96px;height:96px;border-radius:9999px;object-fit:cover;border:2px solid #d1fae5;" />`
              : `<div style="width:96px;height:96px;border-radius:9999px;background:#d1fae5;color:#047857;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:700;">${safe((post.author_name || '🙂').slice(0, 2).toUpperCase())}</div>`
          }
          <div>
            <div style="font-size:36px;font-weight:700;color:#1e293b;">${safe(post.author_name)}</div>
            ${category ? `<div style="font-size:26px;color:#64748b;margin-top:6px;">${category.emoji} ${safe(category.label)}</div>` : ''}
          </div>
        </div>
        <div style="font-size:40px;line-height:1.45;color:#334155;white-space:pre-wrap;word-break:break-word;">${safe(post.content)}</div>
        ${
          post.image_url
            ? `<img src="${post.image_url}" crossorigin="anonymous" style="margin-top:40px;width:100%;border-radius:28px;object-fit:contain;max-height:900px;background:#f1f5f9;" />`
            : ''
        }
        <div style="margin-top:56px;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <div style="font-size:30px;color:#10b981;font-weight:700;white-space:nowrap;">Minha Comunidade 💪</div>
          ${
            caption || handle
              ? `<div style="text-align:right;">
                  ${caption ? `<div style="font-size:32px;color:#1e293b;font-weight:700;white-space:pre-line;line-height:1.3;">${safe(caption)}</div>` : ''}
                  ${handle ? `<div style="font-size:30px;color:#64748b;font-weight:600;margin-top:6px;">@${safe(handle)}</div>` : ''}
                </div>`
              : ''
          }
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
      // Sem windowWidth/Height o html2canvas usa a JANELA ATUAL como referência de
      // layout — no mobile (janela ~390px) o card de 1080px sai espremido/distorcido.
      // Fixar a "janela" em 1080 faz a captura sair idêntica no desktop e no mobile.
      windowWidth: 1080,
      windowHeight: container.offsetHeight,
      width: 1080,
      height: container.offsetHeight,
    });
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob falhou'))), 'image/png', 1),
    );
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

// Compartilha (Web Share API com arquivo quando disponível) ou baixa a imagem.
export async function sharePostImage(post: CommunityPost, branding: ShareBranding): Promise<void> {
  const blob = await generatePostShareImage(post, branding);
  const file = new File([blob], 'comunidade.png', { type: 'image/png' });

  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string; text?: string }) => Promise<void>;
  };

  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    await nav.share({ files: [file], title: 'Comunidade' });
    return;
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'comunidade.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

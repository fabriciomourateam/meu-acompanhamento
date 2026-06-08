// Helper pra baixar uma orientacao como PDF a partir do app do paciente.
// Lê dados via RPC get_guideline_data_for_patient (no projeto Supabase do
// MyShape — meu-acompanhamento usa o mesmo). Renderiza um div invisivel
// com o layout de papel timbrado e captura com html2canvas + jsPDF.
//
// PDF eh dimensionado pelo conteudo (pagina unica, altura proporcional).

import { supabase } from '@/integrations/supabase/client';

interface GuidelineData {
  guideline_id: string;
  guideline_title: string;
  guideline_content: string;
  guideline_type: string;
  patient_nome: string | null;
  letterhead_logo_url: string | null;
  letterhead_signature_url: string | null;
  letterhead_display_name: string | null;
  letterhead_professional_title: string | null;
  letterhead_registry: string | null;
  letterhead_cnpj: string | null;
  letterhead_instagram: string | null;
  letterhead_whatsapp: string | null;
  letterhead_email: string | null;
  letterhead_endereco: string | null;
  letterhead_accent_color: string | null;
}

async function fetchGuidelineData(telefone: string, guidelineId: string): Promise<GuidelineData | null> {
  const { data, error } = await (supabase as any).rpc('get_guideline_data_for_patient', {
    p_telefone: telefone,
    p_guideline_id: guidelineId,
  });
  if (error) {
    console.error('get_guideline_data_for_patient error', error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as GuidelineData) ?? null;
}

// Renderiza HTML offscreen, mede, captura. Promete cleanup.
async function captureLetterheadHtml(html: string): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = '#ffffff';
  container.style.color = '#0f172a';
  // Forca tema claro mesmo se o app estiver em dark mode — senao
  // html2canvas captura cores invertidas (bg cinza-escuro, texto claro)
  // por causa de color-scheme/CSS vars do contexto pai.
  container.style.setProperty('color-scheme', 'light');
  container.classList.add('letterhead-light');
  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    // Aguarda imagens carregarem (logo, assinatura externa via Supabase storage).
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            // timeout pra nao travar caso a imagem nunca carregue
            setTimeout(() => resolve(), 3000);
          })
    ));
    return await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    } as any);
  } finally {
    document.body.removeChild(container);
  }
}

function buildLetterheadHtml(data: GuidelineData): string {
  const accent = data.letterhead_accent_color || '#F59E0B';
  const escape = (s: string | null | undefined) => (s ?? '').replace(/[<>]/g, (c) => ({ '<': '&lt;', '>': '&gt;' }[c] || c));
  const dateBr = new Date().toLocaleDateString('pt-BR');
  return `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background: #ffffff;">
      <div style="display: flex; align-items: center; gap: 16px; padding: 32px 64px 16px 64px;">
        ${data.letterhead_logo_url
          ? `<img src="${data.letterhead_logo_url}" crossorigin="anonymous" style="height: 80px; width: 80px; object-fit: contain; flex-shrink: 0;" />`
          : `<div style="height: 80px; width: 80px; background: #f1f5f9; border-radius: 6px;"></div>`}
        <div style="flex: 1; min-width: 0;">
          <h1 style="font-size: 22px; font-weight: 700; line-height: 1.2; margin: 0;">
            ${escape(data.letterhead_display_name) || 'Profissional'}
            ${data.letterhead_professional_title ? `<span style="color: #475569; font-weight: 500;"> | ${escape(data.letterhead_professional_title)}</span>` : ''}
          </h1>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">
            ${data.letterhead_cnpj ? `<div>CNPJ nº ${escape(data.letterhead_cnpj)}</div>` : ''}
            ${data.letterhead_registry ? `<div>${escape(data.letterhead_registry)}</div>` : ''}
            <div style="margin-top: 2px; font-size: 12px;">
              ${data.letterhead_instagram ? `<span style="margin-right: 12px;">📷 ${escape(data.letterhead_instagram)}</span>` : ''}
              ${data.letterhead_whatsapp ? `<span>📞 ${escape(data.letterhead_whatsapp)}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
      <div style="height: 3px; margin: 0 64px; background: ${accent};"></div>

      <div style="padding: 32px 64px;">
        <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.02em;">
          ${data.guideline_title || 'Orientação'}
        </h2>
        ${data.patient_nome ? `<p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;"><strong>Para:</strong> ${escape(data.patient_nome)} <span style="color: #94a3b8;">·</span> <span style="color: #64748b;">${dateBr}</span></p>` : ''}
        <div style="font-size: 14px; line-height: 1.6; color: #1e293b;">
          ${data.guideline_content || ''}
        </div>
      </div>

      <div style="padding: 48px 64px 32px 64px; margin-top: 16px;">
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
          ${data.letterhead_signature_url ? `<img src="${data.letterhead_signature_url}" crossorigin="anonymous" style="height: 64px; object-fit: contain; margin-bottom: 4px;" />` : ''}
          <div style="font-weight: 700; font-size: 14px;">${escape(data.letterhead_display_name) || 'Profissional'}</div>
          ${data.letterhead_cnpj ? `<div style="font-size: 11px; color: #475569;">CNPJ: ${escape(data.letterhead_cnpj)}</div>` : ''}
          ${data.letterhead_registry ? `<div style="font-size: 11px; color: #475569;">${escape(data.letterhead_registry)}</div>` : ''}
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
            ${data.letterhead_email ? `<span style="margin-right: 12px;">✉️ ${escape(data.letterhead_email)}</span>` : ''}
            ${data.letterhead_endereco ? `<span>📍 ${escape(data.letterhead_endereco)}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Baixa o PDF da orientacao. Telefone do paciente eh usado pra autorizar
 * leitura do conteudo + dados do timbrado.
 */
export async function downloadGuidelinePdf(telefone: string, guidelineId: string): Promise<void> {
  const data = await fetchGuidelineData(telefone, guidelineId);
  if (!data) throw new Error('Orientação não encontrada ou sem acesso');
  const html = buildLetterheadHtml(data);
  const canvas = await captureLetterheadHtml(html);
  const { default: jsPDF } = await import('jspdf');
  const imgData = canvas.toDataURL('image/png');
  const pageW = 210; // mm — A4
  const ratio = canvas.height / canvas.width;
  const pageH = Math.max(297, pageW * ratio);
  const pdf = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation: 'portrait' });
  pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageW * ratio);
  const safeTitle = (data.guideline_title || 'orientacao').replace(/<[^>]+>/g, '').replace(/[^a-z0-9]/gi, '_').slice(0, 40) || 'orientacao';
  pdf.save(`${safeTitle}.pdf`);
}

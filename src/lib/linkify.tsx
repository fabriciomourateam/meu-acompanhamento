import React from 'react';

// Detecta URLs (http/https e www.) em texto plano e as transforma em links
// clicáveis. Usado nas bolhas do chat (Suporte) — o corpo da mensagem é texto
// puro; sem isso, um link colado não abre, só dava pra copiar.
const URL_RE = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

/** Quebra o texto em pedaços, envolvendo cada URL num <a> seguro. */
export function renderWithLinks(text: string | null | undefined): React.ReactNode {
  if (!text) return text;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    const raw = m[0];
    const start = m.index;
    if (start > last) nodes.push(text.slice(last, start));

    // Pontuação final não faz parte do link (ex.: "veja https://x.com.").
    let clean = raw;
    let trail = '';
    const tm = clean.match(/[).,!?;:]+$/);
    if (tm) {
      trail = tm[0];
      clean = clean.slice(0, -trail.length);
    }
    const href = clean.startsWith('http') ? clean : `https://${clean}`;
    nodes.push(
      <a
        key={start}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all"
      >
        {clean}
      </a>,
    );
    if (trail) nodes.push(trail);
    last = start + raw.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

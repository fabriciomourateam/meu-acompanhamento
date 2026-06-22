import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DOMPurify from "dompurify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Regex com grupo de captura para uso em split (mantém a URL como parte separada)
const URL_SPLIT_REGEX = /(https?:\/\/[^\s<>"']+)/g;

/**
 * Sanitiza HTML (DOMPurify) e transforma URLs "cruas" (texto puro) em links
 * clicáveis que abrem em nova aba. Âncoras já existentes também são padronizadas
 * para abrir externamente com segurança (rel=noopener).
 */
// Detecta se a string já contém marcação HTML. Se não, tratamos como texto puro
// e convertemos quebras de linha em <br> para preservar a formatação visual
// (HTML colapsa \n em espaço).
const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*?>/i;

export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) return "";

  const input = HTML_TAG_REGEX.test(html)
    ? html
    : html
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.replace(/^ +/, (m) => "&nbsp;".repeat(m.length)))
        .join("<br>");

  const clean = DOMPurify.sanitize(input);

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return clean;
  }

  const doc = new DOMParser().parseFromString(clean, "text/html");

  // Coletar nós de texto que contêm URLs e não estão dentro de uma âncora
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    if (textNode.parentElement?.closest("a")) continue;
    if (textNode.textContent && /https?:\/\//.test(textNode.textContent)) {
      targets.push(textNode);
    }
  }

  for (const textNode of targets) {
    const frag = doc.createDocumentFragment();
    for (const part of textNode.textContent!.split(URL_SPLIT_REGEX)) {
      if (!part) continue;
      if (/^https?:\/\//.test(part)) {
        const a = doc.createElement("a");
        a.setAttribute("href", part);
        a.textContent = part;
        frag.appendChild(a);
      } else {
        frag.appendChild(doc.createTextNode(part));
      }
    }
    textNode.replaceWith(frag);
  }

  // Padronizar todas as âncoras
  doc.querySelectorAll("a").forEach((a) => {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
    a.classList.add("text-emerald-600", "underline", "break-words");
  });

  return DOMPurify.sanitize(doc.body.innerHTML, { ADD_ATTR: ["target", "rel"] });
}

// ---------------------------------------------------------------------------
// Adaptação de cores de conteúdo (rich text do back-office) para o tema ESCURO.
// O Fabricio colore textos no editor (vermelho, azul, verde, e às vezes
// preto/cinza-escuro). No dark, cores muito escuras somem. Esta função clareia
// SÓ as cores escuras demais — mantendo o matiz (vermelho continua vermelho,
// verde continua verde) — pra tudo ficar legível sem perder a intenção de cor.
// ---------------------------------------------------------------------------
const NAMED_COLORS: Record<string, string> = {
  black: "#000000", gray: "#808080", grey: "#808080", silver: "#c0c0c0",
  navy: "#000080", maroon: "#800000", purple: "#800080", green: "#008000",
  olive: "#808000", teal: "#008080", darkgreen: "#006400", darkblue: "#00008b",
  darkred: "#8b0000", midnightblue: "#191970", indigo: "#4b0082",
};

function parseColor(c: string): [number, number, number] | null {
  let s = c.trim().toLowerCase();
  if (NAMED_COLORS[s]) s = NAMED_COLORS[s];
  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) return [0, 1, 2].map((i) => parseInt(m![1][i] + m![1][i], 16)) as [number, number, number];
  m = s.match(/^#([0-9a-f]{6})$/);
  if (m) return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)) as [number, number, number];
  m = s.match(/^rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    if (p.length >= 3) return [p[0], p[1], p[2]];
  }
  return null;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hslToCss(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

// Se a cor for escura demais p/ fundo escuro, sobe a luminosidade mantendo
// matiz/saturação. Retorna nova cor CSS ou null (mantém a original).
function lightenIfDark(value: string): string | null {
  const rgb = parseColor(value);
  if (!rgb) return null;
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  if (l >= 0.55) return null; // já é claro o bastante
  const newL = s < 0.2 ? 0.85 : 0.72; // cinza/preto -> bem claro; cores -> claras mantendo cor
  return hslToCss(h, s, newL);
}

export function adaptHtmlColorsForDark(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/color\s*:\s*([^;"'}]+)/gi, (full, val) => {
      const lit = lightenIfDark(val);
      return lit ? `color: ${lit}` : full;
    })
    .replace(/(<font[^>]*\scolor\s*=\s*)["']?([^"'>\s]+)["']?/gi, (full, pre, val) => {
      const lit = lightenIfDark(val);
      return lit ? `${pre}"${lit}"` : full;
    });
}

// Utilitário para formatar texto que pode conter HTML ou entidades codificadas (ex: &lt;p&gt;)
// e garantir que será exibido como texto limpo preservando as quebras de linha.
export function formatTextToPlain(text: string | null | undefined): string {
  if (!text) return "";
  try {
    // 1. Substituir tags de quebra de linha por newline real nas tags codificadas ou normais
    let decoded = text.replace(/&lt;br\s*[\/]?&gt;|<br\s*[\/]?>/gi, '\n');
    decoded = decoded.replace(/&lt;\/p&gt;|<\/p>/gi, '\n');

    // 2. Tentar decodificar entidades HTML com DOMParser (resolve os &lt; e &gt; que sobraram)
    const doc = new DOMParser().parseFromString(decoded, 'text/html');
    decoded = doc.documentElement.textContent || decoded;

    // 3. Remover todas as tags HTML restantes
    decoded = decoded.replace(/<[^>]*>?/gm, '');

    // 4. Limpar múltiplas quebras de linha (mais de 2 vira 2)
    return decoded.replace(/\n{3,}/g, '\n\n').trim();
  } catch (e) {
    // Fallback básico caso não haja DOM (muito raro no navegador)
    let fallback = text.replace(/&lt;br\s*[\/]?&gt;|<br\s*[\/]?>/gi, '\n').replace(/&lt;\/p&gt;|<\/p>/gi, '\n');
    return fallback.replace(/<[^>]*>?/gm, '').replace(/\n{3,}/g, '\n\n').trim();
  }
}

// Retorna a data no formato YYYY-MM-DD considerando o fuso horário local
export function getLocalISODate(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
}

// Retorna a data YYYY-MM-DD SEMPRE no fuso de São Paulo (America/Sao_Paulo).
// Use para o "dia" de check-ins, consumo de refeições, metas etc. — o dia
// começa/termina à meia-noite de Brasília, não do navegador do aluno nem em UTC.
// (en-CA formata como 'YYYY-MM-DD'.)
export function getSaoPauloISODate(date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

// Desloca uma data 'YYYY-MM-DD' por N dias (pode ser negativo) sem sofrer com
// fuso: ancora ao meio-dia UTC, então somar/subtrair dias inteiros nunca cruza
// a fronteira do dia errado. Útil pra contar streak (hoje, ontem, ...).
export function shiftISODate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Converte uma string 'YYYY-MM-DD' para um objeto Date correspondente ao meio-dia local.
// Isso evita que a data sofra "shift" para o dia anterior devido ao fuso horário (ex: UTF-3)
export function parseLocalISODate(dateStr: string): Date {
  if (!dateStr) return new Date();
  // Se a string contiver apenas a data e não a hora, forçamos o meio-dia local
  if (dateStr.length === 10) {
    return new Date(`${dateStr}T12:00:00`);
  }
  return new Date(dateStr);
}

// === Fuso de São Paulo (America/Sao_Paulo, UTC-3) ===========================
// O acompanhamento é usado por alunos que podem estar fora do Brasil; o "dia"
// e a "semana" do treino/cardio são sempre o relógio de São Paulo, não o do
// navegador. Por isso comparações de "hoje"/"esta semana"/"dia da semana" usam
// estes helpers, e não new Date().getDay()/toISOString() (que pegam o fuso do
// navegador e erram pra quem está em outro fuso).
const SAO_PAULO_TZ = 'America/Sao_Paulo';

// Data 'YYYY-MM-DD' no fuso de São Paulo para um instante (default: agora).
export function getBrtISODate(input: Date | string | number = new Date()): string {
  const d = input instanceof Date ? input : new Date(input);
  // en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

// Dia da semana (0=domingo .. 6=sábado) no fuso de São Paulo.
export function getBrtDayOfWeek(input: Date | string | number = new Date()): number {
  const d = input instanceof Date ? input : new Date(input);
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: SAO_PAULO_TZ, weekday: 'short' }).format(d);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
}

// Segunda-feira (início ISO da semana) no fuso de São Paulo, como 'YYYY-MM-DD'.
export function getBrtWeekStartISO(input: Date | string | number = new Date()): string {
  const todayStr = getBrtISODate(input);
  const diffToMon = (getBrtDayOfWeek(input) + 6) % 7;
  const [y, m, d] = todayStr.split('-').map(Number);
  // Aritmética de calendário em UTC pra não reintroduzir o fuso do navegador.
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() - diffToMon);
  return base.toISOString().slice(0, 10);
}


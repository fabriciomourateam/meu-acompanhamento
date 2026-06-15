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


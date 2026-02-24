import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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


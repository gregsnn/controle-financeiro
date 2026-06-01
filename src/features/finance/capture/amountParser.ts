import { tokenizeCaptureText } from './tokenizer';

export interface ParsedAmount {
  amount: number;
  raw: string;
}

function parseNumericValue(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.]/g, '');
  if (!cleaned) return null;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  const normalized =
    hasComma && hasDot
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : hasComma
        ? cleaned.replace(',', '.')
        : cleaned;
  const value = Number(normalized);

  return Number.isFinite(value) && value > 0 ? value : null;
}

const MODEL_CONTEXT_STOP_WORDS = new Set([
  'a',
  'as',
  'banrisul',
  'banco',
  'boleto',
  'bradesco',
  'c6',
  'cartao',
  'de',
  'debito',
  'dia',
  'do',
  'em',
  'itau',
  'mes',
  'na',
  'no',
  'nubank',
  'o',
  'os',
  'pix',
  'santander',
  'sicredi',
  'todo',
  'vence',
  'vencimento',
  'vezes',
]);

function looksLikeModelWord(value?: string) {
  const cleaned = value?.replace(/[^\w]/g, '');
  return Boolean(cleaned && /^[a-zA-Z]+$/.test(cleaned) && !MODEL_CONTEXT_STOP_WORDS.has(cleaned));
}

export function parseAmount(input: string): ParsedAmount | null {
  const tokens = tokenizeCaptureText(input);

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const previous = tokens[index - 1]?.normalized;
    const next = tokens[index + 1]?.normalized;
    if (/[a-zA-Z]/.test(token.raw) && /\d/.test(token.raw) && !/^r\$?\d/i.test(token.raw)) {
      continue;
    }
    if (
      /^\d+$/.test(token.normalized) &&
      looksLikeModelWord(previous) &&
      looksLikeModelWord(next)
    ) {
      continue;
    }
    if (previous === 'dia' || previous === 'vence' || next === 'vezes') continue;
    if (
      /^\d+x$/.test(token.normalized) ||
      /^\d+\/\d+$/.test(token.normalized) ||
      /\d+x\d+/i.test(token.normalized)
    ) {
      continue;
    }

    const amount = parseNumericValue(token.raw);
    if (amount !== null) return { amount, raw: token.raw };
  }

  return null;
}

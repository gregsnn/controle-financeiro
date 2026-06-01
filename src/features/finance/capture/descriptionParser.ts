import type { CardBillItem } from '../domain/types';
import { PAYMENT_FILLER_WORDS, PAYMENT_STATUS_WORDS } from './paymentLanguage';
import { normalizeCaptureText, tokenizeCaptureText } from './tokenizer';

const IGNORED_WORDS = new Set([
  'r',
  'rs',
  'dia',
  'vence',
  'vencimento',
  'o',
  'a',
  'todo',
  'mes',
  'mensal',
  'recorrente',
  'fixo',
  'fixa',
  'em',
  'de',
  'do',
  'da',
  'no',
  'na',
  'comprei',
  'comprado',
  'comprada',
  'compra',
  'fiz',
  'parcela',
  'parcelas',
  'parcelado',
  'parcelada',
  'vezes',
  'janeiro',
  'jan',
  'fevereiro',
  'fev',
  'marco',
  'mar',
  'abril',
  'abr',
  'maio',
  'mai',
  'junho',
  'jun',
  'julho',
  'jul',
  'agosto',
  'ago',
  'setembro',
  'set',
  'outubro',
  'out',
  'novembro',
  'nov',
  'dezembro',
  'dez',
  'pix',
  'debito',
  'boleto',
  'cartao',
  'credito',
  'recebi',
  ...PAYMENT_FILLER_WORDS,
  ...PAYMENT_STATUS_WORDS,
]);

function isNumericToken(value: string) {
  if (/^\d+x$/i.test(value.replace(/[^\dx]/gi, ''))) return true;
  if (/[a-zA-Z]/.test(value) && /\d/.test(value)) return false;
  const cleaned = value.replace(/^[^\d]+|[^\dx]+$/g, '');
  return /^\d+(?:[.,]\d+)?x?$/.test(cleaned) || /^\d+\/\d+$/.test(cleaned);
}

function isModelNumberToken(tokens: ReturnType<typeof tokenizeCaptureText>, index: number) {
  const token = tokens[index];
  if (!/^\d+$/.test(token.normalized)) return false;

  const previous = tokens[index - 1]?.normalized.replace(/[^\w]/g, '');
  const next = tokens[index + 1]?.normalized.replace(/[^\w]/g, '');
  return Boolean(
    previous &&
    next &&
    /^[a-zA-Z]+$/.test(previous) &&
    /^[a-zA-Z]+$/.test(next) &&
    !IGNORED_WORDS.has(previous) &&
    !IGNORED_WORDS.has(next)
  );
}

export function parseDescription(input: string, cards: CardBillItem[]): string | null {
  const cardTerms = new Set(
    cards.flatMap((card) => [normalizeCaptureText(card.id), normalizeCaptureText(card.name)])
  );
  const tokens = tokenizeCaptureText(input);
  const descriptionTokens: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const normalized = token.normalized.replace(/[^\w]/g, '');
    const previous = tokens[index - 1]?.normalized;
    if (previous === 'dia' || previous === 'vence') continue;
    if (IGNORED_WORDS.has(normalized)) continue;
    if (isNumericToken(token.normalized) && !isModelNumberToken(tokens, index)) continue;
    if (cardTerms.has(normalized)) continue;
    descriptionTokens.push(token.raw.replace(/[^\p{L}\p{N}\s-]/gu, ''));
  }

  const description = descriptionTokens.join(' ').trim();
  return description || null;
}

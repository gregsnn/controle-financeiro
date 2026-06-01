import { normalizeCaptureText, tokenizeCaptureText } from './tokenizer';

export interface ParsedInstallment {
  totalInstallments: number;
  currentInstallment?: number;
  amount?: number;
  amountRole?: 'installmentValue' | 'totalAmount';
  raw: string;
}

function parseInstallmentAmount(raw: string): number | null {
  const match = raw.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[,.]\d{2}|\d+)/i);
  if (!match) return null;

  const value = Number(
    match[1].includes(',') ? match[1].replace(/\./g, '').replace(',', '.') : match[1]
  );
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function parseInstallment(input: string): ParsedInstallment | null {
  const normalized = normalizeCaptureText(input);

  const installmentValueMatch = normalized.match(
    /\b(\d{1,2})\s*x\s*(?:de|por|a)\s*((?:r\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|(?:r\$\s*)?\d+[,.]\d{2}|(?:r\$\s*)?\d+)\b/
  );
  if (installmentValueMatch) {
    return {
      totalInstallments: Number(installmentValueMatch[1]),
      amount: parseInstallmentAmount(installmentValueMatch[2]) || undefined,
      amountRole: 'installmentValue',
      raw: installmentValueMatch[0],
    };
  }

  const totalAmountMatch = normalized.match(
    /\b((?:r\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|(?:r\$\s*)?\d+[,.]\d{2}|\d+)\s*(?:em|parcelado\s+em)\s*(\d{1,2})\s*x\b/
  );
  if (totalAmountMatch && parseInstallmentAmount(totalAmountMatch[1])) {
    return {
      totalInstallments: Number(totalAmountMatch[2]),
      amount: parseInstallmentAmount(totalAmountMatch[1]) || undefined,
      amountRole: 'totalAmount',
      raw: totalAmountMatch[0],
    };
  }

  const ratioMatch = normalized.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (ratioMatch) {
    return {
      currentInstallment: Number(ratioMatch[1]),
      totalInstallments: Number(ratioMatch[2]),
      raw: ratioMatch[0],
    };
  }

  const tokens = tokenizeCaptureText(input);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const directMatch = token.normalized.match(/^(\d{1,2})x$/);
    if (directMatch) {
      return { totalInstallments: Number(directMatch[1]), raw: token.raw };
    }

    const next = tokens[index + 1]?.normalized;
    if (next === 'vezes' && /^\d{1,2}$/.test(token.normalized)) {
      return { totalInstallments: Number(token.normalized), raw: `${token.raw} vezes` };
    }
  }

  return null;
}

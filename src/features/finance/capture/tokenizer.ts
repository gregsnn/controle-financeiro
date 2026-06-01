export interface CaptureToken {
  raw: string;
  normalized: string;
}

export function normalizeCaptureText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function tokenizeCaptureText(value: string): CaptureToken[] {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => ({
      raw,
      normalized: normalizeCaptureText(raw).replace(/[^\w/,.-]/g, ''),
    }));
}

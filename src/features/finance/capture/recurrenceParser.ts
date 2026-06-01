import { normalizeCaptureText } from './tokenizer';

export interface ParsedRecurrence {
  recurring: boolean;
  reason: string;
}

const RECURRENCE_PATTERNS = [
  { pattern: /\btodo\s+mes\b/, reason: 'todo mes' },
  { pattern: /\btodo\s+dia\b/, reason: 'todo dia' },
  { pattern: /\bmensal\b/, reason: 'mensal' },
  { pattern: /\brecorrente\b/, reason: 'recorrente' },
  { pattern: /\bfixo\b|\bfixa\b/, reason: 'fixo' },
];

export function parseRecurrence(input: string): ParsedRecurrence | null {
  const normalized = normalizeCaptureText(input);
  const match = RECURRENCE_PATTERNS.find((item) => item.pattern.test(normalized));
  return match ? { recurring: true, reason: match.reason } : null;
}

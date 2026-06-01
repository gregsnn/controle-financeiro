import { normalizeCaptureText } from './tokenizer';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  casa: ['mercado', 'padaria', 'casa', 'supermercado'],
  telefone: ['telefone', 'internet', 'fibra', 'celular'],
  aluguel: ['aluguel', 'condominio'],
  streaming: ['netflix', 'spotify', 'streaming', 'prime', 'disney'],
  seguro: ['seguro', 'plano'],
  investimento: ['investimento', 'dividendo', 'renda'],
};

export function classifyCategory(input: string, categories: Record<string, string>): string | null {
  const normalized = normalizeCaptureText(input);

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!categories[category]) continue;
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }

  return categories.outro ? 'outro' : null;
}

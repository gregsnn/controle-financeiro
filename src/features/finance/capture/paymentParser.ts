import { tokenizeCaptureText } from './tokenizer';

const PAYMENT_ALIASES: Record<string, string> = {
  pix: 'pix',
  debito: 'debito',
  boleto: 'boleto',
  cartao: 'cartao',
  credito: 'cartao',
};

export function parsePaymentMethod(input: string, allowedPaymentMethods: string[]): string | null {
  const allowed = new Set(allowedPaymentMethods);
  const tokens = tokenizeCaptureText(input);

  for (const token of tokens) {
    const method = PAYMENT_ALIASES[token.normalized];
    if (method && allowed.has(method)) return method;
  }

  return null;
}

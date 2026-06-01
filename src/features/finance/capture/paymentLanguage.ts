export const PAYMENT_STATUS_WORDS = [
  'baixado',
  'baixada',
  'baixados',
  'baixadas',
  'baixei',
  'liquidei',
  'liquidado',
  'liquidada',
  'liquidados',
  'liquidadas',
  'paga',
  'pagas',
  'paguei',
  'pago',
  'pagos',
  'quitei',
  'quitada',
  'quitadas',
  'quitado',
  'quitados',
];

export const PAYMENT_FILLER_WORDS = [
  'a',
  'as',
  'esta',
  'estao',
  'foi',
  'foram',
  'ja',
  'o',
  'os',
  'ta',
];

const PAYMENT_STATUS_PATTERN = new RegExp(`\\b(${PAYMENT_STATUS_WORDS.join('|')})\\b`);

export function hasPaymentStatusSignal(normalizedInput: string) {
  return PAYMENT_STATUS_PATTERN.test(normalizedInput);
}

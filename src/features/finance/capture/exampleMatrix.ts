import type { CaptureExample } from './types';

export const CAPTURE_EXAMPLES: CaptureExample[] = [
  {
    input: 'mercado 123,45',
    expectedIntent: 'variableExpense',
    description: 'despesa variavel simples com descricao e valor',
  },
  {
    input: 'uber 32 pix',
    expectedIntent: 'variableExpense',
    description: 'despesa variavel com metodo de pagamento explicito',
  },
  {
    input: 'internet 120 todo mes dia 10',
    expectedIntent: 'fixedExpense',
    description: 'despesa fixa recorrente com vencimento',
  },
  {
    input: 'geladeira 2400 10x itau',
    expectedIntent: 'installment',
    description: 'parcelamento com total, quantidade de parcelas e cartao',
  },
  {
    input: 'salario 5000 todo dia 5',
    expectedIntent: 'revenue',
    description: 'receita recorrente com dia de recebimento',
  },
  {
    input: 'freela 1200 dia 18',
    expectedIntent: 'revenue',
    description: 'receita pontual com dia de recebimento',
  },
  {
    input: 'nubank 2539 vence 12',
    expectedIntent: 'cardBill',
    description: 'fatura de cartao com vencimento informativo',
  },
  {
    input: 'paguei nubank',
    expectedIntent: 'markAsPaid',
    description: 'baixa de fatura por nome de cartao',
  },
  {
    input: 'paguei luz',
    expectedIntent: 'markAsPaid',
    description: 'baixa de despesa por descricao',
    requiresReview: true,
  },
  {
    input: 'cartao 200',
    expectedIntent: 'unknown',
    description: 'entrada ambigua que deve exigir revisao',
    requiresReview: true,
  },
];

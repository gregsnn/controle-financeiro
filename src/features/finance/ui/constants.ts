import { DEFAULT_CARD_ID } from '../domain/constants.js';

export const CATEGORIES: Record<string, string> = {
  casa: 'CASA',
  telefone: 'TELEFONE',
  aluguel: 'ALUGUEL',
  streaming: 'STREAMING',
  seguro: 'SEGURO',
  investimento: 'INVESTIMENTO',
  outro: 'OUTRO',
};

export interface Tab {
  id: string;
  labelKey: string;
}

export const TABS: Tab[] = [
  { id: 'resumo', labelKey: 'tabs.resumo' },
  { id: 'gastos', labelKey: 'tabs.gastos' },
  { id: 'parcelas', labelKey: 'tabs.parcelas' },
  { id: 'receitas', labelKey: 'tabs.receitas' },
];

export interface BillCardConfig {
  key: string;
  label: string;
  color?: string;
}

export const BILL_CARDS: BillCardConfig[] = [];

export const BILL_CARD_KEYS: string[] = [];

export const CARD_ORDER = [DEFAULT_CARD_ID] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  debito: 'DEBITO',
  credito: 'CREDITO',
  casa: 'CASA',
  telefone: 'TELEFONE',
  aluguel: 'ALUGUEL',
  cartao: 'CARTAO',
  streaming: 'STREAMING',
  seguro: 'SEGURO',
  investimento: 'INVESTIMENTO',
  outro: 'OUTRO',
};

export const CARD_LABELS: Record<string, string> = {
  [DEFAULT_CARD_ID]: 'OUTROS',
};

export const CARD_NAMES: Record<string, string> = {
  [DEFAULT_CARD_ID]: 'Outro',
};

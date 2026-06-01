import { createSectionLabels } from '../shared/createSectionLabels';

export const FIXED_EXPENSE_LABELS = createSectionLabels({
  title: 'DESPESAS FIXAS',
  description: 'Cadastre uma vez e o valor passa a valer em todos os meses ativos.',
  addLabel: '+ Nova despesa fixa',
  emptyText: 'Nenhuma despesa fixa cadastrada ainda.',
  columns: ['Descricao', 'Categoria', 'Pagamento', 'Vencimento', 'Valor', 'Pago', 'Acoes'] as const,
  createTitle: 'Nova despesa fixa',
  createSubmitLabel: 'Adicionar despesa fixa',
  editTitle: 'Editar despesa fixa',
  editSubmitLabel: 'Salvar alteracoes',
  deleteTitle: 'Confirmar exclusao',
  deleteMessage: (name: string) => `Tem certeza que deseja apagar a despesa fixa "${name}"?`,
});

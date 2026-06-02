import { createSectionLabels } from '../shared/createSectionLabels';

export const FIXED_EXPENSE_LABELS = createSectionLabels({
  title: 'DESPESAS FIXAS',
  description: 'Cadastre uma vez e o valor passa a valer em todos os meses ativos.',
  addLabel: '+ Nova despesa fixa',
  emptyText: 'Nenhuma despesa fixa cadastrada ainda.',
  columns: ['Descrição', 'Categoria', 'Pagamento', 'Vencimento', 'Valor', 'Pago', 'Ações'] as const,
  createTitle: 'Nova despesa fixa',
  createSubmitLabel: 'Adicionar despesa fixa',
  editTitle: 'Editar despesa fixa',
  editSubmitLabel: 'Salvar alterações',
  deleteTitle: 'Confirmar exclusão',
  deleteMessage: (name: string) => `Tem certeza que deseja apagar a despesa fixa "${name}"?`,
});

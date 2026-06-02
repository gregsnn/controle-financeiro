import { createSectionLabels } from '../shared/createSectionLabels';

export const REVENUE_LABELS = createSectionLabels({
  title: 'RECEITAS',
  description: '',
  addLabel: '+ Nova receita',
  emptyText: 'Nenhuma receita cadastrada ainda.',
  columns: ['Descrição', 'Recebimento', 'Recorrente', 'Status', 'Valor', 'Ações'] as const,
  createTitle: 'Nova receita',
  createSubmitLabel: 'Adicionar receita',
  editTitle: 'Editar receita',
  editSubmitLabel: 'Salvar alterações',
  deleteTitle: 'Confirmar exclusão',
  deleteMessage: (name: string) => `Tem certeza que deseja apagar a receita "${name}"?`,
});

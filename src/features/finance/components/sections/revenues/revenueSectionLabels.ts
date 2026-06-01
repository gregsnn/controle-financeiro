import { createSectionLabels } from '../shared/createSectionLabels';

export const REVENUE_LABELS = createSectionLabels({
  title: 'RECEITAS',
  description: '',
  addLabel: '+ Nova receita',
  emptyText: 'Nenhuma receita cadastrada ainda.',
  columns: ['Descricao', 'Recebimento', 'Recorrente', 'Valor', 'Acoes'] as const,
  createTitle: 'Nova receita',
  createSubmitLabel: 'Adicionar receita',
  editTitle: 'Editar receita',
  editSubmitLabel: 'Salvar alteracoes',
  deleteTitle: 'Confirmar exclusao',
  deleteMessage: (name: string) => `Tem certeza que deseja apagar a receita "${name}"?`,
});

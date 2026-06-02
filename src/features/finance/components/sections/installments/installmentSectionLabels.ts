import { createSectionLabels } from '../shared/createSectionLabels';

export const INSTALLMENT_LABELS = createSectionLabels({
  title: 'PARCELAMENTOS',
  description: 'Cada parcela aparece enquanto ainda estiver ativa e some quando o total terminar.',
  addLabel: '+ Novo parcelamento',
  emptyText: 'Nenhum parcelamento cadastrado ainda.',
  columns: ['Nome', 'Parcela', 'Cartão', 'Desde', 'Progresso', 'Pago', 'Ações'] as const,
  createTitle: 'Novo parcelamento',
  createSubmitLabel: 'Adicionar parcelamento',
  editTitle: 'Editar parcelamento',
  editSubmitLabel: 'Salvar alterações',
  deleteTitle: 'Confirmar exclusão',
  deleteMessage: (name: string) => `Tem certeza que deseja apagar o parcelamento "${name}"?`,
});

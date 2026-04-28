export const INSTALLMENT_LABELS = {
  title: 'PARCELAMENTOS',
  description: 'Cada parcela aparece enquanto ainda estiver ativa e some quando o total terminar.',
  addLabel: '+ Novo parcelamento',
  emptyText: 'Nenhum parcelamento cadastrado ainda.',
  columns: ['Nome', 'Parcela', 'Cartão', 'Desde', 'Progresso', 'Pago', 'Ações'] as const,
  modal: {
    create: {
      title: 'Novo parcelamento',
      submitLabel: 'Adicionar parcelamento',
    },
    edit: {
      title: 'Editar parcelamento',
      submitLabel: 'Salvar alterações',
    },
  },
  delete: {
    title: 'Confirmar exclusão',
    message: (name: string) => `Tem certeza que deseja apagar o parcelamento "${name}"?`,
  },
} as const;

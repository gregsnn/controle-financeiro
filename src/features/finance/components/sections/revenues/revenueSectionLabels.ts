export const REVENUE_LABELS = {
  title: 'RECEITAS',
  description:
    'A receita se repete por mês e pode receber ajuste específico depois, se necessário.',
  addLabel: '+ Nova receita',
  emptyText: 'Nenhuma receita cadastrada ainda.',
  columns: ['Nome', 'Valor', 'Desde', 'Ações'] as const,
  modal: {
    create: {
      title: 'Nova receita',
      submitLabel: 'Adicionar receita',
    },
    edit: {
      title: 'Editar receita',
      submitLabel: 'Salvar alterações',
    },
  },
  delete: {
    title: 'Confirmar exclusão',
    message: (name: string) => `Tem certeza que deseja apagar a receita "${name}"?`,
  },
} as const;

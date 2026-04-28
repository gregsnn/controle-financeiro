export const FIXED_EXPENSE_LABELS = {
  title: 'GASTOS FIXOS',
  description: 'Cadastre uma vez e o valor passa a valer em todos os meses ativos.',
  addLabel: '+ Novo gasto fixo',
  emptyText: 'Nenhum gasto fixo cadastrado ainda.',
  columns: [
    'Nome',
    'Valor',
    'Pagamento',
    'Categoria',
    'Vencimento',
    'Desde',
    'Pago',
    'Ações',
  ] as const,
  modal: {
    create: {
      title: 'Novo gasto fixo',
      submitLabel: 'Adicionar gasto fixo',
    },
    edit: {
      title: 'Editar gasto fixo',
      submitLabel: 'Salvar alterações',
    },
  },
  delete: {
    title: 'Confirmar exclusão',
    message: (name: string) => `Tem certeza que deseja apagar o gasto fixo "${name}"?`,
  },
} as const;

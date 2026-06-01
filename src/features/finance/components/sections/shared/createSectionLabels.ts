interface SectionLabelsConfig<TColumns extends readonly string[]> {
  title: string;
  description: string;
  addLabel: string;
  emptyText: string;
  columns: TColumns;
  createTitle: string;
  createSubmitLabel: string;
  editTitle: string;
  editSubmitLabel: string;
  deleteTitle: string;
  deleteMessage: (name: string) => string;
}

export function createSectionLabels<TColumns extends readonly string[]>({
  title,
  description,
  addLabel,
  emptyText,
  columns,
  createTitle,
  createSubmitLabel,
  editTitle,
  editSubmitLabel,
  deleteTitle,
  deleteMessage,
}: SectionLabelsConfig<TColumns>) {
  return {
    title,
    description,
    addLabel,
    emptyText,
    columns,
    modal: {
      create: {
        title: createTitle,
        submitLabel: createSubmitLabel,
      },
      edit: {
        title: editTitle,
        submitLabel: editSubmitLabel,
      },
    },
    delete: {
      title: deleteTitle,
      message: deleteMessage,
    },
  } as const;
}

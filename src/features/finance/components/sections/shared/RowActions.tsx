interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  ariaContext?: string;
}

export function RowActions({ onEdit, onDelete, ariaContext }: RowActionsProps) {
  return (
    <div className="row-actions">
      <button
        type="button"
        className="edit"
        onClick={onEdit}
        aria-label={ariaContext ? `Editar ${ariaContext}` : undefined}
      >
        Editar
      </button>
      <button
        type="button"
        className="del"
        onClick={onDelete}
        aria-label={ariaContext ? `Excluir ${ariaContext}` : undefined}
      >
        Excluir
      </button>
    </div>
  );
}

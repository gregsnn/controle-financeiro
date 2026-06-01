interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function RowActions({ onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="row-actions">
      <button type="button" className="edit" onClick={onEdit}>
        Editar
      </button>
      <button type="button" className="del" onClick={onDelete}>
        Excluir
      </button>
    </div>
  );
}

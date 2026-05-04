import { ACTION_ICONS } from '../../../ui/constants';

interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function RowActions({ onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="row-actions">
      <button type="button" className="edit" onClick={onEdit}>
        {ACTION_ICONS.edit}
      </button>
      <button type="button" className="del" onClick={onDelete}>
        {ACTION_ICONS.delete}
      </button>
    </div>
  );
}

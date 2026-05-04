interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="modal-bg open">
      <div className="modal-fg" onClick={onCancel}></div>
      <div className="modal-box">
        <p className="modal-title">{title}</p>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>{message}</p>
        <div className="factions">
          <button className="btn-del" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn-cancel" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

import { ModalShell } from './ModalShell';

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
  return (
    <ModalShell open={open} title={title} onClose={onCancel}>
      <div className="confirm-modal-content">
        <p className="modal-message">{message}</p>
        <div className="factions confirm-modal-actions">
          <button className="btn-del" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn-cancel" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

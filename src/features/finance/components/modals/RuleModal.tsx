import { FormEvent, ReactNode } from 'react';

interface RuleModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  children: ReactNode;
}

export function RuleModal({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel,
  children,
}: RuleModalProps) {
  if (!open) return null;

  return (
    <div className="modal-bg open">
      <div className="modal-fg" onClick={onClose}></div>
      <div className="modal-box">
        <p className="modal-title">{title}</p>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '10px' }}>
          {children}
          <div className="factions" style={{ marginTop: 4 }}>
            <button className="btn-save" type="submit">
              {submitLabel}
            </button>
            <button className="btn-cancel" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

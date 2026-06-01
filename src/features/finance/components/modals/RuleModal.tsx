import { FormEvent, ReactNode } from 'react';
import { ModalShell } from './ModalShell';

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
  return (
    <ModalShell open={open} title={title} onClose={onClose}>
      <form className="modal-form" onSubmit={onSubmit}>
        {children}
        <div className="factions">
          <button className="btn-save" type="submit">
            {submitLabel}
          </button>
          <button className="btn-cancel" type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

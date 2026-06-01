import type { ReactNode } from 'react';

interface ModalShellProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function ModalShell({ open, title, onClose, children }: ModalShellProps) {
  if (!open) return null;

  return (
    <div className="modal-bg open">
      <div className="modal-fg" onClick={onClose}></div>
      <div className="modal-box">
        <p className="modal-title">{title}</p>
        {children}
      </div>
    </div>
  );
}

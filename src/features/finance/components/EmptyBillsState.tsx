import { CreditCard, Plus } from 'lucide-react';

interface EmptyBillsStateProps {
  canAdd: boolean;
  onAddCard: () => void;
}

export function EmptyBillsState({ canAdd, onAddCard }: EmptyBillsStateProps) {
  return (
    <div className="card-bill-empty">
      <CreditCard className="card-bill-empty-icon" size={22} strokeWidth={1.8} aria-hidden />
      <p className="card-bill-empty-copy">
        <span className="card-bill-empty-title">Nenhum cartao adicionado</span>
        <span className="card-bill-empty-sub">Cadastre um cartao para acompanhar faturas.</span>
        {canAdd ? (
          <button type="button" className="card-bill-empty-btn" onClick={onAddCard}>
            <Plus size={12} strokeWidth={2.4} aria-hidden />
            Adicionar cartao
          </button>
        ) : null}
      </p>
    </div>
  );
}

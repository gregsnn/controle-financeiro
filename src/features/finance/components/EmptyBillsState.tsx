interface EmptyBillsStateProps {
  canAdd: boolean;
  onAddCard: () => void;
}

export function EmptyBillsState({ canAdd, onAddCard }: EmptyBillsStateProps) {
  return (
    <div className="card-bill-empty">
      <p className="card-bill-empty-copy">
        <span className="card-bill-empty-title">Nenhum cartão adicionado</span>
        {canAdd ? (
          <button type="button" className="card-bill-empty-btn" onClick={onAddCard}>
            + Adicionar cartão
          </button>
        ) : null}
      </p>
    </div>
  );
}

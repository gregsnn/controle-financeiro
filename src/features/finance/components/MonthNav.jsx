import { useEffect, useState } from 'react';
import { applyMoneyMask, formatMoneyInput, parseMoneyInput } from '../lib/moneyInput';
import { CARD_NAMES, CARD_ICONS } from '../domain/constants';

export default function MonthNav({
  label,
  onPrev,
  onNext,
  theme,
  onToggleTheme,
  cardBills,
  onSetCardBill,
}) {
  const isDarkTheme = theme === 'premium';
  const nextThemeLabel = isDarkTheme ? 'Claro' : 'Escuro';
  const nextThemeIcon = isDarkTheme ? '☀' : '🌙';
  const [billInputs, setBillInputs] = useState(() =>
    Object.entries(CARD_NAMES).reduce((acc, [card]) => {
      acc[card] = formatMoneyInput(cardBills?.[card], { hideNonPositive: true });
      return acc;
    }, {})
  );

  useEffect(() => {
    setBillInputs(
      Object.entries(CARD_NAMES).reduce((acc, [card]) => {
        acc[card] = formatMoneyInput(cardBills?.[card], { hideNonPositive: true });
        return acc;
      }, {})
    );
  }, [cardBills]);

  const handleBillInputChange = (card, rawValue) => {
    const masked = applyMoneyMask(rawValue);
    setBillInputs((prev) => ({ ...prev, [card]: masked }));
    onSetCardBill(card, parseMoneyInput(masked, { allowZero: false }));
  };

  return (
    <div className="month-nav">
      <div className="month-nav-top">
        <div className="month-stepper" role="group" aria-label="Navegacao de meses">
          <button
            className="month-step-btn month-step-btn--icon"
            type="button"
            onClick={onPrev}
            aria-label="Mes anterior"
          >
            ←
          </button>
          <h2>{label}</h2>
          <button
            className="month-step-btn month-step-btn--icon"
            type="button"
            onClick={onNext}
            aria-label="Proximo mes"
          >
            →
          </button>
        </div>

        <button
          className="theme-btn"
          onClick={onToggleTheme}
          aria-label={`Mudar para tema ${nextThemeLabel.toLowerCase()}`}
          title={`Mudar para tema ${nextThemeLabel.toLowerCase()}`}
        >
          <span aria-hidden="true" className="theme-btn-icon">
            {nextThemeIcon}
          </span>
          <span className="theme-btn-label">{nextThemeLabel}</span>
        </button>
      </div>

      <div className="card-bill-panel">
        <p className="card-bill-title">Faturas do mês</p>
        <div className="card-bill-group">
          {Object.entries(CARD_NAMES).map(([card, name]) => (
            <label key={card} className={`card-bill-field card-bill-field--${card}`}>
              <span className="card-bill-head">
                <span className="card-bill-icon" aria-hidden="true">
                  {CARD_ICONS[card] || '•'}
                </span>
                <span className="card-bill-label">{name}</span>
              </span>
              <span className="bill-input-shell">
                <span className="bill-currency">R$</span>
                <input
                  type="text"
                  className="bill-input"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0,00"
                  value={billInputs?.[card] ?? ''}
                  onChange={(e) => handleBillInputChange(card, e.target.value)}
                  aria-label={`Valor da fatura ${name}`}
                />
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

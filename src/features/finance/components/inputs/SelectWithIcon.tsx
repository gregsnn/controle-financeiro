import { ICONS } from '../../domain/constants';

export function SelectWithIcon({ value, onChange, options }) {
  return (
    <div className="select-icon-wrapper">
      <select value={value} onChange={onChange}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {ICONS[value] && <span className="select-icon">{ICONS[value]}</span>}
    </div>
  );
}

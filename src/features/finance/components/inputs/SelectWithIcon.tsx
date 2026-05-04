import { ICONS } from '../../ui/constants';

interface SelectWithIconProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  iconMap?: Record<string, string>;
  ariaLabel?: string;
}

export function SelectWithIcon({
  value,
  onChange,
  options,
  iconMap = ICONS,
  ariaLabel,
}: SelectWithIconProps) {
  return (
    <div className="select-icon-wrapper">
      <select value={value} onChange={onChange} aria-label={ariaLabel}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {iconMap[value] && <span className="select-icon">{iconMap[value]}</span>}
    </div>
  );
}

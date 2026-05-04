import { ChangeEvent } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  ...inputProps
}: InputProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...inputProps}
      />
    </label>
  );
}

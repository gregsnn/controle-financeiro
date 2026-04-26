export function Input({ label, value, onChange, type = 'text', placeholder = '', ...inputProps }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} {...inputProps} />
    </label>
  );
}
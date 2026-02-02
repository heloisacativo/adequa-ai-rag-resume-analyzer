export interface InputProps {
  label: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

export default function Input({ 
  label, 
  placeholder, 
  type = "text", 
  value, 
  onChange,
  required = false,
  error,
  helperText,
  disabled = false
}: InputProps) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className={`input input-bordered w-full ${error ? 'input-error' : ''}`}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      />
      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
      {helperText && !error && (
        <label className="label">
          <span className="label-text-alt">{helperText}</span>
        </label>
      )}
    </div>
  );
}
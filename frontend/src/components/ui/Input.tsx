import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  id,
  className = '',
  ...props
}: InputProps): React.ReactElement {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-heading font-semibold uppercase tracking-wider text-parchment"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ash text-sm">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            'w-full bg-surface-elevated border border-border-default rounded-[var(--radius-md)]',
            'px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:border-amber focus:shadow-glow-amber',
            'transition-all duration-[var(--transition-fast)]',
            icon ? 'pl-10' : '',
            error ? 'border-blood focus:border-blood focus:shadow-none' : '',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-blood flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

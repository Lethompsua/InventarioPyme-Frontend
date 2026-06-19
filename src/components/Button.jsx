const variants = {
  primary: 'bg-secondary text-on-secondary hover:bg-on-secondary-fixed-variant shadow-sm',
  secondary: 'bg-surface-container-lowest border border-primary text-primary hover:bg-surface-container',
  ghost: 'text-on-surface-variant hover:text-primary hover:bg-surface-container',
  danger: 'bg-error text-on-error hover:opacity-90 shadow-sm',
};

export function Button({ variant = 'primary', className = '', disabled, children, ...props }) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-semibold tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

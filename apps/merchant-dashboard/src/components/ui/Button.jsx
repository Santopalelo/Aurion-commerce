import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button Component
 *
 * Variants: primary, secondary, danger, outline
 * Sizes: sm, md, lg
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
    secondary: 'bg-gray-100 text-dark hover:bg-gray-200 active:bg-gray-300',
    danger: 'bg-danger text-white hover:bg-red-600 active:bg-red-700',
    outline: 'bg-white border border-gray-300 text-dark hover:bg-gray-50 active:bg-gray-100',
    ghost: 'bg-transparent text-dark hover:bg-gray-100 active:bg-gray-200',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Reusable Input Component
 *
 * Works with React Hook Form via forwardRef
 */
const Input = forwardRef(
  ({ label, error, helpText, icon: Icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-dark mb-1.5">
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Optional left icon */}
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Icon className="w-5 h-5" />
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm',
              'placeholder:text-gray-400',
              'focus:ring-2 focus:ring-primary-200 transition-all duration-200',
              'disabled:bg-gray-50 disabled:cursor-not-allowed',
              error
                ? 'border-danger focus:border-danger focus:ring-red-200'
                : 'border-gray-300 focus:border-primary-500',
              Icon && 'pl-10',
              className
            )}
            {...props}
          />
        </div>

        {/* Error message */}
        {error && <p className="text-xs text-danger mt-1">{error}</p>}

        {/* Help text */}
        {!error && helpText && (
          <p className="text-xs text-gray-500 mt-1">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
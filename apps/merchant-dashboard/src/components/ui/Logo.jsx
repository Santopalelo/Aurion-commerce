import { Sparkles } from 'lucide-react';
import clsx from 'clsx';

/**
 * Aurion Commerce Logo
 *
 * Sizes: sm, md, lg
 * Variants: full (icon + text), icon-only, text-only
 */
const Logo = ({ size = 'md', variant = 'full', className = '' }) => {
  const sizeClasses = {
    sm: { icon: 'w-6 h-6', text: 'text-base' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl' },
  };

  const { icon: iconSize, text: textSize } = sizeClasses[size];

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {variant !== 'text-only' && (
        <div
          className={clsx(
            'flex items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white',
            iconSize
          )}
        >
          <Sparkles className="w-1/2 h-1/2" />
        </div>
      )}
      {variant !== 'icon-only' && (
        <span className={clsx('font-bold text-dark tracking-tight', textSize)}>
          Aurion
        </span>
      )}
    </div>
  );
};

export default Logo;
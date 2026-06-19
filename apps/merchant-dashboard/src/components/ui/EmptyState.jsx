import clsx from 'clsx';

/**
 * Empty State Component
 *
 * Shown when there is no data to display
 */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
    >
      {Icon && (
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="w-10 h-10 text-gray-400" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-dark mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-gray-600 max-w-md mb-6">{description}</p>
      )}
      {action}
    </div>
  );
};

export default EmptyState;
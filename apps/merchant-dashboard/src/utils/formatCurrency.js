/**
 * Format a number as currency
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount || 0);
};

/**
 * Format with custom symbol (for stores using custom currency)
 */
export const formatPrice = (amount, symbol = '$') => {
  const num = Number(amount || 0);
  return `${symbol}${num.toFixed(2)}`;
};
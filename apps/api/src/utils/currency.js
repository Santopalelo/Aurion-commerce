/**
 * Currency helpers
 *
 * Stripe works in the SMALLEST unit of a currency (cents for USD, yen for JPY).
 * Most currencies have 2 decimals, but a handful have none at all. Multiplying
 * by 100 for a zero-decimal currency charges the customer 100x too much.
 *
 * These helpers are the single place where that conversion lives, so the
 * payment controller, the order service and the webhook can never disagree.
 */

// Currencies whose smallest unit IS the major unit (no decimals)
export const ZERO_DECIMAL_CURRENCIES = [
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
];

/**
 * Is this a currency without decimals?
 * @param {string} currency - ISO currency code
 * @returns {boolean}
 */
export const isZeroDecimalCurrency = (currency = 'USD') =>
  ZERO_DECIMAL_CURRENCIES.includes(String(currency).toUpperCase());

/**
 * Convert a major-unit amount (dollars) to the Stripe minor unit (cents).
 *
 * @param {number} amount - Amount in major units (e.g. 19.99)
 * @param {string} currency - ISO currency code
 * @returns {number} Amount in the smallest unit (e.g. 1999)
 */
export const toStripeAmount = (amount, currency = 'USD') => {
  if (isZeroDecimalCurrency(currency)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
};

/**
 * Convert a Stripe minor-unit amount (cents) back to major units (dollars).
 *
 * @param {number} amount - Amount in the smallest unit (e.g. 1999)
 * @param {string} currency - ISO currency code
 * @returns {number} Amount in major units (e.g. 19.99)
 */
export const fromStripeAmount = (amount, currency = 'USD') => {
  if (isZeroDecimalCurrency(currency)) {
    return Math.round(amount);
  }
  return Math.round(amount) / 100;
};
